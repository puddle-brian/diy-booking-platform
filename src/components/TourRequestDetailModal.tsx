'use client';

import React from 'react';
import { TourRequest } from '../../types';

interface TourRequestDetailModalProps {
  tourRequest: TourRequest;
  isOpen: boolean;
  onClose: () => void;
  onPlaceBid?: () => void;
  viewerType?: 'artist' | 'venue' | 'public';
}

export default function TourRequestDetailModal({ 
  tourRequest, 
  isOpen, 
  onClose, 
  onPlaceBid,
  viewerType = 'public' 
}: TourRequestDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tourRequest.title}</h2>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(tourRequest.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })} - {new Date(tourRequest.endDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {tourRequest.location}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tourRequest.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {tourRequest.status.charAt(0).toUpperCase() + tourRequest.status.slice(1)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Tour Details */}
            <div className="space-y-6">
              
              {/* Tour Information */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0V7" />
                  </svg>
                  Tour Details
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block text-sm">Description:</span>
                    <p className="font-medium text-gray-900">{tourRequest.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600 block text-sm">Tour Status:</span>
                      <span className="font-medium capitalize">{tourRequest.tourStatus.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Priority:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        tourRequest.priority === 'high' ? 'bg-red-100 text-red-800' :
                        tourRequest.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {tourRequest.priority.charAt(0).toUpperCase() + tourRequest.priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 block text-sm">Flexibility:</span>
                    <span className="font-medium capitalize">{tourRequest.flexibility.replace('-', ' ')}</span>
                  </div>

                  {tourRequest.radius && (
                    <div>
                      <span className="text-gray-600 block text-sm">Search Radius:</span>
                      <span className="font-medium">{tourRequest.radius} miles</span>
                    </div>
                  )}

                  {tourRequest.genres && tourRequest.genres.length > 0 && (
                    <div>
                      <span className="text-gray-600 block text-sm">Genres:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tourRequest.genres.map((genre, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Artist Expectations */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Expected Draw
                </h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600 block text-sm">Minimum:</span>
                      <span className="font-semibold text-green-700">{tourRequest.expectedDraw.min}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Maximum:</span>
                      <span className="font-semibold text-green-700">{tourRequest.expectedDraw.max}</span>
                    </div>
                  </div>
                  
                  {tourRequest.expectedDraw.description && (
                    <div>
                      <span className="text-gray-600 block text-sm">Draw Notes:</span>
                      <p className="font-medium text-gray-900">{tourRequest.expectedDraw.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Financial & Requirements */}
            <div className="space-y-6">
              
              {/* Financial Terms */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Financial Terms
                </h3>
                
                <div className="space-y-4">
                  {tourRequest.guaranteeRange && tourRequest.guaranteeRange.min > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        ${tourRequest.guaranteeRange.min} minimum guarantee
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600 block text-sm">Door Deals:</span>
                      <span className={`font-medium ${tourRequest.acceptsDoorDeals ? 'text-green-700' : 'text-red-700'}`}>
                        {tourRequest.acceptsDoorDeals ? 'Accepted' : 'Not accepted'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Merchandising:</span>
                      <span className={`font-medium ${tourRequest.merchandising ? 'text-green-700' : 'text-red-700'}`}>
                        {tourRequest.merchandising ? 'Required' : 'Not needed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Requirements */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Technical Requirements
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block text-sm">Age Restriction:</span>
                    <span className="font-medium capitalize">{tourRequest.ageRestriction || 'Flexible'}</span>
                  </div>

                  {tourRequest.equipment && (
                    <div>
                      <span className="text-gray-600 block text-sm">Equipment Needs:</span>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(tourRequest.equipment).map(([key, needed]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${needed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className="text-sm">
                              {key.replace('needs', '').replace('PA', 'PA').replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Red = Required • Green = Not needed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Logistics & Actions */}
            <div className="space-y-6">
              
              {/* Travel & Logistics */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Travel & Logistics
                </h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600 block text-sm">Travel Method:</span>
                      <span className="font-medium capitalize">{tourRequest.travelMethod}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Lodging:</span>
                      <span className="font-medium capitalize">{tourRequest.lodging.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Timeline */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Request Timeline
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block text-sm">Created:</span>
                    <span className="font-medium">
                      {new Date(tourRequest.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {tourRequest.expiresAt && (
                    <div>
                      <span className="text-gray-600 block text-sm">Expires:</span>
                      <span className="font-medium">
                        {new Date(tourRequest.expiresAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {tourRequest.responses && (
                    <div>
                      <span className="text-gray-600 block text-sm">Responses Received:</span>
                      <span className="font-semibold text-blue-600">{tourRequest.responses}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                
                <div className="space-y-3">
                  {viewerType === 'venue' && onPlaceBid && (
                    <button
                      onClick={() => {
                        onPlaceBid();
                        onClose();
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Place Bid
                    </button>
                  )}
                  
                  <a 
                    href={`/artists/${tourRequest.artistId}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Artist Profile
                  </a>

                  {viewerType !== 'public' && (
                    <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Contact Artist
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 