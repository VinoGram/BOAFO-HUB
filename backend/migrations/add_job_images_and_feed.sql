-- Run in Neon SQL Editor

-- Add image URLs array to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT '{}';

-- Feed posts (visible to all, only customers can create)
CREATE TABLE IF NOT EXISTS feed_posts (
  id            SERIAL PRIMARY KEY,
  "authorId"    INTEGER NOT NULL REFERENCES users(id),
  content       TEXT NOT NULL,
  "imageUrls"   TEXT[] DEFAULT '{}',
  "likesCount"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_author ON feed_posts("authorId");
CREATE INDEX IF NOT EXISTS idx_feed_created ON feed_posts("createdAt" DESC);

-- Feed comments
CREATE TABLE IF NOT EXISTS feed_comments (
  id          SERIAL PRIMARY KEY,
  "postId"    INTEGER NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  "authorId"  INTEGER NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments("postId");
