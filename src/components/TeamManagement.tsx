'use client';

import { useState, useEffect } from 'react';

// Inline type definitions to avoid import issues
interface ArtistMembership {
  id: string;
  userId: string;
  artistId: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  invitedBy?: string;
  status: 'active' | 'pending' | 'inactive';
}

interface VenueMembership {
  id: string;
  userId: string;
  venueId: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  invitedBy?: string;
  status: 'active' | 'pending' | 'inactive';
}

// Inline constants to avoid import issues
const ARTIST_PERMISSION_LABELS = {
  'edit_profile': 'Edit Artist Profile',
  'manage_bookings': 'Manage Bookings',
  'invite_members': 'Invite Members',
  'manage_members': 'Manage Members',
  'view_analytics': 'View Analytics',
  'delete_artist': 'Delete Artist'
};

const VENUE_PERMISSION_LABELS = {
  'edit_profile': 'Edit Venue Profile',
  'manage_bookings': 'Manage Bookings',
  'invite_staff': 'Invite Staff',
  'manage_staff': 'Manage Staff',
  'view_analytics': 'View Analytics',
  'delete_venue': 'Delete Venue'
};

const DEFAULT_ROLE_PERMISSIONS = {
  artist: {
    owner: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics', 'delete_artist'],
    admin: ['edit_profile', 'manage_bookings', 'invite_members', 'manage_members', 'view_analytics'],
    member: ['edit_profile', 'manage_bookings'],
    viewer: ['view_analytics']
  },
  venue: {
    owner: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics', 'delete_venue'],
    manager: ['edit_profile', 'manage_bookings', 'invite_staff', 'manage_staff', 'view_analytics'],
    staff: ['edit_profile', 'manage_bookings'],
    viewer: ['view_analytics']
  }
};

interface TeamManagementProps {
  entityType: 'artist' | 'venue';
  entityId: string;
  entityName: string;
  currentUserId: string;
  canManageMembers: boolean;
}

export default function TeamManagement({
  entityType,
  entityId,
  entityName,
  currentUserId,
  canManageMembers
}: TeamManagementProps) {
  const [memberships, setMemberships] = useState<(ArtistMembership | VenueMembership)[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    loadMemberships();
  }, [entityType, entityId]);

  const loadMemberships = async () => {
    try {
      // For now, return mock data since we don't have a real API
      setMemberships([]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load memberships:', error);
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock invite functionality
    console.log('Inviting:', inviteEmail, 'as', inviteRole);
    setInviteEmail('');
    setShowInviteForm(false);
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">Loading team management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {entityType === 'artist' ? 'Band Members' : 'Venue Staff'}
        </h3>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Invite {entityType === 'artist' ? 'Member' : 'Staff'}
          </button>
        )}
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {entityType === 'artist' ? (
                <>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </>
              ) : (
                <>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </>
              )}
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Send Invite
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        {memberships.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No {entityType === 'artist' ? 'members' : 'staff'} found.
            {canManageMembers && ' Click "Invite" to add someone.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {memberships.map((membership) => (
              <div key={membership.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{membership.userId}</div>
                  <div className="text-sm text-gray-500 capitalize">{membership.role}</div>
                </div>
                <div className="text-sm text-gray-400">
                  Joined {new Date(membership.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 