const { PrismaClient } = require('@prisma/client');
const { backupDatabase } = require('./backup-database');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function safetyCheck(operation = 'unknown') {
  try {
    console.log(`🛡️  SAFETY CHECK for operation: ${operation}`);
    console.log('=' .repeat(50));

    // 1. Check current data state
    const counts = {
      users: await prisma.user.count(),
      artists: await prisma.artist.count(),
      venues: await prisma.venue.count(),
      shows: await prisma.show.count(),
      tourRequests: await prisma.tourRequest.count(),
      bids: await prisma.bid.count(),
      memberships: await prisma.membership.count()
    };

    console.log('📊 Current database state:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`   TOTAL: ${totalRecords} records`);

    // 2. Check if this looks like production data
    const hasProductionData = (
      counts.users > 5 || 
      counts.shows > 10 || 
      counts.bids > 15
    );

    if (hasProductionData) {
      console.log('⚠️  WARNING: This appears to contain production data!');
    }

    // 3. Create automatic backup before risky operations
    const riskyOperations = ['delete', 'reset', 'migrate', 'seed'];
    const isRisky = riskyOperations.some(op => operation.toLowerCase().includes(op));

    if (isRisky && totalRecords > 0) {
      console.log('🔄 Creating automatic backup before risky operation...');
      const backupFile = await backupDatabase();
      console.log(`✅ Backup created: ${backupFile}`);
      
      // Store the backup reference
      const safetyLog = {
        timestamp: new Date().toISOString(),
        operation,
        backupFile,
        recordCounts: counts,
        totalRecords
      };
      
      const logFile = path.join(__dirname, '..', 'backups', 'safety-log.json');
      let logs = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
      logs.push(safetyLog);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    }

    // 4. Show recent backups
    const backupDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 3);

      if (backups.length > 0) {
        console.log('\\n📁 Recent backups:');
        backups.forEach(backup => {
          const stats = fs.statSync(path.join(backupDir, backup));
          console.log(`   ${backup} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
        });
      }
    }

    console.log('\\n✅ Safety check completed');
    return { safe: true, backupCreated: isRisky, counts };

  } catch (error) {
    console.error('❌ Safety check failed:', error);
    return { safe: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const operation = process.argv[2] || 'manual-check';
  safetyCheck(operation);
}

module.exports = { safetyCheck }; 