import { prisma } from '../database';

export async function truncate() {
    await prisma.$executeRaw`TRUNCATE TABLE recommendations`;
}
