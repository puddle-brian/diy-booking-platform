'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import InlineMessagePanel from '../../components/InlineMessagePanel';

interface Conversation {
  id: string;
  recipientId: string;
  recipientName: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderName: string;
    isFromMe: boolean;
  };
  updatedAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<{
    recipientId: string;
    recipientName: string;
    recipientType: 'artist' | 'venue' | 'user';
  } | null>(null);

  // Helper function to get headers with debug user info if needed
  const getApiHeaders = () => {
    const headers: Record<string, string> = {};

    // If user is a debug user (stored in localStorage), include it in headers
    if (typeof window !== 'undefined') {
      const debugUser = localStorage.getItem('debugUser');
      if (debugUser && user) {
        headers['x-debug-user'] = debugUser;
      }
    }

    return headers;
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations', {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        console.error('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
          <p className="text-gray-600">Please log in to view your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Your conversations with artists and venues</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  💬
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-6">Start messaging artists and venues to see your conversations here.</p>
                <div className="space-y-2">
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => router.back()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Go Back
                    </button>
                    <a href="/artists" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Browse Artists
                    </a>
                    <a href="/venues" className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      Browse Venues
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation({
                      recipientId: conversation.recipientId,
                      recipientName: conversation.recipientName,
                      recipientType: 'user' // We'll improve this later
                    })}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold mr-4">
                      {conversation.recipientName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.recipientName}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage ? (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.isFromMe ? 'You: ' : `${conversation.lastMessage.senderName}: `}
                          {conversation.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No messages yet</p>
                      )}
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Message Panel */}
      {selectedConversation && (
        <InlineMessagePanel
          isOpen={!!selectedConversation}
          onClose={() => setSelectedConversation(null)}
          recipientId={selectedConversation.recipientId}
          recipientName={selectedConversation.recipientName}
          recipientType={selectedConversation.recipientType}
          context={{
            fromPage: 'messages-inbox',
            entityName: selectedConversation.recipientName,
            entityType: 'user'
          }}
        />
      )}
    </div>
  );
} 