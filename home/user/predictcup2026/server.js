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

// IMPORTANT: serve frontend
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});
app.use(limiter);

/* =========================
   TELEGRAM AUTH
========================= */
const authenticateTelegram = async (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) return res.status(401).json({ error: 'Missing Telegram data' });

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (hmac !== hash) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const user = JSON.parse(params.get('user'));
    req.telegramUser = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Auth failed' });
  }
};

/* =========================
   JWT AUTH
========================= */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

/* =========================
   ROUTES
========================= */

// FIX: root route (THIS solves Cannot GET /)
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

app.post('/api/auth/telegram', authenticateTelegram, async (req, res) => {
  const tgUser = req.telegramUser;

  const displayName =
    tgUser.username ? `@${tgUser.username}` :
    tgUser.first_name || `Player ${tgUser.id}`;

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(tgUser.id) },
    update: { displayName },
    create: {
      telegramId: BigInt(tgUser.id),
      displayName
    }
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/predictions', authenticateJWT, predictionsRouter);
app.use('/api/leagues', authenticateJWT, leaguesRouter);
app.use('/api/admin', authenticateJWT, adminRouter);

/* =========================
   SOCKET
========================= */
io.on('connection', (socket) => {
  logger.info('client connected');
});

/* =========================
   START
========================= */
httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});
