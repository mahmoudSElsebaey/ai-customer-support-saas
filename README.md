# Voxly — AI Customer Support SaaS

Modern production-ready AI Customer Support platform with multi-tenancy, real-time messaging, knowledge base + RAG, and a professional agent workspace.

> **Status:** Phase 5 — Knowledge Base ✅

## Features so far

- Multi-tenant organizations + RBAC
- Auth (JWT access/refresh, HTTP-only cookies)
- Customers & Tickets with messages + internal notes
- Real-time Socket.IO (messages, typing, presence)
- **Knowledge base** (articles, categories, tags, search, publish workflow)
- Embedding fields prepared for RAG (Phase 6–7)

## Knowledge API

```
GET    /api/knowledge
GET    /api/knowledge/categories
GET    /api/knowledge/:id
POST   /api/knowledge
PATCH  /api/knowledge/:id
DELETE /api/knowledge/:id
```

All scoped by `organizationId` from the authenticated JWT.

## Getting Started

```bash
cd server && cp ../.env.example .env
npm install && npx prisma generate && npx prisma migrate dev && npm run dev

cd client && npm install && npm run dev
```

After schema changes run:

```bash
cd server && npx prisma migrate dev --name knowledge_embeddings_prep
```

## Phases

| Phase | Status |
|-------|--------|
| 0–4 | ✅ |
| 5 Knowledge Base | ✅ |
| 6 AI Foundation | Next |
| 7 RAG & AI Assistant | |
| 8–13 | Planned |

## License

MIT
