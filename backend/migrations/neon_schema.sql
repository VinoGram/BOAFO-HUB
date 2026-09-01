-- ============================================================
-- BOAFO Marketplace — Full PostgreSQL Schema for Neon
-- Run this once in the Neon SQL Editor to set up all tables.
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  "openId"        VARCHAR(64) NOT NULL UNIQUE,
  name            TEXT,
  email           VARCHAR(320),
  phone           VARCHAR(20),
  "loginMethod"   VARCHAR(64),
  "passwordHash"  VARCHAR(255),
  role            VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','provider','admin')),
  "profilePictureUrl" TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastSignedIn"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trade categories
CREATE TABLE IF NOT EXISTS trade_categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  "iconUrl"   TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider profiles
CREATE TABLE IF NOT EXISTS provider_profiles (
  id                      SERIAL PRIMARY KEY,
  "userId"                INTEGER NOT NULL REFERENCES users(id),
  bio                     TEXT,
  "yearsOfExperience"     INTEGER,
  "hourlyRate"            NUMERIC(10,2),
  "serviceAreaRadius"     INTEGER,
  "serviceAreaLatitude"   NUMERIC(10,8),
  "serviceAreaLongitude"  NUMERIC(11,8),
  plan                     VARCHAR(20) NOT NULL DEFAULT 'Premium' CHECK (plan IN ('Premium','Gold','Diamond')),
  "verificationStatus"    VARCHAR(30) NOT NULL DEFAULT 'unverified'
                          CHECK ("verificationStatus" IN ('unverified','pending','id_verified','certified','community_vouched')),
  "verificationDocuments" JSONB,
  "averageRating"         NUMERIC(3,2) DEFAULT 0,
  "totalReviews"          INTEGER DEFAULT 0,
  "isActive"              BOOLEAN NOT NULL DEFAULT true,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_verification ON provider_profiles("verificationStatus");
CREATE INDEX IF NOT EXISTS idx_provider_rating ON provider_profiles("averageRating");

-- Provider specializations
CREATE TABLE IF NOT EXISTS provider_specializations (
  id                 SERIAL PRIMARY KEY,
  "providerId"       INTEGER NOT NULL REFERENCES provider_profiles(id),
  "tradeCategoryId"  INTEGER NOT NULL REFERENCES trade_categories(id),
  "certificationUrl" TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spec_provider ON provider_specializations("providerId");

-- Provider portfolio
CREATE TABLE IF NOT EXISTS provider_portfolio (
  id           SERIAL PRIMARY KEY,
  "providerId" INTEGER NOT NULL REFERENCES provider_profiles(id),
  "mediaUrl"   TEXT NOT NULL,
  "mediaType"  VARCHAR(10) NOT NULL DEFAULT 'image' CHECK ("mediaType" IN ('image','video')),
  title        VARCHAR(200),
  description  TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON provider_portfolio("providerId");

-- Customer profiles
CREATE TABLE IF NOT EXISTS customer_profiles (
  id                       SERIAL PRIMARY KEY,
  "userId"                 INTEGER NOT NULL REFERENCES users(id),
  address                  TEXT,
  latitude                 NUMERIC(10,8),
  longitude                NUMERIC(11,8),
  "preferredContactMethod" VARCHAR(20) DEFAULT 'in_app',
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id                  SERIAL PRIMARY KEY,
  "customerId"        INTEGER NOT NULL REFERENCES customer_profiles(id),
  "tradeCategoryId"   INTEGER NOT NULL REFERENCES trade_categories(id),
  title               VARCHAR(200) NOT NULL,
  description         TEXT NOT NULL,
  budget              NUMERIC(10,2),
  location            TEXT,
  latitude            NUMERIC(10,8),
  longitude           NUMERIC(11,8),
  status              VARCHAR(20) NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','completed','cancelled')),
  "preferredStartDate" TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs("customerId");
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs("tradeCategoryId");

-- Bids
CREATE TABLE IF NOT EXISTS bids (
  id             SERIAL PRIMARY KEY,
  "jobId"        INTEGER NOT NULL REFERENCES jobs(id),
  "providerId"   INTEGER NOT NULL REFERENCES provider_profiles(id),
  amount         NUMERIC(10,2) NOT NULL,
  message        TEXT,
  "estimatedDays" INTEGER,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','rejected')),
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bids_job ON bids("jobId");
CREATE INDEX IF NOT EXISTS idx_bids_provider ON bids("providerId");

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id                   SERIAL PRIMARY KEY,
  "jobId"              INTEGER NOT NULL REFERENCES jobs(id),
  "providerId"         INTEGER NOT NULL REFERENCES provider_profiles(id),
  "customerId"         INTEGER NOT NULL REFERENCES customer_profiles(id),
  status               VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','accepted','declined','in_progress','completed','cancelled')),
  "scheduledStartTime" TIMESTAMPTZ,
  "scheduledEndTime"   TIMESTAMPTZ,
  "actualStartTime"    TIMESTAMPTZ,
  "actualEndTime"      TIMESTAMPTZ,
  "quotedPrice"        NUMERIC(10,2),
  "finalPrice"         NUMERIC(10,2),
  notes                TEXT,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings("providerId");
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings("customerId");

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           SERIAL PRIMARY KEY,
  "bookingId"  INTEGER NOT NULL REFERENCES bookings(id),
  "providerId" INTEGER NOT NULL REFERENCES provider_profiles(id),
  "customerId" INTEGER NOT NULL REFERENCES customer_profiles(id),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        VARCHAR(200),
  comment      TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews("providerId");

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id                      SERIAL PRIMARY KEY,
  "bookingId"             INTEGER NOT NULL REFERENCES bookings(id),
  "customerId"            INTEGER NOT NULL REFERENCES customer_profiles(id),
  "providerId"            INTEGER NOT NULL REFERENCES provider_profiles(id),
  amount                  NUMERIC(10,2) NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','processing','held','released','refunded','failed')),
  "stripePaymentIntentId" VARCHAR(255),
  "stripeTransferId"      VARCHAR(255),
  "heldUntil"             TIMESTAMPTZ,
  notes                   TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id            SERIAL PRIMARY KEY,
  "bookingId"   INTEGER NOT NULL REFERENCES bookings(id),
  "senderId"    INTEGER NOT NULL REFERENCES users(id),
  "recipientId" INTEGER NOT NULL REFERENCES users(id),
  message       TEXT NOT NULL,
  "mediaUrl"    TEXT,
  "isRead"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_booking ON chat_messages("bookingId");

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id                SERIAL PRIMARY KEY,
  "userId"          INTEGER NOT NULL REFERENCES users(id),
  type              VARCHAR(40) NOT NULL,
  title             VARCHAR(200) NOT NULL,
  message           TEXT,
  "relatedEntityId" INTEGER,
  "isRead"          BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications("isRead");

-- Provider availability
CREATE TABLE IF NOT EXISTS provider_availability (
  id             SERIAL PRIMARY KEY,
  "providerId"   INTEGER NOT NULL REFERENCES provider_profiles(id),
  "dayOfWeek"    INTEGER CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  "startTime"    VARCHAR(5),
  "endTime"      VARCHAR(5),
  "specificDate" TIMESTAMPTZ,
  "isAvailable"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider earnings
CREATE TABLE IF NOT EXISTS provider_earnings (
  id               SERIAL PRIMARY KEY,
  "providerId"     INTEGER NOT NULL REFERENCES provider_profiles(id),
  "bookingId"      INTEGER REFERENCES bookings(id),
  amount           NUMERIC(10,2) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  "payoutDate"     TIMESTAMPTZ,
  "stripePayoutId" VARCHAR(255),
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id                  SERIAL PRIMARY KEY,
  "bookingId"         INTEGER NOT NULL REFERENCES bookings(id),
  "initiatedByUserId" INTEGER NOT NULL REFERENCES users(id),
  reason              VARCHAR(200) NOT NULL,
  description         TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','under_review','resolved','closed')),
  resolution          TEXT,
  "resolvedByAdminId" INTEGER REFERENCES users(id),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider documents (for verification)
CREATE TABLE IF NOT EXISTS provider_documents (
  id               SERIAL PRIMARY KEY,
  "providerId"     INTEGER NOT NULL REFERENCES provider_profiles(id),
  "documentType"   VARCHAR(64) NOT NULL,
  "fileUrl"        TEXT NOT NULL,
  "fileName"       VARCHAR(255),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending_review'
                   CHECK (status IN ('pending_review','approved','rejected')),
  "reviewedAt"     TIMESTAMPTZ,
  "reviewNotes"    TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_provider ON provider_documents("providerId");

-- User reports (fraud / fake profiles)
CREATE TABLE IF NOT EXISTS user_reports (
  id                  SERIAL PRIMARY KEY,
  "reporterUserId"    INTEGER NOT NULL REFERENCES users(id),
  "reportedUserId"    INTEGER NOT NULL REFERENCES users(id),
  reason              VARCHAR(64) NOT NULL,
  description         TEXT,
  "relatedJobId"      INTEGER,
  "relatedBookingId"  INTEGER,
  status              VARCHAR(20) NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','under_review','resolved','dismissed')),
  "resolvedAt"        TIMESTAMPTZ,
  "resolvedByAdminId" INTEGER REFERENCES users(id),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed trade categories
INSERT INTO trade_categories (name, description, "isActive") VALUES
  ('Plumbing',    'Pipes, fixtures & leak repairs',              true),
  ('Electrical',  'Wiring, panels & installations',             true),
  ('Carpentry',   'Custom woodwork, framing & finishing',       true),
  ('HVAC',        'Heating, cooling & ventilation',             true),
  ('Welding',     'Metal fabrication & structural repairs',     true),
  ('Roofing',     'Installation, repair & waterproofing',       true),
  ('Painting',    'Interior, exterior & specialty coats',       true),
  ('Masonry',     'Brickwork, stone & concrete',                true),
  ('Tiling',      'Floor, wall & bathroom tiling',              true),
  ('Landscaping', 'Garden design, lawn care & irrigation',      true)
ON CONFLICT (name) DO NOTHING;
