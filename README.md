# Voxly — AI Customer Support SaaS

> **Status:** Phase 11 — Billing (Stripe) ✅

## Billing (Stripe)

Plans: **FREE** · **PRO** ($49) · **BUSINESS** ($149) — catalog in `server/src/config/plans.ts`.

| Endpoint | Description |
|----------|-------------|
| `GET /api/billing/plans` | Public plan catalog |
| `GET /api/billing/subscription` | Current org plan |
| `POST /api/billing/checkout` | Stripe Checkout (`{ plan: "PRO" \| "BUSINESS" }`) — OWNER/ADMIN |
| `POST /api/billing/portal` | Stripe Customer Portal |
| `POST /api/billing/webhook` | Stripe webhooks (raw body) |

### Env

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
```

### Local webhook testing

```bash
stripe listen --forward-to localhost:5000/api/billing/webhook
```

After schema change:

```bash
cd server && npx prisma migrate dev --name stripe_billing
```

Without Stripe keys, the app still runs; Billing page shows “not configured”.

## Phases

| Phase | Status |
|-------|--------|
| 0–10 | ✅ |
| 11 Billing | ✅ |
| 12 Customer portal | Next |
| 13 Observability | Planned |

## License

MIT
