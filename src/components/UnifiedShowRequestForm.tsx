import React, { useState } from 'react';
import LocationVenueAutocomplete from './LocationVenueAutocomplete';

interface UnifiedShowRequestFormProps {
  // Form configuration
  formType: 'request' | 'confirmed' | 'offer';
  
  // Pre-filled data
  preSelectedVenue?: { id: string; name: string } | null;
  preSelectedDate?: string;
  preSelectedArtist?: { id: string; name: string } | null;
  
  // Context information
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  
  // Handlers
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  
  // UI configuration
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  
  // Loading state (controlled by parent)
  loading?: boolean;
}

export default function UnifiedShowRequestForm({
  formType,
  preSelectedVenue = null,
  preSelectedDate = '',
  preSelectedArtist = null,
  artistId,
  artistName,
  venueId,
  venueName,
  onSubmit,
  onCancel,
  title,
  subtitle,
  submitButtonText,
  loading = false
}: UnifiedShowRequestFormProps) {
  // Form state - matches both previous forms
  const [formData, setFormData] = useState({
    requestDate: preSelectedDate || '',
    date: preSelectedDate || '', // For confirmed shows
    location: preSelectedVenue ? `venue:${preSelectedVenue.id}:${preSelectedVenue.name}` : '',
    title: '',
    description: '',
    
    // Additional fields for different form types
    artistId: preSelectedArtist?.id || '',
    artistName: preSelectedArtist?.name || '',
    venueId: preSelectedVenue?.id || '',
    venueName: preSelectedVenue?.name || '',
    
    // Confirmed show fields
    guarantee: '',
    capacity: '',
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+' | 'flexible',
    loadIn: '',
    soundcheck: '',
    doorsOpen: '',
    showTime: '',
    curfew: '',
    notes: ''
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Basic validation
      const dateField = formType === 'request' ? formData.requestDate : formData.date;
      if (!dateField || !formData.location) {
        throw new Error('Please fill in all required fields.');
      }

      await onSubmit(formData);
    } catch (error) {
      console.error('Error in form submission:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit form');
    }
  };

  // Determine default title and subtitle
  const defaultTitle = title || (() => {
    switch (formType) {
      case 'request': return 'Request Show';
      case 'offer': return 'Make Offer';
      case 'confirmed': return 'Add Show';
      default: return 'Add Date';
    }
  })();

  const defaultSubtitle = subtitle || (() => {
    if (formType === 'request' && artistName && preSelectedVenue) {
      return `${artistName} requesting show at ${preSelectedVenue.name}`;
    }
    if (formType === 'offer' && venueName && preSelectedArtist) {
      return `${venueName} inviting ${preSelectedArtist.name}`;
    }
    if (formType === 'request' && artistName) {
      return `${artistName} requesting show`;
    }
    return '';
  })();

  const defaultSubmitText = submitButtonText || (() => {
    switch (formType) {
      case 'request': return loading ? 'Creating Request...' : 'Create Show Request';
      case 'offer': return loading ? 'Sending Offer...' : 'Send Offer';
      case 'confirmed': return loading ? 'Adding Show...' : 'Add to Calendar';
      default: return loading ? 'Submitting...' : 'Submit';
    }
  })();

  return (
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{defaultTitle}</h3>
            {defaultSubtitle && (
              <p className="text-sm text-gray-600 mt-1">{defaultSubtitle}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Show Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Show Date *
            </label>
            <input
              type="date"
              required
              value={formType === 'request' ? formData.requestDate : formData.date}
              onChange={(e) => {
                const field = formType === 'request' ? 'requestDate' : 'date';
                setFormData(prev => ({ ...prev, [field]: e.target.value }));
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location/Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <LocationVenueAutocomplete
              value={formData.location}
              onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              placeholder="Type location or venue name..."
              required
              label="Location"
              showLabel={false}
              preSelectedVenue={preSelectedVenue}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Leave blank to auto-generate"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={
                formType === 'request' 
                  ? "Tell venues about your show, expected draw, or any special requirements..."
                  : "Additional notes about this show..."
              }
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Additional fields for confirmed shows */}
          {formType === 'confirmed' && (
            <>
              {/* Venue/Artist fields based on context */}
              {artistId && !venueId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.venueName}
                    onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                    placeholder="Enter venue name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {venueId && !artistId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.artistName}
                    onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                    placeholder="Enter artist name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Show details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantee
                  </label>
                  <input
                    type="number"
                    value={formData.guarantee}
                    onChange={(e) => setFormData(prev => ({ ...prev, guarantee: e.target.value }))}
                    placeholder="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Restriction
                  </label>
                  <select
                    value={formData.ageRestriction}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      ageRestriction: e.target.value as 'all-ages' | '18+' | '21+' | 'flexible'
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all-ages">All Ages</option>
                    <option value="18+">18+</option>
                    <option value="21+">21+</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              {/* Show times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doors Open
                  </label>
                  <input
                    type="time"
                    value={formData.doorsOpen}
                    onChange={(e) => setFormData(prev => ({ ...prev, doorsOpen: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Show Time
                  </label>
                  <input
                    type="time"
                    value={formData.showTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, showTime: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {defaultSubmitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 