#!/usr/bin/env bash
# Zalba — one-shot launch for Codespaces or local Docker.
# Brings the stack up, waits for the API, prints the URLs to open on your phone.

set -e

cd "$(dirname "$0")"

echo "▸ Starting docker-compose stack…"
docker compose up -d --build

echo "▸ Waiting for the API to come online (up to 90s)…"
for i in $(seq 1 45); do
  if curl -fsS http://localhost:3000/v1/healthz >/dev/null 2>&1; then
    echo "✓ API is up."
    break
  fi
  sleep 2
  if [ "$i" = "45" ]; then
    echo "✗ API did not come up. Recent logs:"
    docker compose logs --tail=50 api
    exit 1
  fi
done

cat <<'EOF'

────────────────────────────────────────────────────────────────
✓ Zalba is running.

Open these in your browser (works on phone too):

  /                  Public home — browse companies & complaints
  /companies         Browse companies
  /complaints        Browse complaints
  /submit            Submit a new complaint
  /admin/login       Admin console   (admin@demo.com / DemoAdmin123!)
  /portal/login      Company portal  (rep@demo.com / DemoRep123!)

LOCAL:        http://localhost:3000
CODESPACES:   open the PORTS tab → right-click port 3000 →
              Port Visibility → Public, then copy the URL.

To stop the stack:    docker compose down
To view live logs:    docker compose logs -f api
────────────────────────────────────────────────────────────────
EOF
