# Voxly — AI Customer Support SaaS

Modern production-ready AI Customer Support platform with multi-tenancy, real-time messaging, knowledge base + RAG, and a professional agent workspace.

> **Status:** Phase 4 — Real-time System (Socket.IO) ✅

## Tech Stack

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS
- Redux Toolkit + RTK Query
- React Router + React Hook Form + Zod
- i18next (AR/EN + RTL)
- Socket.IO Client

### Backend
- Node.js + Express + TypeScript
- Prisma + PostgreSQL
- JWT + HTTP-only cookies + bcrypt
- Socket.IO (authenticated, org-scoped rooms)
- Zod + Pino

## Real-time events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:created` | Server → Client | New message on a ticket |
| `ticket:created` | Server → Client | New ticket in org |
| `ticket:updated` | Server → Client | Status/priority/assignment change |
| `ticket:assigned` | Server → Client | Assignment change |
| `typing:start` / `typing:stop` | Bidirectional | Typing indicators |
| `agent:online` / `agent:offline` | Server → Client | Presence |
| `presence:list` | Server → Client | Snapshot of online users |
| `message:read` | Bidirectional | Read receipts |
| `ticket:join` / `ticket:leave` | Client → Server | Join ticket room |

Rooms: `org:{organizationId}`, `ticket:{ticketId}`

Auth: access token from HTTP-only cookie (or `handshake.auth.token`).

## Getting Started

```bash
# Backend
cd server && cp ../.env.example .env
npm install && npx prisma generate && npx prisma migrate dev && npm run dev

# Frontend
cd client && npm install && npm run dev
```

Open two browser sessions on the same ticket to see live messages and typing.

## Phases

| Phase | Status |
|-------|--------|
| 0 Discovery | ✅ |
| 1 Foundation | ✅ |
| 2 Auth & Multi-tenancy | ✅ |
| 3 Core Support System | ✅ |
| 4 Real-time (Socket.IO) | ✅ |
| 5 Knowledge Base | Next |
| 6–13 | Planned |

## License

MIT
