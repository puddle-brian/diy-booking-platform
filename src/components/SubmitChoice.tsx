'use client';

import { useState, useEffect } from 'react';
import AgentChat from './AgentChat';

interface SubmitChoiceProps {
  entityType: 'venue' | 'artist';
  children: React.ReactNode; // The form component
}

export default function SubmitChoice({ entityType, children }: SubmitChoiceProps) {
  const [mode, setMode] = useState<'agent' | 'form'>('agent');

  const title = entityType === 'venue' ? 'Add Your Space' : 'Add Your Artist';
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMode('form')}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button 
                onClick={() => setMode('form')}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Chat */}
            <AgentChat 
              entityType={entityType}
              initialPrompt={agentPrompt}
            />
            
            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Prefer to do it yourself?{' '}
                <button 
                  onClick={() => setMode('form')}
                  className="text-gray-700 underline hover:text-black"
                >
                  Fill out the form instead
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
          <div className="bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">Filling out the form manually</span>
              <button 
                onClick={() => setMode('agent')}
                className="text-white hover:text-gray-200 flex items-center gap-2 text-sm font-medium"
              >
                <span>💬</span>
                Chat with agent instead
              </button>
            </div>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
