# REALVELORA - Smart Queue Management

## Overview
A React-based web application for managing virtual queues for local businesses (barbershops, salons, etc.). Users can browse shops, join queues, and track their real-time position. Includes a real Express backend, PostgreSQL database, and Twilio SMS integration.

## Architecture
- **Frontend:** React 18 + TypeScript + Vite 7 (port 5000)
- **Backend:** Express.js API server (port 3001)
- **Database:** Replit PostgreSQL (via DATABASE_URL env var)
- **SMS:** Twilio (optional, gracefully disabled when not configured)
- **Vite proxy:** `/api` → `localhost:3001`

## Project Structure
```
REALVELORA/
├── server/
│   └── index.js         # Express API server
├── src/
│   ├── App.tsx           # Main routing
│   ├── main.tsx          # React entry point
│   ├── store/
│   │   └── queueStore.ts # Zustand store (API-backed)
│   ├── components/       # Navbar, ShopCard, Toast
│   ├── pages/            # Home, Search, Join, Dashboard, About
│   └── types/            # TypeScript interfaces
├── vite.config.ts        # Vite config (port 5000, proxy /api → 3001)
└── package.json
```

## Database Schema
- `shops` — shop info (id, name, phone, avg_service_minutes, category)
- `tickets` — queue entries (id, shop_id, name, phone, timestamps)

## API Endpoints
- `GET /api/shops` — list all shops with wait times
- `GET /api/shops/:id` — get shop + queue
- `POST /api/tickets` — join queue (sends confirmation SMS)
- `GET /api/tickets/:shopId/:ticketId` — get ticket status
- `DELETE /api/tickets/:shopId/:ticketId` — leave queue
- `POST /api/sms/webhook` — Twilio inbound SMS handler (YES/NO replies)
- `POST /api/register` — public business registration submission
- `GET /api/superadmin/:secret/registrations` — list all registrations (protected)
- `POST /api/superadmin/:secret/registrations/:id/approve` — approve + create shop (protected)
- `POST /api/superadmin/:secret/registrations/:id/reject` — reject registration (protected)

## Business Registration Flow
- Businesses submit via `/register` page (linked from the banner ad)
- Submissions go into `shop_registrations` table with `pending` status
- Super admin reviews at `/superadmin/:SUPERADMIN_SECRET`
- Approving creates a shop + generates an admin link to send to the owner
- `SUPERADMIN_SECRET` env var protects the approval dashboard

## Database Tables
- `shops` — approved shops
- `tickets` — queue entries
- `shop_registrations` — pending/approved/rejected business applications

## SMS Flow (Twilio)
1. On join → confirmation SMS with wait time
2. When "approaching" (next in line, 80% through current service) → heads-up SMS
3. When it's your turn → "head in now" SMS
4. 10 min after expected finish → "Are you still there? Reply YES/NO"
5. No reply in 5 min → auto-removed + SMS confirmation

## Environment Variables Required for SMS
- `TWILIO_ACCOUNT_SID` — from Twilio console
- `TWILIO_AUTH_TOKEN` — from Twilio console
- `TWILIO_PHONE_NUMBER` — your Twilio phone number (e.g. +15551234567)
- `APP_DOWNLOAD_LINK` — optional, link sent in join confirmation

## Twilio Webhook Setup
After deploying, set your Twilio phone number's inbound SMS webhook to:
`https://your-domain.replit.app/api/sms/webhook`

## Workflows
- `Start application` — `cd REALVELORA && npm run dev` (port 5000, webview)
- `API Server` — `cd REALVELORA && npm run server` (port 3001, console)
