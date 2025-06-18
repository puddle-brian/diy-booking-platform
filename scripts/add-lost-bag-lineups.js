const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addLostBagLineups() {
  console.log('🎭 Adding MASSIVE diversity of Lost Bag lineups...\n');
  
  try {
    // Find Lost Bag venue
    const lostBag = await prisma.venue.findFirst({
      where: { name: { contains: 'Lost Bag', mode: 'insensitive' } }
    });

    if (!lostBag) {
      console.log('❌ Lost Bag venue not found');
      return;
    }

    console.log('✅ Found Lost Bag:', lostBag.name);

    // Get lots of artists for lineups
    const artists = await prisma.artist.findMany({
      take: 50, // Get 50 artists for diverse lineups
      include: { location: true }
    });

    console.log('✅ Found', artists.length, 'artists for lineups');

    // Find system user
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          email: 'system@diyshows.com',
          verified: true
        }
      });
    }

    // MASSIVE DIVERSE SHOW SCENARIOS FOR LOST BAG
    const showScenarios = [
      // PUNK/HARDCORE SHOWS
      {
        title: 'Hardcore Matinee #1',
        date: new Date('2025-07-05'),
        description: 'All-ages hardcore matinee',
        lineup: [
          { artist: artists[0], billing: 'HEADLINER', guarantee: 800, setLength: 45, order: 4 },
          { artist: artists[1], billing: 'CO_HEADLINER', guarantee: 600, setLength: 35, order: 3 },
          { artist: artists[2], billing: 'SUPPORT', guarantee: 400, setLength: 30, order: 2 },
          { artist: artists[3], billing: 'OPENER', guarantee: 200, setLength: 25, order: 1 }
        ]
      },
      {
        title: 'Punk Fest Saturday',
        date: new Date('2025-07-12'),
        description: 'Five-band punk festival',
        lineup: [
          { artist: artists[4], billing: 'HEADLINER', guarantee: 1200, setLength: 60, order: 5 },
          { artist: artists[5], billing: 'CO_HEADLINER', guarantee: 900, setLength: 45, order: 4 },
          { artist: artists[6], billing: 'SUPPORT', guarantee: 600, setLength: 35, order: 3 },
          { artist: artists[7], billing: 'SUPPORT', guarantee: 400, setLength: 30, order: 2 },
          { artist: artists[8], billing: 'LOCAL_SUPPORT', guarantee: 150, setLength: 20, order: 1 }
        ]
      },
      {
        title: 'DIY Underground Night',
        date: new Date('2025-07-19'),
        description: 'Basement vibes all night',
        lineup: [
          { artist: artists[9], billing: 'HEADLINER', guarantee: 700, setLength: 50, order: 3 },
          { artist: artists[10], billing: 'SUPPORT', guarantee: 450, setLength: 35, order: 2 },
          { artist: artists[11], billing: 'LOCAL_SUPPORT', guarantee: 200, setLength: 25, order: 1 }
        ]
      },

      // INDIE/ALTERNATIVE SHOWS
      {
        title: 'Indie Rock Showcase',
        date: new Date('2025-07-26'),
        description: 'Four band indie lineup',
        lineup: [
          { artist: artists[12], billing: 'HEADLINER', guarantee: 950, setLength: 55, order: 4 },
          { artist: artists[13], billing: 'CO_HEADLINER', guarantee: 700, setLength: 45, order: 3 },
          { artist: artists[14], billing: 'SUPPORT', guarantee: 500, setLength: 35, order: 2 },
          { artist: artists[15], billing: 'OPENER', guarantee: 250, setLength: 25, order: 1 }
        ]
      },
      {
        title: 'Alternative Weekend',
        date: new Date('2025-08-02'),
        description: 'Weekend alternative music fest',
        lineup: [
          { artist: artists[16], billing: 'HEADLINER', guarantee: 1100, setLength: 65, order: 4 },
          { artist: artists[17], billing: 'SUPPORT', guarantee: 650, setLength: 40, order: 3 },
          { artist: artists[18], billing: 'SUPPORT', guarantee: 400, setLength: 30, order: 2 },
          { artist: artists[19], billing: 'LOCAL_SUPPORT', guarantee: 175, setLength: 20, order: 1 }
        ]
      },

      // EXPERIMENTAL/NOISE SHOWS
      {
        title: 'Experimental Noise Night',
        date: new Date('2025-08-09'),
        description: 'Avant-garde and noise artists',
        lineup: [
          { artist: artists[20], billing: 'HEADLINER', guarantee: 600, setLength: 40, order: 3 },
          { artist: artists[21], billing: 'SUPPORT', guarantee: 350, setLength: 30, order: 2 },
          { artist: artists[22], billing: 'OPENER', guarantee: 200, setLength: 25, order: 1 }
        ]
      },
      {
        title: 'Sound Art Collective',
        date: new Date('2025-08-16'),
        description: 'Six artists experimental showcase',
        lineup: [
          { artist: artists[23], billing: 'HEADLINER', guarantee: 800, setLength: 45, order: 6 },
          { artist: artists[24], billing: 'CO_HEADLINER', guarantee: 600, setLength: 35, order: 5 },
          { artist: artists[25], billing: 'SUPPORT', guarantee: 400, setLength: 30, order: 4 },
          { artist: artists[26], billing: 'SUPPORT', guarantee: 300, setLength: 25, order: 3 },
          { artist: artists[27], billing: 'LOCAL_SUPPORT', guarantee: 150, setLength: 20, order: 2 },
          { artist: artists[28], billing: 'LOCAL_SUPPORT', guarantee: 100, setLength: 15, order: 1 }
        ]
      },

      // METAL/HEAVY SHOWS
      {
        title: 'Heavy Metal Monday',
        date: new Date('2025-08-23'),
        description: 'Metal and doom acts',
        lineup: [
          { artist: artists[29], billing: 'HEADLINER', guarantee: 1000, setLength: 55, order: 4 },
          { artist: artists[30], billing: 'CO_HEADLINER', guarantee: 750, setLength: 45, order: 3 },
          { artist: artists[31], billing: 'SUPPORT', guarantee: 500, setLength: 35, order: 2 },
          { artist: artists[32], billing: 'LOCAL_SUPPORT', guarantee: 200, setLength: 25, order: 1 }
        ]
      },
      {
        title: 'Doom & Gloom Festival',
        date: new Date('2025-08-30'),
        description: 'Heavy drone and doom bands',
        lineup: [
          { artist: artists[33], billing: 'HEADLINER', guarantee: 900, setLength: 60, order: 3 },
          { artist: artists[34], billing: 'SUPPORT', guarantee: 550, setLength: 40, order: 2 },
          { artist: artists[35], billing: 'OPENER', guarantee: 300, setLength: 30, order: 1 }
        ]
      },

      // FOLK/ACOUSTIC SHOWS
      {
        title: 'Acoustic Storytellers',
        date: new Date('2025-09-06'),
        description: 'Intimate folk and acoustic acts',
        lineup: [
          { artist: artists[36], billing: 'HEADLINER', guarantee: 650, setLength: 50, order: 3 },
          { artist: artists[37], billing: 'SUPPORT', guarantee: 400, setLength: 35, order: 2 },
          { artist: artists[38], billing: 'LOCAL_SUPPORT', guarantee: 200, setLength: 25, order: 1 }
        ]
      },

      // ELECTRONIC/SYNTH SHOWS
      {
        title: 'Synth Wave Night',
        date: new Date('2025-09-13'),
        description: 'Electronic and synth artists',
        lineup: [
          { artist: artists[39], billing: 'HEADLINER', guarantee: 750, setLength: 45, order: 4 },
          { artist: artists[40], billing: 'SUPPORT', guarantee: 500, setLength: 35, order: 3 },
          { artist: artists[41], billing: 'SUPPORT', guarantee: 350, setLength: 30, order: 2 },
          { artist: artists[42], billing: 'LOCAL_SUPPORT', guarantee: 150, setLength: 20, order: 1 }
        ]
      },

      // MIXED GENRE SHOWS
      {
        title: 'Genre Blender #1',
        date: new Date('2025-09-20'),
        description: 'Eclectic mix of styles',
        lineup: [
          { artist: artists[43], billing: 'HEADLINER', guarantee: 850, setLength: 50, order: 4 },
          { artist: artists[44], billing: 'CO_HEADLINER', guarantee: 650, setLength: 40, order: 3 },
          { artist: artists[45], billing: 'SUPPORT', guarantee: 450, setLength: 30, order: 2 },
          { artist: artists[46], billing: 'OPENER', guarantee: 200, setLength: 25, order: 1 }
        ]
      },
      {
        title: 'All Styles Accepted',
        date: new Date('2025-09-27'),
        description: 'Seven band genre mashup',
        lineup: [
          { artist: artists[47], billing: 'HEADLINER', guarantee: 1000, setLength: 45, order: 7 },
          { artist: artists[48], billing: 'CO_HEADLINER', guarantee: 800, setLength: 40, order: 6 },
          { artist: artists[49], billing: 'SUPPORT', guarantee: 600, setLength: 35, order: 5 },
          { artist: artists[0], billing: 'SUPPORT', guarantee: 450, setLength: 30, order: 4 },
          { artist: artists[1], billing: 'LOCAL_SUPPORT', guarantee: 250, setLength: 25, order: 3 },
          { artist: artists[2], billing: 'LOCAL_SUPPORT', guarantee: 150, setLength: 20, order: 2 },
          { artist: artists[3], billing: 'LOCAL_SUPPORT', guarantee: 100, setLength: 15, order: 1 }
        ]
      },

      // THEMED SHOWS
      {
        title: 'Halloween Horror Show',
        date: new Date('2025-10-31'),
        description: 'Spooky themed multi-band show',
        lineup: [
          { artist: artists[4], billing: 'HEADLINER', guarantee: 1200, setLength: 55, order: 5 },
          { artist: artists[5], billing: 'CO_HEADLINER', guarantee: 900, setLength: 45, order: 4 },
          { artist: artists[6], billing: 'SUPPORT', guarantee: 650, setLength: 35, order: 3 },
          { artist: artists[7], billing: 'SUPPORT', guarantee: 400, setLength: 30, order: 2 },
          { artist: artists[8], billing: 'LOCAL_SUPPORT', guarantee: 200, setLength: 25, order: 1 }
        ]
      },
      {
        title: 'New Years Eve Blowout',
        date: new Date('2025-12-31'),
        description: 'Epic year-end celebration',
        lineup: [
          { artist: artists[9], billing: 'HEADLINER', guarantee: 1500, setLength: 60, order: 6 },
          { artist: artists[10], billing: 'CO_HEADLINER', guarantee: 1200, setLength: 50, order: 5 },
          { artist: artists[11], billing: 'SUPPORT', guarantee: 800, setLength: 40, order: 4 },
          { artist: artists[12], billing: 'SUPPORT', guarantee: 600, setLength: 35, order: 3 },
          { artist: artists[13], billing: 'LOCAL_SUPPORT', guarantee: 350, setLength: 25, order: 2 },
          { artist: artists[14], billing: 'LOCAL_SUPPORT', guarantee: 200, setLength: 20, order: 1 }
        ]
      },

      // BENEFIT/FUNDRAISER SHOWS
      {
        title: 'Community Fundraiser Show',
        date: new Date('2025-11-15'),
        description: 'Benefit show for local causes',
        lineup: [
          { artist: artists[15], billing: 'HEADLINER', guarantee: 700, setLength: 45, order: 4 },
          { artist: artists[16], billing: 'SUPPORT', guarantee: 500, setLength: 35, order: 3 },
          { artist: artists[17], billing: 'SUPPORT', guarantee: 350, setLength: 30, order: 2 },
          { artist: artists[18], billing: 'LOCAL_SUPPORT', guarantee: 150, setLength: 25, order: 1 }
        ]
      },

      // MATINEE/ALL-AGES SHOWS
      {
        title: 'All-Ages Matinee #2',
        date: new Date('2025-06-28'),
        description: 'Family-friendly afternoon show',
        lineup: [
          { artist: artists[19], billing: 'HEADLINER', guarantee: 600, setLength: 40, order: 3 },
          { artist: artists[20], billing: 'SUPPORT', guarantee: 400, setLength: 30, order: 2 },
          { artist: artists[21], billing: 'LOCAL_SUPPORT', guarantee: 200, setLength: 25, order: 1 }
        ]
      },
      {
        title: 'Young Punks Showcase',
        date: new Date('2025-08-03'),
        description: 'Showcasing young talent',
        lineup: [
          { artist: artists[22], billing: 'HEADLINER', guarantee: 500, setLength: 35, order: 4 },
          { artist: artists[23], billing: 'SUPPORT', guarantee: 300, setLength: 30, order: 3 },
          { artist: artists[24], billing: 'LOCAL_SUPPORT', guarantee: 200, setLength: 25, order: 2 },
          { artist: artists[25], billing: 'LOCAL_SUPPORT', guarantee: 100, setLength: 20, order: 1 }
        ]
      }
    ];

    console.log(`\n🎭 Creating ${showScenarios.length} diverse shows for Lost Bag...\n`);

    let showCount = 0;
    let lineupCount = 0;

    for (const scenario of showScenarios) {
      try {
        // Create the show
        const show = await prisma.show.create({
          data: {
            title: scenario.title,
            venueId: lostBag.id,
            date: scenario.date,
            status: 'CONFIRMED',
            description: scenario.description,
            capacity: lostBag.capacity || 200,
            ageRestriction: 'ALL_AGES',
            createdById: systemUser.id,
            ticketPrice: 15 + Math.floor(Math.random() * 20), // $15-35
            doorsOpen: '19:00',
            showTime: '20:00',
            curfew: '23:30'
          }
        });

        console.log(`✅ Created show: ${scenario.title} (${scenario.date.toISOString().split('T')[0]})`);
        showCount++;

        // Create lineup entries for each artist
        for (const lineupItem of scenario.lineup) {
          if (lineupItem.artist && lineupItem.artist.id) {
            await prisma.showLineup.create({
              data: {
                showId: show.id,
                artistId: lineupItem.artist.id,
                billingPosition: lineupItem.billing,
                performanceOrder: lineupItem.order,
                setLength: lineupItem.setLength,
                guarantee: lineupItem.guarantee,
                status: 'CONFIRMED'
              }
            });
            lineupCount++;
          }
        }

        console.log(`   🎵 Added ${scenario.lineup.length} artists to lineup`);

      } catch (error) {
        console.error(`❌ Error creating show ${scenario.title}:`, error.message);
      }
    }

    console.log(`\n🎉 LOST BAG LINEUP BONANZA COMPLETE!`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Created ${showCount} diverse shows`);
    console.log(`   🎵 Added ${lineupCount} lineup positions`);
    console.log(`   🎭 Range: 3-7 artists per show`);
    console.log(`   💰 Guarantees: $100-$1500 per artist`);
    console.log(`   ⏱️  Set lengths: 15-65 minutes`);
    console.log(`   🎨 Genres: Punk, Metal, Indie, Folk, Electronic, Experimental`);
    console.log(`   📅 Dates: June 2025 - December 2025`);
    console.log(`\n🔥 Lost Bag now has MASSIVE booking diversity for testing!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLostBagLineups(); 