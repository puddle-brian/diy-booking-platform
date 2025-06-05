'use client';

import React, { useState } from 'react';
import { HoldRequestPanel } from './HoldRequestPanel';

interface ShowDocumentExampleProps {
  // Show/ShowRequest data
  showId?: string;
  showRequestId?: string;
  
  // Parties involved
  artistId: string;
  artistName: string;
  venueId?: string;
  venueName?: string;
  
  // Current user
  currentUserId: string;
  
  // Show details for demonstration
  title: string;
  date: string;
  status: 'confirmed' | 'pending' | 'negotiating';
}

export function ShowDocumentExample({
  showId,
  showRequestId,
  artistId,
  artistName,
  venueId,
  venueName,
  currentUserId,
  title,
  date,
  status
}: ShowDocumentExampleProps) {
  const [holdRequest, setHoldRequest] = useState<any>(null);
  const [documentStatus, setDocumentStatus] = useState(status);

  const handleHoldChange = (newHoldRequest: any) => {
    setHoldRequest(newHoldRequest);
    
    // Update document status based on hold state
    if (newHoldRequest) {
      if (newHoldRequest.status === 'ACTIVE') {
        setDocumentStatus('negotiating');
      }
    } else {
      // Hold ended, return to previous status
      setDocumentStatus(status);
    }
  };

  const getStatusBadge = () => {
    switch (documentStatus) {
      case 'confirmed':
        return (
          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
            ✓ Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </span>
        );
      case 'negotiating':
        return (
          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
            🔒 Under Hold
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Show Document Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        
        {/* Document Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">
                {artistName} • {venueName} • {new Date(date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Hold Request Panel - THE INTEGRATION POINT */}
        <div className="p-6">
          <HoldRequestPanel
            showId={showId}
            showRequestId={showRequestId}
            currentUserId={currentUserId}
            artistId={artistId}
            venueId={venueId}
            artistName={artistName}
            venueName={venueName}
            onHoldChange={handleHoldChange}
          />

          {/* Rest of Show Document Content */}
          <div className="space-y-6">
            
            {/* Show Details Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Show Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="ml-2">{new Date(date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Artist:</span>
                  <span className="ml-2">{artistName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Venue:</span>
                  <span className="ml-2">{venueName || 'TBD'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2">{getStatusBadge()}</span>
                </div>
              </div>
            </div>

            {/* Financial Terms Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Financial Terms</h3>
              <div className="text-sm text-gray-600">
                {holdRequest && holdRequest.status === 'ACTIVE' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-800">
                      🔒 <strong>Exclusive Negotiation Mode:</strong> Use this protected time 
                      to finalize financial terms. No competing offers can be made during the hold period.
                    </p>
                  </div>
                ) : (
                  <p>Financial terms can be negotiated here...</p>
                )}
              </div>
            </div>

            {/* Technical Requirements Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Technical Requirements</h3>
              <div className="text-sm text-gray-600">
                <p>Equipment, sound, and technical details...</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              {!holdRequest ? (
                <>
                  <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
                    Save Draft
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Finalize Show
                  </button>
                </>
              ) : holdRequest.status === 'ACTIVE' ? (
                <>
                  <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
                    Save Progress
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
                    Accept Terms
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Actions available after hold approval
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">🔧 Integration Instructions</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Step 1:</strong> Import the HoldRequestPanel component</p>
          <p><strong>Step 2:</strong> Place it prominently at the top of your show document</p>
          <p><strong>Step 3:</strong> Pass the required props (showId/showRequestId, parties, currentUser)</p>
          <p><strong>Step 4:</strong> Handle the onHoldChange callback to update your document state</p>
          <p><strong>Step 5:</strong> Adjust your document UI based on hold status</p>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 text-sm">
            <strong>💡 Pro Tip:</strong> The hold system automatically handles date exclusivity 
            and bilateral approval. Your document just needs to respond to state changes via the callback.
          </p>
        </div>
      </div>
    </div>
  );
} 