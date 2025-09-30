-- +goose Up
-- Ekstenzije
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- EXCLUDE (sprečavanje preklapanja)
CREATE EXTENSION IF NOT EXISTS citext;       -- case-insensitive e-mail

-- +goose StatementBegin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('pending','confirmed','canceled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE staff_role AS ENUM ('owner','barber');
  END IF;
END$$;
-- +goose StatementEnd

-- =============================================
-- 3) Users (vlasnici i frizeri)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  role            staff_role NOT NULL DEFAULT 'barber',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4) Salons
-- =============================================
CREATE TABLE IF NOT EXISTS salons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT NOT NULL,
  timezone        TEXT NOT NULL DEFAULT 'Europe/Belgrade',
  currency        TEXT NOT NULL DEFAULT 'RSD',
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 5) Barbers (frizeri)
-- =============================================
CREATE TABLE IF NOT EXISTS barbers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id                  UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  display_name              TEXT NOT NULL,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  slot_duration_minutes     INT NOT NULL CHECK (slot_duration_minutes > 0),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (salon_id, user_id),
  UNIQUE (salon_id, display_name)
);

-- =============================================
-- 6) Barber services (usluge koje frizer radi)
-- =============================================
CREATE TABLE IF NOT EXISTS barber_services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id           UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  duration_min        INT NOT NULL CHECK (duration_min > 0),
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barber_id, name)
);

CREATE INDEX IF NOT EXISTS idx_barber_services_active
  ON barber_services (barber_id, active);

-- =============================================
-- 7) Barber working hours
-- =============================================
CREATE TABLE IF NOT EXISTS barber_working_hours (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id     UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week   INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  CHECK (start_time < end_time),
  UNIQUE (barber_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_working_hours_lookup
  ON barber_working_hours (barber_id, day_of_week);

-- =============================================
-- 8) Barber breaks
-- =============================================
CREATE TABLE IF NOT EXISTS barber_breaks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id     UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week   INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  CHECK (start_time < end_time)
);

-- =============================================
-- 9) Barber time off (slobodni dani, odsustva)
-- =============================================
CREATE TABLE IF NOT EXISTS barber_time_off (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id     UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  reason        TEXT,
  CHECK (start_at < end_at)
);

CREATE INDEX IF NOT EXISTS idx_timeoff_barber
  ON barber_time_off (barber_id, start_at, end_at);

-- =============================================
-- 10) Appointments (rezervacije)
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id            UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  barber_id           UUID NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,
  barber_service_id    UUID NOT NULL,
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT,
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  duration_min        INT NOT NULL CHECK (duration_min > 0),
  start_at            TIMESTAMPTZ NOT NULL,
  end_at              TIMESTAMPTZ NOT NULL,
  status              appointment_status NOT NULL DEFAULT 'pending',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

-- end_at = start_at + duration_min (trigger-based da bismo izbegli immutable restriction)
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION set_appointment_end_at()
RETURNS trigger AS $$
BEGIN
  NEW.end_at := NEW.start_at + make_interval(mins => NEW.duration_min);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_appointment_end_at ON appointments;
CREATE TRIGGER trg_set_appointment_end_at
BEFORE INSERT OR UPDATE OF start_at, duration_min ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_appointment_end_at();
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_appt_barber_service_matches_barber'
  ) THEN
    -- unique da bi FK mogao da referencira oba polja
    ALTER TABLE barber_services
      ADD CONSTRAINT barber_services_id_barber_uniq UNIQUE (id, barber_id);

    ALTER TABLE appointments
      ADD CONSTRAINT fk_appt_barber_service_matches_barber
      FOREIGN KEY (barber_service_id, barber_id)
      REFERENCES barber_services (id, barber_id)
      ON DELETE RESTRICT;
  END IF;
END$$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_appt_barber_in_salon'
  ) THEN
    -- unique da bi FK mogao da referencira oba polja
    ALTER TABLE barbers
      ADD CONSTRAINT barbers_id_salon_uniq UNIQUE (id, salon_id);

    ALTER TABLE appointments
      ADD CONSTRAINT fk_appt_barber_in_salon
      FOREIGN KEY (barber_id, salon_id)
      REFERENCES barbers (id, salon_id)
      ON DELETE RESTRICT;
  END IF;
END$$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'no_overlap_per_barber'
      AND conrelid = 'appointments'::regclass
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT no_overlap_per_barber
      EXCLUDE USING gist (
        barber_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
      )
      WHERE (status <> 'canceled');
  END IF;
END$$;
-- +goose StatementEnd

-- +goose Down
-- Drop trigger and function first
-- +goose StatementBegin
DROP TRIGGER IF EXISTS trg_set_appointment_end_at ON appointments;
DROP FUNCTION IF EXISTS set_appointment_end_at();
-- +goose StatementEnd
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS barber_time_off;
DROP TABLE IF EXISTS barber_breaks;
DROP TABLE IF EXISTS barber_working_hours;
DROP TABLE IF EXISTS barber_services;
DROP TABLE IF EXISTS barbers;
DROP TABLE IF EXISTS salons;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS appointment_status;
DROP TYPE IF EXISTS staff_role;

-- Indeksi za brzinu
CREATE INDEX IF NOT EXISTS idx_appt_barber_start
  ON appointments (barber_id, start_at);

CREATE INDEX IF NOT EXISTS idx_appt_salon_start
  ON appointments (salon_id, start_at);

CREATE INDEX IF NOT EXISTS idx_appt_barber_status_start
  ON appointments (barber_id, status, start_at);

CREATE INDEX IF NOT EXISTS idx_appt_barber_service
  ON appointments (barber_service_id);

CREATE INDEX IF NOT EXISTS idx_appt_not_canceled
  ON appointments (barber_id, start_at)
  WHERE status <> 'canceled';
