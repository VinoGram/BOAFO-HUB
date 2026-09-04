-- Run in Neon SQL Editor
CREATE TABLE IF NOT EXISTS job_comments (
  id          SERIAL PRIMARY KEY,
  "jobId"     INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  "authorId"  INTEGER NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_comments_job ON job_comments("jobId");
CREATE INDEX IF NOT EXISTS idx_job_comments_author ON job_comments("authorId");
