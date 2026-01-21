'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AgentPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{remaining: number | null; limit: number | null; tier: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || rateLimited) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          userId: user?.id, // Include for usage tracking
        })
      });

      const data = await response.json();

      // Handle rate limit
      if (response.status === 429 || data.rateLimited) {
        setRateLimited(true);
        setUsageInfo(data.usage);
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: `⚠️ Daily limit reached (${data.usage?.limit} messages/day on Free tier). Upgrade to Pro for unlimited access!` 
        }]);
        return;
      }

      // Update usage info
      if (data.usage) {
        setUsageInfo(data.usage);
      }

      if (data.error) {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: `[ERROR] ${data.error}` 
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
        content: '[ERROR] Connection failed. Please try again.' 
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

  const getCurrentTimestamp = () => {
    return new Date().toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const suggestions = [
    "Add my venue to the database",
    "Add my band to the database", 
    "Search for venues in Brooklyn",
    "How does booking work?"
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 border border-border-default flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <h1 className="text-sm font-medium text-text-accent uppercase tracking-wider">DIYSHOWS AGENT</h1>
              <p className="text-2xs text-text-muted uppercase tracking-wider">Booking Assistant v0.1</p>
            </div>
            {/* Usage indicator */}
            {usageInfo && usageInfo.remaining !== null && (
              <span className={`text-xs px-2 py-1 border ${
                usageInfo.remaining === 0 
                  ? 'border-red-500 text-red-400' 
                  : usageInfo.remaining <= 1 
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-border-subtle text-text-muted'
              }`}>
                {usageInfo.remaining}/{usageInfo.limit} LEFT
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <span className="text-2xs text-text-muted">{user.email}</span>
            ) : (
              <a href="/auth/login" className="text-2xs text-text-accent hover:underline">LOG IN</a>
            )}
            {usageInfo?.tier === 'FREE' && (
              <a href="/upgrade" className="text-2xs px-2 py-1 bg-text-accent text-bg-primary hover:opacity-80">
                UPGRADE
              </a>
            )}
            <a href="/" className="btn text-2xs">&lt;&lt; BACK</a>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="text-center py-12 border border-border-subtle bg-bg-secondary">
              <div className="text-5xl mb-6">⚡</div>
              <h2 className="text-lg font-medium text-text-accent mb-2">BOOKING AGENT READY</h2>
              <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">
                I can help you add venues and artists, find shows, manage bookings, and more.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-3 bg-bg-tertiary border border-border-subtle hover:border-border-default hover:bg-bg-hover transition-all text-left"
                  >
                    <span className="text-text-muted mr-2">&gt;</span>
                    <span className="text-xs text-text-primary">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {/* Message header */}
                    <div className={`text-2xs text-text-muted uppercase tracking-wider mb-1 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {msg.role === 'user' ? 'YOU' : 'AGENT'} • {getCurrentTimestamp()}
                    </div>
                    
                    {/* Message content */}
                    <div className={`p-3 border ${
                      msg.role === 'user'
                        ? 'bg-bg-tertiary border-border-default text-text-primary'
                        : 'bg-bg-secondary border-border-subtle text-text-primary'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="text-2xs text-text-muted uppercase tracking-wider mb-1">
                      AGENT • PROCESSING...
                    </div>
                    <div className="p-3 bg-bg-secondary border border-border-subtle">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-status-info animate-pulse"></span>
                        <span className="w-2 h-2 bg-status-info animate-pulse" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-status-info animate-pulse" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-border-subtle bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {rateLimited ? (
            <div className="text-center py-4">
              <p className="text-red-400 text-sm mb-3">DAILY LIMIT REACHED</p>
              <a 
                href="/upgrade" 
                className="inline-block px-6 py-3 bg-text-accent text-bg-primary text-sm uppercase tracking-wider hover:opacity-80"
              >
                UPGRADE TO PRO - $10/MO
              </a>
              <p className="text-text-muted text-2xs mt-2">Unlimited conversations • No transaction fees</p>
            </div>
          ) : (
            <div className="flex items-center bg-bg-tertiary border border-border-subtle focus-within:border-border-strong transition-colors">
              <span className="px-4 text-text-muted">&gt;&gt;</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="TYPE YOUR MESSAGE..."
                className="flex-1 bg-transparent py-3 text-sm text-text-primary placeholder-text-muted outline-none"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 text-xs uppercase tracking-wider font-medium border-l border-border-subtle transition-colors disabled:text-text-muted disabled:cursor-not-allowed text-text-accent hover:bg-bg-hover"
              >
                {isLoading ? 'SENDING...' : 'SEND'}
              </button>
            </div>
          )}
          
          {/* Quick actions hint */}
          {!rateLimited && (
            <div className="mt-2 text-2xs text-text-muted">
              <span className="uppercase tracking-wider">[ENTER]</span> to send • 
              <span className="uppercase tracking-wider ml-2">[SHIFT+ENTER]</span> for new line
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
