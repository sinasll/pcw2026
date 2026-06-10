import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Admin role check middleware (simplified production version)
const isAdmin = (req, res, next) => {
  // In production: verify admin role from JWT or DB
  if (!req.user) return res.status(403).json({ error: 'Forbidden' });
  next();
};

router.get('/user/search', isAdmin, async (req, res) => {
  const { q } = req.query;
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { telegramId: { equals: isNaN(q) ? undefined : BigInt(q) } },
        { username: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } }
      ]
    },
    take: 20
  });
  res.json(users);
});

router.post('/user/update-status', isAdmin, async (req, res) => {
  const { userId, isPremium } = req.body;
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium }
  });
  res.json({ success: true });
});

router.get('/metrics', isAdmin, async (req, res) => {
  const dau = await prisma.user.count({
    where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });
  const totalPredictions = await prisma.prediction.count();
  res.json({ dailyActiveUsers: dau, totalPredictions });
});

export default router;