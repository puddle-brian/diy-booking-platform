import React, { useState } from 'react';
import { LineupPosition } from '../../types';

interface LineupBid {
  id: string;
  status: string;
  lineupRole: LineupPosition;
  guarantee?: number;
  setLength?: number;
  message?: string;
  tourRequest?: {
    artist: {
      id: string;
      name: string;
    };
  };
}

interface LineupActionButtonsProps {
  bid: LineupBid;
  showId: string;
  canRespond: boolean; // Based on permissions - is this the invited artist?
  onResponse: (bidId: string, action: 'accept' | 'decline', reason?: string) => void;
}

export function LineupActionButtons({
  bid,
  showId,
  canRespond,
  onResponse
}: LineupActionButtonsProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onResponse(bid.id, 'accept');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onResponse(bid.id, 'decline', declineReason.trim() || undefined);
      setShowDeclineModal(false);
      setDeclineReason('');
    } finally {
      setIsDeclining(false);
    }
  };

  const getRoleColor = (role: LineupPosition) => {
    switch (role) {
      case 'HEADLINER': return 'text-green-700';
      case 'DIRECT_SUPPORT': return 'text-blue-700';
      case 'OPENER': return 'text-yellow-700';
      case 'LOCAL_OPENER': return 'text-purple-700';
      default: return 'text-gray-700';
    }
  };

  // Only show buttons for pending invitations that the user can respond to
  if (bid.status !== 'pending' || !canRespond) {
    return (
      <div className="flex items-center space-x-1">
        {bid.status === 'accepted' && (
          <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>
        )}
        {bid.status === 'declined' && (
          <span className="text-xs text-red-600 font-medium">✗ Declined</span>
        )}
        {bid.status === 'cancelled' && (
          <span className="text-xs text-gray-600 font-medium">Cancelled</span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-1">
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          title="Accept lineup invitation"
        >
          {isAccepting ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="ml-1">Accept</span>
        </button>

        <button
          onClick={() => setShowDeclineModal(true)}
          disabled={isDeclining}
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          title="Decline lineup invitation"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="ml-1">Decline</span>
        </button>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDeclineModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Decline Lineup Invitation
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        You're declining the {bid.lineupRole.toLowerCase().replace('_', ' ')} slot invitation. Would you like to provide a reason?
                      </p>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Optional: Let them know why (scheduling conflict, etc.)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isDeclining}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isDeclining ? 'Declining...' : 'Decline Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 