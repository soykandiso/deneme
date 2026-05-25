# Database schema

The schema lives in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)
and is migrated with `prisma migrate`. This document is the human-readable
reference.

## Enums

```text
ComplaintStatus    = NEW | CONTACTED | RESOLVED | REMOVED
ComplaintCategory  = QUALITY | BILLING | DELIVERY | SUPPORT | ACCOUNT |
                     WARRANTY | MISLEADING | OTHER
SuggestionStatus   = PENDING | APPROVED | REJECTED
UploaderRole       = PUBLIC | COMPANY | ADMIN
```

## Tables

### `companies`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| slug | text UNIQUE | URL-safe |
| name | text | |
| category | text | |
| website | text NULL | |
| phone | text NULL | |
| description | text NULL | |
| logo_url | text NULL | |
| contact_email | citext NULL | |
| address | text NULL | |
| search_vector | tsvector | GENERATED ALWAYS AS (to_tsvector('simple', name)) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

Indexes: `slug` (unique), `search_vector` (GIN), `category`.

### `complaints`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK → companies | ON DELETE RESTRICT |
| title | text NOT NULL | length 8..160 |
| body | text NOT NULL | length 30..8000 |
| contact_email | citext NULL | not returned to public |
| contact_phone | text NULL | not returned to public |
| company_reply | text NULL | |
| company_reply_updated_at | timestamptz NULL | |
| status | ComplaintStatus | default NEW |
| complaint_category | ComplaintCategory | |
| view_count | int | default 0 |
| is_deleted | bool | default false |
| deleted_at | timestamptz NULL | |
| ip_hash | text NULL | for abuse correlation |
| search_vector | tsvector | GENERATED, includes title + body |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

Indexes: `(company_id, status, created_at DESC)`, `(status, created_at DESC)`,
`search_vector` (GIN), `(is_deleted)`.

### `complaint_attachments`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| complaint_id | uuid FK → complaints | ON DELETE CASCADE |
| storage_backend | text | e.g. `s3` |
| storage_key | text | random, opaque |
| original_filename | text | |
| content_type | text | validated server-side |
| file_size | bigint | bytes |
| sha256 | char(64) | uploaded checksum |
| uploaded_by_role | UploaderRole | |
| created_at | timestamptz | default now() |

Unique index on `(complaint_id, sha256)` — prevents duplicate uploads.

### `complaint_updates`
Public timeline entries.

| col | type | notes |
|---|---|---|
| id | uuid PK | |
| complaint_id | uuid FK → complaints CASCADE | |
| actor | text | `system`, `company`, `admin` |
| actor_id | uuid NULL | nullable for system events |
| note | text | localized server-side |
| created_at | timestamptz | default now() |

Index: `(complaint_id, created_at)`.

### `reports`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| complaint_id | uuid FK → complaints CASCADE | |
| reason | text | enum-ish; validated in DTO |
| detail | text NULL | up to 500 chars |
| ip_hash | text | SHA-256(ip + pepper) |
| created_at | timestamptz | default now() |

Unique on `(complaint_id, ip_hash)` to dedupe abuse.

### `company_suggestions`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| website | text NULL | |
| category | text NULL | |
| note | text NULL | |
| status | SuggestionStatus | default PENDING |
| admin_note | text NULL | |
| ip_hash | text | |
| created_at | timestamptz | default now() |
| processed_at | timestamptz NULL | |

### `company_users`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK → companies CASCADE | |
| email | citext UNIQUE | |
| password_hash | text | argon2id |
| display_name | text | |
| is_active | bool | default true |
| last_login_at | timestamptz NULL | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### `admin_users`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| email | citext UNIQUE | |
| password_hash | text | argon2id |
| display_name | text | |
| is_active | bool | default true |
| last_login_at | timestamptz NULL | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### `refresh_tokens`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| token_hash | char(64) UNIQUE | SHA-256 of opaque token |
| audience | text | `portal` or `admin` |
| user_id | uuid | polymorphic by `audience` |
| parent_id | uuid NULL | rotation lineage |
| ip_hash | text | |
| user_agent | text | |
| expires_at | timestamptz | |
| revoked_at | timestamptz NULL | |
| created_at | timestamptz | default now() |

### `admin_audit_log`
| col | type | notes |
|---|---|---|
| id | uuid PK | |
| actor_role | text | `admin` / `company` / `system` |
| actor_id | uuid NULL | |
| action | text | e.g. `complaint.status.update` |
| target_type | text | `complaint` / `company` / ... |
| target_id | text | |
| payload_json | jsonb | redacted |
| ip_hash | text NULL | |
| created_at | timestamptz | default now() |

Index: `(target_type, target_id, created_at DESC)`, `(action, created_at DESC)`.

### `rate_limits`
Backed by Redis at runtime; this table only stores configuration overrides.

| col | type | notes |
|---|---|---|
| key | text PK | route id |
| window_seconds | int | |
| max_requests | int | |

## Conventions

- All primary keys are UUID v4 generated by Postgres `gen_random_uuid()`.
- Every table has `created_at`; mutable tables also have `updated_at` maintained
  by a trigger.
- Soft delete on complaints only. Hard delete is reserved for admin-initiated
  GDPR erasure.
- Foreign keys are `ON DELETE RESTRICT` by default, except attachments,
  updates, and reports (cascade with their complaint).
