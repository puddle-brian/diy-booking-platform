const fs = require('fs');
const path = require('path');

// Mapping from CSV venue types to our venue types
const VENUE_TYPE_MAPPING = {
  'bar': 'bar',
  'club': 'club', 
  'theater': 'theater',
  'warehouse': 'warehouse',
  'lounge': 'club',
  'chapel': 'church',
  'ballroom': 'community-space',
  'bowling': 'other',
  'restaurant': 'restaurant',
  'hotel': 'other',
  'museum': 'gallery',
  'cafe': 'coffee-shop',
  'cinema': 'other',
  'gallery': 'gallery'
};

// Better CSV parser that handles quoted fields properly
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Start or end quote
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => {
    const trimmed = line.trim();
    // Skip empty lines and the header line that appears mid-file
    return trimmed && !trimmed.startsWith('name,address,city,state,zip');
  });
  
  console.log(`Processing ${lines.length} lines from CSV`);
  
  const venues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    
    // Debug first few lines
    if (i < 3) {
      console.log(`Line ${i + 1}:`, line.substring(0, 100) + '...');
      console.log(`Parsed values:`, values.slice(0, 5)); // Show first 5 fields
    }
    
    // Expected CSV structure based on the data:
    // name,address,city,state,zip,phone,email,website,capacity,venue_type,diy_friendly,all_ages,genres,booking_contact,notes,source
    if (values.length >= 16) {
      const venue = {
        name: values[0] || 'Unknown Venue',
        address: values[1] || '',
        city: values[2] || '',
        state: values[3] || '',
        zip: values[4] || '',
        phone: values[5] || '',
        email: values[6] || '',
        website: values[7] || '',
        capacity: values[8] || '100',
        venue_type: values[9] || 'other',
        diy_friendly: values[10] || 'false',
        all_ages: values[11] || 'false',
        genres: values[12] || 'indie rock',
        booking_contact: values[13] || '',
        notes: values[14] || '',
        source: values[15] || 'imported'
      };
      
      venues.push(venue);
    } else {
      console.log(`Skipping line ${i + 1} - not enough fields (${values.length}):`, line.substring(0, 100));
    }
  }
  
  return venues;
}

function convertToVenue(csvRow, index) {
  // Generate ID
  const id = (Date.now() + index).toString();
  
  // Map venue type
  const venueType = VENUE_TYPE_MAPPING[csvRow.venue_type] || 'other';
  
  // Parse genres - remove quotes and split
  let genres = ['indie rock'];
  if (csvRow.genres) {
    const genreString = csvRow.genres.replace(/['"]/g, '');
    genres = genreString.split(',').map(g => g.trim()).filter(g => g);
  }
  
  // Parse age restriction
  let ageRestriction = 'all-ages';
  if (csvRow.all_ages === 'false') {
    ageRestriction = '21+'; // Default for venues that aren't all-ages
  }
  
  // Parse capacity
  const capacity = parseInt(csvRow.capacity) || 100;
  
  // Parse DIY friendly for equipment assumptions
  const diyFriendly = csvRow.diy_friendly === 'true';
  
  // Use booking contact or email
  const contactEmail = csvRow.booking_contact || csvRow.email || '';
  
  const venue = {
    id,
    name: csvRow.name || 'Unknown Venue',
    city: csvRow.city || '',
    state: csvRow.state || '',
    country: 'USA', // All venues in CSV appear to be US/Canada
    venueType,
    genres,
    capacity,
    ageRestriction,
    equipment: {
      pa: diyFriendly, // Assume DIY venues have PA
      mics: diyFriendly,
      drums: false, // Conservative assumption
      amps: false,
      piano: venueType === 'theater' || venueType === 'church'
    },
    features: diyFriendly ? ['DIY Friendly'] : [],
    pricing: {
      guarantee: 0, // Unknown
      door: true,
      merchandise: true
    },
    contact: {
      email: contactEmail,
      phone: csvRow.phone || '',
      social: '',
      website: csvRow.website || ''
    },
    images: [`/api/placeholder/${venueType}`], // Use placeholder
    description: csvRow.notes || `${venueType} venue in ${csvRow.city}, ${csvRow.state}`,
    rating: 0,
    reviewCount: 0,
    verified: false,
    lastUpdated: new Date().toISOString(),
    availability: [],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: [],
    showsThisYear: 0,
    hasAccount: false,
    unavailableDates: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Debug first few venues
  if (index < 3) {
    console.log(`\nConverted venue ${index + 1}:`);
    console.log(`Name: ${venue.name}`);
    console.log(`City: ${venue.city}, State: ${venue.state}`);
    console.log(`Type: ${venue.venueType}`);
    console.log(`Capacity: ${venue.capacity}`);
    console.log(`Email: ${venue.contact.email}`);
  }
  
  return venue;
}

async function importVenues() {
  try {
    console.log('Reading CSV file...');
    const csvPath = path.join(__dirname, '..', 'testvenuedata.txt');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    console.log(`CSV file size: ${csvContent.length} characters`);
    
    console.log('Parsing CSV data...');
    const csvData = parseCSV(csvContent);
    console.log(`Found ${csvData.length} venues in CSV`);
    
    // Convert to venue objects
    const venues = csvData.map((row, index) => convertToVenue(row, index));
    
    // Read existing venues
    const venuesPath = path.join(__dirname, '..', 'data', 'venues.json');
    let existingVenues = [];
    
    if (fs.existsSync(venuesPath)) {
      console.log('Reading existing venues...');
      const existingData = fs.readFileSync(venuesPath, 'utf8');
      existingVenues = JSON.parse(existingData);
      console.log(`Found ${existingVenues.length} existing venues`);
    }
    
    // Filter out duplicates by name and city
    const existingNames = new Set(
      existingVenues.map(v => `${v.name.toLowerCase()}-${v.city.toLowerCase()}`)
    );
    
    const newVenues = venues.filter(venue => {
      const key = `${venue.name.toLowerCase()}-${venue.city.toLowerCase()}`;
      return !existingNames.has(key) && venue.name !== 'Unknown Venue';
    });
    
    console.log(`${newVenues.length} new venues to import`);
    
    if (newVenues.length === 0) {
      console.log('No new venues to import. All venues already exist or have parsing issues.');
      return;
    }
    
    // Remove existing "Unknown Venue" entries first
    const cleanedExisting = existingVenues.filter(v => v.name !== 'Unknown Venue');
    console.log(`Removed ${existingVenues.length - cleanedExisting.length} "Unknown Venue" entries`);
    
    // Combine with existing venues
    const allVenues = [...cleanedExisting, ...newVenues];
    
    // Write back to file
    fs.writeFileSync(venuesPath, JSON.stringify(allVenues, null, 2));
    
    console.log(`✅ Successfully imported ${newVenues.length} venues!`);
    console.log(`📊 Total venues: ${allVenues.length}`);
    
    // Show some sample imports
    console.log('\n📍 Sample imported venues:');
    newVenues.slice(0, 5).forEach(venue => {
      console.log(`  • ${venue.name} (${venue.city}, ${venue.state}) - ${venue.venueType}`);
    });
    
  } catch (error) {
    console.error('❌ Error importing venues:', error);
  }
}

// Run the import
importVenues(); 