# REALVELORA - Smart Queue Management

## Overview
A React-based web application for managing virtual queues for local businesses (barbershops, salons, etc.). Users can browse shops, join queues, and track their real-time position.

## Project Structure
```
REALVELORA/          # Main application directory
├── src/
│   ├── App.tsx      # Main routing (react-router-dom v6)
│   ├── main.tsx     # React entry point
│   ├── components/  # Reusable UI components (Navbar, ShopCard, Toast)
│   ├── pages/       # Route pages (Home, Search, Join, Dashboard, About)
│   ├── store/       # Zustand state management (queueStore.ts)
│   ├── data/        # Mock shop data
│   └── types/       # TypeScript interfaces
├── vite.config.ts   # Vite dev server config (port 5000, host 0.0.0.0)
└── package.json     # Dependencies
```

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite 7
- **Styling:** Tailwind CSS 3
- **State:** Zustand (with localStorage persistence)
- **Routing:** react-router-dom v6
- **Animations:** Framer Motion + GSAP
- **Icons:** lucide-react

## Development
- Workflow: `cd REALVELORA && npm run dev` on port 5000
- Package manager: npm

## Deployment
- Type: Static site
- Build: `cd REALVELORA && npm run build`
- Public dir: `REALVELORA/dist`
