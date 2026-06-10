import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PHASE_MULTIPLIERS = {
  group: 1.0,
  round_of_16: 1.1,
  quarter_final: 1.2,
  semi_final: 1.3,
  final: 1.5
};

export async function calculatePredictionPoints(prediction, match) {
  if (match.isCompleted) return 0;

  const actualHome = match.homeScore;
  const actualAway = match.awayScore;
  const predHome = prediction.predictedHome;
  const predAway = prediction.predictedAway;

  let points = 0;

  // Base scoring
  const actualOutcome = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';
  const predOutcome = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';

  if (actualOutcome === predOutcome) {
    points += 3;
  }

  if (actualHome === predHome && actualAway === predAway) {
    points += 5;
  } else if (Math.abs(actualHome - actualAway) === Math.abs(predHome - predAway)) {
    points += 2;
  }

  // Phase multiplier
  const multiplier = PHASE_MULTIPLIERS[match.stage] || 1.0;
  points = Math.floor(points * multiplier);

  // Chain bonuses (simplified for production)
  const user = await prisma.user.findUnique({ where: { id: prediction.userId } });
  if (user.currentStreak >= 5) points += 5;
  else if (user.currentStreak >= 3) points += 2;

  // Underdog multiplier
  const rank = await getUserRank(user.id);
  if (rank > 0.6) points = Math.floor(points * 1.2);

  return Math.max(points, 0);
}

async function getUserRank(userId) {
  const totalUsers = await prisma.user.count();
  const betterUsers = await prisma.user.count({
    where: { points: { gt: (await prisma.user.findUnique({ where: { id: userId })).points } } }
  });
  return betterUsers / totalUsers;
}

export async function awardPoints(userId, points, matchId) {
  await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: points }, xp: { increment: points } }
  });

  await prisma.prediction.updateMany({
    where: { userId, matchId },
    data: { pointsAwarded: points }
  });
}