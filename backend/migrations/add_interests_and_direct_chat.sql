-- Provider interest in a job
CREATE TABLE IF NOT EXISTS job_interests (
  id            SERIAL PRIMARY KEY,
  "jobId"       INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  "providerId"  INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("jobId", "providerId")
);

-- Direct chat rooms between a customer and provider (customer initiates)
CREATE TABLE IF NOT EXISTS direct_chats (
  id            SERIAL PRIMARY KEY,
  "customerId"  INTEGER NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  "providerId"  INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("customerId", "providerId")
);

-- Messages in direct chats
CREATE TABLE IF NOT EXISTS direct_messages (
  id          SERIAL PRIMARY KEY,
  "chatId"    INTEGER NOT NULL REFERENCES direct_chats(id) ON DELETE CASCADE,
  "senderId"  INTEGER NOT NULL,
  content     TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_interests_job ON job_interests("jobId");
CREATE INDEX IF NOT EXISTS idx_direct_messages_chat ON direct_messages("chatId");
