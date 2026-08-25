# BOAFO — Running the Backend

## 1. Set up Neon database

1. Go to **https://neon.tech** and sign up (free tier is fine)
2. Create a new project — name it `boafo`
3. Click **SQL Editor** in the left sidebar
4. Paste the entire contents of `backend/migrations/neon_schema.sql` and click **Run**
5. Go to **Connection Details**, copy the **Connection string** (it starts with `postgresql://`)

## 2. Configure .env

Open `.env` at the project root and fill in:

```
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=<run: python -c "import secrets; print(secrets.token_hex(32))">
TWILIO_ACCOUNT_SID=       # leave empty to print OTPs to console
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## 3. Install Python dependencies

```bash
cd C:\Users\HP\Downloads\tradecraft-marketplace

# Create a virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate

# Install packages
pip install -r backend/requirements.txt
```

## 4. Run the backend

```bash
# Make sure your venv is active, then from the project root:
uvicorn backend.main:app --reload --port 8000
```

You should see:
```
[Database] Connected to Neon PostgreSQL
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## 5. Run the frontend (separate terminal)

```bash
cd C:\Users\HP\Downloads\tradecraft-marketplace
pnpm dev
```

Frontend runs on **http://localhost:5173**
Backend API runs on **http://localhost:8000**
Vite proxies all `/api/*` calls from the frontend to the backend automatically.

## Twilio SMS (optional)

Without Twilio credentials, OTP codes are printed to the backend console like:
```
[SMS STUB] To +233244123456: Your BOAFO verification code is: 482910
```
Just copy that code into the OTP input during development.

To enable real SMS:
1. Sign up at https://twilio.com (free trial gives $15 credit)
2. Get your Account SID, Auth Token, and a phone number
3. Add them to `.env`
