# REALVELORA (Wavit) — Smart Queue Management

## Overview
A React + Express web app for managing virtual queues for local businesses. Users browse shops, join queues, and track their position in real-time. Includes an Express backend, PostgreSQL database, business PIN login, Twilio SMS, Resend email analytics, and Capacitor native app wrapping for iOS/Android App Store publishing.

## Architecture
- **Frontend:** React 18 + TypeScript + Vite 5 (port 5000 in dev)
- **Backend:** Express.js API server (port 3001 in dev, `PORT` env var in production)
- **Database:** PostgreSQL (via `DATABASE_URL` env var — auto-managed by Replit & Railway)
- **Business auth:** 6-digit admin PINs are SHA-256 hashed in PostgreSQL and validated server-side with per-IP rate limiting
- **SMS:** Twilio (optional, gracefully disabled when not configured)
- **Email analytics:** Resend (optional, gracefully disabled when not configured)
- **Mobile:** Capacitor (iOS + Android native projects in `REALVELORA/ios` and `REALVELORA/android`)
- **Vite proxy (dev only):** `/api` → backend workflow on port 3001

## Project Structure
```
REALVELORA/
├── server/
│   └── index.js            # Express API server + DB schema + migrations
├── src/
│   ├── lib/
│   │   └── api.ts           # Central API base URL (uses VITE_API_URL for Capacitor)
│   ├── store/
│   │   └── queueStore.ts    # Zustand store (uses centralized apiFetch)
│   ├── pages/               # Home, Search, Login, Join, Dashboard, Admin, SuperAdmin, Register
│   ├── components/          # Navbar, ShopCard, Toast, BannerAd
│   └── types/               # TypeScript interfaces
├── ios/                     # Capacitor iOS native project (open with Xcode)
├── android/                 # Capacitor Android native project (open with Android Studio)
├── capacitor.config.ts      # Capacitor config (appId: app.wavit.queue)
├── vite.config.ts           # Vite config (port 5000, dev proxy /api → 3001)
├── .env.example             # All required/optional environment variables documented
└── package.json
railway.json                 # Railway deployment config (build + start commands)
nixpacks.toml                # Nixpacks build config for Railway
```

## Railway Deployment
The app is fully configured for Railway:
- **Build:** `cd REALVELORA && npm install && npm run build`
- **Start:** `node REALVELORA/server/index.js`
- The Express server serves the built frontend (`dist/`) and handles all `/api/*` routes
- The server listens on `process.env.PORT` (set automatically by Railway)

### Required Railway environment variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | Auto-set when you add a PostgreSQL plugin to the Railway project |
| `SUPERADMIN_SECRET` | Long random string to protect the super-admin dashboard |

### Optional Railway environment variables
| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Enables SMS notifications |
| `TWILIO_AUTH_TOKEN` | Enables SMS notifications |
| `TWILIO_PHONE_NUMBER` | Your Twilio number (e.g. +15551234567) |
| `RESEND_API_KEY` | Enables biweekly analytics emails |
| `EMAIL_FROM` | From address for analytics emails |
| `APP_DOWNLOAD_LINK` | Link sent in join confirmation SMS |

## Capacitor (App Store)
Both iOS and Android native projects are set up and synced.

### Building for iOS (App Store)
1. On a Mac, open `REALVELORA/ios/App/App.xcworkspace` in Xcode
2. Run `pod install` in `REALVELORA/ios/App/` first if CocoaPods is available
3. Set your Team/Bundle ID, then Archive and submit

### Building for Android (Play Store)
1. Open `REALVELORA/android/` in Android Studio
2. Build → Generate Signed Bundle/APK

### Updating after code changes
```bash
cd REALVELORA
npm run build      # rebuild frontend
npx cap sync       # push web assets into iOS + Android projects
```

### Capacitor + Railway: API URL
The native app loads web assets locally, so it needs to know the Railway URL for API calls.
Before building for the App Store, set `VITE_API_URL` to your Railway deployment URL:
```bash
VITE_API_URL=https://your-app.up.railway.app npm run build
npx cap sync
```

## Database Schema
Auto-created and migrated on every server start (safe `ADD COLUMN IF NOT EXISTS`):
- `shops` — shop info, settings, analytics config, admin secret, hashed admin PIN
- `tickets` — queue entries with timing and SMS state
- `shop_registrations` — pending/approved/rejected business applications including hashed requested admin PIN

## API Endpoints
- `GET /api/shops` — all shops with live wait times
- `GET /api/shops/:id` — single shop + queue
- `POST /api/tickets` — join queue
- `GET /api/tickets/:shopId/:ticketId` — ticket status + position
- `DELETE /api/tickets/:shopId/:ticketId` — leave queue
- `POST /api/business-login` — validate 6-digit business PIN and return admin route details; limited to 10 failed attempts per IP per 20 minutes
- `POST /api/sms/webhook` — Twilio inbound YES/NO replies
- `POST /api/register` — business registration submission with required 6-digit admin PIN
- `GET /api/admin/:shopId/:secret` — admin queue view
- `POST /api/admin/:shopId/:secret/serve/:ticketId` — mark served
- `DELETE /api/admin/:shopId/:secret/tickets/:ticketId` — remove from queue
- `PATCH /api/admin/:shopId/:secret/settings` — update shop settings including login PIN
- `GET /api/admin/:shopId/:secret/analytics` — analytics data
- `POST /api/admin/:shopId/:secret/analytics/toggle` — enable/disable email reports
- `POST /api/admin/:shopId/:secret/analytics/send` — send report now
- `GET /api/superadmin/:secret/registrations` — list all registrations
- `POST /api/superadmin/:secret/registrations/:id/approve` — approve + create shop
- `POST /api/superadmin/:secret/registrations/:id/reject` — reject registration

## Workflows (Replit dev)
- `Start application` — `cd REALVELORA && npm run dev` (port 5000, webview)
- `API Server` — `cd REALVELORA && npm run server` (port 3001, console)

## Replit Migration Notes
- Dependencies are installed under `REALVELORA/node_modules` from the existing `REALVELORA/package.json`.
- The API server now awaits database schema initialization before starting scheduler jobs, preventing startup races against missing tables.
- `SUPERADMIN_SECRET` should be configured through Replit Secrets when super-admin access is needed; do not hardcode it in source files.
