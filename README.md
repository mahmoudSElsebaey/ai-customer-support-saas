# Voxly — AI Customer Support SaaS

Multi-tenant helpdesk with live chat, knowledge base, RAG-assisted AI replies, analytics, billing, and a customer portal.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, TypeScript, Vite, Tailwind, Redux Toolkit + RTK Query, i18n (EN/AR) |
| Backend | Express.js, TypeScript, Socket.IO |
| Database | **MongoDB + Mongoose** |
| Auth | JWT access + refresh cookies |
| AI | Google Gemini (public demo) + OpenAI (other optional features) |
| Billing | Stripe (optional) |

## Prerequisites

- Node.js 20+
- MongoDB 6+ (local or Atlas)

## Quick start

```bash
# 1) Environment
cp server/.env.example server/.env
# Edit server/.env — set MONGODB_URI, JWT secrets, and GEMINI_API_KEY to enable the live homepage AI demo

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

The public homepage includes a live Voxly AI chat at the bottom corner. The demo uses Google's Gemini API. Add your Gemini API key to `server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

The Gemini key stays server-side and is never exposed to the browser. The selected model has a free tier, subject to Google's current model availability and project rate limits. The public demo endpoint is additionally rate-limited to 12 messages per IP per 10 minutes. The demo assistant explains Voxly and does not access customer workspaces or create real tickets. OpenAI remains an optional integration for other existing AI features. If the frontend and API are hosted on different domains, set `VITE_API_URL` in the client environment to the API origin (for example, `https://api.example.com`) and allow the frontend origin in the server's `CLIENT_URL`.

## API health

- `GET /api/health` — liveness
- `GET /api/health/ready` — MongoDB readiness

## Production notes

See [PRODUCTION.md](./PRODUCTION.md).

## License

Private / proprietary unless otherwise stated.
