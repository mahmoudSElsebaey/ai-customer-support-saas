# Voxly — AI Customer Support SaaS

> **Status:** Phase 10 — Production Hardening ✅

## Production hardening (Phase 10)

| Area | Implementation |
|------|----------------|
| Rate limiting | Global + stricter auth + AI limits (`express-rate-limit`) |
| Security headers | `helmet` (CSP in production) |
| Body size | JSON limited to 1mb |
| Compression | `compression` |
| Request ID | `X-Request-Id` on every response |
| Structured logs | `pino` + `pino-http` |
| Trust proxy | Enabled in production |
| Health | `GET /api/health` (liveness), `GET /api/health/ready` (DB) |
| Graceful shutdown | SIGTERM/SIGINT, 15s force timeout |
| Errors | No stack traces in production; `requestId` in payloads |
| Docker | `Dockerfile` + `docker-compose.yml` (API + Postgres) |

### Health checks

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/ready
```

### Docker

```bash
# Set JWT secrets + optional OPENAI_API_KEY in environment
docker compose up --build
```

### Local production-ish run

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run build && npm start
```

## Phases

| Phase | Status |
|-------|--------|
| 0–9 | ✅ |
| 10 Production Hardening | ✅ |
| 11 Billing (Stripe) | Next |
| 12 Customer portal | Planned |
| 13 Observability / polish | Planned |

## License

MIT
