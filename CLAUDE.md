# SERVICE-MARKETPLACE — Context for Claude Code

## What is this project
Premium home services marketplace. Clients book verified professionals who travel to their location. Two-sided marketplace with AI-powered matching, escrow payments, KYC verification, and real-time chat.

## Stack
- **Frontend**: React 18 + TypeScript + Vite + React Router
- **Backend**: Node.js + Express + Prisma ORM + SQLite (dev)
- **AI**: Anthropic SDK — agents in `backend/src/agents/`
- **Payments**: Stripe + Stripe Connect + custom escrow service
- **Realtime**: WebSockets (`ws` library)
- **i18n**: Custom i18n system in `frontend/src/i18n/` — 15+ languages

## Project structure
SERVICE-MARKETPLACE/
├── frontend/src/
│   ├── pages/          # Full pages (Home, Dashboard, Login, etc.)
│   ├── components/     # Reusable UI components
│   ├── contexts/       # AuthContext, ThemeContext
│   ├── hooks/          # useWebSocket, etc.
│   ├── services/       # api.ts — all API calls
│   ├── types/          # index.ts — all shared types
│   └── i18n/           # Translation files per language
└── backend/src/
    ├── agents/         # AI agents (matching, pricing, kyc, dispute, reputation, opportunity, communication)
    ├── controllers/    # Route handlers
    ├── routes/         # Express routes
    ├── services/       # Business logic (stripe, escrow, pricing, notifications)
    ├── middleware/      # auth, antifraud
    └── utils/          # prisma, jwt, upload

## User roles
- **Client**: books services, pays, reviews
- **Professional/Provider**: offers services, gets verified, receives payments
- **Admin**: platform management
- Users can hold both Client and Professional roles simultaneously.

## CRITICAL RULES — never break these
1. Never modify `backend/prisma/schema.prisma` without being explicitly asked
2. Never change the escrow flow in `backend/src/services/escrow.service.ts` without being explicitly asked
3. Never remove existing i18n translation keys — only add new ones
4. Never change auth middleware or JWT logic without being explicitly asked
5. Always keep frontend types in `frontend/src/types/index.ts` — do not create separate type files
6. Always use the existing `api.ts` for all frontend API calls — no direct fetch calls in components
7. Never use emojis in UI components — design is clean and professional
8. Always add translations for ALL supported languages when adding new UI text

## AI Agents (backend/src/agents/)
- matching.agent.ts — recommends professionals to clients
- pricing.agent.ts — suggests optimal pricing
- kyc.agent.ts — document verification
- dispute.agent.ts — handles payment disputes
- reputation.agent.ts — manages level system (Verified / Pro / Elite)
- opportunity.agent.ts — notifies professionals of relevant jobs
- communication.agent.ts — auto-translation in chat

## How to run
## How to run
- Backend: cd backend && npm run dev
- Frontend: cd frontend && npm run dev  
- Stripe webhooks (necesario para pagos): stripe listen --forward-to localhost:3001/api/bookings/webhook/stripe

Los tres comandos deben estar corriendo a la vez en terminales separadas para que la app funcione completa.

## When making changes
- Always check `frontend/src/types/index.ts` before adding new data structures
- Always check existing agents before creating new AI functionality
- When modifying a controller, check its corresponding route file too
- When adding a new page, register it in `frontend/src/App.tsx`
- SQLite is only for development — do not add SQLite-specific queries
- After any backend change that affects the API, update `frontend/src/services/api.ts`

## Design principles
- Clean, premium aesthetic — no emojis in UI
- Mobile-first responsive design
- Dark/light mode support via ThemeContext
- Real photos for profiles (no avatars/placeholders in production)
