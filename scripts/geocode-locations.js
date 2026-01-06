/**
 * Geocode Locations Script
 * 
 * Fetches coordinates for locations that don't have them using OpenStreetMap's Nominatim API.
 * Run with: node scripts/geocode-locations.js
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --limit=N    Only process N locations (default: all)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rate limit: Nominatim requires max 1 request per second
const RATE_LIMIT_MS = 1100;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Known coordinates for common cities (fallback when API fails)
const CITY_COORDS = {
  'providence, ri': { lat: 41.8240, lng: -71.4128 },
  'providence, rhode island': { lat: 41.8240, lng: -71.4128 },
  'boston, ma': { lat: 42.3601, lng: -71.0589 },
  'boston, massachusetts': { lat: 42.3601, lng: -71.0589 },
  'new york, ny': { lat: 40.7128, lng: -74.0060 },
  'brooklyn, ny': { lat: 40.6782, lng: -73.9442 },
  'philadelphia, pa': { lat: 39.9526, lng: -75.1652 },
  'baltimore, md': { lat: 39.2904, lng: -76.6122 },
  'washington, dc': { lat: 38.9072, lng: -77.0369 },
  'richmond, va': { lat: 37.5407, lng: -77.4360 },
  'chicago, il': { lat: 41.8781, lng: -87.6298 },
  'detroit, mi': { lat: 42.3314, lng: -83.0458 },
  'cleveland, oh': { lat: 41.4993, lng: -81.6944 },
  'pittsburgh, pa': { lat: 40.4406, lng: -79.9959 },
  'los angeles, ca': { lat: 34.0522, lng: -118.2437 },
  'san francisco, ca': { lat: 37.7749, lng: -122.4194 },
  'oakland, ca': { lat: 37.8044, lng: -122.2712 },
  'portland, or': { lat: 45.5152, lng: -122.6784 },
  'seattle, wa': { lat: 47.6062, lng: -122.3321 },
  'austin, tx': { lat: 30.2672, lng: -97.7431 },
  'denver, co': { lat: 39.7392, lng: -104.9903 },
  'atlanta, ga': { lat: 33.7490, lng: -84.3880 },
  'nashville, tn': { lat: 36.1627, lng: -86.7816 },
  'new orleans, la': { lat: 29.9511, lng: -90.0715 },
  'minneapolis, mn': { lat: 44.9778, lng: -93.2650 },
  'st. louis, mo': { lat: 38.6270, lng: -90.1994 },
  'kansas city, mo': { lat: 39.0997, lng: -94.5786 },
  'memphis, tn': { lat: 35.1495, lng: -90.0490 },
  'louisville, ky': { lat: 38.2527, lng: -85.7585 },
  'indianapolis, in': { lat: 39.7684, lng: -86.1581 },
  'columbus, oh': { lat: 39.9612, lng: -82.9988 },
  'cincinnati, oh': { lat: 39.1031, lng: -84.5120 },
  'milwaukee, wi': { lat: 43.0389, lng: -87.9065 },
  'tampa, fl': { lat: 27.9506, lng: -82.4572 },
  'miami, fl': { lat: 25.7617, lng: -80.1918 },
  'orlando, fl': { lat: 28.5383, lng: -81.3792 },
  'phoenix, az': { lat: 33.4484, lng: -112.0740 },
  'tucson, az': { lat: 32.2226, lng: -110.9747 },
  'albuquerque, nm': { lat: 35.0844, lng: -106.6504 },
  'salt lake city, ut': { lat: 40.7608, lng: -111.8910 },
  'las vegas, nv': { lat: 36.1699, lng: -115.1398 },
  'san diego, ca': { lat: 32.7157, lng: -117.1611 },
  'sacramento, ca': { lat: 38.5816, lng: -121.4944 },
  'raleigh, nc': { lat: 35.7796, lng: -78.6382 },
  'charlotte, nc': { lat: 35.2271, lng: -80.8431 },
  'hartford, ct': { lat: 41.7658, lng: -72.6734 },
  'new haven, ct': { lat: 41.3083, lng: -72.9279 },
  'albany, ny': { lat: 42.6526, lng: -73.7562 },
  'buffalo, ny': { lat: 42.8864, lng: -78.8784 },
  'rochester, ny': { lat: 43.1566, lng: -77.6088 },
  'worcester, ma': { lat: 42.2626, lng: -71.8023 },
  'cambridge, ma': { lat: 42.3736, lng: -71.1097 },
  'somerville, ma': { lat: 42.3876, lng: -71.0995 },
  'jersey city, nj': { lat: 40.7178, lng: -74.0431 },
  'newark, nj': { lat: 40.7357, lng: -74.1724 },
  'trenton, nj': { lat: 40.2206, lng: -74.7597 },
  'wilmington, de': { lat: 39.7391, lng: -75.5398 },
};

// State name to abbreviation mapping
const STATE_ABBREV = {
  'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar', 'california': 'ca',
  'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de', 'florida': 'fl', 'georgia': 'ga',
  'hawaii': 'hi', 'idaho': 'id', 'illinois': 'il', 'indiana': 'in', 'iowa': 'ia',
  'kansas': 'ks', 'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
  'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms', 'missouri': 'mo',
  'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv', 'new hampshire': 'nh', 'new jersey': 'nj',
  'new mexico': 'nm', 'new york': 'ny', 'north carolina': 'nc', 'north dakota': 'nd', 'ohio': 'oh',
  'oklahoma': 'ok', 'oregon': 'or', 'pennsylvania': 'pa', 'rhode island': 'ri', 'south carolina': 'sc',
  'south dakota': 'sd', 'tennessee': 'tn', 'texas': 'tx', 'utah': 'ut', 'vermont': 'vt',
  'virginia': 'va', 'washington': 'wa', 'west virginia': 'wv', 'wisconsin': 'wi', 'wyoming': 'wy',
  'district of columbia': 'dc'
};

async function geocode(city, state, country) {
  // Normalize state to abbreviation
  const stateLower = (state || '').toLowerCase().trim();
  const stateAbbrev = STATE_ABBREV[stateLower] || stateLower.substring(0, 2);
  const cityLower = (city || '').toLowerCase().trim();
  
  // Try multiple key formats
  const keys = [
    `${cityLower}, ${stateAbbrev}`,           // "boston, ma"
    `${cityLower}, ${stateLower}`,             // "boston, massachusetts"  
    `${cityLower}, ${stateLower.substring(0,2)}` // "boston, ma" (first 2 chars)
  ];
  
  for (const key of keys) {
    if (CITY_COORDS[key]) {
      return {
        latitude: CITY_COORDS[key].lat,
        longitude: CITY_COORDS[key].lng,
        displayName: `${city}, ${state} (local lookup)`
      };
    }
  }
  
  // Skip unknown/invalid cities
  if (city.toLowerCase() === 'unknown' || city.toLowerCase() === 'tbd') {
    return null;
  }

  // Try Nominatim API as fallback
  const query = encodeURIComponent(`${city}, ${state || ''}, ${country || 'USA'}`.replace(/,\s*,/g, ',').trim());
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DIYShowsBookingPlatform/1.0 (https://github.com/diy-booking; booking@diyshows.com)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!response.ok) {
      // If API fails, return null silently for this location
      return null;
    }
    
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    // Silently fail - we'll handle missing ones manually
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
  
  console.log('🗺️  Geocoding Locations Script');
  console.log('================================');
  if (dryRun) console.log('🔍 DRY RUN MODE - No changes will be made\n');
  
  // Find locations without coordinates
  const locations = await prisma.location.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Found ${locations.length} locations without coordinates\n`);
  
  if (locations.length === 0) {
    console.log('✅ All locations already have coordinates!');
    await prisma.$disconnect();
    return;
  }
  
  let updated = 0;
  let failed = 0;
  
  for (const location of locations) {
    const label = `${location.city}, ${location.stateProvince || ''}, ${location.country}`;
    process.stdout.write(`📍 ${label}... `);
    
    const result = await geocode(location.city, location.stateProvince, location.country);
    
    if (result) {
      console.log(`✅ (${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)})`);
      
      if (!dryRun) {
        await prisma.location.update({
          where: { id: location.id },
          data: {
            latitude: result.latitude,
            longitude: result.longitude
          }
        });
      }
      updated++;
    } else {
      console.log('❌ Not found');
      failed++;
    }
    
    // Rate limiting
    await sleep(RATE_LIMIT_MS);
  }
  
  console.log('\n================================');
  console.log(`📊 Results:`);
  console.log(`   ✅ Geocoded: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);
  if (dryRun) {
    console.log(`\n💡 Run without --dry-run to apply changes`);
  }
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

