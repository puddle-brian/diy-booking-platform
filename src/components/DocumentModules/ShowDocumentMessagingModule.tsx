import React, { useState, useEffect, useRef } from 'react';
import { ModuleComponentProps } from './ModuleRegistry';

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: 'artist' | 'venue' | 'user';
  content: string;
  timestamp: string;
  read: boolean;
}

interface ShowDocumentMessagingData {
  conversationId?: string;
  messages: Message[];
  participantIds: string[];
  participantNames: string[];
  showContext: {
    showId?: string;
    bidId?: string;
    tourRequestId?: string;
    artistId: string;
    venueId: string;
    artistName: string;
    venueName: string;
  };
}

export default function ShowDocumentMessagingModule({
  data,
  isEditing,
  status,
  viewerType,
  canEdit,
  onDataChange,
  onSave,
  onCancel,
  onStartEdit,
  isSaving,
  errors
}: ModuleComponentProps) {
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Only auto-scroll when messages are added, not on initial load
    if (data.messages.length > 0) {
      // Small delay to ensure DOM is updated, and use instant scroll for better UX
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
    }
  }, [data.messages.length]); // Only trigger when message count changes

  // Initialize conversation when component mounts (only once)
  useEffect(() => {
    if (!data.conversationId && data.showContext && !loading) {
      initializeConversation();
    }
  }, []); // Only run once on mount to prevent multiple initializations

  const getApiHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Include debug user if needed
    if (typeof window !== 'undefined') {
      const debugUser = localStorage.getItem('debugUser');
      if (debugUser) {
        headers['x-debug-user'] = debugUser;
      }
    }

    return headers;
  };

  const initializeConversation = async () => {
    if (!data.showContext) {
      console.log('🔴 ShowDocumentMessaging: No show context available');
      return;
    }

    // Check if we have valid participant data
    if (data.showContext.venueId === 'unknown' || data.showContext.artistId === 'unknown') {
      console.log('🔴 ShowDocumentMessaging: Invalid participant IDs - cannot create conversation');
      console.log('🔴 ShowDocumentMessaging: venueId:', data.showContext.venueId, 'artistId:', data.showContext.artistId);
      return;
    }

    setLoading(true);
    try {
      // Create conversation between artist and venue for this show
      const recipientId = viewerType === 'artist' ? data.showContext.venueId : data.showContext.artistId;
      const recipientName = viewerType === 'artist' ? data.showContext.venueName : data.showContext.artistName;
      const recipientType = viewerType === 'artist' ? 'venue' : 'artist';

      console.log('🔵 ShowDocumentMessaging: Creating conversation with params:', {
        recipientId,
        recipientName,
        recipientType,
        viewerType,
        showContext: data.showContext
      });
      
      console.log('🔵 ShowDocumentMessaging: Debug showContext details:', {
        artistId: data.showContext.artistId,
        venueId: data.showContext.venueId,
        artistName: data.showContext.artistName,
        venueName: data.showContext.venueName,
        showId: data.showContext.showId,
        bidId: data.showContext.bidId,
        tourRequestId: data.showContext.tourRequestId
      });

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          recipientId,
          recipientName,
          recipientType
        }),
      });

      console.log('🔵 ShowDocumentMessaging: API response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('🔵 ShowDocumentMessaging: API response data:', responseData);
        
        const { conversationId } = responseData;
        
        // Update data with conversation ID
        const updatedData = {
          ...data,
          conversationId,
          participantIds: [data.showContext.artistId, data.showContext.venueId],
          participantNames: [data.showContext.artistName, data.showContext.venueName]
        };
        
        console.log('🔵 ShowDocumentMessaging: Updating data with conversation ID:', conversationId);
        onDataChange(updatedData);
        
        // Load messages for this conversation
        await loadMessages(conversationId);
      } else {
        const errorText = await response.text();
        console.error('🔴 ShowDocumentMessaging: Failed to create conversation:', response.status, errorText);
      }
    } catch (error) {
      console.error('🔴 ShowDocumentMessaging: Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('🔵 ShowDocumentMessaging: Loading messages for conversation:', conversationId);
      
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: getApiHeaders()
      });
      
      console.log('🔵 ShowDocumentMessaging: Messages API response status:', response.status);
      
      if (response.ok) {
        const messages = await response.json();
        console.log('🔵 ShowDocumentMessaging: Loaded messages:', messages.length);
        
        const updatedData = {
          ...data,
          conversationId, // Make sure conversation ID is preserved
          messages
        };
        onDataChange(updatedData);
      } else {
        const errorText = await response.text();
        console.error('🔴 ShowDocumentMessaging: Failed to load messages:', response.status, errorText);
      }
    } catch (error) {
      console.error('🔴 ShowDocumentMessaging: Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    console.log('🟢 Form submitted! Event:', e.type);
    e.preventDefault();
    
    console.log('🟢 Checking conditions - message:', newMessage.trim(), 'conversationId:', data.conversationId);
    if (!newMessage.trim() || !data.conversationId) {
      console.log('🔴 Blocking send - missing message or conversation ID');
      return;
    }

    console.log('🔵 ShowDocumentMessaging: Sending message to conversation:', data.conversationId);
    
    setSending(true);
    try {
      const response = await fetch(`/api/messages/${data.conversationId}`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          content: newMessage.trim(),
          senderId: 'current-user', // Will be overridden by API with actual user ID
          senderName: 'Current User', // Will be overridden by API
          senderType: viewerType === 'artist' ? 'artist' : 'venue',
          context: 'show-document'
        }),
      });

      console.log('🔵 ShowDocumentMessaging: Message response status:', response.status);

      if (response.ok) {
        const message = await response.json();
        console.log('🔵 ShowDocumentMessaging: Message sent successfully:', message);
        
        const updatedData = {
          ...data,
          messages: [...data.messages, message]
        };
        onDataChange(updatedData);
        setNewMessage('');
        
        // Don't auto-save - messaging is real-time and doesn't need document saving
      } else {
        const errorText = await response.text();
        console.error('🔴 ShowDocumentMessaging: Failed to send message:', response.status, errorText);
      }
    } catch (error) {
      console.error('🔴 ShowDocumentMessaging: Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getMessageSenderLabel = (message: Message) => {
    if (viewerType === 'artist') {
      return message.senderType === 'venue' ? data.showContext.venueName : 'You';
    } else {
      return message.senderType === 'artist' ? data.showContext.artistName : 'You';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Loading conversation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm text-blue-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
          </svg>
          <span className="font-medium">Show Discussion</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Discuss additional requirements, changes, or clarifications for this show
        </p>
      </div>

      {/* Messages Container */}
      <div className="border border-gray-200 rounded-lg">
        {/* Messages List */}
        <div className="h-40 overflow-y-auto p-3 space-y-2">
          {data.messages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
              </svg>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs text-gray-400">Start the conversation about this show</p>
              {!data.conversationId && (
                <p className="text-xs text-red-400 mt-1">Debug: No conversation ID</p>
              )}
            </div>
          ) : (
            data.messages.map((message: Message) => {
              const isFromCurrentUser = (viewerType === 'artist' && message.senderType === 'artist') || 
                                      (viewerType === 'venue' && message.senderType === 'venue');
              
              return (
                <div key={message.id} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    isFromCurrentUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {getMessageSenderLabel(message)} • {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {status !== 'locked' && (
          <div className="border-t border-gray-200 p-3">
            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || !data.conversationId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                onClick={(e) => {
                  console.log('🟡 Button clicked! conversationId:', data.conversationId, 'message:', newMessage);
                  if (!data.conversationId) {
                    console.log('🔴 No conversation ID - button should be disabled');
                    e.preventDefault();
                    return;
                  }
                }}
              >
                {sending ? (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    <span>Send</span>
                  </div>
                ) : (
                  'Send'
                )}
              </button>
            </form>
            {/* Debug info */}
            <div className="text-xs text-gray-400 mt-2">
              Debug: ConvID={data.conversationId ? data.conversationId.slice(-8) : 'None'} | 
              Messages={data.messages.length} | 
              Status={status} | 
              Viewer={viewerType}
            </div>
          </div>
        )}
      </div>

      {/* Status Information */}
      {data.messages.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>{data.messages.length} message{data.messages.length !== 1 ? 's' : ''}</span>
          <span>
            Participants: {data.showContext.artistName}, {data.showContext.venueName}
          </span>
        </div>
      )}
    </div>
  );
}

// Export the module definition for registration
export const showDocumentMessagingModule = {
  id: 'show-messaging',
  title: 'Show Discussion',
  owner: 'shared' as const,
  order: 1, // At the top - most essential use case
  defaultStatus: 'draft' as const,
  
  canEdit: (viewerType: string, status: string) => {
    return viewerType !== 'public' && status !== 'locked';
  },
  
  canView: (viewerType: string) => true,
  
  extractData: (context: any) => {
    console.log('🔵 ShowDocumentMessaging: extractData called with context:', context);
    
    // Initialize with show context data
    const showContext = {
      showId: context.show?.id,
      bidId: context.bid?.id,
      tourRequestId: context.tourRequest?.id,
      artistId: context.show?.artistId || context.bid?.artistId || context.tourRequest?.artistId || 'unknown',
      venueId: context.show?.venueId || context.bid?.venueId || context.tourRequest?.venueId || 'unknown',
      artistName: context.show?.artistName || context.bid?.artistName || context.tourRequest?.artistName || 'Artist',
      venueName: context.show?.venueName || context.bid?.venueName || context.tourRequest?.venueName || 'Venue'
    };

    console.log('🔵 ShowDocumentMessaging: Extracted showContext:', showContext);

    return {
      conversationId: undefined, // Will be set when conversation is initialized
      messages: [],
      participantIds: [],
      participantNames: [],
      showContext
    };
  },
  
  component: ShowDocumentMessagingModule
};