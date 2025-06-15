const { PrismaClient } = require('@prisma/client');

async function checkActivities() {
  const prisma = new PrismaClient();
  
  try {
    const count = await prisma.activityNotification.count();
    console.log('🎯 Activity notifications in database:', count);
    
    if (count > 0) {
      const recent = await prisma.activityNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          title: true,
          summary: true,
          createdAt: true,
          isRead: true
        }
      });
      
      console.log('\n📋 Recent activities:');
      recent.forEach(activity => {
        console.log(`  - ${activity.type}: ${activity.title} (${activity.createdAt.toISOString()})`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivities(); 