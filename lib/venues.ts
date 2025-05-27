import { promises as fs } from 'fs';
import path from 'path';
import { Venue, VenueType, AgeRestriction } from '../types/index';

const DB_FILE = path.join(process.cwd(), 'data', 'venues.json');

// Default sample venues
const defaultVenues: Venue[] = [
  {
    id: '1',
    name: "Joe's Basement",
    city: 'Portland',
    state: 'OR',
    country: 'USA',
    venueType: 'house-show',
    genres: ['punk', 'hardcore', 'folk'],
    capacity: 35,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: false,
      amps: false,
      piano: false,
    },
    features: ['basement', 'intimate'],
    pricing: {
      guarantee: 200,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'joe@example.com',
      phone: '555-0123',
      social: '@joesbasement',
      website: 'www.joesbasement.com',
    },
    images: ['/api/placeholder/house-show'],
    description: 'Intimate basement shows in a cozy living room setting. Perfect for acoustic and folk acts.',
    rating: 4.2,
    reviewCount: 15,
    totalRatings: 15,
    verified: true,
    lastUpdated: new Date().toISOString(),
    availability: [
      {
        startDate: new Date().toISOString().split('T')[0], // Today
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        notes: 'Available weekends only'
      }
    ],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: ['friday', 'saturday'],
    showsThisYear: 8,
    hasAccount: false,
    unavailableDates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2', 
    name: 'The Record Exchange',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    venueType: 'record-store',
    genres: ['indie', 'alternative', 'electronic'],
    capacity: 50,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: false,
      amps: true,
      piano: false,
    },
    features: ['retail', 'listening station'],
    pricing: {
      guarantee: 300,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'bookings@recordexchange.com',
      phone: '555-0124',
      social: '@recordexchange',
      website: 'www.recordexchange.com',
    },
    images: ['/api/placeholder/record-store'],
    description: 'In-store performances surrounded by vinyl. Great for intimate acoustic sets and listening parties.',
    rating: 4.5,
    reviewCount: 23,
    totalRatings: 23,
    verified: true,
    lastUpdated: new Date().toISOString(),
    availability: [
      {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
        notes: 'Thursday evenings preferred'
      }
    ],
    bookedDates: [
      {
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
        artistName: 'Indie Folk Duo',
        confirmed: true,
        notes: 'Album release show'
      }
    ],
    blackoutDates: [],
    preferredDays: ['thursday', 'friday'],
    showsThisYear: 12,
    hasAccount: true,
    unavailableDates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Vinyl Paradise',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    venueType: 'record-store',
    genres: ['indie', 'folk', 'jazz'],
    capacity: 30,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: false,
      amps: false,
      piano: false,
    },
    features: ['intimate', 'acoustic'],
    pricing: {
      guarantee: 150,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'shows@vinylparadise.com',
      phone: '555-0126',
      social: '@vinylparadise',
      website: 'vinylparadise.com',
    },
    images: ['/api/placeholder/record-store'],
    description: 'In-store acoustic performances and listening parties in a cozy record shop.',
    rating: 4.7,
    reviewCount: 18,
    totalRatings: 18,
    verified: true,
    lastUpdated: new Date().toISOString(),
    availability: [
      {
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now
        notes: 'Weekend afternoons preferred'
      }
    ],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: ['saturday', 'sunday'],
    showsThisYear: 15,
    hasAccount: true,
    unavailableDates: ['2024-01-27', '2024-02-10'], // A few booked dates
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: '4',
    name: 'The Underground',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    venueType: 'house-show',
    genres: ['punk', 'hardcore', 'metal'],
    capacity: 50,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: true,
      amps: true,
      piano: false,
    },
    features: ['basement', 'stage', 'bar'],
    pricing: {
      guarantee: 400,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'book@theunderground.nyc',
      phone: '555-0127',
      social: '@undergroundbrooklyn',
      website: 'www.theunderground.nyc',
    },
    images: ['/api/placeholder/house-show'],
    description: 'Legendary basement venue for punk and hardcore shows. Full backline available.',
    rating: 5.0,
    reviewCount: 42,
    totalRatings: 42,
    verified: true,
    lastUpdated: new Date().toISOString(),
    availability: [
      {
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        notes: 'Weekends primarily, some weeknights'
      }
    ],
    bookedDates: [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
        artistName: 'Local Hardcore Band',
        confirmed: true,
        notes: 'Regular monthly show'
      }
    ],
    blackoutDates: [],
    preferredDays: ['friday', 'saturday'],
    showsThisYear: 32,
    hasAccount: false, // No account - artists should email directly
    unavailableDates: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '5',
    name: 'VFW Post 1138',
    city: 'Richmond',
    state: 'VA',
    country: 'USA',
    venueType: 'vfw-hall',
    genres: ['punk', 'hardcore', 'metal', 'indie'],
    capacity: 150,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: false,
      amps: false,
      piano: false,
    },
    features: ['stage', 'bar', 'parking'],
    pricing: {
      guarantee: 300,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'events@vfw1138.org',
      phone: '804-555-0199',
      social: '@vfw1138',
      website: 'www.vfw1138.org',
    },
    images: ['/api/placeholder/vfw-hall'],
    description: 'Community-focused venue supporting local and touring acts. Great sound system.',
    rating: 4.6,
    reviewCount: 31,
    totalRatings: 31,
    verified: true,
    lastUpdated: new Date().toISOString(),
    availability: [
      {
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days from now
        notes: 'Available most weekends, some Friday nights'
      }
    ],
    bookedDates: [
      {
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks from now
        artistName: 'Touring Punk Band',
        confirmed: false,
        notes: 'Pending confirmation'
      }
    ],
    blackoutDates: ['2024-07-04'], // Independence Day
    preferredDays: ['friday', 'saturday'],
    showsThisYear: 28,
    hasAccount: true,
    unavailableDates: ['2024-01-20', '2024-01-21', '2024-02-03', '2024-02-17'], // Busier venue
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

