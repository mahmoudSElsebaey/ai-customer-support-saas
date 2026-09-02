# Voxly — Production checklist

## Required

- [ ] Strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥ 32 random chars)
- [ ] `DATABASE_URL` pointing to managed Postgres
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` = real frontend origin (HTTPS)
- [ ] TLS terminated at reverse proxy / platform
- [ ] `npx prisma migrate deploy` on release

## Recommended

- [ ] `OPENAI_API_KEY` for AI features
- [ ] Stripe keys + webhook endpoint `https://api.example.com/api/billing/webhook`
- [ ] `SENTRY_DSN` for error tracking
- [ ] Health probes:
  - Liveness: `GET /api/health`
  - Readiness: `GET /api/health/ready`
  - Metrics: `GET /api/health/metrics`

## Security notes

- Cookies: `httpOnly`, `secure` in production, `sameSite=none` when cross-site
- Rate limits active on global / auth / AI routes
- Multi-tenancy: never trust client `organizationId`
- Webhook body must stay raw for Stripe signature verification

## Docker

```bash
docker compose up --build
```

## Version

API reports `version: 0.13.0` on health endpoints.
