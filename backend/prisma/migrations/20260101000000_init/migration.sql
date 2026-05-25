-- Zalba initial migration.
-- Owns: enums, tables, indexes, generated tsvector columns, updated_at triggers.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE "ComplaintStatus"   AS ENUM ('NEW','CONTACTED','RESOLVED','REMOVED');
CREATE TYPE "ComplaintCategory" AS ENUM (
  'QUALITY','BILLING','DELIVERY','SUPPORT','ACCOUNT','WARRANTY','MISLEADING','OTHER'
);
CREATE TYPE "SuggestionStatus"  AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE "UploaderRole"      AS ENUM ('PUBLIC','COMPANY','ADMIN');
CREATE TYPE "AuditActorRole"    AS ENUM ('SYSTEM','COMPANY','ADMIN','PUBLIC');

-- ============================================================
-- companies
-- ============================================================

CREATE TABLE "companies" (
  "id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"          TEXT         NOT NULL UNIQUE,
  "name"          TEXT         NOT NULL,
  "category"      TEXT         NOT NULL,
  "website"       TEXT,
  "phone"         TEXT,
  "description"   TEXT,
  "logo_url"      TEXT,
  "contact_email" TEXT,
  "address"       TEXT,
  "search_vector" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("category", '')), 'B')
  ) STORED,
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "companies_category_idx"      ON "companies"("category");
CREATE INDEX "companies_search_vector_idx" ON "companies" USING GIN ("search_vector");

-- ============================================================
-- complaints
-- ============================================================

CREATE TABLE "complaints" (
  "id"                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id"                  UUID NOT NULL REFERENCES "companies"("id") ON DELETE RESTRICT,
  "title"                       TEXT NOT NULL,
  "body"                        TEXT NOT NULL,
  "contact_email"               TEXT,
  "contact_phone"               TEXT,
  "company_reply"               TEXT,
  "company_reply_updated_at"    TIMESTAMPTZ(6),
  "status"                      "ComplaintStatus"   NOT NULL DEFAULT 'NEW',
  "complaint_category"          "ComplaintCategory" NOT NULL,
  "view_count"                  INT NOT NULL DEFAULT 0,
  "is_published"                BOOLEAN NOT NULL DEFAULT FALSE,
  "is_deleted"                  BOOLEAN NOT NULL DEFAULT FALSE,
  "deleted_at"                  TIMESTAMPTZ(6),
  "ip_hash"                     TEXT,
  "draft_token_hash"            TEXT UNIQUE,
  "draft_expires_at"            TIMESTAMPTZ(6),
  "search_vector"               tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("body", '')),  'B')
  ) STORED,
  "created_at"                  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"                  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "complaints_title_length"  CHECK (char_length("title") BETWEEN 8  AND 160),
  CONSTRAINT "complaints_body_length"   CHECK (char_length("body")  BETWEEN 30 AND 8000)
);

CREATE INDEX "complaints_company_status_created_idx"
  ON "complaints"("company_id", "status", "created_at" DESC);
CREATE INDEX "complaints_status_created_idx"
  ON "complaints"("status", "created_at" DESC);
CREATE INDEX "complaints_is_deleted_idx" ON "complaints"("is_deleted");
CREATE INDEX "complaints_published_idx"  ON "complaints"("is_published", "is_deleted");
CREATE INDEX "complaints_search_vector_idx" ON "complaints" USING GIN ("search_vector");

-- ============================================================
-- complaint_attachments
-- ============================================================

CREATE TABLE "complaint_attachments" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "complaint_id"       UUID NOT NULL REFERENCES "complaints"("id") ON DELETE CASCADE,
  "storage_backend"    TEXT NOT NULL DEFAULT 's3',
  "storage_key"        TEXT NOT NULL,
  "original_filename"  TEXT NOT NULL,
  "content_type"       TEXT NOT NULL,
  "file_size"          BIGINT NOT NULL,
  "sha256"             CHAR(64) NOT NULL,
  "uploaded_by_role"   "UploaderRole" NOT NULL DEFAULT 'PUBLIC',
  "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "complaint_attachments_complaint_sha_unique"
  ON "complaint_attachments"("complaint_id", "sha256");
