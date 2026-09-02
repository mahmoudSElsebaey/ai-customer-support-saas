# Production checklist — Voxly

## Required environment

- `NODE_ENV=production`
- `PORT` (platform-assigned or fixed)
- `CLIENT_URL` — HTTPS frontend origin (CORS + cookies)
- `MONGODB_URI` — MongoDB Atlas recommended (`retryWrites=true&w=majority`)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — ≥ 32 random characters each

## Recommended

- `OPENAI_API_KEY` — AI features
- Stripe keys + webhook endpoint pointing to `/api/billing/webhook`
- `SENTRY_DSN` — error tracking

## Security

- Serve API and client over HTTPS only
- Cookies: `secure`, `httpOnly`, `sameSite` appropriate for your domain layout
- Restrict CORS to `CLIENT_URL`
- Rate limits enabled on auth routes (already in middleware)
- Never commit `.env`

## Process

```bash
cd server && npm ci && npm run build && npm start
cd client && npm ci && npm run build
# Serve client/dist via CDN or static host; API as Node process (PM2, Railway, Render, Fly, etc.)
```

## Database

- Use a managed MongoDB (Atlas)
- Enable backups and network IP allowlisting
- Indexes are defined on Mongoose models and created on connection

## Health

- Liveness: `GET /api/health`
- Readiness: `GET /api/health/ready` (expects `checks.mongodb === "ok"`)
