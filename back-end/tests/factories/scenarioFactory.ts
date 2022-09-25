import { prisma } from '../../src/database';

export async function deleteAllData() {
    await prisma.$transaction([prisma.$executeRaw`TRUNCATE TABLE recommendations`]);
}

export async function disconnectPrisma() {
    await prisma.$disconnect();
}
