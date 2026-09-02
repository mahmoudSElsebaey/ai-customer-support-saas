# Voxly — AI Customer Support SaaS

> **Status:** Phase 9 — Analytics & Reporting ✅

## Analytics

```
GET /api/analytics/overview?days=30
```

Returns (org-scoped):

- Totals: active, created/resolved in period, customers, published articles
- By status & priority
- Daily volume series
- Avg first response time & avg resolution time
- Agent workload
- AI usage (requests, tokens, estimated cost by feature)

UI: **Analytics** in the main nav — period toggles 7 / 14 / 30 days.

## Phases

| Phase | Status |
|-------|--------|
| 0–8 | ✅ |
| 9 Analytics | ✅ |
| 10 Production hardening | Next |
| 11–13 | Planned |

## License

MIT
