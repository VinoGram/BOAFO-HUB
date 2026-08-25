from fastapi import APIRouter, Request, Response, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.auth import get_current_user, COOKIE_NAME, JWT_SECRET
import backend.crud as crud
from typing import Optional
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timezone, timedelta
import hashlib, os, random, string
import smtplib
from email.message import EmailMessage

from backend.redis_otp import store as redis_otp_store, otp_store_required
from backend.cloudinary import upload_to_cloudinary

from backend.otp_utils import generate_otp


router = APIRouter(prefix="/api/auth", tags=["auth"])

ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.getenv("TWILIO_PHONE_NUMBER", "")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


def _hash_password(pw: str) -> str:
    import bcrypt
    salt = bcrypt.gensalt(rounds=int(os.getenv("BCRYPT_ROUNDS", "12")))
    return bcrypt.hashpw(pw.encode("utf-8"), salt).decode("utf-8")


def _verify_password(pw: str, pw_hash: str) -> bool:
    import bcrypt
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), pw_hash.encode("utf-8"))
    except Exception:
        return False



def _make_token(user_id: int, open_id: str, name: str, role: str = "customer") -> str:
    exp = datetime.now(timezone.utc) + timedelta(seconds=ONE_YEAR_SECONDS)
    return jwt.encode(
        {"sub": user_id, "openId": open_id, "name": name, "role": role, "exp": exp},
        JWT_SECRET, algorithm="HS256"
    )


def _send_sms(phone: str, message: str) -> bool:
    if not TWILIO_SID or not TWILIO_TOKEN:
        print(f"[SMS STUB] To {phone}: {message}")
        return True
    try:
        from twilio.rest import Client
        Client(TWILIO_SID, TWILIO_TOKEN).messages.create(body=message, from_=TWILIO_FROM, to=phone)
        return True
    except Exception as e:
        print(f"[SMS ERROR] {e}")
        return False


def _get_email_credentials() -> tuple[str, int, str, str, str]:
    if GMAIL_ADDRESS and GMAIL_APP_PASSWORD:
        from_address = SMTP_FROM if SMTP_FROM else GMAIL_ADDRESS
        return ("smtp.gmail.com", 587, GMAIL_ADDRESS, GMAIL_APP_PASSWORD, from_address)
    return (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM)


def _send_email(to_email: str, subject: str, body: str) -> bool:
    host, port, username, password, from_address = _get_email_credentials()
    if not host or not username or not password or not from_address:
        print(f"[EMAIL STUB] To {to_email}: {subject}\n{body}")
        return True
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = from_address
        msg["To"] = to_email
        msg.set_content(body)
        with smtplib.SMTP(host, port) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def _normalize_phone(phone: str) -> str:
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        phone = "+233" + phone[1:]
    if not phone.startswith("+"):
        phone = "+233" + phone
    return phone


# ── Models ────────────────────────────────────────────────────────────────────

class SendOTPBody(BaseModel):
    phone: str

class VerifyOTPBody(BaseModel):
    phone: str
    otp: str
    name: str = ""
    role: str = "customer"
    plan: Optional[str] = "Premium"

class LoginBody(BaseModel):
    email: str
    password: str

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str
    role: str = "customer"
    phone: str = ""
    plan: Optional[str] = "Premium"


class ForgotPasswordBody(BaseModel):
    email: str


class ResetPasswordBody(BaseModel):
    email: str
    phone: Optional[str] = None
    otp: str
    newPassword: str
    confirmPassword: str



# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request)
    if not user or not db:
        return None
    row = db.execute(text('SELECT * FROM users WHERE id=:id LIMIT 1'), {"id": user["sub"]}).mappings().first()
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row.get("name"),
        "email": row.get("email"),
        "phone": row.get("phone"),
        "role": row.get("role"),
        "profilePictureUrl": row.get("profilePictureUrl"),
    }


@router.post("/otp/send")
def send_otp(body: SendOTPBody):
    phone = _normalize_phone(body.phone)
    otp = generate_otp(6)
    redis_store = otp_store_required()
    key = redis_store.make_key("phone_verify", phone=phone)
    redis_store.set_otp(key, otp)
    _send_sms(phone, f"Your BOAFO verification code is: {otp}. Valid for 10 minutes.")
    return {"success": True, "phone": phone}


