const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTimelineData() {
  try {
    console.log('🕐 Adding timeline data to existing shows...');
    
    // Get all shows
    const shows = await prisma.show.findMany();
    console.log(`Found ${shows.length} shows to update`);
    
    // Update each show with realistic timeline data
    for (const show of shows) {
      // Generate realistic timeline based on show date
      const showDate = new Date(show.date);
      const isWeekend = showDate.getDay() === 5 || showDate.getDay() === 6; // Friday or Saturday
      
      // Different timing patterns based on day of week
      let loadIn, soundcheck, doorsOpen, showTime, curfew;
      
      if (isWeekend) {
        // Weekend shows - later times
        loadIn = '17:00';
        soundcheck = '18:30';
        doorsOpen = '19:30';
        showTime = '21:00';
        curfew = '00:00';
      } else {
        // Weekday shows - earlier times
        loadIn = '18:00';
        soundcheck = '19:00';
        doorsOpen = '20:00';
        showTime = '21:00';
        curfew = '23:30';
      }
      
      // Add some variation
      const variations = [
        { loadIn: '16:00', soundcheck: '18:00', doorsOpen: '19:00', showTime: '20:30', curfew: '23:00' },
        { loadIn: '17:30', soundcheck: '19:30', doorsOpen: '20:30', showTime: '21:30', curfew: '00:00' },
        { loadIn: '15:00', soundcheck: '17:30', doorsOpen: '19:00', showTime: '20:00', curfew: '23:30' }
      ];
      
      // Use variation based on show ID for consistency
      const variationIndex = parseInt(show.id.slice(-1)) % variations.length;
      const timeline = variations[variationIndex] || { loadIn, soundcheck, doorsOpen, showTime, curfew };
      
      await prisma.show.update({
        where: { id: show.id },
        data: {
          loadIn: timeline.loadIn,
          soundcheck: timeline.soundcheck,
          doorsOpen: timeline.doorsOpen,
          showTime: timeline.showTime,
          curfew: timeline.curfew,
          capacity: 200 + (parseInt(show.id.slice(-2)) % 300), // Random capacity 200-500
          guarantee: 300 + (parseInt(show.id.slice(-2)) % 700), // Random guarantee $300-1000
          notes: 'Timeline data added automatically'
        }
      });
      
      console.log(`✅ Updated show ${show.id} with timeline data`);
    }
    
    console.log('🎉 Timeline data added to all shows!');
  } catch (error) {
    console.error('❌ Error adding timeline data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTimelineData(); 