import React from 'react';
import {
  ProfileContext,
  Artist,
  Venue,
  ProfileHeader,
  BookingStatusCard,
  ContactEssentialCard,
  DetailCard,
  ProfileCard,
  BookingContactCard
} from './ProfileModules';
import TabbedTourItinerary from '../TabbedTourItinerary';
import MediaSection from '../MediaSection';
import TeamManagementCard from './TeamManagementCard';

interface ProfileLayoutProps {
  entity: Artist | Venue;
  context: ProfileContext;
  members?: any[];
  loadingMembers?: boolean;
  onMembersUpdate?: () => void;
  children?: React.ReactNode;
  // Booking-related props
  onBookingInquiry?: () => void;
  onTemplateManage?: () => void;
  hasSentInquiry?: boolean;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({
  entity,
  context,
  members = [],
  loadingMembers = false,
  onMembersUpdate = () => {},
  children,
  // Booking-related props
  onBookingInquiry,
  onTemplateManage,
  hasSentInquiry
}) => {
  const isArtist = context.entityType === 'artist';
  const artist = isArtist ? entity as Artist : null;
  const venue = !isArtist ? entity as Venue : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header - Hero section (without team thumbnails) */}
        <ProfileHeader 
          entity={entity} 
          context={context} 
          members={[]} // Don't pass members to avoid showing thumbnails in header
          onTemplateManage={onTemplateManage}
        />

        {/* Team Management - MOVED ABOVE tour itinerary for better hierarchy */}
        <div className="mb-6">
          <TeamManagementCard
            key={`team-${entity.id}-${context.entityType}`}
            entityType={context.entityType}
            entityId={entity.id}
            entityName={entity.name}
            members={members}
            loadingMembers={loadingMembers}
            canManageTeam={context.canEdit}
            onMembersUpdate={onMembersUpdate}
          />
        </div>

        {/* Primary Content Grid - Most important functionality */}
        <div className="grid gap-6 mb-8">
          {/* Tour Dates/Booking - HIGHEST PRIORITY */}
          <TabbedTourItinerary
            {...(isArtist ? { artistId: entity.id, artistName: entity.name } : { venueId: entity.id, venueName: entity.name })}
            title="Show Dates"
            showTitle={true}
            editable={context.canEdit}
            viewerType={context.viewerType === 'public' ? 'public' : context.entityType}
          />
        </div>

        {/* Secondary Content Grid - Important supporting information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Contact & Essential Info - Always show (useful for everyone) */}
          <ContactEssentialCard 
            entity={entity} 
            context={context}
          />

          {/* Quick Actions - Different content for owners vs visitors */}
          <ProfileCard priority="secondary" size="medium">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {context.isOwner ? (
                // Actions for entity owners viewing their own profile
                <>
                  {context.canEdit && (
                    <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                      Manage Availability
                    </button>
                  )}
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                    View Analytics
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                    Download Press Kit
                  </button>
                </>
              ) : (
                // Actions for visitors viewing someone else's profile
                <>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                    View Full Calendar
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                    Export Contact Info
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                    {isArtist ? 'Request Booking' : 'Invite to Play'}
                  </button>
                </>
              )}
            </div>
          </ProfileCard>
        </div>

        {/* Media Section - Visual content */}
        <div className="mb-6">
          <ProfileCard priority="secondary" size="medium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Media & Links</h3>
              {context.canEdit && (
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Manage Media
                </button>
              )}
            </div>
            
            <MediaSection
              entityId={entity.id}
              entityType={context.entityType}
              className="w-full"
              compact={false}
            />
          </ProfileCard>
        </div>

        {/* Tertiary Content Grid - Detailed information */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Description */}
          <DetailCard 
            title="About" 
            defaultExpanded={true}
            priority="secondary"
            className="md:col-span-2 lg:col-span-2"
          >
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {entity.description || `No description available for ${entity.name}.`}
            </p>
          </DetailCard>

