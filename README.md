# Voxly — AI Customer Support SaaS

> **Status:** Phase 7 — RAG & AI Assistant ✅

## RAG pipeline

1. Publish knowledge articles (org-scoped).
2. Click **Index for AI** on Knowledge page (or `POST /api/ai/knowledge/embed`).
3. Embeddings stored on `KnowledgeArticle.embedding` (`text-embedding-3-small`).
4. **Suggest reply** embeds the ticket query, ranks articles by cosine similarity, injects top hits into the LLM prompt.
5. Agent sees suggestion + source links — **never auto-sent** to the customer.

> Note: similarity ranking runs in-app over JSON vectors (no pgvector required to start). For large corpora, migrate to PostgreSQL `pgvector` with the same service interface.

## AI endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ai/status` | AI availability |
| POST | `/api/ai/tickets/:id/analyze` | Intent / priority / sentiment |
| POST | `/api/ai/tickets/:id/suggest-reply` | RAG-grounded draft |
| GET | `/api/ai/knowledge/search?q=` | Semantic KB search |
| POST | `/api/ai/knowledge/embed` | Batch embed published articles |
| GET | `/api/ai/usage` | Token & cost summary |

## Setup

```bash
# server/.env
OPENAI_API_KEY=sk-...

cd server && npm install && npx prisma generate && npx prisma migrate dev && npm run dev
cd client && npm install && npm run dev
```

## Phases

| Phase | Status |
|-------|--------|
| 0–6 | ✅ |
| 7 RAG & AI Assistant | ✅ |
| 8 Agent Workspace UX | Next |
| 9–13 | Planned |

## License

MIT