CREATE INDEX "complaint_attachments_complaint_idx"
  ON "complaint_attachments"("complaint_id");

-- ============================================================
-- complaint_updates
-- ============================================================

CREATE TABLE "complaint_updates" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "complaint_id"  UUID NOT NULL REFERENCES "complaints"("id") ON DELETE CASCADE,
  "actor"         "AuditActorRole" NOT NULL,
  "actor_id"      UUID,
  "note"          TEXT NOT NULL,
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "complaint_updates_complaint_created_idx"
  ON "complaint_updates"("complaint_id", "created_at");

-- ============================================================
-- reports
-- ============================================================

CREATE TABLE "reports" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "complaint_id"  UUID NOT NULL REFERENCES "complaints"("id") ON DELETE CASCADE,
  "reason"        TEXT NOT NULL,
  "detail"        TEXT,
  "ip_hash"       TEXT NOT NULL,
  "resolved_at"   TIMESTAMPTZ(6),
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "reports_detail_length" CHECK (detail IS NULL OR char_length(detail) <= 500)
);

CREATE UNIQUE INDEX "reports_complaint_ip_unique"
  ON "reports"("complaint_id", "ip_hash");
CREATE INDEX "reports_resolved_created_idx"
  ON "reports"("resolved_at", "created_at");

-- ============================================================
-- company_suggestions
-- ============================================================

CREATE TABLE "company_suggestions" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"          TEXT NOT NULL,
  "website"       TEXT,
  "category"      TEXT,
  "note"          TEXT,
  "status"        "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note"    TEXT,
  "ip_hash"       TEXT NOT NULL,
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "processed_at"  TIMESTAMPTZ(6)
);

CREATE INDEX "company_suggestions_status_created_idx"
  ON "company_suggestions"("status", "created_at" DESC);

-- ============================================================
-- company_users
-- ============================================================

CREATE TABLE "company_users" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id"     UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "email"          CITEXT NOT NULL UNIQUE,
  "password_hash"  TEXT NOT NULL,
  "display_name"   TEXT NOT NULL,
  "is_active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "last_login_at"  TIMESTAMPTZ(6),
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "company_users_company_idx" ON "company_users"("company_id");

-- ============================================================
-- admin_users
-- ============================================================

CREATE TABLE "admin_users" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"          CITEXT NOT NULL UNIQUE,
  "password_hash"  TEXT NOT NULL,
  "display_name"   TEXT NOT NULL,
  "is_active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "last_login_at"  TIMESTAMPTZ(6),
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- ============================================================
-- refresh_tokens
-- ============================================================

CREATE TABLE "refresh_tokens" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "token_hash"   CHAR(64) NOT NULL UNIQUE,
  "audience"     TEXT NOT NULL,
  "user_id"      UUID NOT NULL,
  "parent_id"    UUID,
  "ip_hash"      TEXT,
  "user_agent"   TEXT,
  "expires_at"   TIMESTAMPTZ(6) NOT NULL,
  "revoked_at"   TIMESTAMPTZ(6),
  "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "refresh_tokens_user_aud_idx" ON "refresh_tokens"("user_id", "audience");
CREATE INDEX "refresh_tokens_expires_idx"  ON "refresh_tokens"("expires_at");

-- ============================================================
-- admin_audit_log
-- ============================================================

CREATE TABLE "admin_audit_log" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_role"    "AuditActorRole" NOT NULL,
  "actor_id"      UUID,
  "action"        TEXT NOT NULL,
  "target_type"   TEXT NOT NULL,
  "target_id"     TEXT NOT NULL,
  "payload_json"  JSONB,
  "ip_hash"       TEXT,
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "admin_audit_log_target_created_idx"
  ON "admin_audit_log"("target_type", "target_id", "created_at" DESC);
CREATE INDEX "admin_audit_log_action_created_idx"
  ON "admin_audit_log"("action", "created_at" DESC);

-- ============================================================
-- updated_at triggers
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_set_updated_at      BEFORE UPDATE ON "companies"      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER complaints_set_updated_at     BEFORE UPDATE ON "complaints"     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER company_users_set_updated_at  BEFORE UPDATE ON "company_users"  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER admin_users_set_updated_at    BEFORE UPDATE ON "admin_users"    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
