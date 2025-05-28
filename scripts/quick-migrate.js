const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function quickMigration() {
  try {
    console.log('🔄 Quick user migration...');
    
    const fileUsers = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
    console.log(`📊 Found ${fileUsers.length} file users`);
    
    for (const fileUser of fileUsers) {
      const existing = await prisma.user.findUnique({ where: { id: fileUser.id } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: fileUser.id,
            email: fileUser.email,
            username: fileUser.name,
            passwordHash: fileUser.password,
            role: fileUser.role.toUpperCase(),
            verified: fileUser.isVerified || false,
            createdAt: new Date(fileUser.createdAt)
          }
        });
        console.log(`✅ Migrated: ${fileUser.name}`);
      } else {
        console.log(`⏭️ Already exists: ${fileUser.name}`);
      }
    }
    
    // Set Lightning Bolt ownership
    const brianGibson = await prisma.user.findUnique({ where: { id: 'brian-gibson' } });
    if (brianGibson) {
      await prisma.artist.update({
        where: { id: '1748101913848' },
        data: { submittedById: brianGibson.id }
      });
      console.log('🎵 Set Brian Gibson as Lightning Bolt owner');
    }
    
    // Set Lost Bag ownership
    const lidz = await prisma.user.findUnique({ where: { id: 'lidz-bierenday' } });
    if (lidz) {
      const lostBag = await prisma.venue.findFirst({ where: { name: { contains: 'Lost Bag' } } });
      if (lostBag) {
        await prisma.venue.update({
          where: { id: lostBag.id },
          data: { submittedById: lidz.id }
        });
        console.log('🏢 Set Lidz as Lost Bag owner');
      }
    }
    
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickMigration(); 