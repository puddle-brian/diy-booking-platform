'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StagedEntity {
  id: string;
  entityType: 'VENUE' | 'ARTIST';
  data: {
    name: string;
    city?: string;
    state?: string;
    venueType?: string;
    artistType?: string;
    [key: string]: unknown;
  };
  confidence: number;
  status: string;
  createdAt: string;
  aiNotes: string | null;
}

export default function DiscoverPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [stagedEntities, setStagedEntities] = useState<StagedEntity[]>([]);
  const [sessionStaged, setSessionStaged] = useState<string[]>([]); // IDs staged this session
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load staged entities
  const loadStagedEntities = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staged?status=PENDING&limit=20');
      if (res.ok) {
        const data = await res.json();
        setStagedEntities(data.entities || []);
      }
    } catch (error) {
      console.error('Failed to load staged entities:', error);
    }
  }, []);

  // Initial load and polling during search
  useEffect(() => {
    loadStagedEntities();
  }, [loadStagedEntities]);

  // Poll for updates while loading
  useEffect(() => {
    if (isLoading) {
      // Poll every 2 seconds while searching
      pollIntervalRef.current = setInterval(loadStagedEntities, 2000);
    } else {
      // Clear polling when done
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      // Final refresh when done
      loadStagedEntities();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isLoading, loadStagedEntities]);

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
    
    // Track entities before search to identify new ones
    const beforeIds = new Set(stagedEntities.map(e => e.id));
    
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
      
      // Refresh staged entities and track new ones
      const refreshRes = await fetch('/api/admin/staged?status=PENDING&limit=20');
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setStagedEntities(refreshData.entities || []);
        
        // Identify newly staged items
        const newIds = (refreshData.entities || [])
          .filter((e: StagedEntity) => !beforeIds.has(e.id))
          .map((e: StagedEntity) => e.id);
        setSessionStaged(prev => [...prev, ...newIds]);
      }
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
    setSessionStaged([]);
  };

  const handleQuickApprove = async (entity: StagedEntity) => {
    try {
      const res = await fetch(`/api/admin/staged/${entity.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: 'Quick approved from discovery' })
      });
      
      if (res.ok) {
        loadStagedEntities();
      }
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleQuickReject = async (entity: StagedEntity) => {
    try {
      const res = await fetch(`/api/admin/staged/${entity.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected from discovery view' })
      });
      
      if (res.ok) {
        loadStagedEntities();
      }
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const suggestedQueries = [
    "Find DIY venues in Portland, Oregon",
    "Search for punk house shows in Chicago",
    "Find noise rock bands from Providence, RI",
    "Look for all-ages venues in Austin, Texas",
  ];

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (confidence >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    return 'bg-red-500/20 text-red-400 border-red-500/40';
  };

  const newThisSession = stagedEntities.filter(e => sessionStaged.includes(e.id));
  const otherPending = stagedEntities.filter(e => !sessionStaged.includes(e.id));

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-text-accent">[DISCOVERY AGENT]</span>
              <span className="text-2xs text-text-muted uppercase tracking-wider">AI-Powered Database Builder</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/admin/staging" className="btn text-2xs">&lt;&lt; FULL REVIEW QUEUE</a>
              <button onClick={clearChat} className="btn text-2xs">CLEAR CHAT</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col border-r border-border-subtle">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome message if no messages */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-lg text-text-accent mb-2">Discovery Agent</h2>
                <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                  I'll search the web for DIY venues and artists, then stage them for your review.
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
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 ${
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
                    <span>Searching the web and staging findings...</span>
                  </div>
                  <div className="text-2xs text-text-muted mt-2">
                    Watch the panel on the right for new entries →
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
                placeholder="Ask me to find venues or artists..."
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
          </div>
        </div>

        {/* Right: Staging Queue */}
        <div className="w-96 flex flex-col bg-bg-secondary">
          <div className="p-3 border-b border-border-subtle">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-text-accent">
                STAGING QUEUE
              </span>
              <span className="text-2xs text-text-muted">
                {stagedEntities.length} pending
              </span>
            </div>
            {isLoading && (
              <div className="text-2xs text-status-info mt-1 animate-pulse">
                ● Updating...
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* New this session */}
            {newThisSession.length > 0 && (
              <div className="p-2">
                <div className="text-2xs text-status-active uppercase tracking-wider mb-2 px-2">
                  ✨ Found This Session ({newThisSession.length})
                </div>
                {newThisSession.map(entity => (
                  <div
                    key={entity.id}
                    className="p-2 mb-2 bg-status-active/10 border border-status-active/30 animate-in fade-in slide-in-from-right duration-300"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-xs text-text-primary font-medium">
                          {entity.data.name}
                        </div>
                        <div className="text-2xs text-text-secondary">
                          {entity.data.city}, {entity.data.state} • {entity.entityType}
                        </div>
                      </div>
                      <span className={`text-2xs px-1.5 py-0.5 border ${getConfidenceBadge(entity.confidence)}`}>
                        {entity.confidence}%
                      </span>
                    </div>
                    {entity.aiNotes && (
                      <div className="text-2xs text-text-muted mt-1 italic">
                        {entity.aiNotes.substring(0, 80)}...
                      </div>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => handleQuickApprove(entity)}
                        className="flex-1 py-1 text-2xs bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30"
                      >
                        ✓ APPROVE
                      </button>
                      <button
                        onClick={() => handleQuickReject(entity)}
                        className="flex-1 py-1 text-2xs bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                      >
                        ✗ REJECT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Other pending */}
            {otherPending.length > 0 && (
              <div className="p-2 border-t border-border-subtle">
                <div className="text-2xs text-text-muted uppercase tracking-wider mb-2 px-2">
                  Other Pending ({otherPending.length})
                </div>
                {otherPending.map(entity => (
                  <div
                    key={entity.id}
                    className="p-2 mb-2 bg-bg-tertiary border border-border-subtle"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-text-primary">
                          {entity.data.name}
                        </div>
                        <div className="text-2xs text-text-secondary">
                          {entity.data.city}, {entity.data.state}
                        </div>
                      </div>
                      <span className={`text-2xs px-1.5 py-0.5 border ${getConfidenceBadge(entity.confidence)}`}>
                        {entity.confidence}%
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => handleQuickApprove(entity)}
                        className="flex-1 py-1 text-2xs text-green-400 hover:bg-green-500/20"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleQuickReject(entity)}
                        className="flex-1 py-1 text-2xs text-red-400 hover:bg-red-500/20"
                      >
                        ✗
                      </button>
                      <a
                        href={`/admin/staging?selected=${entity.id}`}
                        className="flex-1 py-1 text-2xs text-text-muted hover:text-text-primary text-center"
                      >
                        EDIT
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stagedEntities.length === 0 && !isLoading && (
              <div className="p-4 text-center text-text-muted text-xs">
                No pending entries.
                <br />
                Ask me to find some!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
