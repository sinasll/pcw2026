# PredictCup 2026 - Deploy on Render (No Redis)

This is the final, simplified deployment guide for **Render** (Redis removed).

---

## Step 1: Push Code to GitHub

```bash
cd /home/user/predictcup2026

git add .
git commit -m "PredictCup 2026 - Ready for Render (No Redis)"
git push
```

---

## Step 2: Create PostgreSQL Database on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Settings:
   - Name: `predictcup-db`
   - Plan: **Free**
4. Click **Create Database**
5. Copy the **Internal Database URL** (you will need this)

---

## Step 3: Create Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Use these settings:

   | Field                    | Value                    |
   |--------------------------|--------------------------|
   | **Name**                 | `predictcup2026`         |
   | **Environment**          | `Docker`                 |
   | **Dockerfile Path**      | `./Dockerfile`           |
   | **Plan**                 | **Free**                 |

4. Click **Advanced** and add these **Environment Variables**:

   | Variable              | Value                                      |
   |-----------------------|--------------------------------------------|
   | `DATABASE_URL`        | Paste **Internal Database URL** from PostgreSQL |
   | `TELEGRAM_BOT_TOKEN`  | Your real token from @BotFather            |
   | `JWT_SECRET`          | A long random string (32+ characters)      |
   | `NODE_ENV`            | `production`                               |
   | `PORT`                | `3000`                                     |

5. Click **Create Web Service**

---

## Step 4: Get Your Public URL

After deployment:
- Go to your Web Service → **Settings**
- Copy the **URL** (example: `https://predictcup2026.onrender.com`)

---

## Step 5: Configure Telegram Bot

1. Open Telegram → **@BotFather**
2. Run:
   - `/newbot`
   - `/setmenubutton` → Button text: `PredictCup 2026`
   - Paste your Render URL

---

## Step 6: Run Database Migrations & Seed (One Time)

After deployment finishes:

1. Go to your Web Service → **Shell** tab
2. Run:

```bash
npx prisma migrate deploy
node seed.js
```

---

## Done!

Your PredictCup 2026 app is now fully deployed on Render **without Redis**.