import { NextRequest, NextResponse } from 'next/server';
import { Venue } from '../../../../types/index';

// Embedded venue data for reliable deployment
const venues: Venue[] = [
  {
    id: '1748094967307',
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
      phone: '503-555-0123',
      social: '@joesbasement',
      website: 'https://joes-basement.com',
    },
    availability: [
      {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        notes: 'Available year-round'
      }
    ],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: ['friday', 'saturday'],
    showsThisYear: 127,
    hasAccount: true,
    unavailableDates: [],
    description: 'Intimate basement venue perfect for punk and hardcore shows. All ages welcome.',
    images: ['/images/venues/joes-basement.jpg'],
    rating: 4.5,
    reviewCount: 23,
    verified: true,
    lastUpdated: '2024-12-15T10:30:00Z',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-12-15T10:30:00Z'),
  },
  {
    id: '2',
    name: 'The Underground',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    venueType: 'club',
    genres: ['electronic', 'techno', 'house'],
    capacity: 150,
    ageRestriction: '21+',
    equipment: {
      pa: true,
      mics: true,
      drums: false,
      amps: true,
      piano: false,
    },
    features: ['dance-floor', 'bar', 'lighting'],
    pricing: {
      guarantee: 800,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'booking@theunderground.com',
      phone: '206-555-0456',
      social: '@theundergroundseattle',
      website: 'https://theunderground.com',
    },
    availability: [
      {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        notes: 'Weekends only'
      }
    ],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: ['friday', 'saturday'],
    showsThisYear: 89,
    hasAccount: true,
    unavailableDates: [],
    description: 'Premier electronic music venue with state-of-the-art sound system.',
    images: ['/images/venues/underground.jpg'],
    rating: 4.7,
    reviewCount: 45,
    verified: true,
    lastUpdated: '2024-12-10T14:20:00Z',
    createdAt: new Date('2024-02-01T14:20:00Z'),
    updatedAt: new Date('2024-12-10T14:20:00Z'),
  },
  {
    id: '3',
    name: 'Acoustic Corner',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    venueType: 'coffee-shop',
    genres: ['folk', 'acoustic', 'indie'],
    capacity: 40,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: false,
      amps: false,
      piano: true,
    },
    features: ['intimate', 'coffee', 'acoustic-friendly'],
    pricing: {
      guarantee: 150,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'music@acousticcorner.com',
      phone: '512-555-0789',
      social: '@acousticcorneraustin',
      website: 'https://acousticcorner.com',
    },
    availability: [
      {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        notes: 'Available most days'
      }
    ],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: ['thursday', 'friday', 'saturday', 'sunday'],
    showsThisYear: 156,
    hasAccount: true,
    unavailableDates: [],
    description: 'Cozy coffee shop perfect for acoustic performances and intimate shows.',
    images: ['/images/venues/acoustic-corner.jpg'],
    rating: 4.3,
    reviewCount: 67,
    verified: true,
    lastUpdated: '2024-12-05T09:15:00Z',
    createdAt: new Date('2024-03-10T09:15:00Z'),
    updatedAt: new Date('2024-12-05T09:15:00Z'),
  },
  {
    id: '4',
    name: 'The Warehouse',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    venueType: 'warehouse',
    genres: ['punk', 'metal', 'hardcore'],
    capacity: 300,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: true,
      amps: true,
      piano: false,
    },
    features: ['large-space', 'high-ceiling', 'industrial'],
    pricing: {
      guarantee: 1200,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'shows@thewarehouse.nyc',
      phone: '718-555-0321',
      social: '@thewarehousenyc',
      website: 'https://thewarehouse.nyc',
    },
    availability: [
      {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        notes: 'Available all week'
      }
    ],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: ['friday', 'saturday'],
    showsThisYear: 203,
    hasAccount: true,
    unavailableDates: [],
    description: 'Large warehouse space perfect for high-energy punk and metal shows.',
    images: ['/images/venues/warehouse.jpg'],
    rating: 4.6,
    reviewCount: 89,
    verified: true,
    lastUpdated: '2024-11-30T16:45:00Z',
    createdAt: new Date('2024-01-20T16:45:00Z'),
    updatedAt: new Date('2024-11-30T16:45:00Z'),
  },
  {
    id: '5',
    name: 'Sunset Amphitheater',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    venueType: 'park',
    genres: ['rock', 'indie', 'alternative'],
    capacity: 500,
    ageRestriction: 'all-ages',
    equipment: {
      pa: true,
      mics: true,
      drums: true,
      amps: true,
      piano: true,
    },
    features: ['outdoor', 'sunset-views', 'large-stage'],
    pricing: {
      guarantee: 2000,
      door: true,
      merchandise: true,
    },
    contact: {
      email: 'booking@sunsetamphitheater.com',
      phone: '323-555-0654',
      social: '@sunsetamphitheater',
      website: 'https://sunsetamphitheater.com',
    },
    availability: [
      {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        notes: 'Weekends only'
      }
    ],
    bookedDates: [],
    blackoutDates: [],
    preferredDays: ['saturday', 'sunday'],
    showsThisYear: 78,
    hasAccount: true,
    unavailableDates: [],
    description: 'Beautiful outdoor amphitheater with stunning sunset views.',
    images: ['/images/venues/sunset-amphitheater.jpg'],
    rating: 4.8,
    reviewCount: 34,
    verified: true,
    lastUpdated: '2024-12-01T11:30:00Z',
    createdAt: new Date('2024-04-05T11:30:00Z'),
    updatedAt: new Date('2024-12-01T11:30:00Z'),
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const genre = searchParams.get('genre');
    const venueType = searchParams.get('venueType');
    const capacity = searchParams.get('capacity');
    const ageRestriction = searchParams.get('ageRestriction');
    
    let filteredVenues = [...venues];
    
    console.log(`🏢 API: Fetching venues. Total: ${filteredVenues.length}`);
    
    // Apply filters
    if (city) {
      filteredVenues = filteredVenues.filter(venue => 
        venue.city.toLowerCase().includes(city.toLowerCase())
      );
      console.log(`🏢 API: After city filter: ${filteredVenues.length} venues`);
    }
    
    if (state) {
      filteredVenues = filteredVenues.filter(venue => 
        venue.state.toLowerCase() === state.toLowerCase()
      );
      console.log(`🏢 API: After state filter: ${filteredVenues.length} venues`);
    }
    
    if (genre) {
      filteredVenues = filteredVenues.filter(venue =>
        venue.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
      console.log(`🏢 API: After genre filter: ${filteredVenues.length} venues`);
    }
    
    if (venueType) {
      filteredVenues = filteredVenues.filter(venue =>
        venue.venueType === venueType
      );
      console.log(`🏢 API: After venue type filter: ${filteredVenues.length} venues`);
    }
    
    if (capacity) {
      const capacityNum = parseInt(capacity);
      filteredVenues = filteredVenues.filter(venue =>
        venue.capacity >= capacityNum
      );
      console.log(`🏢 API: After capacity filter: ${filteredVenues.length} venues`);
    }
    
    if (ageRestriction) {
      filteredVenues = filteredVenues.filter(venue =>
        venue.ageRestriction === ageRestriction
      );
      console.log(`🏢 API: After age restriction filter: ${filteredVenues.length} venues`);
    }
    
    // Sort by rating and total shows
    filteredVenues.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.showsThisYear - a.showsThisYear;
    });
    
    console.log(`🏢 API: Final result: ${filteredVenues.length} venues`);
    
    return NextResponse.json(filteredVenues);
  } catch (error) {
    console.error('Error in GET /api/venues:', error);
    return NextResponse.json(venues); // Return all venues as fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production, we don't support creating venues via API
    return NextResponse.json(
      { error: 'Creating venues not supported in this deployment' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error in POST /api/venues:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 