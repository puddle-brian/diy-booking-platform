import React, { useState } from 'react';
import Link from 'next/link';
import MessageButton from '../MessageButton';
import FavoriteButton from '../FavoriteButton';
import { VENUE_TYPE_LABELS, ARTIST_TYPE_LABELS } from '../../../types/index';

// Centralized Module Styling Configuration
// Change these values to update the appearance of all profile modules from one place
export const MODULE_STYLES = {
  // Border and background styles for different priority levels
  primary: {
    background: 'bg-white',
    border: 'border border-gray-200',
    shadow: 'shadow-md',
    borderRadius: 'rounded-xl'
  },
  secondary: {
    background: 'bg-white',
    border: 'border border-gray-200', 
    shadow: 'shadow-md',
    borderRadius: 'rounded-xl'
  },
  tertiary: {
    background: 'bg-gray-50',
    border: 'border border-gray-100',
    shadow: 'shadow-sm',
    borderRadius: 'rounded-xl'
  },
  admin: {
    background: 'bg-red-50',
    border: 'border border-red-200',
    shadow: 'shadow-sm',
    borderRadius: 'rounded-xl'
  },
  
  // Padding styles for different sizes
  sizes: {
    small: 'p-4',
    medium: 'p-6', 
    large: 'p-8'
  }
};

// Types for the modular profile system
export interface ProfileContext {
  viewerType: 'artist' | 'venue' | 'public' | 'admin';
  entityType: 'artist' | 'venue';
  isOwner: boolean;
  canEdit: boolean;
}

export interface BaseEntity {
  id: string;
  name: string;
  city: string;
  state: string;
  country?: string;
  images: string[];
  description: string;
  rating?: number;
  contact: {
    email: string;
    phone?: string;
    website?: string;
    social?: string;
  };
}

export interface Artist extends BaseEntity {
  artistType: 'band' | 'solo' | 'duo' | 'collective';
  genres: string[];
  tourStatus: 'active' | 'hiatus' | 'selective' | 'local-only';
  yearFormed?: number;
  members?: number;
  expectedDraw?: string;
  equipment: {
    needsPA: boolean;
    needsMics: boolean;
    needsDrums: boolean;
    needsAmps: boolean;
    acoustic: boolean;
  };
}

export interface Venue extends BaseEntity {
  venueType: 'house-show' | 'community-space' | 'record-store' | 'vfw-hall' | 'arts-center' | 'warehouse' | 'bar' | 'club' | 'theater' | 'other';
  capacity: number;
  ageRestriction: 'all-ages' | '18+' | '21+';
  genres: string[];
  equipment: {
    pa: boolean;
    mics: boolean;
    drums: boolean;
    amps: boolean;
    piano: boolean;
  };
  features: string[];
  pricing: {
    guarantee: number;
    door: boolean;
    merchandise: boolean;
  };
  streetAddress?: string;
  neighborhood?: string;
  postalCode?: string;
}

