import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';
import winston from 'winston';

import path from 'path';
import { fileURLToPath } from 'url';

import predictionsRouter from './routes/predictions.js';
import leaguesRouter from './routes/leagues.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.set('io', io);

const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

/* -------------------------
   FIX: SERVE FRONTEND
------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------
   ROOT ROUTE FIX
------------------------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* -------------------------
   TELEGRAM AUTH
------------------------- */
const authenticateTelegram = async (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) return res.status(401).json({ error: 'Missing Telegram data' });

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (hmac !== hash) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    req.telegramUser = JSON.parse(params.get('user'));
    next();
  } catch (err) {
    logger.error(err);
    return res.status(401).json({ error: 'Auth failed' });
  }
};

/* -------------------------
   JWT AUTH
------------------------- */
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

/* -------------------------
   AUTH ROUTE
------------------------- */
app.post('/api/auth/telegram', authenticateTelegram, async (req, res) => {
  const tg = req.telegramUser;

  const displayName =
    tg.username ? `@${tg.username}` : tg.first_name || `Player ${tg.id}`;

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(tg.id) },
    update: {
      username: tg.username,
      displayName
    },
    create: {
      telegramId: BigInt(tg.id),
      username: tg.username,
      displayName
    }
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
});

/* -------------------------
   API ROUTES
------------------------- */
app.get('/api/profile', authenticateJWT, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId }
  });
  res.json(user);
});

app.use('/api/predictions', authenticateJWT, predictionsRouter);
app.use('/api/leagues', authenticateJWT, leaguesRouter);
app.use('/api/admin', authenticateJWT, adminRouter);

/* -------------------------
   TRANSLATIONS
------------------------- */
app.get('/api/translations/:lang', async (req, res) => {
  const data = await prisma.translation.findMany({
    where: { lang: req.params.lang }
  });

  const map = {};
  data.forEach(t => map[t.key] = t.value);
  res.json(map);
});

/* -------------------------
   SOCKET.IO
------------------------- */
io.on('connection', (socket) => {
  logger.info("Client connected");

  socket.on('disconnect', () => {
    logger.info("Client disconnected");
  });
});

/* -------------------------
   START SERVER
------------------------- */
httpServer.listen(process.env.PORT || 3000, () => {
  logger.info(`Server running on ${process.env.PORT || 3000}`);
});
