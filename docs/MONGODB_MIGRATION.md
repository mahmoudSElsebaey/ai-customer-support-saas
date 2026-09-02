# MongoDB + Mongoose Migration — Architecture Notes

**Phase:** 1 (Architecture & Migration Design)  
**Status:** Models and connection layer added; Prisma still powers runtime until Phase 2+.

## Target data model

| Collection | Model file | Key indexes |
|------------|------------|-------------|
| `organizations` | `Organization.ts` | `slug` unique, sparse Stripe ids |
| `users` | `User.ts` | `(email, organizationId)` unique, `organizationId` |
| `refresh_tokens` | `RefreshToken.ts` | `token` unique, TTL on `expiresAt` |
| `customers` | `Customer.ts` | `(email, organizationId)` unique |
| `tickets` | `Ticket.ts` | org+status, org+agent, org+updatedAt |
| `messages` | `Message.ts` | `ticketId` + `createdAt` |
| `knowledge_articles` | `KnowledgeArticle.ts` | org+status, text search |
| `canned_responses` | `CannedResponse.ts` | org, org+isActive |
| `ai_usages` | `AIUsage.ts` | org+createdAt |

## Design decisions

1. **References, not deep embedding** — tickets do not embed messages (unbounded growth).
2. **Multi-tenancy** — every business document has `organizationId`; queries must always filter by it.
3. **IDs** — MongoDB `ObjectId`; API responses expose `id` (string) via schema `toJSON` / `serializeDoc`.
4. **Enums** — defined in `src/types/enums.ts` (no Prisma dependency).
5. **Embeddings** — stored as `number[]` on knowledge articles (same as previous Json field).
6. **Refresh tokens** — TTL index auto-deletes expired rows.

## Environment

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/voxly
# DATABASE_URL kept optional only during transition
```

## Next phases

- **Phase 2:** Wire `connectDatabase()` in `server.ts`, migrate Auth + Organization services off Prisma.
- **Phase 3–4:** Tickets, Customers, Knowledge, AI, Billing.
- **Phase 5+:** Socket.IO, seed, remove Prisma/Docker.
