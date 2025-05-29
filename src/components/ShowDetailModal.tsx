'use client';

import React from 'react';
import { Show } from '../../types';

interface ShowDetailModalProps {
  show: Show;
  isOpen: boolean;
  onClose: () => void;
  viewerType?: 'artist' | 'venue' | 'public';
}

export default function ShowDetailModal({ show, isOpen, onClose, viewerType = 'public' }: ShowDetailModalProps) {
  if (!isOpen) return null;

  // Parse extended details from description if available
  let extendedDetails = null;
  try {
    if (show.notes?.includes('Extended Details:')) {
      const jsonStart = show.notes.indexOf('Extended Details:') + 'Extended Details:'.length;
      const jsonString = show.notes.substring(jsonStart).trim();
      extendedDetails = JSON.parse(jsonString);
    }
  } catch (error) {
    console.warn('Could not parse extended details:', error);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{show.artistName} at {show.venueName}</h2>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(show.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {show.venueName}, {show.city}, {show.state}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  show.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
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
            
            {/* Left Column - Lineup & Performance */}
            <div className="space-y-6">
              
              {/* Lineup Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Lineup & Set Times
                </h3>
                
                {extendedDetails?.billing ? (
                  <div className="space-y-4">
                    {/* Headliner */}
                    <div className="border-l-4 border-yellow-400 pl-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{extendedDetails.billing.headliner}</div>
                          <div className="text-sm text-yellow-600">Headliner</div>
                        </div>
                        {extendedDetails.billing.setTimes?.[extendedDetails.billing.headliner] && (
                          <div className="text-right text-sm">
                            <div className="font-medium">{extendedDetails.billing.setTimes[extendedDetails.billing.headliner].start}</div>
                            <div className="text-gray-500">{extendedDetails.billing.setTimes[extendedDetails.billing.headliner].length} min</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Support */}
                    {extendedDetails.billing.directSupport && (
                      <div className="border-l-4 border-blue-400 pl-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{extendedDetails.billing.directSupport}</div>
                            <div className="text-sm text-blue-600">Direct Support</div>
                          </div>
                          {extendedDetails.billing.setTimes?.[extendedDetails.billing.directSupport] && (
                            <div className="text-right text-sm">
                              <div className="font-medium">{extendedDetails.billing.setTimes[extendedDetails.billing.directSupport].start}</div>
                              <div className="text-gray-500">{extendedDetails.billing.setTimes[extendedDetails.billing.directSupport].length} min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Opener */}
                    {extendedDetails.billing.opener && (
                      <div className="border-l-4 border-gray-400 pl-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{extendedDetails.billing.opener}</div>
                            <div className="text-sm text-gray-600">Opener</div>
                          </div>
                          {extendedDetails.billing.setTimes?.[extendedDetails.billing.opener] && (
                            <div className="text-right text-sm">
                              <div className="font-medium">{extendedDetails.billing.setTimes[extendedDetails.billing.opener].start}</div>
                              <div className="text-gray-500">{extendedDetails.billing.setTimes[extendedDetails.billing.opener].length} min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Local Opener */}
                    {extendedDetails.billing.localOpener && (
                      <div className="border-l-4 border-green-400 pl-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{extendedDetails.billing.localOpener}</div>
                            <div className="text-sm text-green-600">Local Opener</div>
                          </div>
                          {extendedDetails.billing.setTimes?.[extendedDetails.billing.localOpener] && (
                            <div className="text-right text-sm">
                              <div className="font-medium">{extendedDetails.billing.setTimes[extendedDetails.billing.localOpener].start}</div>
                              <div className="text-gray-500">{extendedDetails.billing.setTimes[extendedDetails.billing.localOpener].length} min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <div className="text-lg font-medium">{show.artistName}</div>
                    <div className="text-sm">Lineup details not available</div>
                  </div>
                )}
              </div>

              {/* Schedule Card */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Show Schedule
                </h3>
                
                {extendedDetails?.schedule ? (
                  <div className="space-y-3">
                    {Object.entries(extendedDetails.schedule).map(([key, time]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium">{time as string}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <div className="text-sm">Schedule details not available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Column - Financial & Logistics */}
            <div className="space-y-6">
              
              {/* Financial Card */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Financial Details
                </h3>
                
                <div className="space-y-4">
                  {extendedDetails?.financial ? (
                    <>
                      {extendedDetails.financial.guarantee && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Guarantee:</span>
                          <span className="font-semibold text-green-700">${extendedDetails.financial.guarantee}</span>
                        </div>
                      )}
                      {extendedDetails.financial.doorDeal && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Door Deal:</span>
                          <span className="font-medium">{extendedDetails.financial.doorDeal}</span>
                        </div>
                      )}
                      {extendedDetails.financial.ticketPrices && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Ticket Prices:</span>
                          <span className="font-medium">
                            ${extendedDetails.financial.ticketPrices.advance} adv / ${extendedDetails.financial.ticketPrices.door} door
                          </span>
                        </div>
                      )}
                      {extendedDetails.financial.expectedDraw && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Expected Draw:</span>
                          <span className="font-medium">{extendedDetails.financial.expectedDraw}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Merchandising:</span>
                        <span className="font-medium">{extendedDetails.financial.merchandising ? 'Allowed' : 'Not allowed'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {show.guarantee && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Guarantee:</span>
                          <span className="font-semibold text-green-700">${show.guarantee}</span>
                        </div>
                      )}
                      {show.ticketPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Ticket Price:</span>
                          <span className="font-medium">
                            {typeof show.ticketPrice === 'object' 
                              ? `${show.ticketPrice.advance ? '$' + show.ticketPrice.advance + ' adv' : ''}${show.ticketPrice.advance && show.ticketPrice.door ? ' / ' : ''}${show.ticketPrice.door ? '$' + show.ticketPrice.door + ' door' : ''}`
                              : `$${show.ticketPrice}`
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{show.capacity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Age Restriction:</span>
                        <span className="font-medium">{show.ageRestriction}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Technical Requirements */}
              {extendedDetails?.technical && (
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Technical & Logistics
                  </h3>
                  
                  <div className="space-y-3">
                    {extendedDetails.technical.backline && (
                      <div>
                        <span className="text-gray-600 block text-sm">Backline:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {extendedDetails.technical.backline.map((item: string, index: number) => (
                            <span key={index} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {extendedDetails.technical.lighting && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Lighting:</span>
                        <span className="font-medium text-sm">{extendedDetails.technical.lighting}</span>
                      </div>
                    )}
                    {extendedDetails.technical.sound && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sound:</span>
                        <span className="font-medium text-sm">{extendedDetails.technical.sound}</span>
                      </div>
                    )}
                    {extendedDetails.technical.parking && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Parking:</span>
                        <span className="font-medium text-sm">{extendedDetails.technical.parking}</span>
                      </div>
                    )}
                    {extendedDetails.technical.special && (
                      <div>
                        <span className="text-gray-600 block text-sm">Special Requirements:</span>
                        <span className="font-medium text-sm">{extendedDetails.technical.special}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contacts & Actions */}
            <div className="space-y-6">
              
              {/* Contacts Card */}
              {extendedDetails?.contacts && (
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Key Contacts
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(extendedDetails.contacts).map(([role, contact]) => (
                      <div key={role} className="border-b border-yellow-200 pb-2 last:border-b-0">
                        <div className="text-sm text-gray-600 capitalize">{role.replace(/([A-Z])/g, ' $1').trim()}:</div>
                        <div className="font-medium text-sm">{contact as string}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <a 
                    href={`/venues/${show.venueId}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Venue Page
                  </a>
                  
                  <a 
                    href={`/artists/${show.artistId}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Artist Page
                  </a>

                  {viewerType !== 'public' && (
                    <>
                      <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Send Message
                      </button>
                      
                      <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Show Details
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Show Notes */}
              {show.notes && !show.notes.includes('Extended Details:') && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{show.notes}</p>
                </div>
              )}
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