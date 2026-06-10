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
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

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
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Telegram Auth Middleware
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
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hmac !== hash) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const user = JSON.parse(params.get('user'));
    req.telegramUser = user;
    next();
  } catch (error) {
    logger.error('Auth error', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// JWT Middleware
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

// Auth Endpoint
app.post('/api/auth/telegram', authenticateTelegram, async (req, res) => {
  const tgUser = req.telegramUser;

  let displayName = tgUser.username 
    ? `@${tgUser.username}` 
    : tgUser.first_name || `Player #${tgUser.id}`;

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(tgUser.id) },
    update: {
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
      languageCode: tgUser.language_code,
      isPremium: tgUser.is_premium || false,
      displayName,
      updatedAt: new Date()
    },
    create: {
      telegramId: BigInt(tgUser.id),
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
      languageCode: tgUser.language_code,
      isPremium: tgUser.is_premium || false,
      displayName
    }
  });

  const jwtToken = jwt.sign(
    { userId: user.id, telegramId: user.telegramId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token: jwtToken, user });
});

// Protected Routes
app.get('/api/profile', authenticateJWT, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  res.json(user);
});

// Mount routers
app.use('/api/predictions', authenticateJWT, predictionsRouter);
app.use('/api/leagues', authenticateJWT, leaguesRouter);
app.use('/api/admin', authenticateJWT, adminRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.IO real-time
io.on('connection', (socket) => {
  logger.info('Client connected');
  socket.on('disconnect', () => logger.info('Client disconnected'));
});

// Translation endpoint
app.get('/api/translations/:lang', async (req, res) => {
  const { lang } = req.params;
  const translations = await prisma.translation.findMany({ where: { lang } });
  const map = {};
  translations.forEach(t => map[t.key] = t.value);
  res.json(map);
});

httpServer.listen(process.env.PORT || 3000, () => {
  logger.info(`PredictCup 2026 server running on port ${process.env.PORT || 3000}`);
});