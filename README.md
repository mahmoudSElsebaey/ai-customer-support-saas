# Voxly — AI Customer Support SaaS

> **Status:** Phase 8 — Agent Workspace UX ✅

## Agent workspace (Phase 8)

- Queue views: **All active / Mine / Unassigned / Urgent / Open** with live counts
- Auto-refresh ticket list (15s) + workspace stats (20s)
- **Assign to me** on ticket detail
- **Quick replies** (canned responses) picker in the composer
- Dashboard cards: active, mine, unassigned, urgent, resolved today
- Urgent rows highlighted in the queue

### Canned responses API

```
GET    /api/canned-responses
POST   /api/canned-responses
PATCH  /api/canned-responses/:id
DELETE /api/canned-responses/:id
```

### Workspace stats

```
GET /api/tickets/stats/workspace
```

After pull:

```bash
cd server && npx prisma migrate dev --name canned_responses
```

## Phases

| Phase | Status |
|-------|--------|
| 0–7 | ✅ |
| 8 Agent Workspace UX | ✅ |
| 9 Analytics | Next |
| 10–13 | Planned |

## License

MIT
