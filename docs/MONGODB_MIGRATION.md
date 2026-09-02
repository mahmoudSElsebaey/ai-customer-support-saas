# MongoDB migration — complete

The application has been fully migrated from **PostgreSQL + Prisma** to **MongoDB + Mongoose**.

## Phases completed

1. **Phase 1** — Mongoose models, enums, connection, serialize helpers
2. **Phase 2** — Auth, Organization, User, RefreshToken
3. **Phase 3** — Customers, Tickets, Messages, Canned, Socket domain handlers
4. **Phase 4** — Knowledge, Embeddings, AI, Analytics, Billing, Portal
5. **Phase 5** — Removed Prisma & Docker Postgres; required `MONGODB_URI`; seed script; docs

## Runtime requirement

```env
MONGODB_URI=mongodb://127.0.0.1:27017/voxly
```

`DATABASE_URL` is no longer used.

## Seed

```bash
cd server && npm run seed
```

## Architecture

```
Route → Middleware → Controller → Service → Mongoose Model → MongoDB
```

Multi-tenancy remains organization-scoped via `organizationId` on all domain collections.
