'use client';

import React, { useState } from 'react';

const PRESET_DURATIONS = [
  { hours: 24, label: '24h' },
  { hours: 48, label: '48h' },
  { hours: 72, label: '72h' },
  { hours: 168, label: '1wk' }
];

interface HoldRequestFormProps {
  onSubmit: (formData: {
    duration: number;
    reason: string;
  }) => void;
  onCancel: () => void;
  otherPartyName: string;
}

export function HoldRequestForm({ onSubmit, onCancel, otherPartyName }: HoldRequestFormProps) {
  const [duration, setDuration] = useState(48); // Default to 48 hours
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        duration,
        reason: message.trim() || 'Hold request' // Fallback if no message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Duration Selection - Compact horizontal layout */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Duration</label>
        <div className="flex gap-2">
          {PRESET_DURATIONS.map((preset) => (
            <button
              key={preset.hours}
              type="button"
              onClick={() => setDuration(preset.hours)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                duration === preset.hours
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Message - Compact */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Quick note (optional)"
          rows={2}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
        />
      </div>

      {/* Compact Action Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>Requesting...</span>
            </div>
          ) : (
            '🔒 Request Hold'
          )}
        </button>
      </div>
    </form>
  );
} 