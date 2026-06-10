import express from 'express';
import { PrismaClient } from '@prisma/client';
import { calculatePredictionPoints, awardPoints } from '../services/scoring.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { userId, matchId, predictedHome, predictedAway } = req.body;
  const tokenUser = req.user;

  if (!tokenUser || tokenUser.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const timeDiff = (new Date(match.kickoffTime) - new Date()) / (1000 * 60);
  if (timeDiff < 30) {
    return res.status(400).json({ error: 'Predictions locked 30 minutes before kickoff' });
  }

  const existing = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId, matchId } }
  });

  if (existing) {
    return res.status(400).json({ error: 'Prediction already submitted' });
  }

  const prediction = await prisma.prediction.create({
    data: { userId, matchId, predictedHome, predictedAway }
  });

  res.json({ success: true, prediction });
});

router.post('/resolve', async (req, res) => {
  // Admin-only endpoint - production would add role check
  const { matchId, homeScore, awayScore } = req.body;

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, isCompleted: true }
  });

  const predictions = await prisma.prediction.findMany({ where: { matchId } });

  for (const pred of predictions) {
    const points = await calculatePredictionPoints(pred, match);
    await awardPoints(pred.userId, points, matchId);
  }

  // Emit real-time update
  req.app.get('io').emit('match:resolved', { matchId });

  res.json({ success: true });
});

export default router;