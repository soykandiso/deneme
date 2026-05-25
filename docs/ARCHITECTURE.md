# Architecture

## Goals

1. Public users get a polished, fast, accessible **mobile app** for browsing
   and submitting complaints.
2. Company representatives get a tightly scoped **web portal** where they can
   only see and act on their own company's complaints.
3. Platform admins get a **moderation console** with audit trails for every
   sensitive action.
4. Everything is built on top of a single, well-tested **REST API** with strict
   server-side authorization.

## Component diagram (text)

```
                ┌──────────────────────────┐
                │  Flutter mobile app      │
                │  iOS + Android           │
                └───────────────┬──────────┘
                                │  HTTPS / JSON
                                ▼
┌──────────────┐       ┌──────────────────────────┐       ┌────────────────┐
│ Company      │──────▶│   NestJS REST API        │◀──────│ Admin console  │
│ portal       │ HTML  │   /v1/*                  │ HTML  │ /admin/*       │
│ /portal/*    │       │                          │       │                │
└──────────────┘       │  ┌────────────────────┐  │       └────────────────┘
                       │  │ Auth + RBAC guards │  │
                       │  ├────────────────────┤  │
                       │  │ Domain modules     │  │
                       │  │  companies         │  │
                       │  │  complaints        │  │
                       │  │  attachments       │  │
                       │  │  reports           │  │
                       │  │  suggestions       │  │
                       │  │  audit             │  │
                       │  ├────────────────────┤  │
                       │  │ Prisma data layer  │  │
                       │  └─────────┬──────────┘  │
                       └────────────┼─────────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              ▼                     ▼                      ▼
       ┌──────────────┐     ┌──────────────┐       ┌──────────────┐
       │ PostgreSQL   │     │ Redis        │       │ S3 / MinIO   │
       │ (primary DB) │     │ (rate limit, │       │ (attachment  │
       │ full-text    │     │  refresh     │       │  evidence)   │
       │ search       │     │  tokens)     │       │              │
       └──────────────┘     └──────────────┘       └──────────────┘
```

## Why this stack

- **Flutter** — one codebase for iOS + Android with native-quality animations,
  strong widget composition, and an excellent design-system story. The
  reference app concept is unequivocally mobile-first.
- **NestJS** — opinionated, modular, DI-driven; pairs naturally with class-based
  domain modules, request validation (`class-validator`), guards for RBAC,
  interceptors for audit logging.
- **Prisma + PostgreSQL** — typed schema, migration system, strong relational
  integrity, `tsvector`-backed full-text search out of the box. Easy to swap in
  Meilisearch later because all queries flow through the repository layer.
- **Redis** — durable enough for rate-limit counters, refresh-token revocation,
  and BullMQ-style background jobs if we add them.
- **S3-compatible storage** (MinIO in dev) — never store binary evidence in the
  RDBMS. Pre-signed URLs keep downloads scoped without proxying bytes.
- **Server-rendered web portal** — admins and company reps need rich tables,
  fast iteration, and zero install. Reusing the same NestJS process keeps
  deployments simple and ensures the exact same RBAC code runs everywhere.

## Authentication model

There are two auth domains, both JWT-based, with **separate signing keys**:

| Domain | Token audience | Issued for |
|---|---|---|
| `mobile` | `aud=mobile` | Anonymous + future user accounts |
| `portal` | `aud=portal` | Company reps |
| `admin`  | `aud=admin`  | Platform admins |

- Access tokens are short-lived JWTs (15 min).
- Refresh tokens are opaque, hashed-at-rest in `refresh_tokens`, and rotated on
  every use. Reuse triggers cascade revocation of the lineage.
- Passwords are hashed with **argon2id**.
- Web sessions are cookie-based (httpOnly + SameSite=Lax) and CSRF-protected.
  The mobile API uses bearer tokens.

## Tenant isolation

The single most important security invariant is that **a company rep can only
ever see their own company's data**. This is enforced in three layers:

1. `CompanyAuthGuard` attaches `req.companyId` from the JWT.
2. Every portal repository call takes `companyId` as a parameter; Prisma
   queries always include `where: { companyId }`.
3. Integration tests assert that a rep from company A receives 404 (not 403,
   to avoid enumeration) when accessing a complaint owned by company B.

## Public visibility rules

- Complaints with `status = 'removed'` or `is_deleted = true` are excluded from
  every public list, search result, and detail endpoint.
- Complaints with `status = 'new'` are public by default once submitted — this
  matches the reference platform behavior — but contact email / phone are
  **never** returned to public consumers.
- Public share links use the `id` (UUID) directly; integer keys are never
  exposed.

## File pipeline

```
client ──(multipart)──▶ POST /v1/complaints/:id/attachments
                          │
                          ├── validate content-type (magic bytes, not just header)
                          ├── validate size (max 10 MB / file, 5 files / complaint)
                          ├── stream to S3 with random storage key
                          ├── compute sha256 during upload
                          └── INSERT attachment row in same transaction as
                              "completed" marker; on rollback, schedule S3 delete
```

Downloads are gated by `AttachmentAccessGuard` which:
- returns the file if the complaint is public, OR
- returns the file if the requester is the admin, OR
- returns the file if the requester is a company rep AND the attachment belongs
  to a complaint owned by that company.

Otherwise it returns 404.

## Audit log

Every state-changing admin/company-portal action runs through the
`@Audited(action)` decorator + interceptor, which writes a row to
`admin_audit_log` capturing `actor`, `action`, `target_type`, `target_id`,
sanitized `payload_json`, IP hash, and timestamp.

## Observability

- **Logs** — `pino` structured JSON with a request-scoped logger. Includes
  `req_id`, `actor_id`, `actor_role`, `route`, `latency_ms`.
- **Errors** — Sentry SDK in both backend and mobile; PII is scrubbed in
  `beforeSend`.
- **Metrics** — `/metrics` exposes Prometheus counters (request counts,
  latencies, queue depths). Disabled in test.
- **Health** — `/healthz` (liveness) and `/readyz` (DB + Redis + S3 probes).

## Search

PostgreSQL `tsvector` columns on `complaints.title || complaints.body` and
`companies.name`. Each list endpoint accepts a `q` parameter that is parsed
through `plainto_tsquery`. The repository layer encapsulates this so a future
move to Meilisearch is a single-module change.

## Internationalization

- Backend: `nestjs-i18n` with JSON resources at `backend/src/i18n/{mk,sq,en}/`.
  Used for validation messages and emails.
- Mobile: Flutter `intl` + ARB files under `mobile/lib/l10n/` generated into a
  typed `AppLocalizations` class.
- Locale resolution order on mobile: user setting → device locale → English.
