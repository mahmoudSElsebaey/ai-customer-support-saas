# Voxly — AI Customer Support SaaS

Multi-tenant helpdesk with live chat, knowledge base, RAG-assisted AI replies, analytics, billing, and a customer portal.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, TypeScript, Vite, Tailwind, Redux Toolkit + RTK Query, i18n (EN/AR) |
| Backend | Express.js, TypeScript, Socket.IO |
| Database | **MongoDB + Mongoose** |
| Auth | JWT access + refresh cookies |
| AI | OpenAI (optional) |
| Billing | Stripe (optional) |

## Prerequisites

- Node.js 20+
- MongoDB 6+ (local or Atlas)

## Quick start

```bash
# 1) Environment
cp .env.example server/.env
# Edit server/.env — set MONGODB_URI and JWT secrets

# 2) Server
cd server
npm install
npm run seed    # optional demo data
npm run dev     # http://localhost:5000

# 3) Client (new terminal)
cd client
npm install
npm run dev     # http://localhost:5173
```

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
|------|--------|----------|
| Owner | owner@demo.voxly.app | Demo1234! |
| Agent | agent@demo.voxly.app | Demo1234! |
| Portal customer | customer@demo.voxly.app | Demo1234! |

Organization slug: `demo` — portal at `/portal/demo`.

## API health

- `GET /api/health` — liveness
- `GET /api/health/ready` — MongoDB readiness

## Production notes

See [PRODUCTION.md](./PRODUCTION.md).

## License

Private / proprietary unless otherwise stated.
