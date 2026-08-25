-- Migration 002: Provider documents, user reports
-- Run after 001_add_bids_and_auth.sql

CREATE TABLE IF NOT EXISTS provider_documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  providerId    INT NOT NULL,
  documentType  VARCHAR(64) NOT NULL,  -- national_id | trade_cert | apprenticeship_cert | portfolio_photo | other
  fileUrl       TEXT NOT NULL,
  fileName      VARCHAR(255),
  status        ENUM('pending_review','approved','rejected') DEFAULT 'pending_review' NOT NULL,
  reviewedAt    DATETIME,
  reviewNotes   TEXT,
  createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_provider_id (providerId),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS user_reports (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  reporterUserId    INT NOT NULL,
  reportedUserId    INT NOT NULL,
  reason            VARCHAR(64) NOT NULL,  -- fake_profile | fraud | no_show | inappropriate | other
  description       TEXT,
  relatedJobId      INT,
  relatedBookingId  INT,
  status            ENUM('open','under_review','resolved','dismissed') DEFAULT 'open' NOT NULL,
  resolvedAt        DATETIME,
  resolvedByAdminId INT,
  createdAt         TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_reported (reportedUserId),
  INDEX idx_status (status)
);

-- Guarantee/insurance fund tracking
CREATE TABLE IF NOT EXISTS guarantee_claims (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  bookingId       INT NOT NULL,
  claimedByUserId INT NOT NULL,
  reason          TEXT NOT NULL,
  amount          DECIMAL(10,2),
  status          ENUM('pending','approved','rejected') DEFAULT 'pending' NOT NULL,
  adminNotes      TEXT,
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_booking (bookingId)
);

-- Push notification tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  userId    INT NOT NULL,
  token     VARCHAR(512) NOT NULL,
  platform  VARCHAR(32) DEFAULT 'web',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY uk_token (token)
);
