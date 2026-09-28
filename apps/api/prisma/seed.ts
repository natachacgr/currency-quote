import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const currencies = [
  { code: 'USD', name: 'Dólar Americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Libra Esterlina' },
  { code: 'JPY', name: 'Iene Japonês' },
  { code: 'CAD', name: 'Dólar Canadense' },
  { code: 'AUD', name: 'Dólar Australiano' },
  { code: 'CHF', name: 'Franco Suíço' },
  { code: 'CNY', name: 'Yuan Chinês' },
  { code: 'ARS', name: 'Peso Argentino' },
  { code: 'MXN', name: 'Peso Mexicano' },
];

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    for (const currency of currencies) {
      await prisma.currency.upsert({
        where: {
          code: currency.code,
        },
        update: {
          name: currency.name,
        },
        create: currency,
      });
    }

    console.log(`Seed completed: ${currencies.length} currencies.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();