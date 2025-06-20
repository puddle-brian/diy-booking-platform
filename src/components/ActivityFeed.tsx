'use client';

import React, { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: 'hold_request' | 'hold_granted' | 'hold_declined' | 'message' | 'bid_update' | 'bid_received' | 'show_edit' | 'show_confirmed' | 'tour_request' | 'member_invite' | 'review' | 'venue_offer';
  title: string;
  summary: string;
  fullContent?: string;
  actionText: string;
  actionUrl?: string;
  timestamp: string;
  isRead: boolean;
  metadata?: {
    artistName?: string;
    venueName?: string;
    showDate?: string;
    actionType?: string;
    [key: string]: any;
  };
}

interface ActivityFeedProps {
  userId: string;
  venueId?: string;
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({ 
  userId, 
  venueId, 
  maxItems = 10,
  className = ""
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [userId, venueId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: maxItems.toString()
      });
      
      if (venueId) {
        params.set('venueId', venueId);
      }
      

      
      const response = await fetch(`/api/activities?${params}`);
      
              if (response.ok) {
          const fetchedActivities = await response.json();
        setActivities(fetchedActivities);
      } else {
        console.error('🎯 ActivityFeed: Failed to fetch activities, status:', response.status);
        const errorText = await response.text();
        console.error('🎯 ActivityFeed: Error response:', errorText);
        // Fall back to empty array
        setActivities([]);
      }
    } catch (error) {
      console.error('🎯 ActivityFeed: Error fetching activities:', error);
      // Fall back to empty array
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: ActivityItem) => {
    if (item.actionUrl) {
      // Navigate to the URL
      window.location.href = item.actionUrl;
    } else {
      // Handle custom actions based on type
      setActionLoading(item.id);
      
      try {
        switch (item.type) {
          case 'hold_request':
            // Handle hold request actions
            break;
          case 'message':
            // Mark message as read and navigate
            break;
          default:
            console.log('Action for:', item.type);
        }
      } catch (error) {
        console.error('Error handling action:', error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const markAsRead = (itemId: string) => {
    setActivities(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isRead: true } : item
      )
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getTypeStyle = (type: string, isRead: boolean) => {
    const baseStyle = "border-l-2 px-2 py-1 rounded-sm text-sm";
    const readStyle = isRead ? "opacity-75" : "";
    
    switch (type) {
      case 'hold_request':
      case 'hold_granted':
      case 'hold_declined':
        return `${baseStyle} bg-amber-50 border-amber-400 ${readStyle}`;
      case 'message':
        return `${baseStyle} bg-blue-50 border-blue-400 ${readStyle}`;
      case 'bid_update':
      case 'bid_received':
        return `${baseStyle} bg-green-50 border-green-400 ${readStyle}`;
      case 'show_edit':
      case 'show_confirmed':
        return `${baseStyle} bg-purple-50 border-purple-400 ${readStyle}`;
      case 'tour_request':
        return `${baseStyle} bg-orange-50 border-orange-400 ${readStyle}`;
      case 'member_invite':
        return `${baseStyle} bg-pink-50 border-pink-400 ${readStyle}`;
      case 'venue_offer':
        return `${baseStyle} bg-indigo-50 border-indigo-400 ${readStyle}`;
      case 'review':
        return `${baseStyle} bg-gray-50 border-gray-400 ${readStyle}`;
      default:
        return `${baseStyle} bg-gray-50 border-gray-300 ${readStyle}`;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hold_request':
      case 'hold_granted': 
      case 'hold_declined':
        return 'text-amber-600';
      case 'message': 
        return 'text-blue-600';
      case 'bid_update':
      case 'bid_received':
        return 'text-green-600';
      case 'show_edit':
      case 'show_confirmed':
        return 'text-purple-600';
      case 'tour_request': 
        return 'text-orange-600';
      case 'member_invite': 
        return 'text-pink-600';
      case 'venue_offer':
        return 'text-indigo-600';
      case 'review': 
        return 'text-gray-600';
      default: 
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="text-xs text-gray-500 py-1">
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
        {activities.length > maxItems && (
          <button className="text-xs text-gray-500 hover:text-gray-700">
            View All ({activities.length})
          </button>
        )}
      </div>

      {/* Activity Items */}
      <div className="space-y-1 mb-3">
        {activities.slice(0, maxItems).map((item) => (
          <div key={item.id} className={getTypeStyle(item.type, item.isRead)}>
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center space-x-2 min-w-0 flex-1 cursor-pointer"
                onClick={() => !item.isRead && markAsRead(item.id)}
              >
                <span className={`font-medium truncate ${getTypeColor(item.type)}`}>
                  {item.title}: {item.summary}
                </span>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  {getTimeAgo(item.timestamp)}
                </span>
                {!item.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                {item.fullContent && (
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-1"
                    title={expandedItem === item.id ? 'Collapse' : 'Expand'}
                  >
                    {expandedItem === item.id ? '−' : '+'}
                  </button>
                )}
                <button
                  onClick={() => handleAction(item)}
                  disabled={actionLoading === item.id}
                  className={`px-2 py-1 text-xs rounded hover:opacity-80 disabled:opacity-50 ${getTypeColor(item.type)} hover:bg-white/50`}
                >
                  {actionLoading === item.id ? '...' : item.actionText}
                </button>
              </div>
            </div>
            
            {/* Expandable full content */}
            {expandedItem === item.id && item.fullContent && (
              <div className="text-xs text-gray-600 mt-2 p-2 bg-white/50 rounded border-t border-gray-200">
                {item.fullContent}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {activities.length > maxItems && (
        <div className="text-center py-2">
          <button className="text-xs text-gray-500 hover:text-gray-700">
            View All Activity ({activities.length} total)
          </button>
        </div>
      )}
    </div>
  );
}