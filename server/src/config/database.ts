import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient instance to avoid multiple connections
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;

