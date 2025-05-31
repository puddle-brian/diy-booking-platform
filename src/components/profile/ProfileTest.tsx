import React from 'react';
import ProfileLayout from './ProfileLayout';
import { ProfileContext, Artist, Venue } from './ProfileModules';

// Mock data for testing
const mockArtist: Artist = {
  id: '1748101913848',
  name: 'Lightning Bolt',
  city: 'Providence',
  state: 'Rhode Island',
  country: 'USA',
  images: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop'
  ],
  description: 'Experimental noise rock duo from Providence, RI. Known for intense live performances and innovative use of bass and drums. We\'ve been pushing the boundaries of underground music since 1994.',
  rating: 4.7,
  contact: {
    email: 'booking@lightningbolt.com',
    phone: '+1 (401) 555-0123',
    website: 'https://lightningbolt.com',
    social: 'laserboeast.com'
  },
  artistType: 'duo',
  genres: ['noise rock', 'experimental', 'math rock', 'avant-garde'],
  tourStatus: 'active',
  yearFormed: 1994,
  members: 2,
  expectedDraw: '200-500',
  equipment: {
    needsPA: true,
    needsMics: true,
    needsDrums: false,
    needsAmps: true,
    acoustic: false
  }
};

const mockVenue: Venue = {
  id: 'venue-123',
  name: 'The Basement',
  city: 'Portland',
  state: 'Oregon',
  country: 'USA',
  images: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
  ],
  description: 'Intimate DIY venue in a converted basement. All-ages shows, great sound system, and a welcoming community atmosphere.',
  rating: 4.2,
  contact: {
    email: 'shows@thebasement.com',
    phone: '+1 (503) 555-0456',
    website: 'https://thebasement.com'
  },
  venueType: 'house-show',
  capacity: 75,
  ageRestriction: 'all-ages',
  genres: ['punk', 'indie', 'experimental', 'hardcore'],
  equipment: {
    pa: true,
    mics: true,
    drums: true,
    amps: false,
    piano: false
  },
  features: ['merch table', 'green room', 'parking', 'accessible'],
  pricing: {
    guarantee: 200,
    door: true,
    merchandise: true
  },
  streetAddress: '1234 SE Division St',
  neighborhood: 'Division/Richmond',
  postalCode: '97202'
};

const mockMembers = [
  {
    id: 'member-1',
    name: 'Brian Gibson',
    role: 'Owner',
    email: 'brian@lightningbolt.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    unreadCount: 2 // Has unread messages
  },
  {
    id: 'member-2', 
    name: 'Brian Chippendale',
    role: 'Member',
    email: 'chip@lightningbolt.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    unreadCount: 0 // No unread messages
  },
  {
    id: 'member-3',
    name: 'Sarah Johnson',
    role: 'Manager',
    email: 'sarah@lightningbolt.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    unreadCount: 5 // Has several unread messages
  },
  {
    id: 'member-4',
    name: 'Mike Chen',
    role: 'Sound Tech',
    email: 'mike@lightningbolt.com',
    unreadCount: 1 // Has one unread message
    // No avatar - will show initials
  },
  {
    id: 'member-5',
    name: 'Alex Rivera',
    role: 'Photographer',
    email: 'alex@lightningbolt.com',
    unreadCount: 12 // Many unread messages (will show 9+)
  },
  {
    id: 'member-6',
    name: 'Jordan Kim',
    role: 'Merch',
    email: 'jordan@lightningbolt.com',
    unreadCount: 3 // Some unread messages
  }
];

interface ProfileTestProps {
  entityType?: 'artist' | 'venue';
  viewerType?: 'public' | 'artist' | 'venue' | 'admin';
  isOwner?: boolean;
}

export const ProfileTest: React.FC<ProfileTestProps> = ({
  entityType = 'artist',
  viewerType = 'public',
  isOwner = false
}) => {
  const entity = entityType === 'artist' ? mockArtist : mockVenue;
  
  const context: ProfileContext = {
    viewerType,
    entityType,
    isOwner,
    canEdit: isOwner || viewerType === 'admin'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Controls */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            🧪 Profile System Test
          </h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-yellow-700">
              <strong>Entity:</strong> {entityType} ({entity.name})
            </span>
            <span className="text-yellow-700">
              <strong>Viewer:</strong> {viewerType}
            </span>
            <span className="text-yellow-700">
              <strong>Owner:</strong> {isOwner ? 'Yes' : 'No'}
            </span>
            <span className="text-yellow-700">
              <strong>Can Edit:</strong> {context.canEdit ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Layout */}
      <ProfileLayout
        entity={entity}
        context={context}
        members={mockMembers}
      >
        {/* Custom test content */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ✨ Custom Content Area
          </h3>
          <p className="text-blue-700 text-sm">
            This demonstrates how you can add custom content to any profile using the children prop.
            Perfect for announcements, special features, or entity-specific content.
          </p>
        </div>
      </ProfileLayout>
    </div>
  );
};

// Test page component that lets you switch between different scenarios
export const ProfileTestPage: React.FC = () => {
  const [entityType, setEntityType] = React.useState<'artist' | 'venue'>('artist');
  const [viewerType, setViewerType] = React.useState<'public' | 'artist' | 'venue' | 'admin'>('public');
  const [isOwner, setIsOwner] = React.useState(false);

  return (
    <div>
      {/* Test Controls */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-xl font-bold mb-4">🎸 Modular Profile System Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Entity Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Entity Type:</label>
              <select 
                value={entityType} 
                onChange={(e) => setEntityType(e.target.value as 'artist' | 'venue')}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
              >
                <option value="artist">Artist (Lightning Bolt)</option>
                <option value="venue">Venue (The Basement)</option>
              </select>
            </div>

            {/* Viewer Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Viewer Type:</label>
              <select 
                value={viewerType} 
                onChange={(e) => setViewerType(e.target.value as any)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
              >
                <option value="public">Public User</option>
                <option value="artist">Artist User</option>
                <option value="venue">Venue User</option>
                <option value="admin">Admin User</option>
              </select>
            </div>

            {/* Owner Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Owner Status:</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isOwner}
                  onChange={(e) => setIsOwner(e.target.checked)}
                  className="mr-2"
                />
                <span>Is Owner/Member</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Test */}
      <ProfileTest 
        entityType={entityType}
        viewerType={viewerType}
        isOwner={isOwner}
      />
    </div>
  );
};

export default ProfileTest; 