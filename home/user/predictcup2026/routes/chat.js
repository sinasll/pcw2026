import express from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

const chatLimiter = rateLimit({
  windowMs: 10000,
  max: 5,
  message: { error: 'Rate limit exceeded' }
});

router.post('/send', chatLimiter, async (req, res) => {
  const { leagueId, userId, message, svgAsset } = req.body;

  const msg = await prisma.chatMessage.create({
    data: { leagueId, userId, message, svgAsset }
  });

  // Broadcast via Socket.IO (injected from server)
  req.app.get('io').to(`league_${leagueId}`).emit('chat:message', msg);

  res.json(msg);
});

router.get('/:leagueId', async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { leagueId: parseInt(req.params.leagueId) },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(messages);
});

export default router;