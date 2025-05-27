const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLidz() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'lidz' } },
          { username: { contains: 'lidz' } }
        ]
      }
    });
    console.log('Lidz users:', users);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLidz(); 