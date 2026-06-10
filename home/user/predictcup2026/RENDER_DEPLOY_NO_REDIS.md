# PredictCup 2026 - Deploy on Render (No Redis Version)

This is the updated deployment guide for Render after removing Redis dependency.

---

## Step 1: Push to GitHub

```bash
cd /home/user/predictcup2026
git add .
git commit -m "Remove Redis dependency for Render free tier"
git push
```

---

## Step 2: Create PostgreSQL on Render

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Name: `predictcup-db`
3. Plan: **Free**
4. Create and copy the **Internal Database URL**

---

## Step 3: Create Web Service

1. **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:

   | Field               | Value                  |
   |---------------------|------------------------|
   | Environment         | Docker                 |
   | Dockerfile Path     | `./Dockerfile`         |
   | Plan                | Free                   |

4. Add these **Environment Variables**:

   | Variable              | Value                                      |
   |-----------------------|--------------------------------------------|
   | `DATABASE_URL`        | Internal PostgreSQL URL                    |
   | `TELEGRAM_BOT_TOKEN`  | Your bot token                             |
   | `JWT_SECRET`          | Long random string                         |
   | `NODE_ENV`            | `production`                               |
   | `PORT`                | `3000`                                     |

5. Click **Create Web Service**

---

## Step 4: Configure Telegram Bot

Use your Render URL with `/setmenubutton` in @BotFather.

---

## Step 5: Run Migrations (One Time)

In the Web Service **Shell** tab:

```bash
npx prisma migrate deploy
node seed.js
```

---

**Done.** Your app is now deployed on Render without Redis.