// Base Profile Card Component
interface ProfileCardProps {
  priority: 'primary' | 'secondary' | 'tertiary' | 'admin';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  children: React.ReactNode;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  priority, 
  size = 'medium', 
  className = '', 
  children 
}) => {
  const priorityStyle = MODULE_STYLES[priority];
  const sizeStyle = MODULE_STYLES.sizes[size];

  const combinedClasses = [
    priorityStyle.background,
    priorityStyle.border,
    priorityStyle.shadow,
    priorityStyle.borderRadius,
    sizeStyle,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

// Compact Team Thumbnails Component - For header display with message notifications
interface TeamThumbnailsProps {
  members: any[];
  entityName: string;
  maxDisplay?: number;
  className?: string;
  showMessageBadges?: boolean; // New prop to enable message notifications
}

export const TeamThumbnails: React.FC<TeamThumbnailsProps> = ({ 
  members, 
  entityName, 
  maxDisplay = 4,
  className = '',
  showMessageBadges = true
}) => {
  if (members.length === 0) return null;

  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex -space-x-2">
        {displayMembers.map((member, index) => (
          <div
            key={member.id || index}
            className="relative group cursor-pointer"
            title={`${member.name || 'Team Member'} (${member.role || 'Member'})`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name || 'Team Member'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                  {(member.name || 'T').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Message Notification Badge - Similar to UserStatus component */}
            {showMessageBadges && member.unreadCount && member.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg border border-white">
                {member.unreadCount > 9 ? '9+' : member.unreadCount}
              </div>
            )}
            
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {member.name || 'Team Member'}
              <div className="text-gray-300">{member.role || 'Member'}</div>
              {showMessageBadges && member.unreadCount && member.unreadCount > 0 && (
                <div className="text-blue-300 font-medium">{member.unreadCount} unread message{member.unreadCount !== 1 ? 's' : ''}</div>
              )}
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div 
            className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer relative"
            title={`${remainingCount} more team member${remainingCount !== 1 ? 's' : ''}`}
          >
            <span className="text-xs font-medium text-gray-600">+{remainingCount}</span>
            
            {/* Aggregate notification badge for remaining members */}
            {showMessageBadges && (() => {
              const remainingMembers = members.slice(maxDisplay);
              const totalUnread = remainingMembers.reduce((sum, member) => sum + (member.unreadCount || 0), 0);
              
              if (totalUnread > 0) {
                return (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg border border-white">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
      
      {/* Only show member count on mobile or when explicitly requested */}
      {className.includes('show-count') && members.length > 0 && (
        <span className="text-xs text-gray-500 ml-2">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

// Profile Header Component - Hero section with essential info
interface ProfileHeaderProps {
  entity: Artist | Venue;
  context: ProfileContext;
  members?: any[];
  onTemplateManage?: () => void; // Add this prop for template management
}

// Updated Profile Header Component - Team thumbnails integrated into main row
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ entity, context, members = [], onTemplateManage }) => {
  const isArtist = context.entityType === 'artist';
  const artist = isArtist ? entity as Artist : null;
  const venue = !isArtist ? entity as Venue : null;

  return (
    <ProfileCard priority="primary" size="large" className="mb-6">
      <div className="space-y-4">
        {/* Top Row: Thumbnail + Name + Location/Info + Team Thumbnails */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Entity Thumbnail */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <img
              src={entity.images?.[0] || `/api/placeholder/${isArtist ? artist?.artistType : 'other'}`}
              alt={entity.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `/api/placeholder/${isArtist ? artist?.artistType : 'other'}`;
              }}
            />
          </div>
          
          {/* Entity Name + Location/Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-2">
                  {entity.name}
                </h1>
                
                {/* Location & Key Details */}
                <div className="space-y-1">
                  <p className="text-base text-gray-600">
                    {entity.city}, {entity.state}
                    {isArtist && artist?.artistType && (
                      <>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="capitalize">{ARTIST_TYPE_LABELS[artist.artistType] || artist.artistType.replace('-', ' ')}</span>
                      </>
                    )}
                    {!isArtist && venue?.capacity && (
                      <>
                        <span className="text-gray-400 mx-2">•</span>
                        <span>{venue.capacity >= 1000 ? `${(venue.capacity / 1000).toFixed(venue.capacity % 1000 === 0 ? 0 : 1)}k` : venue.capacity} cap</span>
                      </>
                    )}
                    <span className="text-gray-400 mx-2">•</span>
                    {entity.rating && entity.rating > 0 ? (
                      <span className="text-gray-700">★ {entity.rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-gray-400">★ N/A</span>
                    )}
                  </p>
                  
                  {/* Additional context info */}
                  <div className="text-sm text-gray-500 space-x-3">
                    {isArtist && artist?.yearFormed && (
                      <span>Est. {artist.yearFormed}</span>
                    )}
                    {isArtist && artist?.tourStatus && (
                      <span className="capitalize">{artist.tourStatus.replace('-', ' ')} touring</span>
                    )}
                    {!isArtist && venue?.venueType && (
                      <span className="capitalize">{VENUE_TYPE_LABELS[venue.venueType] || venue.venueType.replace('-', ' ')}</span>
                    )}
                    {!isArtist && venue?.ageRestriction && (
                      <span className="capitalize">{venue.ageRestriction}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Thumbnails - Integrated into main row */}
              {members.length > 0 && (
                <div className="flex-shrink-0 hidden sm:block">
                  <TeamThumbnails 
                    members={members}
                    entityName={entity.name}
                    maxDisplay={4}
                    className="justify-end"
                    showMessageBadges={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Favorite Button */}
          {!context.isOwner && (
            <div className="flex-shrink-0">
              <FavoriteButton 
                entityType={context.entityType.toUpperCase() as 'ARTIST' | 'VENUE'}
                entityId={entity.id}
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Mobile Team Thumbnails - Only show on mobile when hidden above */}
        {members.length > 0 && (
          <div className="sm:hidden">
            <TeamThumbnails 
              members={members}
              entityName={entity.name}
              maxDisplay={6}
              className="show-count"
              showMessageBadges={true}
            />
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-3 pt-2">
          <MessageButton 
            recipientId={entity.id}
            recipientName={entity.name}
            recipientType={context.entityType}
            variant="primary"
            size="md"
            context={{
              fromPage: `${context.entityType}-profile`,
              entityName: entity.name,
              entityType: context.entityType
            }}
            isOwnEntity={context.isOwner}
          >
            Send Message
          </MessageButton>
          
          {/* Edit Profile Button - Only show for owners/admins */}
          {context.canEdit && (
            <Link
              href={`/${context.entityType}s/${entity.id}/edit`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          )}

          {/* Edit Templates Button - Only show for artists with edit permissions */}
          {context.canEdit && isArtist && onTemplateManage && (
            <button
              onClick={onTemplateManage}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Edit Templates
            </button>
          )}
        </div>
      </div>
    </ProfileCard>
  );
};

// Booking Status Card - Primary functionality for tour dates/availability
interface BookingStatusCardProps {
  entity: Artist | Venue;
  context: ProfileContext;
  className?: string;
}

export const BookingStatusCard: React.FC<BookingStatusCardProps> = ({ entity, context, className = '' }) => {
  return (
    <ProfileCard priority="primary" size="large" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Show Dates</h2>
        {context.canEdit && (
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Manage Dates
          </button>
        )}
      </div>
      
      {/* This will be replaced with TabbedTourItinerary component */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-500 mb-2">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">
          Tour itinerary component will be integrated here
        </p>
      </div>
    </ProfileCard>
  );
};

// Team & Credibility Card - Shows members and trust signals
interface TeamCredibilityCardProps {
  entity: Artist | Venue;
  context: ProfileContext;
  members?: any[];
  className?: string;
}

export const TeamCredibilityCard: React.FC<TeamCredibilityCardProps> = ({ 
  entity, 
  context, 
  members = [], 
  className = '' 
}) => {
  return (
    <ProfileCard priority="secondary" size="medium" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Team</h3>
        {context.canEdit && members.length > 0 && (
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Manage Team
          </button>
        )}
      </div>
      
      {members.length > 0 ? (
        <div className="space-y-3">
          {members.slice(0, 4).map((member, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{member.name || 'Team Member'}</p>
                <p className="text-xs text-gray-500">{member.role || 'Member'}</p>
              </div>
            </div>
          ))}
          {members.length > 4 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              +{members.length - 4} more members
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No team members yet</p>
          {context.canEdit && (
            <button className="text-xs text-blue-600 hover:text-blue-800 mt-1">
              Invite members
            </button>
          )}
        </div>
      )}
    </ProfileCard>
  );
};

// Media Showcase Card - Photos, videos, music
interface MediaShowcaseCardProps {
  entity: Artist | Venue;
  context: ProfileContext;
  className?: string;
}

export const MediaShowcaseCard: React.FC<MediaShowcaseCardProps> = ({ entity, context, className = '' }) => {
  const hasMedia = entity.images && entity.images.length > 0;

  return (
    <ProfileCard priority="secondary" size="medium" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Media</h3>
        {context.canEdit && (
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Add Media
          </button>
        )}
      </div>
      
      {hasMedia ? (
        <div className="grid grid-cols-2 gap-2">
          {entity.images.slice(0, 4).map((image, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={image}
                alt={`${entity.name} photo ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No media yet</p>
          {context.canEdit && (
            <button className="text-xs text-blue-600 hover:text-blue-800 mt-1">
              Add photos or videos
            </button>
          )}
        </div>
      )}
      
      {hasMedia && entity.images.length > 4 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          +{entity.images.length - 4} more photos
        </p>
      )}
    </ProfileCard>
  );
};

// Contact & Essential Info Card - Key details for booking decisions
interface ContactEssentialCardProps {
  entity: Artist | Venue;
  context: ProfileContext;
  className?: string;
}

export const ContactEssentialCard: React.FC<ContactEssentialCardProps> = ({ entity, context, className = '' }) => {
  const isArtist = context.entityType === 'artist';
  const artist = isArtist ? entity as Artist : null;
  const venue = !isArtist ? entity as Venue : null;

  return (
    <ProfileCard priority="secondary" size="medium" className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Essential Info</h3>
      
      <div className="space-y-3">
        {/* Contact Email */}
        <div className="flex items-center space-x-3">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-700">{entity.contact.email}</span>
        </div>

        {/* Phone */}
        {entity.contact.phone && (
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm text-gray-700">{entity.contact.phone}</span>
          </div>
        )}

        {/* Website */}
        {entity.contact.website && (
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
            </svg>
            <a href={entity.contact.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 truncate">
              {entity.contact.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        {/* Entity-specific key info */}
        {isArtist && artist && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Members:</span>
                <span className="ml-1 text-gray-700">{artist.members || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Draw:</span>
                <span className="ml-1 text-gray-700">{artist.expectedDraw || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {!isArtist && venue && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Guarantee:</span>
                <span className="ml-1 text-gray-700">${venue.pricing.guarantee}</span>
              </div>
              <div>
                <span className="text-gray-500">Door:</span>
                <span className="ml-1 text-gray-700">{venue.pricing.door ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfileCard>
  );
};

// Expandable Detail Card - For longer descriptions and detailed specs
interface DetailCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  priority?: 'secondary' | 'tertiary' | 'admin';
  className?: string;
}

export const DetailCard: React.FC<DetailCardProps> = ({ 
  title, 
  children, 
  defaultExpanded = false, 
  priority = 'tertiary',
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <ProfileCard priority={priority} size="medium" className={className}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </ProfileCard>
  );
};

// Booking & Contact Card - For booking inquiries and contact actions (only for non-owners)
interface BookingContactCardProps {
  entity: Artist | Venue;
  context: ProfileContext;
  onBookingInquiry?: () => void;
  onTemplateManage?: () => void;
  hasSentInquiry?: boolean;
  className?: string;
}

export const BookingContactCard: React.FC<BookingContactCardProps> = ({ 
  entity, 
  context, 
  onBookingInquiry,
  onTemplateManage,
  hasSentInquiry = false,
  className = '' 
}) => {
  const isArtist = context.entityType === 'artist';

  // Don't show this card to owners/members - they don't need to book themselves
  if (context.isOwner) {
    return null;
  }

  return (
    <ProfileCard priority="secondary" size="medium" className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking & Contact</h3>
      
      {/* Date Availability Check - Only for venues */}
      {!isArtist && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Check Date Availability</label>
          <input
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
            placeholder="Select a date to check availability"
          />
          <p className="text-xs text-gray-500 mt-1">Select a date to check if the venue is available</p>
        </div>
      )}
      
      {/* Contact Buttons */}
      <div className="space-y-3">
        {/* Main Booking Inquiry Button */}
        <button
          onClick={onBookingInquiry}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            hasSentInquiry 
              ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
          disabled={hasSentInquiry}
        >
          {hasSentInquiry ? 'Inquiry Sent ✓' : `Send ${isArtist ? 'Booking' : 'Show'} Inquiry`}
        </button>
        
        {/* Send Another Inquiry - Only if already sent */}
        {hasSentInquiry && (
          <button
            onClick={onBookingInquiry}
            className="block text-sm text-gray-600 hover:text-gray-800 py-1 w-full text-center"
          >
            Send Another Inquiry
          </button>
        )}
      </div>

      {/* Contact Information Note */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-600">
          {isArtist 
            ? "Booking inquiries will be sent directly to the artist's management team."
            : "Show requests will be sent to the venue's booking coordinator."
          }
        </p>
      </div>
    </ProfileCard>
  );
}; 