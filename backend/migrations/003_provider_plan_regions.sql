-- Add plan and serviceRegions to provider_profiles if not already present
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'Premium'
    CHECK (plan IN ('Premium','Gold','Diamond'));

ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS "serviceRegions" JSONB NOT NULL DEFAULT '[]';
