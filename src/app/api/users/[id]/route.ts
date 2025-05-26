import { NextRequest, NextResponse } from 'next/server';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: string;
  profileType?: 'artist' | 'venue';
  profileId?: string;
  joinedAt: string;
  memberships: {
    entityType: 'artist' | 'venue';
    entityId: string;
    entityName: string;
    role: string;
    joinedAt: string;
  }[];
}

// Mock user profiles
const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    name: 'John Venue Owner',
    email: 'john@theunderground.com',
    bio: 'Venue owner and music enthusiast. Always looking for great bands to book.',
    role: 'venue_owner',
    profileType: 'venue',
    profileId: '1748094967307',
    joinedAt: '2023-06-15T00:00:00Z',
    memberships: [
      {
        entityType: 'venue',
        entityId: '1748094967307',
        entityName: 'Lost Bag',
        role: 'owner',
        joinedAt: '2023-06-15T00:00:00Z'
      }
    ]
  },
  {
    id: 'user-2',
    name: 'Sarah Musician',
    email: 'sarah@midnightechoes.com',
    bio: 'Lead vocalist and songwriter for The Midnight Echoes. Love connecting with venues and other musicians.',
    role: 'artist',
    profileType: 'artist',
    profileId: '1748101913848',
    joinedAt: '2023-08-20T00:00:00Z',
    memberships: [
      {
        entityType: 'artist',
        entityId: '1748101913848',
        entityName: 'lightning bolt',
        role: 'member',
        joinedAt: '2023-08-20T00:00:00Z'
      }
    ]
  },
  {
    id: 'user-3',
    name: 'Mike Sound Tech',
    email: 'mike@soundtech.com',
    bio: 'Professional sound engineer with 10+ years experience.',
    role: 'sound_tech',
    joinedAt: '2023-09-10T00:00:00Z',
    memberships: [
      {
        entityType: 'venue',
        entityId: '1748094967307',
        entityName: 'Lost Bag',
        role: 'sound-tech',
        joinedAt: '2023-09-10T00:00:00Z'
      }
    ]
  },
  {
    id: 'brian-gibson',
    name: 'Brian Gibson',
    email: 'brian@lightningbolt.com',
    bio: 'Bassist for Lightning Bolt. Experimental noise rock duo from Providence, RI.',
    role: 'user',
    profileType: 'artist',
    profileId: '1748101913848',
    joinedAt: '2024-01-15T00:00:00Z',
    memberships: [
      {
        entityType: 'artist',
        entityId: '1748101913848',
        entityName: 'lightning bolt',
        role: 'member',
        joinedAt: '2024-01-15T00:00:00Z'
      }
    ]
  },
  {
    id: 'lidz-bierenday',
    name: 'Lidz Bierenday',
    email: 'lidz@lostbag.com',
    bio: 'Staff member at Lost Bag. Passionate about supporting local music and creating inclusive spaces for artists.',
    role: 'user',
    joinedAt: '2024-02-01T00:00:00Z',
    memberships: [
      {
        entityType: 'venue',
        entityId: '1748094967307',
        entityName: 'Lost Bag',
        role: 'staff',
        joinedAt: '2024-02-01T00:00:00Z'
      }
    ]
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find user by ID
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 