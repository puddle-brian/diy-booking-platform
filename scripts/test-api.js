const https = require('http');

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // Test the user API endpoint
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/debug-lidz-bierenday',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.memberships) {
            console.log(`\n✅ User has ${parsed.memberships.length} memberships:`);
            parsed.memberships.forEach(m => {
              console.log(`  - ${m.entityType}: ${m.entityName} (${m.role})`);
            });
          } else {
            console.log('❌ No memberships found in response');
          }
        } catch (e) {
          console.log('❌ Could not parse JSON response');
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
    });

    req.end();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Wait a bit for server to start, then test
setTimeout(testAPI, 3000); 