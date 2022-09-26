import { prisma } from '../database.js';

export async function truncate() {
    await prisma.$executeRaw`TRUNCATE TABLE recommendations`;
}
