'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackData {
  type: 'bug' | 'feature' | 'ux' | 'content' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  context: {
    url: string;
    userAgent: string;
    viewport: string;
    timestamp: string;
    userId?: string;
    userType?: string;
  };
}

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    type: 'bug' as FeedbackData['type'],
    priority: 'medium' as FeedbackData['priority'],
    title: '',
    description: '',
  });

  const feedbackTypes = {
    bug: { label: 'BUG REPORT', icon: '⚠' },
    feature: { label: 'FEATURE REQUEST', icon: '+' },
    ux: { label: 'UX/DESIGN', icon: '◊' },
    content: { label: 'CONTENT', icon: '▤' },
    other: { label: 'OTHER', icon: '○' }
  };

  const priorityLevels = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        ...formData,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString(),
          userId: user?.id,
          userType: user?.memberships?.[0]?.entityType || 'user',
        }
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({ type: 'bug', priority: 'medium', title: '', description: '' });
      }, 2000);

    } catch (error) {
      console.error('Feedback submission failed:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const suggestedPriority = {
      bug: 'high', feature: 'medium', ux: 'medium', content: 'low', other: 'low'
    }[formData.type] as FeedbackData['priority'];
    setFormData(prev => ({ ...prev, priority: suggestedPriority }));
  }, [formData.type]);

  if (submitted) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-bg-secondary border border-status-active text-status-active px-4 py-3 flex items-center text-xs uppercase tracking-wider">
          <span className="mr-2">✓</span> FEEDBACK SENT
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Feedback Button - Desktop Only */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex fixed bottom-24 right-6 z-30 bg-bg-secondary border border-border-subtle hover:border-status-info text-text-secondary hover:text-status-info px-4 py-3 items-center transition-all text-xs uppercase tracking-wider"
        >
          <span className="mr-2">💬</span> FEEDBACK
        </button>
      )}

      {/* Feedback Modal - Terminal Style */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg-primary/80" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-bg-secondary border border-border-subtle max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="module-header flex justify-between items-center">
              <span>&gt; SEND FEEDBACK</span>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary">
                [X]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="terminal-label block mb-2">TYPE</label>
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(feedbackTypes).map(([key, { label, icon }]) => (
                    <label key={key} className={`flex items-center p-2 cursor-pointer transition-colors ${
                      formData.type === key 
                        ? 'bg-bg-tertiary border border-border-default text-text-accent' 
                        : 'hover:bg-bg-hover text-text-secondary'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value={key}
                        checked={formData.type === key}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                        className="sr-only"
                      />
                      <span className="w-6 text-center mr-2">{icon}</span>
                      <span className="text-xs uppercase tracking-wider">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="terminal-label block mb-2">PRIORITY</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="input text-xs"
                >
                  {Object.entries(priorityLevels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="terminal-label block mb-2">SUMMARY *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description..."
                  className="input text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="terminal-label block mb-2">DETAILS *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details. For bugs, include steps to reproduce."
                  className="input text-xs resize-none"
                />
              </div>

              {/* Context Info */}
              <div className="p-3 bg-bg-tertiary border border-border-subtle">
                <p className="text-2xs text-text-muted uppercase tracking-wider mb-2">[AUTO-INCLUDED]</p>
                <ul className="text-2xs text-text-muted space-y-1">
                  <li>• Page: {typeof window !== 'undefined' ? window.location.pathname : ''}</li>
                  <li>• Browser & viewport</li>
                  <li>• Timestamp</li>
                  {user && <li>• User ID for follow-up</li>}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="btn flex-1 text-2xs">
                  CANCEL
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 text-2xs">
                  {isSubmitting ? 'SENDING...' : 'SEND'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Mobile Feedback Button - Terminal Style
export function MobileFeedbackButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    type: 'bug' as FeedbackData['type'],
    priority: 'medium' as FeedbackData['priority'],
    title: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        ...formData,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString(),
          userId: user?.id,
          userType: user?.memberships?.[0]?.entityType || 'user',
        }
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({ type: 'bug', priority: 'medium', title: '', description: '' });
      }, 2000);

    } catch (error) {
      console.error('Feedback submission failed:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <span className="text-2xs text-status-active uppercase tracking-wider ml-2">✓ SENT</span>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-2xs text-text-muted hover:text-status-info uppercase tracking-wider transition-colors ml-2"
      >
        [FEEDBACK]
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg-primary/80" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-bg-secondary border border-border-subtle max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="module-header flex justify-between items-center">
              <span>&gt; QUICK FEEDBACK</span>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary">[X]</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="terminal-label block mb-2">SUMMARY *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What's the issue or suggestion?"
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="terminal-label block mb-2">DETAILS</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional: provide more context..."
                  className="input text-xs resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="btn flex-1 text-2xs">CANCEL</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 text-2xs">
                  {isSubmitting ? 'SENDING...' : 'SEND'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
