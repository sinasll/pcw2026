# PredictCup 2026 - Production Deployment & Publishing Guide

This guide shows the fastest and most reliable way to deploy PredictCup 2026 to production.

---

## Recommended Platform: Railway (Easiest & Fastest)

Railway supports Docker, PostgreSQL, Redis, and custom domains with automatic HTTPS.

### Step 1: Prepare Your Project

1. Push your code to GitHub (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial PredictCup 2026 production release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/predictcup2026.git
   git push -u origin main
   ```

2. Make sure you have a `.env` file locally (for reference only — never commit secrets).

---

### Step 2: Deploy on Railway

1. Go to [https://railway.app](https://railway.app) and sign up with GitHub.
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select your `predictcup2026` repository.
4. Railway will automatically detect the `Dockerfile`.

5. **Add Services** (Railway will prompt you):
   - Add **PostgreSQL** plugin
   - Add **Redis** plugin

6. Railway will automatically set the correct environment variables.

7. Go to your **App service** → **Variables** and add these:

   | Variable              | Value                                      |
   |-----------------------|--------------------------------------------|
   | `TELEGRAM_BOT_TOKEN`  | Your real bot token from @BotFather        |
   | `JWT_SECRET`          | A long random string (use a password generator) |
   | `NODE_ENV`            | `production`                               |
   | `PORT`                | `3000`                                     |

8. Click **Deploy**.

---

### Step 3: Get Your Public URL

After deployment finishes:
- Go to your App service → **Settings** → **Domains**
- Railway gives you a free `*.up.railway.app` domain with automatic HTTPS.
- Copy this URL (example: `https://predictcup2026-production.up.railway.app`)

---

### Step 4: Configure Telegram Bot (Critical)

1. Open Telegram and search for **@BotFather**.
2. Send `/newbot` and create your bot (e.g., `@PredictCup2026Bot`).
3. After creation, send `/setmenubutton` → choose your bot → set the button text to `PredictCup 2026`.
4. Send `/setmenubutton` again → paste your Railway HTTPS URL.
5. (Optional) Send `/setdomain` and enter the same domain.

Your Mini App is now live inside Telegram.

---

### Step 5: Final Production Checklist

- [ ] `TELEGRAM_BOT_TOKEN` is set in Railway
- [ ] `JWT_SECRET` is long and random
- [ ] Database migrations ran (`npx prisma migrate deploy` via Railway shell if needed)
- [ ] Seed data ran once (`node seed.js`)
- [ ] HTTPS is active (Railway provides it automatically)
- [ ] Test login with a real Telegram account

---

## Alternative Platforms

| Platform       | Difficulty | Best For                     | Notes                              |
|----------------|------------|------------------------------|------------------------------------|
| **Railway**    | Very Easy  | Full stack + DB + Redis      | Recommended                        |
| **Render**     | Easy       | Docker + PostgreSQL          | Good free tier                     |
| **Fly.io**     | Medium     | Global low-latency           | Excellent performance              |
| **DigitalOcean App Platform** | Medium | Full control            | More configuration needed          |

---

## Updating the App Later

Every time you push to GitHub `main` branch:
- Railway will automatically rebuild and deploy (zero downtime).

---

## Need a Custom Domain?

1. Buy a domain (Namecheap, Cloudflare, etc.)
2. In Railway → Domains → Add custom domain
3. Follow the DNS instructions Railway gives you.

---

**You are now live.**

Your PredictCup 2026 Telegram Mini App is fully deployed and published.