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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-bg-primary border border-border-default max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-medium text-text-primary uppercase tracking-wider">{show.artistName} <span className="text-text-muted">@</span> {show.venueName}</h2>
              <div className="flex items-center space-x-4 mt-2 text-xs text-text-secondary uppercase tracking-wider">
                <div className="flex items-center">
                  <span className="text-text-muted mr-2">[DATE]</span>
                  {new Date(show.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <span className="text-text-muted mr-2">[LOC]</span>
                  {show.venueName}, {show.city}, {show.state}
                </div>
                <span className={`px-2 py-1 text-2xs font-medium uppercase ${
                  show.status === 'confirmed' ? 'bg-status-success/20 text-status-success border border-status-success/30' : 'bg-bg-tertiary text-text-secondary border border-border-subtle'
                }`}>
                  {show.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors p-1"
            >
              <span className="text-lg">[×]</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Lineup & Performance */}
            <div className="space-y-4">
              
              {/* Lineup Card */}
              <div className="bg-bg-secondary border border-border-subtle p-4">
                <h3 className="text-xs font-medium text-text-accent mb-4 flex items-center uppercase tracking-wider">
                  <span className="text-text-muted mr-2">&gt;</span>
                  LINEUP_&_SET_TIMES
                </h3>
                
                {extendedDetails?.billing ? (
                  <div className="space-y-3">
                    {/* Headliner */}
                    <div className="border-l-2 border-status-warning pl-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-text-primary text-sm">{extendedDetails.billing.headliner}</div>
                          <div className="text-2xs text-status-warning uppercase">HEADLINER</div>
                        </div>
                        {extendedDetails.billing.setTimes?.[extendedDetails.billing.headliner] && (
                          <div className="text-right text-xs">
                            <div className="font-medium text-text-primary">{extendedDetails.billing.setTimes[extendedDetails.billing.headliner].start}</div>
                            <div className="text-text-muted">{extendedDetails.billing.setTimes[extendedDetails.billing.headliner].length}min</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Support */}
                    {extendedDetails.billing.directSupport && (
                      <div className="border-l-2 border-status-info pl-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-text-primary text-sm">{extendedDetails.billing.directSupport}</div>
                            <div className="text-2xs text-status-info uppercase">DIRECT_SUPPORT</div>
                          </div>
                          {extendedDetails.billing.setTimes?.[extendedDetails.billing.directSupport] && (
                            <div className="text-right text-xs">
                              <div className="font-medium text-text-primary">{extendedDetails.billing.setTimes[extendedDetails.billing.directSupport].start}</div>
                              <div className="text-text-muted">{extendedDetails.billing.setTimes[extendedDetails.billing.directSupport].length}min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Opener */}
                    {extendedDetails.billing.opener && (
                      <div className="border-l-2 border-border-default pl-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-text-primary text-sm">{extendedDetails.billing.opener}</div>
                            <div className="text-2xs text-text-muted uppercase">OPENER</div>
                          </div>
                          {extendedDetails.billing.setTimes?.[extendedDetails.billing.opener] && (
                            <div className="text-right text-xs">
                              <div className="font-medium text-text-primary">{extendedDetails.billing.setTimes[extendedDetails.billing.opener].start}</div>
                              <div className="text-text-muted">{extendedDetails.billing.setTimes[extendedDetails.billing.opener].length}min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Local Opener */}
                    {extendedDetails.billing.localOpener && (
                      <div className="border-l-2 border-status-success pl-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-text-primary text-sm">{extendedDetails.billing.localOpener}</div>
                            <div className="text-2xs text-status-success uppercase">LOCAL_OPENER</div>
                          </div>
                          {extendedDetails.billing.setTimes?.[extendedDetails.billing.localOpener] && (
                            <div className="text-right text-xs">
                              <div className="font-medium text-text-primary">{extendedDetails.billing.setTimes[extendedDetails.billing.localOpener].start}</div>
                              <div className="text-text-muted">{extendedDetails.billing.setTimes[extendedDetails.billing.localOpener].length}min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-text-muted py-4">
                    <div className="text-sm font-medium text-text-secondary">{show.artistName}</div>
                    <div className="text-2xs uppercase">LINEUP_PENDING</div>
                  </div>
                )}
              </div>

              {/* Schedule Card */}
              <div className="bg-bg-secondary border border-border-subtle p-4">
                <h3 className="text-xs font-medium text-text-accent mb-4 flex items-center uppercase tracking-wider">
                  <span className="text-text-muted mr-2">&gt;</span>
                  SCHEDULE
                </h3>
                
                {extendedDetails?.schedule ? (
                  <div className="space-y-2">
                    {Object.entries(extendedDetails.schedule).map(([key, time]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-text-muted uppercase text-2xs">{key.replace(/([A-Z])/g, '_$1').trim()}:</span>
                        <span className="font-medium text-text-primary">{time as string}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-text-muted py-4">
                    <div className="text-2xs uppercase">SCHEDULE_PENDING</div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Column - Financial & Logistics */}
            <div className="space-y-4">
              
              {/* Financial Card */}
              <div className="bg-bg-secondary border border-border-subtle p-4">
                <h3 className="text-xs font-medium text-text-accent mb-4 flex items-center uppercase tracking-wider">
                  <span className="text-text-muted mr-2">&gt;</span>
                  FINANCIAL
                </h3>
                
                <div className="space-y-2">
                  {extendedDetails?.financial ? (
                    <>
                      {extendedDetails.financial.guarantee && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-text-muted uppercase text-2xs">GUARANTEE:</span>
                          <span className="font-semibold text-status-success">${extendedDetails.financial.guarantee}</span>
                        </div>
                      )}
                      {extendedDetails.financial.doorDeal && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-text-muted uppercase text-2xs">DOOR_DEAL:</span>
                          <span className="font-medium text-text-primary">{extendedDetails.financial.doorDeal}</span>
                        </div>
                      )}
                      {extendedDetails.financial.ticketPrices && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-text-muted uppercase text-2xs">TICKETS:</span>
                          <span className="font-medium text-text-primary">
                            ${extendedDetails.financial.ticketPrices.advance} adv / ${extendedDetails.financial.ticketPrices.door} door
                          </span>
                        </div>
                      )}
                      {extendedDetails.financial.expectedDraw && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-text-muted uppercase text-2xs">EXPECTED_DRAW:</span>
                          <span className="font-medium text-text-primary">{extendedDetails.financial.expectedDraw}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted uppercase text-2xs">MERCH:</span>
                        <span className="font-medium text-text-primary">{extendedDetails.financial.merchandising ? 'ALLOWED' : 'NOT_ALLOWED'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {show.guarantee && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-text-muted uppercase text-2xs">GUARANTEE:</span>
                          <span className="font-semibold text-status-success">${show.guarantee}</span>
                        </div>
                      )}
                      {show.ticketPrice && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-text-muted uppercase text-2xs">TICKET:</span>
                          <span className="font-medium text-text-primary">
                            {typeof show.ticketPrice === 'object' 
                              ? `${show.ticketPrice.advance ? '$' + show.ticketPrice.advance + ' adv' : ''}${show.ticketPrice.advance && show.ticketPrice.door ? ' / ' : ''}${show.ticketPrice.door ? '$' + show.ticketPrice.door + ' door' : ''}`
                              : `$${show.ticketPrice}`
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted uppercase text-2xs">CAPACITY:</span>
                        <span className="font-medium text-text-primary">{show.capacity}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted uppercase text-2xs">AGE:</span>
                        <span className="font-medium text-text-primary uppercase">{show.ageRestriction}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Technical Requirements */}
              {extendedDetails?.technical && (
                <div className="bg-bg-secondary border border-border-subtle p-4">
                  <h3 className="text-xs font-medium text-text-accent mb-4 flex items-center uppercase tracking-wider">
                    <span className="text-text-muted mr-2">&gt;</span>
                    TECHNICAL
                  </h3>
                  
                  <div className="space-y-2">
                    {extendedDetails.technical.backline && (
                      <div>
                        <span className="text-text-muted block text-2xs uppercase mb-1">BACKLINE:</span>
                        <div className="flex flex-wrap gap-1">
                          {extendedDetails.technical.backline.map((item: string, index: number) => (
                            <span key={index} className="inline-block bg-bg-tertiary text-text-secondary px-2 py-1 text-2xs border border-border-subtle uppercase">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {extendedDetails.technical.lighting && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted uppercase text-2xs">LIGHTING:</span>
                        <span className="font-medium text-text-primary text-xs">{extendedDetails.technical.lighting}</span>
                      </div>
                    )}
                    {extendedDetails.technical.sound && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted uppercase text-2xs">SOUND:</span>
                        <span className="font-medium text-text-primary text-xs">{extendedDetails.technical.sound}</span>
                      </div>
                    )}
                    {extendedDetails.technical.parking && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted uppercase text-2xs">PARKING:</span>
                        <span className="font-medium text-text-primary text-xs">{extendedDetails.technical.parking}</span>
                      </div>
                    )}
                    {extendedDetails.technical.special && (
                      <div>
                        <span className="text-text-muted block text-2xs uppercase">SPECIAL:</span>
                        <span className="font-medium text-text-secondary text-xs">{extendedDetails.technical.special}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contacts & Actions */}
            <div className="space-y-4">
              
              {/* Contacts Card */}
              {extendedDetails?.contacts && (
                <div className="bg-bg-secondary border border-border-subtle p-4">
                  <h3 className="text-xs font-medium text-text-accent mb-4 flex items-center uppercase tracking-wider">
                    <span className="text-text-muted mr-2">&gt;</span>
                    CONTACTS
                  </h3>
                  
                  <div className="space-y-2">
                    {Object.entries(extendedDetails.contacts).map(([role, contact]) => (
                      <div key={role} className="border-b border-border-subtle pb-2 last:border-b-0">
                        <div className="text-2xs text-text-muted uppercase">{role.replace(/([A-Z])/g, '_$1').trim()}:</div>
                        <div className="font-medium text-text-primary text-sm">{contact as string}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-bg-secondary border border-border-subtle p-4">
                <h3 className="text-xs font-medium text-text-accent mb-4 flex items-center uppercase tracking-wider">
                  <span className="text-text-muted mr-2">&gt;</span>
                  ACTIONS
                </h3>
                
                <div className="space-y-2">
                  <a 
                    href={`/venues/${show.venueId}`}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary text-xs font-medium uppercase tracking-wider hover:bg-bg-hover hover:border-border-strong transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    [VIEW_VENUE]
                  </a>
                  
                  <a 
                    href={`/artists/${show.artistId}`}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary text-xs font-medium uppercase tracking-wider hover:bg-bg-hover hover:border-border-strong transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    [VIEW_ARTIST]
                  </a>

                  {viewerType !== 'public' && (
                    <>
                      <button className="w-full inline-flex items-center justify-center px-3 py-2 border border-status-info bg-status-info/10 text-status-info text-xs font-medium uppercase tracking-wider hover:bg-status-info/20 transition-colors">
                        [SEND_MESSAGE]
                      </button>
                      
                      <button className="w-full inline-flex items-center justify-center px-3 py-2 border border-status-success bg-status-success/10 text-status-success text-xs font-medium uppercase tracking-wider hover:bg-status-success/20 transition-colors">
                        [EDIT_SHOW]
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Show Notes */}
              {show.notes && !show.notes.includes('Extended Details:') && (
                <div className="bg-bg-secondary border border-border-subtle p-4">
                  <h3 className="text-xs font-medium text-text-accent mb-4 flex items-center uppercase tracking-wider">
                    <span className="text-text-muted mr-2">&gt;</span>
                    NOTES
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{show.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle bg-bg-secondary flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border-default bg-bg-tertiary text-text-primary text-xs font-medium uppercase tracking-wider hover:bg-bg-hover hover:border-border-strong transition-colors"
          >
            [CLOSE]
          </button>
        </div>
      </div>
    </div>
  );
} 