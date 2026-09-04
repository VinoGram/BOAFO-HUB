from sqlalchemy.orm import Session
from sqlalchemy import text


# ── Users ──────────────────────────────────────────────────────────────────

def get_user_by_open_id(db: Session, open_id: str):
    row = db.execute(text('SELECT * FROM users WHERE "openId" = :oid LIMIT 1'), {"oid": open_id}).mappings().first()
    return dict(row) if row else None


def get_user_by_id(db: Session, user_id):
    row = db.execute(text("SELECT * FROM users WHERE id = :id LIMIT 1"), {"id": int(user_id)}).mappings().first()
    return dict(row) if row else None


def upsert_user(db: Session, open_id: str, name=None, email=None, login_method=None):
    existing = get_user_by_open_id(db, open_id)
    if existing:
        db.execute(text(
            'UPDATE users SET name=:name, email=:email, "loginMethod"=:lm, "lastSignedIn"=NOW() WHERE "openId"=:oid'
        ), {"name": name, "email": email, "lm": login_method, "oid": open_id})
    else:
        db.execute(text(
            'INSERT INTO users ("openId", name, email, "loginMethod", "lastSignedIn") VALUES (:oid, :name, :email, :lm, NOW())'
        ), {"oid": open_id, "name": name, "email": email, "lm": login_method})
    db.commit()
    return get_user_by_open_id(db, open_id)


# ── Trade Categories ────────────────────────────────────────────────────────

def get_trade_categories(db: Session):
    rows = db.execute(text('SELECT * FROM trade_categories WHERE "isActive" = true')).mappings().all()
    return [dict(r) for r in rows]


def get_trade_category_by_id(db: Session, category_id: int):
    row = db.execute(text("SELECT * FROM trade_categories WHERE id = :id LIMIT 1"), {"id": category_id}).mappings().first()
    return dict(row) if row else None


# ── Provider Profiles ───────────────────────────────────────────────────────

def get_provider_profile(db: Session, user_id):
    row = db.execute(text('SELECT * FROM provider_profiles WHERE "userId" = :uid LIMIT 1'), {"uid": int(user_id)}).mappings().first()
    return dict(row) if row else None


def get_provider_profile_by_id(db: Session, provider_id: int):
    row = db.execute(text("SELECT * FROM provider_profiles WHERE id = :id LIMIT 1"), {"id": provider_id}).mappings().first()
    return dict(row) if row else None


def get_verified_providers(db: Session, limit: int = 20, offset: int = 0):
    rows = db.execute(text(
        "SELECT * FROM provider_profiles WHERE \"isActive\"=true "
        "AND \"verificationStatus\" IN ('id_verified','certified','community_vouched') "
        'ORDER BY "averageRating" DESC LIMIT :lim OFFSET :off'
    ), {"lim": limit, "off": offset}).mappings().all()
    return [dict(r) for r in rows]


def search_providers_by_category(db: Session, trade_category_id: int, limit: int = 20, offset: int = 0):
    rows = db.execute(text(
        'SELECT pp.* FROM provider_profiles pp '
        'INNER JOIN provider_specializations ps ON pp.id = ps."providerId" '
        'WHERE pp."isActive"=true AND ps."tradeCategoryId"=:cid '
        'ORDER BY pp."averageRating" DESC LIMIT :lim OFFSET :off'
    ), {"cid": trade_category_id, "lim": limit, "off": offset}).mappings().all()
    return [dict(r) for r in rows]


def create_provider_profile(db: Session, data: dict):
    import json
    regions = data.get("serviceRegions") or []
    row = db.execute(text(
        'INSERT INTO provider_profiles ("userId", bio, "yearsOfExperience", "hourlyRate", '
        '"serviceAreaRadius", "serviceAreaLatitude", "serviceAreaLongitude", plan, "serviceRegions") '
        'VALUES (:userId, :bio, :yearsOfExperience, :hourlyRate, :serviceAreaRadius, '
        ':serviceAreaLatitude, :serviceAreaLongitude, :plan, :serviceRegions::jsonb) RETURNING id'
    ), {**data, "plan": data.get("plan") or "Premium", "serviceRegions": json.dumps(regions)}).mappings().first()
    db.commit()
    return get_provider_profile(db, data["userId"])


def update_provider_profile(db: Session, provider_id: int, data: dict):
    sets = ", ".join(f'"{k}"=:{k}' for k in data)
    db.execute(text(f"UPDATE provider_profiles SET {sets} WHERE id=:id"), {**data, "id": provider_id})
    db.commit()
    return get_provider_profile_by_id(db, provider_id)


