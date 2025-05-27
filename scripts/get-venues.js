const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getVenues() {
  try {
    const venues = await prisma.venue.findMany({
      where: {
        OR: [
          { name: { contains: 'AS220', mode: 'insensitive' } },
          { name: { contains: 'Lost Bag', mode: 'insensitive' } }
        ]
      }
    });
    console.log('Key venues:');
    venues.forEach(venue => {
      console.log(`- ${venue.name} (${venue.id}) - ${venue.city}, ${venue.state}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getVenues(); 