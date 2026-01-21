'use client';

import { useState, useEffect } from 'react';
import AgentChat from './AgentChat';

interface SubmitChoiceProps {
  entityType: 'venue' | 'artist';
  children: React.ReactNode; // The form component
}

export default function SubmitChoice({ entityType, children }: SubmitChoiceProps) {
  const [mode, setMode] = useState<'agent' | 'form'>('agent');

  const title = entityType === 'venue' ? 'ADD_SPACE' : 'ADD_ARTIST';
  const agentPrompt = entityType === 'venue' 
    ? "Hi! I'd like to add my venue to DIY Shows."
    : "Hi! I'd like to add my band/artist to DIY Shows.";

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (mode === 'agent') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mode]);

  return (
    <>
      {/* Agent Modal Overlay */}
      {mode === 'agent' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMode('form')}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-xl mx-4 bg-bg-primary border border-border-default overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-secondary">
              <h2 className="text-sm font-medium text-text-accent uppercase tracking-wider">
                <span className="text-text-muted mr-2">&gt;</span>
                {title}
              </h2>
              <button 
                onClick={() => setMode('form')}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <span className="text-lg">[×]</span>
              </button>
            </div>
            
            {/* Chat */}
            <AgentChat 
              entityType={entityType}
              initialPrompt={agentPrompt}
            />
            
            {/* Footer */}
            <div className="px-6 py-3 bg-bg-secondary border-t border-border-subtle">
              <p className="text-center text-xs text-text-muted uppercase tracking-wider">
                Prefer manual?{' '}
                <button 
                  onClick={() => setMode('form')}
                  className="text-text-accent hover:text-text-primary underline"
                >
                  [FILL_FORM]
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form (shown when modal is closed, or as background) */}
      <div className={mode === 'agent' ? 'opacity-50' : ''}>
        {/* Banner to reopen agent */}
        {mode === 'form' && (
          <div className="bg-bg-secondary border-b border-border-subtle">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-text-muted uppercase tracking-wider">MANUAL_FORM_MODE</span>
              <button 
                onClick={() => setMode('agent')}
                className="text-text-accent hover:text-text-primary flex items-center gap-2 text-xs font-medium uppercase tracking-wider"
              >
                <span>⚡</span>
                [CHAT_WITH_AGENT]
              </button>
            </div>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
