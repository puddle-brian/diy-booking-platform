'use client';

import React, { useState } from 'react';

const PRESET_DURATIONS = [
  { hours: 24, label: '24 hours', description: 'Quick decision needed' },
  { hours: 48, label: '48 hours', description: 'Standard review time' },
  { hours: 72, label: '72 hours', description: 'Weekend consideration' },
  { hours: 168, label: '1 week', description: 'Complex decision' }
];

const PRESET_REASONS = [
  'Need to confirm opening acts',
  'Waiting for collective/band decision',
  'Checking availability with sound engineer',
  'Coordinating with other venues in area',
  'Need time to review technical requirements',
  'Waiting on budget approval',
  'Custom reason...'
];

interface HoldRequestFormProps {
  onSubmit: (formData: {
    duration: number;
    reason: string;
    customMessage?: string;
  }) => void;
  onCancel: () => void;
  otherPartyName: string;
}

export function HoldRequestForm({ onSubmit, onCancel, otherPartyName }: HoldRequestFormProps) {
  const [duration, setDuration] = useState(48); // Default to 48 hours
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    const finalReason = reason === 'Custom reason...' ? customReason : reason;
    
    try {
      await onSubmit({
        duration,
        reason: finalReason,
        customMessage: customMessage.trim() || undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDuration = PRESET_DURATIONS.find(d => d.hours === duration);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Hold Duration
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_DURATIONS.map((preset) => (
            <button
              key={preset.hours}
              type="button"
              onClick={() => setDuration(preset.hours)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                duration === preset.hours
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{preset.label}</div>
              <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
            </button>
          ))}
        </div>
        {selectedDuration && (
          <p className="text-sm text-gray-600 mt-2">
            🕒 Hold will last {selectedDuration.label} once approved by {otherPartyName}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Reason for Hold
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select a reason...</option>
          {PRESET_REASONS.map((presetReason) => (
            <option key={presetReason} value={presetReason}>
              {presetReason}
            </option>
          ))}
        </select>
      </div>

      {reason === 'Custom reason...' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Custom Reason
          </label>
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Explain why you need this hold..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Additional Message (Optional)
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder={`Add any additional context for ${otherPartyName}...`}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-600 text-sm">⚠️</span>
          <div className="text-sm text-yellow-800">
            <strong>Important:</strong> This hold will block competing offers once approved. 
            Only request a hold if you're seriously considering this opportunity.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!reason.trim() || (reason === 'Custom reason...' && !customReason.trim()) || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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