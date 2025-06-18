const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🎵 Helper functions for realistic lineup generation

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getBillingPosition(index, totalArtists) {
  if (index === 0) return 'HEADLINER';
  if (totalArtists > 3 && index === 1) return 'CO_HEADLINER';
  if (index === totalArtists - 1) return 'OPENER';
  return 'SUPPORT';
}

async function createLineupTestData() {
  console.log('🎵 Creating new lineup-based test data...');
  
  try {
    // Get system user
    const systemUser = await prisma.user.findFirst({
      where: { email: 'system@diyshows.com' }
    });

    if (!systemUser) {
      throw new Error('System user not found');
    }

    // Get artists and venues
    const artists = await prisma.artist.findMany({
      where: {
        name: { not: null, not: '' }
      },
      take: 20,
      select: { id: true, name: true, genres: true }
    });

    const venues = await prisma.venue.findMany({
      take: 8,
      select: { 
        id: true, 
        name: true, 
        capacity: true,
        location: {
          select: { city: true, stateProvince: true }
        }
      }
    });

    console.log(`🎸 Found ${artists.length} artists and ${venues.length} venues`);

    // 🎯 CREATE REALISTIC MULTI-ARTIST SHOWS
    const showTemplates = [
      {
        title: "Punk Night",
        artistCount: 4,
        ticketPrice: 15,
        description: "Classic punk showcase with established and up-and-coming bands"
      },
      {
        title: "Indie Rock Evening",
        artistCount: 3,
        ticketPrice: 20,
        description: "Curated evening of indie rock featuring touring and local acts"
      },
      {
        title: "DIY Showcase",
        artistCount: 5,
        ticketPrice: 12,
        description: "Community-focused show supporting local DIY scene"
      },
      {
        title: "Alternative Festival",
        artistCount: 3,
        ticketPrice: 25,
        description: "Alternative music celebration with diverse lineup"
      }
    ];

    let totalShows = 0;
    let totalLineupEntries = 0;

    for (let venueIndex = 0; venueIndex < Math.min(venues.length, 6); venueIndex++) {
      const venue = venues[venueIndex];
      
      // Create 2-3 shows per venue over the next few months
      const showsPerVenue = Math.floor(Math.random() * 2) + 2; // 2-3 shows
      
      for (let showIndex = 0; showIndex < showsPerVenue; showIndex++) {
        const template = showTemplates[showIndex % showTemplates.length];
        
        // Generate show date (2-12 weeks from now)
        const showDate = new Date();
        showDate.setDate(showDate.getDate() + (14 + (venueIndex * 14) + (showIndex * 21)));
        
        console.log(`🎪 Creating show: ${template.title} at ${venue.name} on ${showDate.toDateString()}`);

        // Create the show container
        const show = await prisma.show.create({
          data: {
            title: `${template.title} at ${venue.name}`,
            date: showDate,
            venueId: venue.id,
            description: template.description,
            ticketPrice: template.ticketPrice,
            ageRestriction: Math.random() > 0.3 ? 'ALL_AGES' : 'TWENTY_ONE_PLUS',
            status: 'CONFIRMED',
            createdById: systemUser.id,
            capacity: venue.capacity,
            doorsOpen: '7:00 PM',
            showTime: '8:00 PM',
            curfew: '11:00 PM',
            notes: `Multi-artist ${template.title.toLowerCase()} featuring ${template.artistCount} acts`
          }
        });

        console.log(`✅ Created show: ${show.title}`);
        totalShows++;

        // Select artists for this show's lineup
        const showArtists = getRandomElements(artists, template.artistCount);
        
        // Create lineup entries for each artist
        for (let artistIndex = 0; artistIndex < showArtists.length; artistIndex++) {
          const artist = showArtists[artistIndex];
          const billingPosition = getBillingPosition(artistIndex, showArtists.length);
          
          // Calculate guarantee based on billing position
          let guarantee;
          switch (billingPosition) {
            case 'HEADLINER':
              guarantee = Math.floor(Math.random() * 600) + 400; // $400-$1000
              break;
            case 'CO_HEADLINER':
              guarantee = Math.floor(Math.random() * 400) + 300; // $300-$700
              break;
            case 'SUPPORT':
              guarantee = Math.floor(Math.random() * 250) + 150; // $150-$400
              break;
            case 'OPENER':
              guarantee = Math.floor(Math.random() * 150) + 75;  // $75-$225
              break;
            default:
              guarantee = Math.floor(Math.random() * 200) + 100; // $100-$300
          }

          // Set length based on billing position
          let setLength;
          switch (billingPosition) {
            case 'HEADLINER':
              setLength = Math.floor(Math.random() * 30) + 60; // 60-90 minutes
              break;
            case 'CO_HEADLINER':
              setLength = Math.floor(Math.random() * 20) + 45; // 45-65 minutes
              break;
            case 'SUPPORT':
              setLength = Math.floor(Math.random() * 15) + 30; // 30-45 minutes
              break;
            case 'OPENER':
              setLength = Math.floor(Math.random() * 10) + 20; // 20-30 minutes
              break;
            default:
              setLength = Math.floor(Math.random() * 20) + 25; // 25-45 minutes
          }

          const lineupEntry = await prisma.showLineup.create({
            data: {
              showId: show.id,
              artistId: artist.id,
              billingPosition: billingPosition,
              setLength: setLength,
              guarantee: guarantee,
              status: 'CONFIRMED',
              performanceOrder: artistIndex + 1,
              notes: billingPosition === 'HEADLINER' ? 'Main act - full production support' : 
                     billingPosition === 'OPENER' ? 'Opening slot - house sound only' :
                     'Standard support slot'
            }
          });

          console.log(`  🎤 Added to lineup: ${artist.name} (${billingPosition}) - $${guarantee}, ${setLength}min`);
          totalLineupEntries++;
        }

        console.log(`✅ Completed lineup for ${show.title} with ${showArtists.length} artists\n`);
      }
    }

    // 🎯 CREATE SOME SHOWS IN PLANNING STAGE (PENDING)
    console.log('📅 Creating shows in planning stage...');
    
    for (let i = 0; i < 3; i++) {
      const venue = venues[i % venues.length];
      const template = showTemplates[i % showTemplates.length];
      
      const showDate = new Date();
      showDate.setDate(showDate.getDate() + (60 + (i * 14))); // Further out dates

      const pendingShow = await prisma.show.create({
        data: {
          title: `${template.title} at ${venue.name} (Planning)`,
          date: showDate,
          venueId: venue.id,
          description: `${template.description} - Lineup being finalized`,
          ticketPrice: template.ticketPrice,
          ageRestriction: 'ALL_AGES',
          status: 'PENDING',
          createdById: systemUser.id,
          capacity: venue.capacity,
          notes: 'Show in planning stage - lineup being confirmed'
        }
      });

      // Add partial lineup (headliner confirmed, support TBD)
      const headliner = artists[Math.floor(Math.random() * artists.length)];
      
      await prisma.showLineup.create({
        data: {
          showId: pendingShow.id,
          artistId: headliner.id,
          billingPosition: 'HEADLINER',
          setLength: 75,
          guarantee: 800,
          status: 'CONFIRMED',
          performanceOrder: 1,
          notes: 'Headliner confirmed - support acts TBD'
        }
      });

      console.log(`📅 Created pending show: ${pendingShow.title} with ${headliner.name} as headliner`);
      totalShows++;
      totalLineupEntries++;
    }

    console.log('\n🎉 Lineup test data creation completed!');
    console.log(`📊 Summary:`);
    console.log(`   • ${totalShows} shows created`);
    console.log(`   • ${totalLineupEntries} lineup entries created`);
    console.log(`   • Shows span ${Math.min(venues.length, 6)} venues`);
    console.log(`   • Mix of confirmed multi-artist shows and pending shows`);
    console.log(`   • Realistic billing positions and payment structures`);
    console.log(`   • Proper set lengths and performance order`);

  } catch (error) {
    console.error('Error creating lineup test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createLineupTestData().catch(console.error);
}

module.exports = { createLineupTestData }; 