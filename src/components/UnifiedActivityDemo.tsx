'use client';

import React from 'react';
import { ActivityFeed } from './ActivityFeed';
import { HoldNotificationPanel } from './HoldNotificationPanel';

interface UnifiedActivityDemoProps {
  userId: string;
  venueId?: string;
}

export function UnifiedActivityDemo({ userId, venueId }: UnifiedActivityDemoProps) {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Activity Feed</h2>
      
      {/* Current hold notifications */}
      <HoldNotificationPanel
        venueId={venueId}
        currentUserId={userId}
        onHoldResponse={(holdId, action) => {
          console.log('Hold response:', holdId, action);
        }}
      />

      {/* New unified activity feed */}
      <ActivityFeed
        userId={userId}
        venueId={venueId}
        maxItems={8}
      />

      {/* Optional: "View All Activity" link */}
      <div className="text-center pt-2 border-t border-gray-100">
        <button className="text-sm text-gray-600 hover:text-gray-800">
          View All Activity
        </button>
      </div>
    </div>
  );
} 