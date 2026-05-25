# Zalba Mobile — Public Complaint Platform

A production-grade, cross-platform mobile complaint and accountability platform.

This repository contains a complete system:

- **`mobile/`** — Flutter app (iOS + Android) for the public-facing experience.
- **`backend/`** — NestJS + Prisma + PostgreSQL API plus a server-rendered web
  portal for company representatives and admins.
- **`docs/`** — Architecture, API contract, database schema, mobile screen plan,
  deployment guide and product roadmap.

## At a glance

| Surface | Audience | Tech |
|---|---|---|
| Mobile app | Public users (browse, search, submit complaints) | Flutter / Dart |
| Company portal | Company representatives (reply, update status) | Web (server-rendered, NestJS + Handlebars) |
| Admin console | Platform moderators | Web (server-rendered, NestJS + Handlebars) |
| Public API | Mobile app + web portals | NestJS REST API |

## Quick start

```bash
# 1. Spin up Postgres, Redis, MinIO, and the API.
docker compose up -d

# 2. Bootstrap the database.
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed

# 3. Run the API in dev mode.
npm run start:dev

# 4. Open the company portal.
open http://localhost:3000/portal/login
# Demo company login: rep@demo.com / DemoRep123!

# 5. Open the admin console.
open http://localhost:3000/admin/login
# Demo admin login: admin@demo.com / DemoAdmin123!

# 6. Run the mobile app against the local API.
cd ../mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for production deployment, and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system design.

## Languages

The platform ships with three first-class locales: **Macedonian**, **Albanian**,
**English**. Locale resources live alongside code in both the backend
(`backend/src/i18n/`) and the mobile app (`mobile/lib/l10n/`).

## Status

This is an initial reference implementation suitable as the foundation for a
production deployment. The shape, security posture and migrations are
production-grade; remaining work is enumerated in [`docs/ROADMAP.md`](docs/ROADMAP.md).
