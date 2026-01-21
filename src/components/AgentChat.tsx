'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentChatProps {
  initialPrompt?: string;
  entityType: 'venue' | 'artist';
  onClose?: () => void;
}

export default function AgentChat({ initialPrompt, entityType, onClose }: AgentChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-start conversation if we have an initial prompt
  useEffect(() => {
    if (initialPrompt && !hasStarted) {
      setHasStarted(true);
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, hasStarted]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading || rateLimited) return;

    if (!messageText) {
      setInput('');
    }
    setIsLoading(true);

    // Add user message to UI immediately (only if it's user-initiated, not the auto-prompt)
    const isAutoPrompt = messageText === initialPrompt && messages.length === 0;
    const newMessages: Message[] = isAutoPrompt 
      ? messages 
      : [...messages, { role: 'user', content: textToSend }];
    
    if (!isAutoPrompt) {
      setMessages(newMessages);
    }

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages,
          userId: user?.id, // Include for usage tracking
        })
      });

      const data = await response.json();

      // Handle rate limit
      if (response.status === 429 || data.rateLimited) {
        setRateLimited(true);
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: `⚠️ Daily limit reached. ${data.usage?.upgradeMessage || 'Upgrade to Pro for unlimited access!'}` 
        }]);
        return;
      }

      if (data.error) {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${data.error}. Please try again.` 
        }]);
      } else {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: data.message 
        }]);
      }
    } catch (error) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl overflow-hidden">
      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.length === 0 && isLoading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">
                {entityType === 'venue' ? '🏠' : '🎸'}
              </div>
              <p className="text-gray-400">
                Starting conversation...
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-gray-200 p-4 bg-gray-50">
        {rateLimited ? (
          <div className="text-center py-2">
            <p className="text-red-600 text-sm mb-2">Daily limit reached</p>
            <a 
              href="/upgrade" 
              className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800"
            >
              Upgrade to Pro - $10/mo
            </a>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 rounded-full font-medium text-white text-sm transition-colors"
            >
              Send
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
