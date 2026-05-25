# Roadmap

This document is the honest "what's done vs. what's next" list, so that anyone
picking up the codebase knows where the seams are.

## In this initial release

- Full Prisma schema and migrations for every entity.
- NestJS modules for auth, companies, complaints, attachments, reports,
  suggestions, audit, admin, portal.
- argon2id password hashing, JWT access + opaque refresh tokens with rotation
  and reuse-detection.
- Role-based guards and tenant isolation for the company portal.
- File upload pipeline with content-type and size validation, sha256
  checksums, S3-compatible storage abstraction (MinIO in dev).
- Public API with pagination, sorting, filtering, and PostgreSQL FTS.
- Server-rendered admin console and company portal with full moderation flows.
- Audit logging interceptor for every state-changing action.
- Rate-limit guard backed by Redis with per-route configuration.
- Flutter mobile app: design system, theming (light/dark), navigation
  shell, i18n (mk / sq / en), repositories, controllers, public screens, and a
  three-step complaint submission flow with attachments.
- docker-compose stack (postgres, redis, minio, api).
- GitHub Actions: backend lint + test + build, mobile analyze + test.

## Deliberately deferred (next sprints)

- **Push notifications** — schema is ready (`device_tokens` table outline in
  `ROADMAP.md`), but FCM + APNs integration is intentionally not wired so we
  can pick the right provider per market.
- **End-user accounts** — the mobile flow is currently anonymous (matching the
  reference platform). The auth scaffolding for `aud=mobile` exists; adding
  sign-up requires deciding on identity providers and verification flow.
- **External search engine** — current FTS is fine through ~1M complaints. The
  repository layer hides the implementation so swapping in Meilisearch is a
  contained change.
- **Email outbound** — transactional templates live in `backend/src/i18n/` but
  the actual SMTP / Postmark integration is stubbed.
- **App store release artifacts** — signing configs and store metadata are
  client-specific and not committed.

## Known sharp edges

- The web portal uses Handlebars with progressive enhancement; rich features
  (drag-to-reorder attachments, live queue updates) will likely justify moving
  to HTMX or a small React island for the admin moderation screen.
- The mobile app ships with `flutter_secure_storage` configured for both
  platforms; iOS keychain access groups will need to be set before TestFlight.
- Test coverage is representative, not exhaustive — see
  `backend/test/` for the patterns to follow.