// Initialize database file if it doesn't exist
async function initializeDB() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(DB_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Check if file exists
    await fs.access(DB_FILE);
  } catch (error) {
    // File doesn't exist, create it with default venues
    console.log('Venues file not found, using default venues');
    // In production, we can't write files, so we'll just use defaults
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    try {
      await saveVenues(defaultVenues);
    } catch (writeError) {
      console.warn('Could not write venues file, using defaults:', writeError);
    }
  }
}

// Load venues from JSON file
async function loadVenues(): Promise<Venue[]> {
  try {
    await initializeDB();
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const venues = JSON.parse(data);
    
    // Convert date strings back to Date objects
    return venues.map((venue: any) => ({
      ...venue,
      createdAt: new Date(venue.createdAt),
      updatedAt: new Date(venue.updatedAt),
    }));
  } catch (error) {
    console.warn('Error loading venues from file, using defaults:', error);
    return defaultVenues;
  }
}

// Save venues to JSON file
async function saveVenues(venues: Venue[]): Promise<void> {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(venues, null, 2));
  } catch (error) {
    console.error('Error saving venues:', error);
    // In production, we can't write files, so just log the error
    if (process.env.NODE_ENV === 'production') {
      console.warn('Cannot save venues in production environment');
      return;
    }
    throw error;
  }
}

export async function getVenues(filters?: {
  city?: string;
  genre?: string;
  venueType?: string;
  ageRestriction?: string;
}): Promise<Venue[]> {
  let venues = await loadVenues();

  if (filters?.city) {
    venues = venues.filter(v => 
      v.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }

  if (filters?.genre) {
    venues = venues.filter(v => 
      v.genres.includes(filters.genre!)
    );
  }

  if (filters?.venueType) {
    venues = venues.filter(v => 
      v.venueType === filters.venueType
    );
  }

  if (filters?.ageRestriction) {
    venues = venues.filter(v => 
      v.ageRestriction === filters.ageRestriction
    );
  }

  return venues;
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const venues = await loadVenues();
  return venues.find(v => v.id === id) || null;
}

export async function createVenue(venueData: Omit<Venue, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'totalRatings' | 'showsThisYear' | 'hasAccount' | 'unavailableDates'>): Promise<Venue> {
  if (!venueData.images || venueData.images.length === 0) {
    throw new Error('At least one image is required');
  }

  const venues = await loadVenues();
  
  const venue: Venue = {
    ...venueData,
    id: Date.now().toString(),
    rating: 0,
    reviewCount: 0,
    totalRatings: 0,
    showsThisYear: 0,
    hasAccount: true,
    unavailableDates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  venues.push(venue);
  await saveVenues(venues);
  
  return venue;
}

export async function updateVenue(id: string, updates: Partial<Venue>): Promise<Venue | null> {
  const venues = await loadVenues();
  const index = venues.findIndex(v => v.id === id);
  if (index === -1) return null;

  venues[index] = {
    ...venues[index],
    ...updates,
    updatedAt: new Date(),
  };

  await saveVenues(venues);
  return venues[index];
}

export async function deleteVenue(id: string): Promise<boolean> {
  const venues = await loadVenues();
  const index = venues.findIndex(v => v.id === id);
  if (index === -1) return false;

  venues.splice(index, 1);
  await saveVenues(venues);
  
  return true;
} 