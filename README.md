# Voxly — AI Customer Support SaaS

> **Status:** Phase 13 — Observability & Polish ✅ · **v0.13.0**

Production-oriented multi-tenant helpdesk with AI (RAG), real-time Socket.IO, Stripe billing, and a customer portal.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Vite, Tailwind, RTK Query, i18n (EN/AR) |
| Backend | Express, TypeScript, Prisma, PostgreSQL, Socket.IO |
| AI | OpenAI chat + embeddings (optional) |
| Billing | Stripe Checkout + Customer Portal + webhooks |
| Ops | Helmet, rate limits, pino, metrics, optional Sentry, Docker |

## Quick start

```bash
# Database
# set DATABASE_URL in server/.env (see .env.example)

cd server && npm install && npx prisma migrate dev && npm run dev
cd client && npm install && npm run dev
```

## Observability (Phase 13)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness + version + uptime |
| `GET /api/health/ready` | DB + AI/billing capability flags |
| `GET /api/health/metrics` | Request counts, latency avg, top paths, memory |

Set `SENTRY_DSN` to enable error reporting (server).

See [PRODUCTION.md](./PRODUCTION.md) for go-live checklist.

## Product surfaces

- **Agent dashboard** — tickets, customers, knowledge, AI, analytics, billing
- **Customer portal** — `/portal/:orgSlug` tickets + help center

## Phases completed

| Phase | Topic |
|-------|--------|
| 0–3 | Foundation, auth, multi-tenancy, core tickets |
| 4–5 | Real-time, knowledge base |
| 6–7 | AI + RAG |
| 8–9 | Agent workspace, analytics |
| 10–11 | Production hardening, Stripe |
| 12–13 | Customer portal, observability |

## License

MIT
