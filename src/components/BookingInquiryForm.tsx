'use client';

import { useState } from 'react';

interface BookingInquiryFormProps {
  // Who is receiving the inquiry
  recipientType: 'artist' | 'venue';
  recipientId: string;
  recipientName: string;
  
  // Optional: Pre-fill inquirer details if logged in
  inquirerType?: 'artist' | 'venue';
  inquirerId?: string;
  inquirerName?: string;
  inquirerEmail?: string;
  inquirerPhone?: string;
  
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BookingInquiryForm({
  recipientType,
  recipientId,
  recipientName,
  inquirerType,
  inquirerId,
  inquirerName,
  inquirerEmail,
  inquirerPhone,
  onSuccess,
  onCancel
}: BookingInquiryFormProps) {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    inquirerName: inquirerName || '',
    inquirerEmail: inquirerEmail || '',
    inquirerPhone: inquirerPhone || '',
    proposedDate: '',
    alternativeDates: [] as string[],
    eventType: 'concert',
    expectedAttendance: '',
    guarantee: '',
    doorSplit: '',
    ticketPrice: '',
    message: '',
    riders: ''
  });

  const handleSubmit = async () => {
    if (!formData.inquirerName || !formData.inquirerEmail || !formData.proposedDate || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/booking-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inquirerType: inquirerType || 'artist',
          inquirerId: inquirerId || 'anonymous',
          inquirerName: formData.inquirerName,
          inquirerEmail: formData.inquirerEmail,
          inquirerPhone: formData.inquirerPhone,
          recipientType,
          recipientId,
          recipientName,
          proposedDate: formData.proposedDate,
          alternativeDates: formData.alternativeDates,
          eventType: formData.eventType,
          expectedAttendance: formData.expectedAttendance ? parseInt(formData.expectedAttendance) : undefined,
          guarantee: formData.guarantee ? parseFloat(formData.guarantee) : undefined,
          doorSplit: formData.doorSplit,
          ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : undefined,
          message: formData.message,
          riders: formData.riders,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to send inquiry');
      }

      // Skip the 'sent' step and immediately call onSuccess
      onSuccess?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (step === 'preview') {
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Review Your Inquiry
          </h3>
          <p className="text-gray-600">
            Here's what will be sent to {recipientName}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <strong className="text-gray-700">From:</strong> {formData.inquirerName} ({formData.inquirerEmail})
          </div>
          <div>
            <strong className="text-gray-700">To:</strong> {recipientName}
          </div>
          <div>
            <strong className="text-gray-700">Proposed Date:</strong> {formatDate(formData.proposedDate)}
          </div>
          {formData.alternativeDates.length > 0 && (
            <div>
              <strong className="text-gray-700">Alternative Dates:</strong> {formData.alternativeDates.map(date => formatDate(date)).join(', ')}
            </div>
          )}
          <div>
            <strong className="text-gray-700">Event Type:</strong> {formData.eventType}
          </div>
          {formData.expectedAttendance && (
            <div>
              <strong className="text-gray-700">Expected Attendance:</strong> {formData.expectedAttendance}
            </div>
          )}
          {(formData.guarantee || formData.doorSplit || formData.ticketPrice) && (
            <div>
              <strong className="text-gray-700">Financial Details:</strong>
              <div className="ml-4 text-sm">
                {formData.guarantee && <div>• Guarantee: ${formData.guarantee}</div>}
                {formData.doorSplit && <div>• Door Split: {formData.doorSplit}</div>}
                {formData.ticketPrice && <div>• Ticket Price: ${formData.ticketPrice}</div>}
              </div>
            </div>
          )}
          <div>
            <strong className="text-gray-700">Message:</strong>
            <div className="mt-1 text-gray-600 whitespace-pre-line">{formData.message}</div>
          </div>
          {formData.riders && (
            <div>
              <strong className="text-gray-700">Technical Requirements:</strong>
              <div className="mt-1 text-gray-600 whitespace-pre-line">{formData.riders}</div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            ← Edit Inquiry
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Inquiry 📧'}
          </button>
        </div>
      </div>
    );
  }

  // Form step
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Get In Touch with {recipientName}
        </h3>
        <p className="text-gray-600">
          Send a booking inquiry to discuss show dates, splits, and details.
        </p>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        setStep('preview');
      }} className="space-y-4">
        
        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Your Contact Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={formData.inquirerName}
              onChange={(e) => setFormData(prev => ({ ...prev, inquirerName: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Artist or band name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.inquirerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, inquirerEmail: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.inquirerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, inquirerPhone: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Event Details</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Date *</label>
            <input
              type="date"
              required
              value={formData.proposedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, proposedDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="concert">Concert</option>
              <option value="festival">Festival</option>
              <option value="showcase">Showcase</option>
              <option value="private-event">Private Event</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Attendance</label>
            <input
              type="number"
              value={formData.expectedAttendance}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedAttendance: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="How many people you expect"
            />
          </div>
        </div>

        {/* Financial Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Financial Details (Optional)</h4>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.guarantee}
                onChange={(e) => setFormData(prev => ({ ...prev, guarantee: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Door Split</label>
              <select
                value={formData.doorSplit}
                onChange={(e) => setFormData(prev => ({ ...prev, doorSplit: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select split</option>
                <option value="50/50">50/50</option>
                <option value="60/40">60/40 (venue/artist)</option>
                <option value="70/30">70/30 (venue/artist)</option>
                <option value="80/20">80/20 (venue/artist)</option>
                <option value="100% to artist">100% to artist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.ticketPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, ticketPrice: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="15"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
          <textarea
            rows={4}
            required
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Tell them about your music, why you'd like to play this venue, tour dates, etc."
          />
        </div>

        {/* Technical Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Technical/Hospitality Requirements</label>
          <textarea
            rows={3}
            value={formData.riders}
            onChange={(e) => setFormData(prev => ({ ...prev, riders: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Sound equipment needs, backline, hospitality requests, etc."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Preview Inquiry →
          </button>
        </div>
      </form>
    </div>
  );
} 