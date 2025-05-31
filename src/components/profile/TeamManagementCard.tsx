import React, { useState } from 'react';
import { ProfileCard } from './ProfileModules';
import TeamMembers from '../TeamMembers';
import InviteMemberModal from '../InviteMemberModal';
import ClaimEntityModal from '../ClaimEntityModal';

interface TeamManagementCardProps {
  entityType: 'artist' | 'venue';
  entityId: string;
  entityName: string;
  members: any[];
  loadingMembers: boolean;
  canManageTeam: boolean;
  onMembersUpdate: () => void;
  className?: string;
}

export const TeamManagementCard: React.FC<TeamManagementCardProps> = ({
  entityType,
  entityId,
  entityName,
  members,
  loadingMembers,
  canManageTeam,
  onMembersUpdate,
  className = ''
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleInviteSuccess = () => {
    setStatusMessage('Invitation sent successfully! They will receive an email from DIY Shows.');
    setTimeout(() => setStatusMessage(''), 5000);
    onMembersUpdate();
    setShowInviteModal(false);
  };

  const handleClaimSuccess = () => {
    setStatusMessage('Claim request submitted! We will verify and contact you within 24-48 hours.');
    setTimeout(() => setStatusMessage(''), 8000);
    setShowClaimModal(false);
  };

  return (
    <>
      <ProfileCard priority="secondary" size="medium" className={className}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Members</h3>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{statusMessage}</p>
          </div>
        )}

        {/* Team Members Component - Preserves all existing functionality */}
        {!loadingMembers && (
          <TeamMembers 
            members={members}
            entityType={entityType}
            entityName={entityName}
            entityId={entityId}
            maxDisplay={6}
            showTitle={false}
            canInviteMembers={canManageTeam}
            onInviteClick={() => setShowInviteModal(true)}
            onClaimClick={members.length === 0 ? () => setShowClaimModal(true) : undefined}
          />
        )}

        {loadingMembers && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading members...</p>
          </div>
        )}
      </ProfileCard>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        entityType={entityType}
        entityName={entityName}
        entityId={entityId}
        onSuccess={handleInviteSuccess}
      />

      {/* Claim Entity Modal */}
      <ClaimEntityModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        entityType={entityType}
        entityName={entityName}
        entityId={entityId}
        onSuccess={handleClaimSuccess}
      />
    </>
  );
};

export default TeamManagementCard; 