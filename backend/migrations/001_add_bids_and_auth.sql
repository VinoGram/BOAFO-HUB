-- Run this migration against your MySQL database before starting the backend

ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordHash varchar(64) NULL;

CREATE TABLE IF NOT EXISTS bids (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  jobId         INT NOT NULL,
  providerId    INT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  message       TEXT,
  estimatedDays INT,
  status        ENUM('pending','accepted','rejected') DEFAULT 'pending' NOT NULL,
  createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_job_id (jobId),
  INDEX idx_provider_id (providerId),
  INDEX idx_status (status)
);
