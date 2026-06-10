import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed Teams
  const teams = [
    { name: 'United States', code: 'USA', flag: '🇺🇸' },
    { name: 'Canada', code: 'CAN', flag: '🇨🇦' },
    { name: 'Mexico', code: 'MEX', flag: '🇲🇽' },
    { name: 'Brazil', code: 'BRA', flag: '🇧🇷' },
    { name: 'Argentina', code: 'ARG', flag: '🇦🇷' },
    { name: 'Germany', code: 'GER', flag: '🇩🇪' },
    { name: 'France', code: 'FRA', flag: '🇫🇷' },
    { name: 'Spain', code: 'ESP', flag: '🇪🇸' },
    { name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Japan', code: 'JPN', flag: '🇯🇵' }
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: {},
      create: team
    });
  }

  // Seed sample matches
  const usa = await prisma.team.findUnique({ where: { code: 'USA' } });
  const can = await prisma.team.findUnique({ where: { code: 'CAN' } });
  const mex = await prisma.team.findUnique({ where: { code: 'MEX' } });

  await prisma.match.createMany({
    data: [
      {
        homeTeamId: usa.id,
        awayTeamId: can.id,
        kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        stage: 'group'
      },
      {
        homeTeamId: mex.id,
        awayTeamId: usa.id,
        kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 48),
        stage: 'group'
      }
    ],
    skipDuplicates: true
  });

  // Seed translations
  const translations = [
    { key: 'welcome', lang: 'en', value: 'Welcome to PredictCup 2026' },
    { key: 'welcome', lang: 'ar', value: 'مرحبا بك في PredictCup 2026' },
    { key: 'welcome', lang: 'ckb', value: 'بەخێربێیت بۆ PredictCup 2026' },
    { key: 'predict', lang: 'en', value: 'Submit Prediction' },
    { key: 'predict', lang: 'ar', value: 'إرسال التوقع' },
    { key: 'predict', lang: 'ckb', value: 'ناردنی پێشبینی' }
  ];

  for (const t of translations) {
    await prisma.translation.upsert({
      where: { key_lang: { key: t.key, lang: t.lang } },
      update: { value: t.value },
      create: t
    });
  }

  console.log('Seed completed');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());