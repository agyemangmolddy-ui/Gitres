CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  category VARCHAR(40) NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'GHS',
  coverage VARCHAR(180),
  records_label VARCHAR(100),
  licence_summary VARCHAR(500),
  source_description TEXT NOT NULL,
  rights_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','archived')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS datasets_public_listing_idx ON datasets(status,created_at DESC);
CREATE INDEX IF NOT EXISTS datasets_seller_idx ON datasets(seller_id,created_at DESC);
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  price NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'GHS',
  buyer_note VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS purchase_requests_buyer_idx ON purchase_requests(buyer_id,created_at DESC);
