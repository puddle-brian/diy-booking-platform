import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
  profileUrl?: string;
  joinedAt?: string;
}

interface TeamMembersProps {
  members: TeamMember[];
  entityType: 'artist' | 'venue';
  entityName: string;
  entityId: string;
  maxDisplay?: number;
  showRoles?: boolean;
  size?: 'sm' | 'md' | 'lg';
  canInviteMembers?: boolean;
  onInviteClick?: () => void;
  onClaimClick?: () => void;
}

export default function TeamMembers({ 
  members, 
  entityType, 
  entityName, 
  entityId,
  maxDisplay = 8,
  showRoles = true,
  size = 'md',
  canInviteMembers = false,
  onInviteClick,
  onClaimClick
}: TeamMembersProps) {
  const { user } = useAuth();
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  // Debug logging
  console.log('TeamMembers Debug:', {
    entityType,
    entityName,
    entityId,
    membersCount: members?.length || 0,
    members: members?.map(m => ({ id: m.id, name: m.name, role: m.role })),
    userId: user?.id,
    userName: user?.name,
    userProfileType: user?.profileType,
    userProfileId: user?.profileId,
    canInviteMembers,
    hasOnInviteClick: !!onInviteClick
  });

  // If no members and can claim, show claim button
  if (!members || members.length === 0) {
    if (onClaimClick) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Members
          </h3>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <button
                onClick={onClaimClick}
                className={`${sizeClasses[size]} rounded-full bg-green-100 border-2 border-dashed border-green-300 flex items-center justify-center mx-auto mb-1 hover:bg-green-200 hover:border-green-400 transition-colors group`}
              >
                <svg className="w-4 h-4 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <div className="text-xs text-center max-w-[80px]">
                <div className="text-green-600 truncate font-medium">
                  Claim this
                </div>
                <div className="text-green-600 truncate font-medium">
                  {entityType}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>No members yet. Are you part of {entityName}?</p>
              <p className="text-xs text-gray-500 mt-1">Click to add yourself as the first member</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'owner': 'Owner',
      'manager': 'Manager',
      'staff': 'Staff',
      'member': 'Member',
      'admin': 'Admin',
      'booker': 'Booker',
      'sound-tech': 'Sound Tech',
      'bartender': 'Bartender',
      'security': 'Security',
      'vocalist': 'Vocals',
      'guitarist': 'Guitar',
      'bassist': 'Bass',
      'drummer': 'Drums',
      'keyboardist': 'Keys',
      'producer': 'Producer'
    };
    return roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Generate profile URL for member
  const getMemberProfileUrl = (member: TeamMember) => {
    if (member.profileUrl) {
      return member.profileUrl;
    }
    
    // Debug logging
    console.log('TeamMembers: Checking member', {
      memberId: member.id,
      memberName: member.name,
      userId: user?.id,
      userName: user?.name,
      isMatch: user && member.id === user.id
    });
    
    // If this member is the current user, redirect to dashboard
    if (user && member.id === user.id) {
      console.log('TeamMembers: Redirecting to dashboard for current user');
      return '/dashboard';
    }
    
    // Otherwise, use the profile URL structure
    console.log('TeamMembers: Using profile URL for member:', member.id);
    return `/profile/${member.id}`;
  };

  // Check if current user can invite members
  const userCanInvite = (() => {
    if (!user || !onInviteClick) {
      console.log('TeamMembers: Cannot invite - no user or no invite handler');
      return false;
    }
    
    // Check if user is a member in the members array
    const isMember = members.some(member => member.id === user.id);
    
    // Check if user owns this entity (for artists/venues they submitted)
    const isOwner = user.profileType === entityType && user.profileId === entityId;
    
    console.log('TeamMembers: Invite permission check:', {
      userId: user.id,
      userName: user.name,
      userProfileType: user.profileType,
      userProfileId: user.profileId,
      entityType,
      entityId,
      isMember,
      isOwner,
      canInviteMembers,
      finalDecision: isMember || isOwner
    });
    
    // Allow if user is a member OR if they own this entity
    return isMember || isOwner;
  })();

  console.log('TeamMembers: Final invite button decision:', {
    userCanInvite,
    willShowInviteButton: userCanInvite
  });

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">
        Members
      </h3>
      
      <div className="flex flex-wrap items-center gap-3">
        {displayMembers.map((member) => (
          <div key={member.id} className="group">
            <Link href={getMemberProfileUrl(member)} className="block">
              <div className="text-center">
                <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 border-2 border-transparent group-hover:border-blue-500 transition-colors mx-auto mb-1`}>
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials
                        const target = e.currentTarget;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                              ${getInitials(member.name)}
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(member.name)}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-center max-w-[80px]">
                  <div className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {member.name}
                  </div>
                  {showRoles && (
                    <div className="text-gray-500 truncate">
                      {getRoleLabel(member.role)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className="text-center">
            <div className={`${sizeClasses[size]} rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-1`}>
              <span className="text-gray-500 font-semibold text-sm">
                +{remainingCount}
              </span>
            </div>
            <div className="text-xs text-center max-w-[80px]">
              <div className="text-gray-500 truncate">
                more
              </div>
            </div>
          </div>
        )}
        
        {userCanInvite && (
          <div className="text-center">
            <button
              onClick={onInviteClick}
              className={`${sizeClasses[size]} rounded-full bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center mx-auto mb-1 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 group shadow-sm hover:shadow-md`}
              title={`Invite ${entityType === 'artist' ? 'band member' : 'venue staff'}`}
            >
              <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <div className="text-xs text-center max-w-[80px]">
              <div className="text-blue-600 truncate font-medium">
                Invite
              </div>
              {showRoles && (
                <div className="text-gray-500 truncate">
                  {entityType === 'artist' ? 'Member' : 'Staff'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 