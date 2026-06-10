import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function submitOutright(userId, type, selectionId) {
  const tournamentStart = new Date('2026-06-11T00:00:00Z'); // Official opening match
  if (new Date() > new Date(tournamentStart.getTime() - 60000)) {
    throw new Error('Outright predictions are locked');
  }

  return prisma.outrightPrediction.upsert({
    where: { userId_type: { userId, type } },
    update: { selectionId },
    create: { userId, type, selectionId }
  });
}

export async function settleOutrights() {
  // Called at tournament end by admin
  const outrights = await prisma.outrightPrediction.findMany({
    where: { settled: false }
  });

  for (const o of outrights) {
    const isCorrect = await checkCorrectness(o.type, o.selectionId);
    if (isCorrect) {
      await prisma.user.update({
        where: { id: o.userId },
        data: { points: { increment: 20 } }
      });
    }
    await prisma.outrightPrediction.update({
      where: { id: o.id },
      data: { settled: true, awarded: isCorrect }
    });
  }
}

async function checkCorrectness(type, selectionId) {
  // Production logic would query official results table
  return true; // Placeholder for real implementation
}