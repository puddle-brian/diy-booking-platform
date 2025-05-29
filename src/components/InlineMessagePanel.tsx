'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

interface InlineMessagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientType: 'artist' | 'venue' | 'user';
  onMessagesRead?: () => void;
  context?: {
    fromPage: string;
    entityName: string;
    entityType: string;
  };
}

export default function InlineMessagePanel({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientType,
  onMessagesRead,
  context
}: InlineMessagePanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation when panel opens
  useEffect(() => {
    if (isOpen && user && recipientId) {
      initializeConversation();
    }
  }, [isOpen, user, recipientId]);

  // Helper function to get headers with debug user info if needed
  const getApiHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If user is a debug user (stored in localStorage), include it in headers
    if (typeof window !== 'undefined') {
      const debugUser = localStorage.getItem('debugUser');
      if (debugUser && user) {
        console.log('🔐 Frontend: Debug user from localStorage:', debugUser);
        console.log('🔐 Frontend: Current user object:', user);
        headers['x-debug-user'] = debugUser;
        console.log('🔐 Frontend: Sending headers:', headers);
      }
    }

    return headers;
  };

  const initializeConversation = async () => {
    setLoading(true);
    try {
      // Create or find existing conversation
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          recipientId,
          recipientName,
          recipientType,
        }),
      });

      if (response.status === 401) {
        console.error('Authentication failed - user may need to log in again');
        alert('Please log in again to send messages');
        return;
      }

      if (response.ok) {
        const { conversationId: convId } = await response.json();
        setConversationId(convId);
        await loadMessages(convId);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create conversation:', errorData);
        alert(`Failed to start conversation: ${errorData.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      alert('Failed to start conversation. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const response = await fetch(`/api/messages/${convId}`, {
        headers: getApiHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Notify parent component that messages were read (to refresh unread counts)
        if (onMessagesRead) {
          onMessagesRead();
        }
        // Also trigger global refresh for notification badge
        window.dispatchEvent(new CustomEvent('refreshUnreadCount'));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          content: newMessage,
          senderId: user.id,
          senderName: user.name,
          senderType: user.profileType || 'user',
        }),
      });

      if (response.status === 401) {
        console.error('Authentication failed while sending message');
        alert('Please log in again to send messages');
        return;
      }

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to send message:', errorData);
        alert(`Failed to send message: ${errorData.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Quick message templates for common booking scenarios
  const getQuickMessages = () => {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
    
    if (recipientType === 'artist') {
      // Templates for messaging artists (from venues)
      return [
        `Hi! I'd love to have ${recipientName} play at our venue. Are you booking shows for the coming months?`,
        `What's your availability like for ${currentMonth}? We have some great dates open.`,
        `I run ${context?.entityName || 'a venue'} and think you'd be a perfect fit for our space. Interested in discussing a show?`,
        `Could you send me your tech rider and any booking requirements? We're interested in having you play.`
      ];
    } else {
      // Templates for messaging venues (from artists)
      return [
        `Hi! I'm interested in booking a show at ${recipientName}. Are you available for dates in the coming months?`,
        `What's your availability like for ${currentMonth}? We're planning a tour and would love to play your venue.`,
        `Could you send me your booking requirements and any venue details? We're interested in playing a show.`,
        `I'd love to discuss a potential show at your venue. When would be a good time to chat about availability?`
      ];
    }
  };

  const quickMessages = getQuickMessages();

  const insertQuickMessage = (template: string) => {
    setNewMessage(template);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-96 sm:w-[420px] bg-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {recipientName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{recipientName}</h3>
              <p className="text-xs text-gray-500 capitalize">{recipientType}</p>
              {context && (
                <p className="text-xs text-blue-600">
                  From {context.entityName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                💬
              </div>
              <p className="text-sm text-gray-600 mb-4">Start the conversation!</p>
              
              {/* Quick Message Templates */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Quick messages:</p>
                {quickMessages.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => insertQuickMessage(template)}
                    className="block w-full text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-xs ${message.senderId === user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* User Badge/Avatar */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    message.senderId === user?.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {message.senderName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                  </div>
                  
                  {/* Message Bubble */}
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.senderId === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm">
                      {message.senderId !== user?.id && (
                        <div className="font-medium mb-1 text-xs opacity-75">{message.senderName}</div>
                      )}
                      <p className="leading-relaxed">{message.content}</p>
                      <div
                        className={`text-xs mt-1 opacity-75 ${
                          message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {/* Tip moved above textarea */}
            {messages.length === 0 && (
              <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                💡 <strong>Tip:</strong> Use the quick messages above to get started, or write your own message below
              </div>
            )}
            
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${recipientName}...`}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              rows={3}
              disabled={sending || loading}
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {newMessage.length > 0 ? `${newMessage.length} characters` : 'Type your message...'}
              </div>
              <button
                type="submit"
                disabled={sending || !newMessage.trim() || loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
} 