@router.post("/otp/verify")
async def verify_otp(
    response: Response,
    db: Session = Depends(get_db),
    phone: str = Form(...),
    otp: str = Form(...),
    name: str = Form(""),
    role: str = Form("customer"),
    plan: Optional[str] = Form("Premium"),
    profile_picture: Optional[UploadFile] = File(None),
):
    phone = _normalize_phone(phone)
    redis_store = otp_store_required()
    key = redis_store.make_key("phone_verify", phone=phone)
    
    payload = redis_store.get_otp_payload(key)

    if not payload:
        raise HTTPException(400, "OTP expired. Please request a new one.")

    stored_otp = payload.get("otp")
    if stored_otp != otp.strip():
        raise HTTPException(400, "Invalid OTP")
    
    redis_store.delete_key(key)

    if not db:
        raise HTTPException(503, "Database unavailable")

    # Upsert user by phone
    open_id = f"phone_{phone}"
    existing = db.execute(text('SELECT * FROM users WHERE "openId"=:oid LIMIT 1'), {"oid": open_id}).mappings().first()
    if existing:
        db.execute(text('UPDATE users SET "lastSignedIn"=NOW() WHERE "openId"=:oid'), {"oid": open_id})
        db.commit()
        user = dict(existing)
    else:
        role = role if role in ("customer", "provider", "admin") else "customer"
        row = db.execute(text(
            'INSERT INTO users ("openId", name, phone, role, "loginMethod", "lastSignedIn") '
            'VALUES (:oid,:name,:phone,:role,\'phone\',NOW()) RETURNING *'
        ), {"oid": open_id, "name": name or phone, "phone": phone, "role": role}).mappings().first()
        db.commit()
        user = dict(row)

        if profile_picture:
            profile_url = await upload_to_cloudinary(profile_picture, user["id"])
            db.execute(text('UPDATE users SET "profilePictureUrl" = :url WHERE id = :id'), {"url": profile_url, "id": user["id"]})
            db.commit()
            user["profilePictureUrl"] = profile_url

        if role == "customer":
            crud.create_customer_profile(db, {"userId": user["id"], "address": None, "latitude": None, "longitude": None})
        elif role == "provider":
            crud.create_provider_profile(db, {
                "userId": user["id"],
                "bio": None,
                "yearsOfExperience": None,
                "hourlyRate": None,
                "serviceAreaRadius": None,
                "serviceAreaLatitude": None,
                "serviceAreaLongitude": None,
                "plan": plan,
                "serviceRegions": []
            })

    token = _make_token(user["id"], user["openId"], user.get("name") or "", user.get("role") or "customer")
    response.set_cookie(COOKIE_NAME, token, max_age=ONE_YEAR_SECONDS, httponly=True, samesite="lax")
    return {"success": True, "user": {"id": user["id"], "name": user.get("name"), "phone": user.get("phone"), "role": user.get("role"), "profilePictureUrl": user.get("profilePictureUrl"), "email": user.get("email")}}


