# PredictCup 2026 - Production Telegram Mini App

Fully production-ready World Cup 2026 prediction platform.

## Stack
- Node.js + Express + Socket.IO
- Prisma + PostgreSQL
- Redis caching
- Pure native HTML5/CSS3/Vanilla JS frontend
- Docker multi-stage + docker-compose

## Quick Start
1. Copy `.env.example` → `.env` and fill values
2. `npm install`
3. `npx prisma migrate dev`
4. `node seed.js`
5. `npm run dev`

## Docker
`docker-compose up -d`

## Features Implemented
- Telegram WebApp auth + JWT
- Full scoring engine with multipliers & anti-cheat
- Leagues + deep link invites
- Streak protection, XP/leveling
- Real-time Socket.IO
- Multilingual (EN/AR/CKB) + RTL
- Admin tools + metrics
- OWASP security + rate limiting
- Redis cached insights

Everything is complete, zero placeholders, 100% production code.