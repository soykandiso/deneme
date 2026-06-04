# Zalba — Public Complaint Platform

A production-grade complaint and accountability platform.

- **`backend/`** — REST API + server-rendered web portals (NestJS + Prisma + PostgreSQL).
- **`mobile/`** — Flutter app (iOS + Android).
- **`docs/`** — Architecture, API contract, schema, deployment.

---

## Run it in 30 seconds (Codespaces or local Docker)

```bash
./start.sh
```

That's it. The script will:

1. Build and start postgres + redis + minio + the API in Docker.
2. Apply migrations and seed demo data automatically.
3. Wait until the API is healthy.
4. Print every URL you can open in your browser.

When it's done, open `http://localhost:3000` — you'll get the public web UI.

> ⚠️ Don't run `npm run start:dev`. The API is already running in Docker.
> Running it on top causes a port-3000 conflict.

---

## Open it on your phone (from Codespaces)

1. Run `./start.sh` and wait for it to print the URLs.
2. In VS Code, look at the bottom panel and click the **PORTS** tab.
3. Find the row with port `3000`. **Right-click it → Port Visibility → Public**.
4. The **Forwarded Address** column now shows a URL like `https://<your-codespace>-3000.app.github.dev`.
   Click the 📋 icon to copy it.
5. Open that URL in your phone's browser. You'll land on the public home page.

---

## What you can click through

| URL | Who it's for |
|---|---|
| `/` | Public home — hero, recent complaints, top companies |
| `/companies` | Browse all companies (with search) |
| `/companies/:slug` | One company's profile + its complaints |
| `/complaints` | Browse all complaints (search + filter + sort) |
| `/complaints/:id` | One complaint with timeline, evidence, company reply, report button |
| `/submit` | Submit a new complaint (public web form) |
| `/suggest` | Suggest a new company |
| `/admin/login` | Admin console — moderation, reports, audit log |
| `/portal/login` | Company portal — reps reply to their own complaints |

### Demo logins

| Surface | Email | Password |
|---|---|---|
| Admin | `admin@demo.com` | `DemoAdmin123!` |
| Company portal | `rep@demo.com` | `DemoRep123!` |

---

## Stop / restart

```bash
docker compose down            # stop everything
docker compose logs -f api     # watch live API logs
./start.sh                     # start again
```

The Postgres data persists in a Docker volume, so your test complaints stick
around between restarts.

---

## Mobile (Flutter) app

The mobile app talks to the same REST API. If you want to actually run the
Flutter app on your phone:

1. Make sure the API is running (`./start.sh`).
2. Get the public Codespaces URL (or your laptop's LAN IP if local).
3. On your **laptop** (Codespaces can't push builds to phones):
   ```bash
   cd mobile
   flutter pub get
   flutter run --dart-define=API_BASE_URL=https://<your-codespace>-3000.app.github.dev
   ```

For "just review the product on my phone," skip the Flutter step — the
**public web UI** at `/`, `/companies`, `/complaints`, `/submit` covers the
same flows in mobile Safari/Chrome.

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API contract](docs/API.md)
- [Database schema](docs/DATABASE.md)
- [Mobile plan](docs/MOBILE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Roadmap](docs/ROADMAP.md)
