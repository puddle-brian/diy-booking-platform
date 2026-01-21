'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function DiscoverPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/discovery/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      
      // Add assistant response to display
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // Update conversation history for context
      setConversationHistory(data.conversationHistory || []);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Error: Failed to get response. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  const suggestedQueries = [
    "Find DIY venues in Portland, Oregon",
    "Search for punk house shows in Chicago",
    "Find noise rock bands from Providence, RI",
    "Look for all-ages venues in Austin, Texas",
    "Search for warehouse venues in Brooklyn",
    "Find indie bands on Bandcamp from Philadelphia"
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-text-accent">[DISCOVERY AGENT]</span>
              <span className="text-2xs text-text-muted uppercase tracking-wider">AI-Powered Database Builder</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/admin/staging" className="btn text-2xs">&lt;&lt; REVIEW QUEUE</a>
              <button onClick={clearChat} className="btn text-2xs">CLEAR CHAT</button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-lg text-text-accent mb-2">Discovery Agent</h2>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                I can search the web to find DIY venues and artists, then stage them for your review.
                Tell me what you're looking for!
              </p>
              
              <div className="space-y-2">
                <p className="text-2xs text-text-muted uppercase tracking-wider mb-3">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQueries.map((query, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(query)}
                      className="px-3 py-1.5 text-xs bg-bg-tertiary border border-border-subtle hover:border-text-accent hover:text-text-accent transition-all"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-4 bg-bg-secondary border border-border-subtle max-w-md mx-auto text-left">
                <p className="text-2xs text-text-muted uppercase tracking-wider mb-2">Setup Note</p>
                <p className="text-xs text-text-secondary">
                  For web search to work, add a search API key to your .env file:
                </p>
                <ul className="text-xs text-text-muted mt-2 space-y-1">
                  <li>• <code className="text-status-info">TAVILY_API_KEY</code> - Get one at tavily.com</li>
                  <li>• <code className="text-status-info">SERPER_API_KEY</code> - Get one at serper.dev</li>
                </ul>
                <p className="text-xs text-text-secondary mt-2">
                  Without a search API, you can still manually describe venues/artists and I'll stage them.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 ${
                  msg.role === 'user'
                    ? 'bg-status-info/20 border border-status-info/40 text-text-primary'
                    : 'bg-bg-secondary border border-border-subtle text-text-primary'
                }`}
              >
                <div className="text-2xs text-text-muted mb-1 uppercase tracking-wider">
                  {msg.role === 'user' ? 'You' : 'Discovery Agent'}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-bg-secondary border border-border-subtle p-3">
                <div className="text-2xs text-text-muted mb-1 uppercase tracking-wider">Discovery Agent</div>
                <div className="flex items-center space-x-2 text-sm text-text-secondary">
                  <span className="animate-pulse">●</span>
                  <span>Searching...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border-subtle bg-bg-secondary p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to find venues or artists... (Enter to send, Shift+Enter for new line)"
              className="flex-1 bg-bg-primary border border-border-subtle text-text-primary text-sm px-3 py-2 resize-none focus:outline-none focus:border-text-accent"
              rows={2}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-status-active/20 text-status-active border border-status-active/40 hover:bg-status-active/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? '...' : 'SEND'}
            </button>
          </form>
          <div className="mt-2 text-2xs text-text-muted">
            Found items are staged for review. <a href="/admin/staging" className="text-status-info hover:underline">View review queue →</a>
          </div>
        </div>
      </main>
    </div>
  );
}
