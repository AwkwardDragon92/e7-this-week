-- E7 This Week: initial schema
CREATE TABLE IF NOT EXISTS codes (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  rewards       TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','unconfirmed','expired')),
  found_at      TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  source_name   TEXT,
  source_url    TEXT,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('limited','pickup','class','group','mystic')),
  hero           TEXT,
  artifact       TEXT,
  element        TEXT,
  hero_class     TEXT,
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ,
  time_precision TEXT NOT NULL DEFAULT 'exact' CHECK (time_precision IN ('exact','date')),
  notice_url     TEXT,
  source_url     TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS banners_starts_idx ON banners (starts_at DESC);
CREATE INDEX IF NOT EXISTS banners_hero_idx ON banners (hero);

CREATE TABLE IF NOT EXISTS events (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  kind           TEXT,
  description    TEXT,
  rewards        TEXT,
  starts_at      TIMESTAMPTZ,
  ends_at        TIMESTAMPTZ,
  time_precision TEXT NOT NULL DEFAULT 'exact' CHECK (time_precision IN ('exact','date')),
  source_url     TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signups (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  source        TEXT,
  resend_status TEXT,
  unsubscribed  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rerun_alerts (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  hero        TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, hero)
);

CREATE TABLE IF NOT EXISTS submissions (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL,
  rewards     TEXT,
  source_url  TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note TEXT,
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status, created_at);

CREATE TABLE IF NOT EXISTS sponsors (
  id         SERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsor_weeks (
  id         SERIAL PRIMARY KEY,
  sponsor_id INTEGER NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  message    TEXT NOT NULL,
  cta        TEXT,
  price_usd  NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sponsor_weeks_range_idx ON sponsor_weeks (starts_at, ends_at);

CREATE TABLE IF NOT EXISTS sponsor_clicks (
  id         BIGSERIAL PRIMARY KEY,
  sponsor_id INTEGER REFERENCES sponsors(id) ON DELETE SET NULL,
  slug       TEXT NOT NULL,
  referer    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsor_inquiries (
  id         SERIAL PRIMARY KEY,
  name       TEXT,
  email      TEXT NOT NULL,
  company    TEXT,
  message    TEXT,
  emailed    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pageviews (
  id         BIGSERIAL PRIMARY KEY,
  path       TEXT NOT NULL,
  referrer   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pageviews_created_idx ON pageviews (created_at);

CREATE TABLE IF NOT EXISTS zero_result_searches (
  id         BIGSERIAL PRIMARY KEY,
  page       TEXT NOT NULL,
  query      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS errors (
  id         BIGSERIAL PRIMARY KEY,
  source     TEXT NOT NULL,
  message    TEXT NOT NULL,
  stack      TEXT,
  path       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
