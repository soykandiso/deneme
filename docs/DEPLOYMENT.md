# Deployment

## Local development

```bash
docker compose up -d         # postgres, redis, minio, api
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev            # if running outside the container
```

## Environment variables

See [`backend/.env.example`](../backend/.env.example) for the canonical list.

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `REDIS_URL` | yes | |
| `S3_ENDPOINT` | yes | `http://minio:9000` in dev |
| `S3_BUCKET` | yes | |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | yes | |
| `JWT_PORTAL_SECRET` | yes | Distinct from admin secret |
| `JWT_ADMIN_SECRET` | yes | |
| `JWT_MOBILE_SECRET` | yes | |
| `IP_HASH_PEPPER` | yes | Rotate yearly |
| `PUBLIC_BASE_URL` | yes | Used in canonical share URLs |
| `SENTRY_DSN` | no | Disables Sentry if unset |
| `LOG_LEVEL` | no | Defaults to `info` |

## Production checklist

- [ ] Rotate all secrets out of `.env.example`.
- [ ] Run `npm run prisma:migrate deploy` against the prod DB.
- [ ] Confirm `/healthz` and `/readyz` are wired into your orchestrator.
- [ ] Confirm S3 bucket has versioning + lifecycle rules for failed uploads.
- [ ] Confirm Postgres is on a major version >= 14 (for `gen_random_uuid`).
- [ ] Set `NODE_ENV=production`.
- [ ] Behind a reverse proxy: trust the proxy for client IP and enforce HTTPS.
- [ ] Enable Cloudflare / WAF rate limits as a defense-in-depth layer.
- [ ] Configure CSP, HSTS, X-Frame-Options on the web portal routes.

## Mobile release

```bash
cd mobile
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.zalba.app \
  --dart-define=SENTRY_DSN=...
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://api.zalba.app \
  --dart-define=SENTRY_DSN=...
```

App-store metadata, screenshots and review notes live in `mobile/store/` (to
be added once the design pass for store assets is done).