@router.post("/login")
def login(body: LoginBody, response: Response, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(503, "Database unavailable")
    row = db.execute(
        text('SELECT * FROM users WHERE email=:email LIMIT 1'),
        {"email": body.email}
    ).mappings().first()
    if not row:
        raise HTTPException(401, "Invalid email or password")
    row = dict(row)
    if not _verify_password(body.password, row.get("passwordHash") or ""):
        raise HTTPException(401, "Invalid email or password")
    user = row

    token = _make_token(user["id"], user["openId"], user.get("name") or "", user.get("role") or "customer")
    response.set_cookie(COOKIE_NAME, token, max_age=ONE_YEAR_SECONDS, httponly=True, samesite="lax")
    _send_email(
        user.get("email") or "",
        "Welcome to BOAFO",
        f"Hi {user.get('name') or 'there'},\n\nYour BOAFO account has been created successfully."
    )
    return {"success": True, "user": {"id": user["id"], "name": user.get("name"), "email": user.get("email"), "role": user.get("role"), "profilePictureUrl": user.get("profilePictureUrl"), "phone": user.get("phone")}}


@router.post("/register")
async def register(
    response: Response,
    db: Session = Depends(get_db),
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form("customer"),
    phone: str = Form(""),
    plan: Optional[str] = Form("Premium"),
    profile_picture: Optional[UploadFile] = File(None),
):
    if not db:
        raise HTTPException(503, "Database unavailable")
    existing = db.execute(text("SELECT id FROM users WHERE email=:e LIMIT 1"), {"e": email}).mappings().first()
    if existing:
        raise HTTPException(400, "Email already registered")
    open_id = f"local_{email}"
    pw_hash = _hash_password(password)
    row = db.execute(text(
        'INSERT INTO users ("openId", name, email, phone, "passwordHash", role, "loginMethod", "lastSignedIn") '
        "VALUES (:oid,:name,:email,:phone,:pw,:role,'email',NOW()) RETURNING *"
    ), {"oid": open_id, "name": name, "email": email, "phone": phone, "pw": pw_hash, "role": role}).mappings().first()
    db.commit()
    user = dict(row)

    if profile_picture:
        profile_url = await upload_to_cloudinary(profile_picture, user["id"])
        db.execute(text('UPDATE users SET "profilePictureUrl" = :url WHERE id = :id'), {"url": profile_url, "id": user["id"]})
        db.commit()
        user["profilePictureUrl"] = profile_url

    if role == "customer":
        crud.create_customer_profile(db, {"userId": user["id"], "address": None, "latitude": None, "longitude": None})
    elif role == "provider":
        crud.create_provider_profile(db, {
            "userId": user["id"],
            "bio": None,
            "yearsOfExperience": None,
            "hourlyRate": None,
            "serviceAreaRadius": None,
            "serviceAreaLatitude": None,
            "serviceAreaLongitude": None,
            "plan": plan,
            "serviceRegions": []
        })
    token = _make_token(user["id"], user["openId"], user.get("name") or "", user.get("role") or "customer")
    response.set_cookie(COOKIE_NAME, token, max_age=ONE_YEAR_SECONDS, httponly=True, samesite="lax")
    _send_email(
        user.get("email") or "",
        "Welcome to BOAFO",
        f"Hi {user.get('name') or 'there'},\n\nYour BOAFO account has been created successfully."
    )
    return {"success": True, "user": {"id": user["id"], "name": user.get("name"), "email": user.get("email"), "role": user.get("role"), "profilePictureUrl": user.get("profilePictureUrl"), "phone": user.get("phone")}}


@router.post("/password/forgot")
def password_forgot(body: ForgotPasswordBody, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(503, "Database unavailable")

    # Don't reveal whether the email exists.
    email = (body.email or "").strip().lower()
    row = db.execute(text('SELECT id, email, phone FROM users WHERE email=:email LIMIT 1'), {"email": email}).mappings().first()

    # Always behave the same.
    otp = generate_otp(6)

    if row:
        user = dict(row)
        phone = user.get("phone") or ""

        # Store OTP for both email + phone (two-sided).
        # Reset requires OTP to match for both keys.
        redis_store = otp_store_required()
        redis_store.set_otp(
            redis_store.make_key("password_reset", email=email, phone=None),
            otp,
            meta={"userId": user.get("id")},
        )
        if phone:
            redis_store.set_otp(
                redis_store.make_key("password_reset", email=None, phone=phone),
                otp,
                meta={"userId": user.get("id")},
            )


        # Send OTP to both destinations where possible.
        _send_email(
            email,
            "BOAFO Password Reset",
            f"Your BOAFO password reset OTP is: {otp}. It expires in 10 minutes.",
        )
        if phone:
            _send_sms(
                _normalize_phone(phone),
                f"Your BOAFO password reset OTP is: {otp}. It expires in 10 minutes.",
            )

    return {"success": True}


@router.post("/password/reset")
def password_reset(body: ResetPasswordBody, response: Response, db: Session = Depends(get_db)):
    # Basic validations
    if body.newPassword.strip() == "" or body.newPassword != body.confirmPassword:
        raise HTTPException(400, "Passwords do not match")



    if not db:
        raise HTTPException(503, "Database unavailable")

    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(400, "Invalid email")

    user_row = db.execute(text('SELECT id, email, phone FROM users WHERE email=:email LIMIT 1'), {"email": email}).mappings().first()
    if not user_row:
        # Don't leak existence; still require OTP validation keys.
        raise HTTPException(400, "Invalid OTP")

    user = dict(user_row)
    phone = user.get("phone") or ""

    # Two-sided verification: OTP must match for email-key and phone-key.
    redis_store = otp_store_required()

    email_key = redis_store.make_key("password_reset", email=email, phone=None)
    phone_key = redis_store.make_key("password_reset", email=None, phone=phone) if phone else None

    email_payload = redis_store.get_otp_payload(email_key)

    if not email_payload:
        raise HTTPException(400, "OTP expired or invalid")

    if body.otp.strip() != str(email_payload.get("otp") or ""):

        raise HTTPException(400, "Invalid OTP")

    if phone_key:
        phone_payload = redis_store.get_otp_payload(phone_key)

        if not phone_payload:
            raise HTTPException(400, "OTP expired or invalid")
        if body.otp.strip() != str(phone_payload.get("otp") or ""):
            raise HTTPException(400, "Invalid OTP")

    # One-time use
    redis_store.delete_key(email_key)
    if phone_key:
        redis_store.delete_key(phone_key)


    pw_hash = _hash_password(body.newPassword)
    db.execute(text('UPDATE users SET "passwordHash"=:pw WHERE email=:email'), {"pw": pw_hash, "email": email})
    db.commit()

    return {"success": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"success": True}