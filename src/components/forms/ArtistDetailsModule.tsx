import React from 'react';
import { ArtistType, ArtistStatus, ARTIST_STATUS_OPTIONS, CAPACITY_OPTIONS } from '../../../types/index';

export interface ArtistDetailsData {
  members?: string;
  yearFormed?: string;
  status: ArtistStatus;
  expectedDraw?: string;
  // Future artist features
  tourHistory?: string[];
  pressQuotes?: string[];
  awards?: string[];
  influences?: string[];
}

export interface ArtistDetailsModuleProps {
  artistType: ArtistType;
  details: ArtistDetailsData;
  onDetailsChange: (details: ArtistDetailsData) => void;
  className?: string;
}

export const ArtistDetailsModule: React.FC<ArtistDetailsModuleProps> = ({
  artistType,
  details,
  onDetailsChange,
  className = ''
}) => {
  const handleInputChange = (field: keyof ArtistDetailsData, value: string) => {
    onDetailsChange({
      ...details,
      [field]: value
    });
  };

  // Check if artist type should show members/year formed fields
  const showGroupFields = ['band', 'duo', 'collective', 'theater-group'].includes(artistType);

  return (
    <div className={`space-y-6 ${className}`}>
      <h4 className="text-lg font-medium text-gray-800 mb-3">Performance Details</h4>
      <p className="text-sm text-gray-600 mb-4">
        Tell venues about your experience and what they can expect.
      </p>

      <div className="space-y-6">
        {/* Conditional Members & Year Formed - only show for multi-member artist types */}
        {showGroupFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ease-in-out">
            <div>
              <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Members
              </label>
              <select
                id="members"
                value={details.members || ''}
                onChange={(e) => handleInputChange('members', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7+</option>
              </select>
            </div>
            <div>
              <label htmlFor="year-formed" className="block text-sm font-medium text-gray-700 mb-2">
                Year Formed
              </label>
              <select
                id="year-formed"
                value={details.yearFormed || ''}
                onChange={(e) => handleInputChange('yearFormed', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select year...</option>
                {Array.from({length: 15}, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
                <option value="earlier">Earlier than {new Date().getFullYear() - 14}</option>
              </select>
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Current Status
          </label>
          <select
            id="status"
            value={details.status}
            onChange={(e) => handleInputChange('status', e.target.value as ArtistStatus)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {ARTIST_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Let venues know if you're actively booking shows
          </p>
        </div>

        {/* Expected Draw */}
        <div>
          <label htmlFor="expected-draw" className="block text-sm font-medium text-gray-700 mb-2">
            Expected Draw
          </label>
          <select
            id="expected-draw"
            value={details.expectedDraw || ''}
            onChange={(e) => handleInputChange('expectedDraw', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Select expected draw...</option>
            {CAPACITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Honest estimates help venues plan appropriate shows
          </p>
        </div>
      </div>

      {/* Helpful Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">💡 Profile Tips</h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Be honest about your draw - it helps venues book appropriate shows</li>
          <li>• Update your status regularly to let venues know you're available</li>
          <li>• {showGroupFields ? 'Group details help venues understand your setup needs' : 'Solo artists often have more flexible booking options'}</li>
        </ul>
      </div>
    </div>
  );
}; 