'use client';

import { useState, useEffect } from 'react';
import { ArtistMembership, VenueMembership, ARTIST_PERMISSION_LABELS, VENUE_PERMISSION_LABELS, DEFAULT_ROLE_PERMISSIONS } from '../../types';

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
  const [members, setMembers] = useState<(ArtistMembership | VenueMembership)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    customPermissions: [] as string[]
  });

  // Load team members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch(`/api/${entityType}s/${entityId}/members`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        }
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [entityType, entityId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeEmail: inviteForm.email,
          role: inviteForm.role,
          customPermissions: inviteForm.customPermissions.length > 0 ? inviteForm.customPermissions : undefined,
          entityName
        })
      });

      if (response.ok) {
        alert('Invitation sent successfully!');
        setShowInviteForm(false);
        setInviteForm({ email: '', role: 'member', customPermissions: [] });
      } else {
        const error = await response.json();
        alert(`Failed to send invitation: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from ${entityName}?`)) return;

    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/members?memberId=${memberId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
        const error = await response.json();
        alert(`Failed to remove member: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  const getRoleOptions = () => {
    if (entityType === 'artist') {
      return [
        { value: 'member', label: 'Member' },
        { value: 'admin', label: 'Admin' },
        { value: 'owner', label: 'Owner' }
      ];
    } else {
      return [
        { value: 'staff', label: 'Staff' },
        { value: 'booker', label: 'Booker' },
        { value: 'owner', label: 'Owner' }
      ];
    }
  };

  const getDefaultPermissions = (role: string) => {
    return entityType === 'artist' 
      ? DEFAULT_ROLE_PERMISSIONS.artist[role as keyof typeof DEFAULT_ROLE_PERMISSIONS.artist] || []
      : DEFAULT_ROLE_PERMISSIONS.venue[role as keyof typeof DEFAULT_ROLE_PERMISSIONS.venue] || [];
  };

  const getPermissionLabel = (permission: string): string => {
    if (entityType === 'artist') {
      return ARTIST_PERMISSION_LABELS[permission as keyof typeof ARTIST_PERMISSION_LABELS] || permission;
    } else {
      return VENUE_PERMISSION_LABELS[permission as keyof typeof VENUE_PERMISSION_LABELS] || permission;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading team members...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Team Members</h3>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* Current Members */}
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">
                {/* TODO: Load user name from userId */}
                User {member.userId} {member.userId === currentUserId && <span className="text-sm text-gray-500">(You)</span>}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {member.role} • Joined {new Date(member.joinedAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Permissions: {member.permissions.join(', ')}
              </div>
            </div>
            
            {canManageMembers && member.userId !== currentUserId && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRemoveMember(member.id, member.userId)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No team members yet. {canManageMembers && 'Invite someone to get started!'}
          </div>
        )}
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Invite Member to {entityName}
            </h3>
            
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="member@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ 
                    ...prev, 
                    role: e.target.value,
                    customPermissions: [] // Reset custom permissions when role changes
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {getRoleOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show default permissions for selected role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions ({inviteForm.role} role)
                </label>
                <div className="text-sm text-gray-600 space-y-1">
                  {getDefaultPermissions(inviteForm.role).map(permission => (
                    <div key={permission} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {getPermissionLabel(permission)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 