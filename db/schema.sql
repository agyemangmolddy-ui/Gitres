CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(80) NOT NULL,
 email VARCHAR(254) NOT NULL UNIQUE,
 password_hash TEXT,
 role VARCHAR(16) NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
 google_sub TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Upgrade databases created before Google sign-in was added.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique_idx ON users(google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS telecom_bundles (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 network VARCHAR(40) NOT NULL,
 bundle_size VARCHAR(60) NOT NULL,
 data_mb INTEGER,
 validity_label VARCHAR(80) NOT NULL,
 price NUMERIC(10,2) NOT NULL CHECK(price > 0),
 provider_product_code VARCHAR(120),
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS telecom_bundles_active_idx ON telecom_bundles(is_active,network,price);
CREATE TABLE IF NOT EXISTS bundle_orders (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 bundle_id UUID REFERENCES telecom_bundles(id) ON DELETE SET NULL,
 network VARCHAR(40) NOT NULL,
 bundle_size VARCHAR(60) NOT NULL,
 price NUMERIC(10,2) NOT NULL CHECK(price > 0),
 recipient_phone VARCHAR(16) NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','fulfilled','failed','cancelled')),
 payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','pending','paid','refunded')),
 provider_reference VARCHAR(160),
 provider_response JSONB,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bundle_orders_customer_idx ON bundle_orders(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS bundle_orders_status_idx ON bundle_orders(status,created_at DESC);