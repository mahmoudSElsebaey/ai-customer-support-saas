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
# Edit server/.env — set MONGODB_URI, JWT secrets, and OPENAI_API_KEY to enable the live homepage AI demo

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

### Live AI homepage demo

The public homepage includes a live Voxly AI chat at the bottom corner. To enable real replies, add your OpenAI API key to `server/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
```

The key stays server-side. The public demo endpoint is rate-limited to 12 messages per IP per 10 minutes. The demo assistant explains Voxly and does not access customer workspaces or create real tickets. If the frontend and API are hosted on different domains, set `VITE_API_URL` in the client environment to the API origin (for example, `https://api.example.com`) and allow the frontend origin in the server's `CLIENT_URL`.

## API health

- `GET /api/health` — liveness
- `GET /api/health/ready` — MongoDB readiness

## Production notes

See [PRODUCTION.md](./PRODUCTION.md).

## License

Private / proprietary unless otherwise stated.
