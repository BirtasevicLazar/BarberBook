-- +goose Up
-- Add customer_email column to appointments table
ALTER TABLE appointments ADD COLUMN customer_email TEXT;

-- Add index for email lookups
CREATE INDEX idx_appointments_customer_email ON appointments(customer_email);

-- +goose Down
DROP INDEX IF EXISTS idx_appointments_customer_email;
ALTER TABLE appointments DROP COLUMN IF EXISTS customer_email;
