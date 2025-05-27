const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDebugUsers() {
  try {
    console.log('🔧 Setting up debug users and artist ownership...');

    // Create Tom May and link to The Menzingers
    console.log('\n1. Setting up Tom May (The Menzingers)...');
    let tomMay = await prisma.user.findUnique({ where: { id: 'tom-may' } });
    if (!tomMay) {
      tomMay = await prisma.user.create({
        data: {
          id: 'tom-may',
          email: 'tom@themenzingers.com',
          username: 'Tom May',
          role: 'USER'
        }
      });
      console.log(`✅ Created Tom May user: ${tomMay.id}`);
    } else {
      console.log(`✅ Tom May user already exists: ${tomMay.id}`);
    }

    // Link Tom May to The Menzingers
    const menzingers = await prisma.artist.findUnique({ where: { id: '2' } });
    if (menzingers) {
      await prisma.artist.update({
        where: { id: '2' },
        data: { submittedById: tomMay.id }
      });
      console.log(`✅ Linked Tom May to The Menzingers`);
    }

    // Create Patti Smith and link to Patti Smith artist
    console.log('\n2. Setting up Patti Smith...');
    let pattiSmith = await prisma.user.findUnique({ where: { id: 'patti-smith' } });
    if (!pattiSmith) {
      pattiSmith = await prisma.user.create({
        data: {
          id: 'patti-smith',
          email: 'patti@pattismith.net',
          username: 'Patti Smith',
          role: 'USER'
        }
      });
      console.log(`✅ Created Patti Smith user: ${pattiSmith.id}`);
    } else {
      console.log(`✅ Patti Smith user already exists: ${pattiSmith.id}`);
    }

    // Link Patti Smith to Patti Smith artist
    const pattiArtist = await prisma.artist.findUnique({ where: { id: '3' } });
    if (pattiArtist) {
      await prisma.artist.update({
        where: { id: '3' },
        data: { submittedById: pattiSmith.id }
      });
      console.log(`✅ Linked Patti Smith to Patti Smith artist`);
    }

    // Create Laura Jane Grace and link to Against Me!
    console.log('\n3. Setting up Laura Jane Grace (Against Me!)...');
    let lauraJane = await prisma.user.findUnique({ where: { id: 'laura-jane-grace' } });
    if (!lauraJane) {
      lauraJane = await prisma.user.create({
        data: {
          id: 'laura-jane-grace',
          email: 'laura@againstme.com',
          username: 'Laura Jane Grace',
          role: 'USER'
        }
      });
      console.log(`✅ Created Laura Jane Grace user: ${lauraJane.id}`);
    } else {
      console.log(`✅ Laura Jane Grace user already exists: ${lauraJane.id}`);
    }

    // Link Laura Jane Grace to Against Me!
    const againstMe = await prisma.artist.findUnique({ where: { id: '1' } });
    if (againstMe) {
      await prisma.artist.update({
        where: { id: '1' },
        data: { submittedById: lauraJane.id }
      });
      console.log(`✅ Linked Laura Jane Grace to Against Me!`);
    }

    // Create Barry Johnson and link to Joyce Manor
    console.log('\n4. Setting up Barry Johnson (Joyce Manor)...');
    let barryJohnson = await prisma.user.findUnique({ where: { id: 'barry-johnson' } });
    if (!barryJohnson) {
      barryJohnson = await prisma.user.create({
        data: {
          id: 'barry-johnson',
          email: 'barry@joycemanor.org',
          username: 'Barry Johnson',
          role: 'USER'
        }
      });
      console.log(`✅ Created Barry Johnson user: ${barryJohnson.id}`);
    } else {
      console.log(`✅ Barry Johnson user already exists: ${barryJohnson.id}`);
    }

    // Link Barry Johnson to Joyce Manor
    const joyceManor = await prisma.artist.findUnique({ where: { id: '5' } });
    if (joyceManor) {
      await prisma.artist.update({
        where: { id: '5' },
        data: { submittedById: barryJohnson.id }
      });
      console.log(`✅ Linked Barry Johnson to Joyce Manor`);
    }

    // Create Brian Chippendale and link to Lightning Bolt (as second member)
    console.log('\n5. Setting up Brian Chippendale (Lightning Bolt)...');
    let brianChip = await prisma.user.findUnique({ where: { id: 'brian-chippendale' } });
    if (!brianChip) {
      brianChip = await prisma.user.create({
        data: {
          id: 'brian-chippendale',
          email: 'brian.chippendale@lightningbolt.com',
          username: 'Brian Chippendale',
          role: 'USER'
        }
      });
      console.log(`✅ Created Brian Chippendale user: ${brianChip.id}`);
    } else {
      console.log(`✅ Brian Chippendale user already exists: ${brianChip.id}`);
    }

    // Note: Lightning Bolt is already owned by Brian Gibson, so we'll need to implement 
    // a proper membership system for multiple members later

    console.log('\n📋 Verification - checking all artist ownership:');
    const artistsToCheck = [
      { name: 'Against Me!', id: '1' },
      { name: 'The Menzingers', id: '2' },
      { name: 'Patti Smith', id: '3' },
      { name: 'Joyce Manor', id: '5' },
      { name: 'Lightning Bolt', id: '1748101913848' }
    ];

    for (const artistInfo of artistsToCheck) {
      const artist = await prisma.artist.findUnique({
        where: { id: artistInfo.id },
        include: { submittedBy: true }
      });
      
      if (artist) {
        console.log(`🎵 ${artist.name}: Owner = ${artist.submittedBy?.username || 'None'}`);
      }
    }

    console.log('\n🎉 Debug user setup complete!');
  } catch (error) {
    console.error('❌ Error setting up debug users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDebugUsers(); 