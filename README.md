# Voxly — AI Customer Support SaaS

> **Status:** Phase 6 — AI Foundation ✅

Multi-tenant AI customer support platform: tickets, realtime chat, knowledge base, and OpenAI-assisted agent workflows.

## AI (Phase 6)

Requires `OPENAI_API_KEY` in `server/.env`.

| Endpoint | Description |
|----------|-------------|
| `GET /api/ai/status` | Whether AI is configured |
| `POST /api/ai/tickets/:ticketId/analyze` | Intent, category, priority, sentiment, summary |
| `POST /api/ai/tickets/:ticketId/suggest-reply` | Draft reply for agent (not auto-sent) |
| `POST /api/ai/tickets/:ticketId/summarize` | Short summary |
| `GET /api/ai/usage` | Token/cost usage per org |

- Failures return `502 AI_REQUEST_FAILED` — support still works without AI.
- Usage is stored in `AIUsage` (tokens + estimated cost).
- Model default: `gpt-4o-mini`.

## Setup

```bash
cd server && cp ../.env.example .env
# Set DATABASE_URL, JWT secrets, OPENAI_API_KEY
npm install && npx prisma generate && npx prisma migrate dev && npm run dev

cd client && npm install && npm run dev
```

## Phases

| Phase | Status |
|-------|--------|
| 0–5 | ✅ |
| 6 AI Foundation | ✅ |
| 7 RAG & AI Assistant | Next |
| 8–13 | Planned |

## License

MIT
