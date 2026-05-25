# API contract

Base URL (dev): `http://localhost:3000/v1`

All responses are JSON. Errors use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be 8–160 characters.",
    "details": { "field": "title" }
  }
}
```

## Conventions

- **Pagination** is cursor-style: `?limit=20&cursor=<opaque>`. The response
  includes `nextCursor` (nullable).
- **Sorting** is `?sort=<field>:<dir>`; allowed values are documented per
  endpoint.
- **Filtering** uses explicit query params (`category`, `status`, etc.).
  Unknown params are rejected.
- **Auth** is `Authorization: Bearer <jwt>` for mobile API, cookie for web
  portals.
- **Locale** is taken from `Accept-Language`; supported: `mk`, `sq`, `en`.

## Public — no auth

| Method | Path | Description |
|---|---|---|
| GET | `/v1/healthz` | Liveness probe |
| GET | `/v1/companies` | List companies (`q`, `category`, `sort`, pagination) |
| GET | `/v1/companies/:slug` | Company detail |
| GET | `/v1/companies/:slug/complaints` | Public complaints for one company |
| GET | `/v1/complaints` | List complaints (`q`, `companyId`, `category`, `status`, `sort`) |
| GET | `/v1/complaints/:id` | Complaint detail (public fields only) |
| POST | `/v1/complaints` | Create complaint (rate-limited per IP) |
| POST | `/v1/complaints/:id/attachments` | Multipart upload, requires draft token |
| POST | `/v1/complaints/:id/reports` | Report a complaint |
| POST | `/v1/suggestions` | Suggest a new company |
| GET | `/v1/categories` | Localized list of complaint + company categories |

### Complaint create flow

1. `POST /v1/complaints` → returns `{ id, draftToken, expiresAt }`. The
   complaint is created in `status=NEW` but `is_published=false` until the
   client confirms.
2. `POST /v1/complaints/:id/attachments` (0..5 times) using
   `X-Draft-Token` header. Returns the attachment record.
3. `POST /v1/complaints/:id/publish` with the same draft token. Marks
   `is_published=true` and emits a `complaint.created` audit row.

Draft tokens are single-use after publish and expire after 30 minutes.

## Company portal — `aud=portal`

| Method | Path | Description |
|---|---|---|
| POST | `/v1/portal/auth/login` | Email + password → access + refresh |
| POST | `/v1/portal/auth/refresh` | Rotate refresh token |
| POST | `/v1/portal/auth/logout` | Revoke refresh |
| GET | `/v1/portal/me` | Current rep + company profile |
| GET | `/v1/portal/complaints` | Scoped to `companyId` |
| GET | `/v1/portal/complaints/:id` | Single complaint (404 if not theirs) |
| POST | `/v1/portal/complaints/:id/reply` | Set/update company reply |
| POST | `/v1/portal/complaints/:id/status` | `CONTACTED` or `RESOLVED` only |
| GET | `/v1/portal/attachments/:id` | Stream attachment (scoped) |

## Admin — `aud=admin`

| Method | Path | Description |
|---|---|---|
| POST | `/v1/admin/auth/login` | |
| POST | `/v1/admin/auth/refresh` | |
| POST | `/v1/admin/auth/logout` | |
| GET | `/v1/admin/dashboard` | Queue counts + health indicators |
| GET | `/v1/admin/complaints` | All complaints (`includeDeleted=true` available) |
| POST | `/v1/admin/complaints/:id/status` | Any status incl. `REMOVED` |
| POST | `/v1/admin/complaints/:id/redact` | Replace body/title with `[redacted]` |
| DELETE | `/v1/admin/complaints/:id` | Soft delete |
| GET | `/v1/admin/reports` | Reports queue |
| POST | `/v1/admin/reports/:id/resolve` | Mark report handled |
| GET | `/v1/admin/suggestions` | Pending company suggestions |
| POST | `/v1/admin/suggestions/:id/approve` | Creates a company |
| POST | `/v1/admin/suggestions/:id/reject` | |
| GET/POST/PATCH/DELETE | `/v1/admin/companies[/:id]` | Companies CRUD |
| GET/POST/PATCH/DELETE | `/v1/admin/companies/:id/users[/:userId]` | Company-rep accounts |
| GET | `/v1/admin/audit` | Audit log search |

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | DTO validation failed |
| `AUTH_REQUIRED` | 401 | Missing/expired token |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Includes tenant-isolation misses |
| `RATE_LIMITED` | 429 | Includes `Retry-After` header |
| `PAYLOAD_TOO_LARGE` | 413 | Attachment size limit |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Attachment type rejected |
| `CONFLICT` | 409 | Duplicate slug, duplicate sha256, etc. |
| `INTERNAL` | 500 | Unexpected; logged with `req_id` |
