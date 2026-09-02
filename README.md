# Voxly — AI Customer Support SaaS

> **Status:** Phase 12 — Customer Portal ✅

## Customer portal

End-customer help center per organization (public slug):

```
/portal/:orgSlug/login
/portal/:orgSlug/register
/portal/:orgSlug              → my tickets
/portal/:orgSlug/new          → create ticket
/portal/:orgSlug/tickets/:id  → conversation (no internal notes)
/portal/:orgSlug/knowledge    → published articles
```

### API

```
GET  /api/portal/org/:slug
POST /api/portal/auth/register
POST /api/portal/auth/login
POST /api/portal/auth/logout
GET  /api/portal/tickets
POST /api/portal/tickets
GET  /api/portal/tickets/:id
POST /api/portal/tickets/:id/messages
GET  /api/portal/knowledge
GET  /api/portal/knowledge/:id
```

- Portal users have role `CUSTOMER` scoped to one organization.
- CRM `Customer` row is created/linked by email automatically.
- Tickets are isolated to that customer; internal notes never returned.
- Messages emit Socket.IO events so agents see updates live.

Example: if org slug is `acme`, open `http://localhost:5173/portal/acme/register`.

## Phases

| Phase | Status |
|-------|--------|
| 0–11 | ✅ |
| 12 Customer Portal | ✅ |
| 13 Observability / polish | Next |

## License

MIT