def get_provider_specializations(db: Session, provider_id: int):
    rows = db.execute(text('SELECT * FROM provider_specializations WHERE "providerId"=:pid'), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


def get_provider_portfolio(db: Session, provider_id: int):
    rows = db.execute(text('SELECT * FROM provider_portfolio WHERE "providerId"=:pid ORDER BY "createdAt" DESC'), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


def get_provider_portfolio_item(db: Session, item_id: int):
    row = db.execute(text('SELECT * FROM provider_portfolio WHERE id=:id LIMIT 1'), {"id": item_id}).mappings().first()
    return dict(row) if row else None


def create_provider_portfolio_item(db: Session, data: dict):
    row = db.execute(text(
        'INSERT INTO provider_portfolio ("providerId", "mediaUrl", "mediaType", title, description) '
        'VALUES (:providerId, :mediaUrl, :mediaType, :title, :description) RETURNING *'
    ), data).mappings().first()
    db.commit()
    return dict(row) if row else None


def delete_provider_portfolio_item(db: Session, item_id: int):
    db.execute(text('DELETE FROM provider_portfolio WHERE id=:id'), {"id": item_id})
    db.commit()


def get_provider_earnings(db: Session, provider_id: int):
    rows = db.execute(text('SELECT * FROM provider_earnings WHERE "providerId"=:pid'), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


def get_total_provider_earnings(db: Session, provider_id: int):
    row = db.execute(text('SELECT * FROM provider_earnings WHERE "providerId"=:pid LIMIT 1'), {"pid": provider_id}).mappings().first()
    return dict(row) if row else {"totalEarned": "0", "availableForPayout": "0", "pendingEscrow": "0"}


# ── Customer Profiles ───────────────────────────────────────────────────────

def get_customer_profile(db: Session, user_id):
    row = db.execute(text('SELECT * FROM customer_profiles WHERE "userId"=:uid LIMIT 1'), {"uid": int(user_id)}).mappings().first()
    return dict(row) if row else None


def create_customer_profile(db: Session, data: dict):
    db.execute(text(
        'INSERT INTO customer_profiles ("userId", address, latitude, longitude) '
        'VALUES (:userId, :address, :latitude, :longitude)'
    ), data)
    db.commit()
    return get_customer_profile(db, data["userId"])


# ── Jobs ────────────────────────────────────────────────────────────────────

def get_job_by_id(db: Session, job_id: int):
    row = db.execute(text("SELECT * FROM jobs WHERE id=:id LIMIT 1"), {"id": job_id}).mappings().first()
    return dict(row) if row else None


def get_open_jobs(db: Session, limit: int = 20, offset: int = 0):
    rows = db.execute(text(
        'SELECT * FROM jobs WHERE status=\'open\' ORDER BY "createdAt" DESC LIMIT :lim OFFSET :off'
    ), {"lim": limit, "off": offset}).mappings().all()
    return [dict(r) for r in rows]


def get_open_jobs_by_regions(db: Session, regions: list, limit: int = 20, offset: int = 0):
    # Match jobs whose location contains any of the provider's regions (case-insensitive)
    conditions = " OR ".join(f"location ILIKE :r{i}" for i in range(len(regions)))
    params: dict = {"lim": limit, "off": offset}
    for i, r in enumerate(regions):
        params[f"r{i}"] = f"%{r}%"
    rows = db.execute(text(
        f'SELECT * FROM jobs WHERE status=\'open\' AND ({conditions}) ORDER BY "createdAt" DESC LIMIT :lim OFFSET :off'
    ), params).mappings().all()
    return [dict(r) for r in rows]


def get_jobs_by_customer(db: Session, customer_id: int):
    rows = db.execute(text(
        'SELECT * FROM jobs WHERE "customerId"=:cid ORDER BY "createdAt" DESC'
    ), {"cid": customer_id}).mappings().all()
    return [dict(r) for r in rows]


def get_jobs_by_category(db: Session, trade_category_id: int, limit: int = 20, offset: int = 0):
    rows = db.execute(text(
        'SELECT * FROM jobs WHERE "tradeCategoryId"=:cid AND status=\'open\' ORDER BY "createdAt" DESC LIMIT :lim OFFSET :off'
    ), {"cid": trade_category_id, "lim": limit, "off": offset}).mappings().all()
    return [dict(r) for r in rows]


def create_job(db: Session, data: dict):
    if "imageUrls" not in data:
        data["imageUrls"] = []
    result = db.execute(
        text(
            'INSERT INTO jobs ("customerId", "tradeCategoryId", title, description, budget, '
            'location, latitude, longitude, status, "preferredStartDate", "imageUrls") '
            'VALUES (:customerId, :tradeCategoryId, :title, :description, :budget, '
            ':location, :latitude, :longitude, :status, :preferredStartDate, :imageUrls) '
            'RETURNING id'
        ),
        data,
    )
    db.commit()
    return result.scalar()


# ── Bookings ────────────────────────────────────────────────────────────────

def get_booking_by_id(db: Session, booking_id: int):
    row = db.execute(text("SELECT * FROM bookings WHERE id=:id LIMIT 1"), {"id": booking_id}).mappings().first()
    return dict(row) if row else None


def get_bookings_by_provider(db: Session, provider_id: int):
    rows = db.execute(text(
        'SELECT * FROM bookings WHERE "providerId"=:pid ORDER BY "createdAt" DESC'
    ), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


def get_bookings_by_customer(db: Session, customer_id: int):
    rows = db.execute(text(
        'SELECT * FROM bookings WHERE "customerId"=:cid ORDER BY "createdAt" DESC'
    ), {"cid": customer_id}).mappings().all()
    return [dict(r) for r in rows]


def create_booking(db: Session, data: dict):
    row = db.execute(text(
        'INSERT INTO bookings ("jobId", "providerId", "customerId", "quotedPrice", '
        '"scheduledStartTime", "scheduledEndTime", notes, status) '
        'VALUES (:jobId, :providerId, :customerId, :quotedPrice, '
        ':scheduledStartTime, :scheduledEndTime, :notes, :status) RETURNING id'
    ), data).mappings().first()
    db.commit()
    return row["id"] if row else 0


def update_booking_status(db: Session, booking_id: int, status: str):
    db.execute(text(
        'UPDATE bookings SET status=:status, "updatedAt"=NOW() WHERE id=:id'
    ), {"status": status, "id": booking_id})
    db.commit()


# ── Reviews ─────────────────────────────────────────────────────────────────

def get_reviews_by_provider(db: Session, provider_id: int):
    rows = db.execute(text(
        'SELECT * FROM reviews WHERE "providerId"=:pid ORDER BY "createdAt" DESC'
    ), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


def create_review(db: Session, data: dict):
    row = db.execute(text(
        'INSERT INTO reviews ("bookingId", "providerId", "customerId", rating, title, comment) '
        'VALUES (:bookingId, :providerId, :customerId, :rating, :title, :comment) RETURNING id'
    ), data).mappings().first()
    review_id = row["id"] if row else 0

    # Update provider average rating
    avg_row = db.execute(text(
        'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE "providerId"=:pid'
    ), {"pid": data["providerId"]}).mappings().first()
    if avg_row and avg_row["avg"]:
        db.execute(text(
            'UPDATE provider_profiles SET "averageRating"=:avg, "totalReviews"=:cnt WHERE id=:pid'
        ), {"avg": round(float(avg_row["avg"]), 2), "cnt": avg_row["cnt"], "pid": data["providerId"]})
    db.commit()
    return review_id


# ── Chat ─────────────────────────────────────────────────────────────────────

def get_chat_messages_by_booking(db: Session, booking_id: int):
    rows = db.execute(text(
        'SELECT * FROM chat_messages WHERE "bookingId"=:bid ORDER BY "createdAt" DESC'
    ), {"bid": booking_id}).mappings().all()
    return [dict(r) for r in rows]


def create_chat_message(db: Session, data: dict):
    row = db.execute(text(
        'INSERT INTO chat_messages ("bookingId", "senderId", "recipientId", message, "mediaUrl", "isRead") '
        'VALUES (:bookingId, :senderId, :recipientId, :message, :mediaUrl, :isRead) RETURNING id'
    ), data).mappings().first()
    db.commit()
    return row["id"] if row else 0


def mark_chat_message_as_read(db: Session, message_id: int):
    db.execute(text('UPDATE chat_messages SET "isRead"=true WHERE id=:id'), {"id": message_id})
    db.commit()


# ── Notifications ────────────────────────────────────────────────────────────

def get_notifications_by_user(db: Session, user_id: int, limit: int = 50, offset: int = 0):
    rows = db.execute(text(
        'SELECT * FROM notifications WHERE "userId"=:uid ORDER BY "createdAt" DESC LIMIT :lim OFFSET :off'
    ), {"uid": user_id, "lim": limit, "off": offset}).mappings().all()
    return [dict(r) for r in rows]


def get_unread_notifications(db: Session, user_id: int):
    rows = db.execute(text(
        'SELECT * FROM notifications WHERE "userId"=:uid AND "isRead"=false'
    ), {"uid": user_id}).mappings().all()
    return [dict(r) for r in rows]


def create_notification(db: Session, data: dict):
    db.execute(text(
        'INSERT INTO notifications ("userId", type, title, message, "relatedEntityId", "isRead") '
        'VALUES (:userId, :type, :title, :message, :relatedEntityId, :isRead)'
    ), data)
    db.commit()


def mark_notification_as_read(db: Session, notification_id: int):
    db.execute(text('UPDATE notifications SET "isRead"=true WHERE id=:id'), {"id": notification_id})
    db.commit()


# ── Payments ─────────────────────────────────────────────────────────────────

def get_payment_by_booking(db: Session, booking_id: int):
    row = db.execute(text('SELECT * FROM payments WHERE "bookingId"=:bid LIMIT 1'), {"bid": booking_id}).mappings().first()
    return dict(row) if row else None


def get_payments_by_provider(db: Session, provider_id: int):
    rows = db.execute(text(
        'SELECT * FROM payments WHERE "providerId"=:pid ORDER BY "createdAt" DESC'
    ), {"pid": provider_id}).mappings().all()
    return [dict(r) for r in rows]


def update_payment_status(db: Session, payment_id: int, status: str):
    db.execute(text(
        'UPDATE payments SET status=:status, "updatedAt"=NOW() WHERE id=:id'
    ), {"status": status, "id": payment_id})
    db.commit()
