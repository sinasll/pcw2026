import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/create', async (req, res) => {
  const { name, ownerId } = req.body;
  const inviteCode = crypto.randomBytes(6).toString('hex');

  const league = await prisma.league.create({
    data: {
      name,
      ownerId,
      inviteCode,
      memberships: {
        create: { userId: ownerId }
      }
    }
  });

  const deepLink = `https://t.me/PredictCupBot?start=league_${inviteCode}`;
  res.json({ league, deepLink });
});

router.post('/join', async (req, res) => {
  const { inviteCode, userId } = req.body;
  const league = await prisma.league.findUnique({ where: { inviteCode } });
  if (!league) return res.status(404).json({ error: 'League not found' });

  await prisma.leagueMembership.create({
    data: { leagueId: league.id, userId }
  });

  res.json({ success: true });
});

export default router;