          {/* Genres */}
          <DetailCard 
            title={isArtist ? "Genres" : "Preferred Genres"} 
            defaultExpanded={true}
            priority="secondary"
          >
            {(isArtist ? artist?.genres : venue?.genres) && (isArtist ? artist?.genres : venue?.genres)!.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(isArtist ? artist?.genres : venue?.genres)!.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No genres specified</p>
            )}
          </DetailCard>
        </div>

        {/* Entity-Specific Details */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Artist-specific details */}
          {isArtist && artist && (
            <>
              <DetailCard title="Equipment Needs" priority="secondary">
                <div className="space-y-2">
                  {Object.entries(artist.equipment).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-gray-400'}`}>
                        {value ? 'Needed' : 'Not needed'}
                      </span>
                    </div>
                  ))}
                </div>
              </DetailCard>

              <DetailCard title="Tour Info" priority="secondary">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{artist.tourStatus?.replace('-', ' ')}</span>
                  </div>
                  {artist.members && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Members:</span>
                      <span className="font-medium">{artist.members}</span>
                    </div>
                  )}
                  {artist.expectedDraw && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Draw:</span>
                      <span className="font-medium">{artist.expectedDraw}</span>
                    </div>
                  )}
                  {artist.yearFormed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Formed:</span>
                      <span className="font-medium">{artist.yearFormed}</span>
                    </div>
                  )}
                </div>
              </DetailCard>
            </>
          )}

          {/* Venue-specific details */}
          {!isArtist && venue && (
            <>
              <DetailCard title="Equipment Available" priority="secondary">
                <div className="space-y-2">
                  {Object.entries(venue.equipment).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {key === 'pa' ? 'PA System' : key.charAt(0).toUpperCase() + key.slice(1)}:
                      </span>
                      <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-gray-400'}`}>
                        {value ? 'Available' : 'Not available'}
                      </span>
                    </div>
                  ))}
                </div>
              </DetailCard>

              <DetailCard title="Pricing & Policies" priority="secondary">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Typical Guarantee:</span>
                    <span className="font-medium">${venue.pricing.guarantee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age Restriction:</span>
                    <span className="font-medium capitalize">{venue.ageRestriction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Door Split:</span>
                    <span className="font-medium">{venue.pricing.door ? 'Available' : 'Not available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Merch Sales:</span>
                    <span className="font-medium">{venue.pricing.merchandise ? 'Allowed' : 'Not allowed'}</span>
                  </div>
                </div>
              </DetailCard>

              {/* Venue Features */}
              {venue.features && venue.features.length > 0 && (
                <DetailCard title="Venue Features" priority="secondary">
                  <div className="flex flex-wrap gap-2">
                    {venue.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </DetailCard>
              )}

              {/* Address Information */}
              {venue.streetAddress && (
                <DetailCard title="Location Details" priority="secondary">
                  <div className="space-y-1 text-sm">
                    <div className="text-gray-700">{venue.streetAddress}</div>
                    <div className="text-gray-700">
                      {entity.city}, {entity.state} {venue.postalCode}
                    </div>
                    {venue.neighborhood && (
                      <div className="text-gray-500">({venue.neighborhood})</div>
                    )}
                  </div>
                </DetailCard>
              )}
            </>
          )}
        </div>

        {/* Admin Section - Only visible to admins */}
        {context.viewerType === 'admin' && (
          <div className="mt-8">
            <DetailCard 
              title="Admin Controls" 
              priority="admin"
              defaultExpanded={false}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Entity ID:</span>
                    <span className="ml-2 font-mono text-gray-800">{entity.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 capitalize">{context.entityType}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Edit as Admin
                  </button>
                  <button className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                    Feature Entity
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                    Verify Entity
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                    Suspend
                  </button>
                </div>
              </div>
            </DetailCard>
          </div>
        )}

        {/* Booking & Contact Section - Only visible to non-owners */}
        <div className="mt-8">
          <BookingContactCard
            entity={entity}
            context={context}
            onBookingInquiry={onBookingInquiry}
            onTemplateManage={onTemplateManage}
            hasSentInquiry={hasSentInquiry}
          />
        </div>

        {/* Custom children content */}
        {children}
      </div>
    </div>
  );
};

export default ProfileLayout; 