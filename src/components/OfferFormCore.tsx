import React, { useState, useEffect } from 'react';
import OfferInput from './OfferInput';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  city: string;
  state: string;
}

interface OfferFormCoreProps {
  // Context
  venueId: string;
  venueName: string;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  
  // Pre-selection (when coming from artist page)
  preSelectedArtist?: {
    id: string;
    name: string;
  };
  
  // Pre-selection (when coming from tour request date)
  preSelectedDate?: string;
  
  // Existing bid information (when updating)
  existingBid?: {
    id: string;
    amount?: number;
    message?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    guarantee?: number;
    billingPosition?: 'headliner' | 'co-headliner' | 'support' | 'local-support';
    setLength?: number;
  };
  
  // 🎯 UX IMPROVEMENT: Delete functionality for existing offers
  onDelete?: () => Promise<void>;
  
  // 🎯 UX IMPROVEMENT: Universal dismiss functionality (replaces onDismissRequest)
  onDismiss?: () => Promise<void>;
  
  // 🎯 UX IMPROVEMENT: Global alert system integration
  confirm?: (title: string, message: string, onConfirm: () => void) => void;
  
  // Customization
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  
  // Error handling
  error?: string;
}

export default function OfferFormCore({
  venueId,
  venueName,
  onSubmit,
  onCancel,
  loading = false,
  preSelectedArtist,
  preSelectedDate,
  existingBid,
  onDelete,
  onDismiss,
  confirm,
  title = "Make Offer to Artist",
  subtitle,
  submitButtonText = "Send Offer",
  error
}: OfferFormCoreProps) {
  // 🎵 Smart billing position logic
  const getSmartBillingDefault = async (proposedDate: string): Promise<'headliner' | 'support'> => {
    if (!proposedDate || !venueId) return 'headliner';
    
    try {
      // Check for existing confirmed shows or accepted offers on this date
      const response = await fetch(`/api/venues/${venueId}/shows?date=${proposedDate}`);
      if (response.ok) {
        const existingShows = await response.json();
        const hasHeadliner = existingShows.some((show: any) => 
          show.billingPosition === 'headliner' || 
          show.billingOrder?.position === 'headliner'
        );
        return hasHeadliner ? 'support' : 'headliner';
      }
    } catch (error) {
      console.log('Could not check existing shows, defaulting to headliner');
    }
    
    return 'headliner';
  };

  // Form state - Updated to include billing position fields
  const [formData, setFormData] = useState<{
    artistId: string;
    artistName: string;
    proposedDate: string;
    capacity: string;
    ageRestriction: string;
    message: string;
    billingPosition: 'headliner' | 'co-headliner' | 'support' | 'local-support';
    setLength: string;
  }>({
    artistId: preSelectedArtist?.id || '',
    artistName: preSelectedArtist?.name || '',
    proposedDate: preSelectedDate || '',
    capacity: '',
    ageRestriction: 'ALL_AGES',
    message: '',
    billingPosition: 'headliner', // Smart default
    setLength: ''
  });
  
  const [offerData, setOfferData] = useState<any>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [hasInitializedFromExistingBid, setHasInitializedFromExistingBid] = useState(false);
  
  // 🎯 UX IMPROVEMENT: Delete state management
  const [isDeleting, setIsDeleting] = useState(false);

  // 🎯 LOAD EXISTING BID DATA: Pre-populate form if editing existing bid (ONLY ONCE)
  useEffect(() => {
    if (existingBid && !hasInitializedFromExistingBid) {
      console.log('🔄 Pre-filling form with existing bid (first time only):', existingBid);
      
      // Pre-populate form with existing bid data
      // ✅ FIX: Check both guarantee and amount properties
      const bidAmount = existingBid.guarantee || existingBid.amount;
      if (bidAmount) {
        const parsedOffer = {
          type: 'guarantee' as const,
          displayText: `$${bidAmount} guarantee`,
          guarantee: bidAmount,
          rawInput: `$${bidAmount} guarantee`
        };
        setOfferData(parsedOffer);
        console.log('✅ Set offer data:', parsedOffer);
      }
      
      // 🎯 UX FIX: Always respect preSelectedDate when provided (from button's date row)
      const updates: Partial<typeof formData> = {};
      
      if (existingBid.message) {
        updates.message = existingBid.message;
        console.log('✅ Set message:', existingBid.message);
      }
      
      // 🎵 Pre-populate billing position from existing bid
      if (existingBid.billingPosition) {
        updates.billingPosition = existingBid.billingPosition;
        console.log('✅ Set billing position:', existingBid.billingPosition);
      }
      
      // Pre-populate set length from existing bid
      if (existingBid.setLength) {
        updates.setLength = existingBid.setLength.toString();
        console.log('✅ Set length:', existingBid.setLength);
      }
      
      // If we have a preSelectedDate (from the date row button), use it
      // This ensures edit buttons auto-fill the date from their specific row
      if (preSelectedDate) {
        updates.proposedDate = preSelectedDate;
        console.log('✅ Set date from button row:', preSelectedDate);
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }

      // Mark that we've initialized to prevent re-running
      setHasInitializedFromExistingBid(true);
      console.log('🚫 Marked as initialized - will not override user input');
    }
  }, [existingBid, hasInitializedFromExistingBid, preSelectedDate]);

  // Load artists on mount
  useEffect(() => {
    loadArtists();
  }, []);

  // Filter artists based on search
  useEffect(() => {
    if (!artistSearch.trim()) {
      setFilteredArtists([]);
      return;
    }

    const filtered = artists.filter(artist =>
      artist.name.toLowerCase().includes(artistSearch.toLowerCase()) ||
      artist.genres.some(genre => genre.toLowerCase().includes(artistSearch.toLowerCase())) ||
      `${artist.city}, ${artist.state}`.toLowerCase().includes(artistSearch.toLowerCase())
    ).slice(0, 8);

    setFilteredArtists(filtered);
  }, [artistSearch, artists]);

  // 🎵 Smart billing position logic - update when date changes
  useEffect(() => {
    const updateSmartBillingPosition = async () => {
      if (formData.proposedDate && !hasInitializedFromExistingBid) {
        // Only run smart defaults for new offers, not when editing existing ones
        const smartDefault = await getSmartBillingDefault(formData.proposedDate);
        setFormData(prev => ({ ...prev, billingPosition: smartDefault }));
      }
    };

    updateSmartBillingPosition();
  }, [formData.proposedDate, hasInitializedFromExistingBid]);

  const loadArtists = async () => {
    try {
      const response = await fetch('/api/artists');
      if (response.ok) {
        const data = await response.json();
        setArtists(Array.isArray(data) ? data : (data.artists || []));
      }
    } catch (error) {
      console.error('Failed to load artists:', error);
    }
  };

  const handleArtistSelect = (artist: Artist) => {
    setFormData(prev => ({
      ...prev,
      artistId: artist.id,
      artistName: artist.name
    }));
    setArtistSearch(artist.name);
    setShowArtistDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the submission data
    const submissionData = {
      artistId: formData.artistId,
      artistName: formData.artistName,
      proposedDate: formData.proposedDate,
      ageRestriction: formData.ageRestriction,
      message: formData.message,
      offerData: offerData, // The parsed offer data from OfferInput
      // 🎵 Include billing position and set length data
      billingPosition: formData.billingPosition,
      setLength: formData.setLength ? parseInt(formData.setLength) : undefined
    };

    await onSubmit(submissionData);
  };

  const defaultSubtitle = subtitle || `Invite a specific artist to play at ${venueName}`;

  return (
    <div className="bg-bg-primary border border-border-subtle p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-text-accent mb-2 uppercase tracking-wider">
          <span className="text-text-muted mr-2">&gt;</span>
          {existingBid ? 'UPDATE_BID' : title.toUpperCase().replace(/\s+/g, '_')}
        </h3>
        <p className="text-xs text-text-secondary">
          {existingBid ? `Updating your existing bid for this show request` : defaultSubtitle}
        </p>
      </div>

      {/* 🎯 EXISTING BID INDICATOR: Show when updating existing bid */}
      {existingBid && (
        <div className="mb-6 p-4 bg-status-warning/10 border border-status-warning/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-status-warning">[!]</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-medium text-status-warning mb-3 uppercase tracking-wider">EXISTING_BID_DETECTED</h4>
              
              {/* Compact inline layout */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted uppercase">CURRENT:</span>
                  <span className="px-2 py-1 bg-bg-tertiary text-status-success font-semibold border border-border-subtle">
                    ${existingBid.guarantee || existingBid.amount || '--'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted uppercase">STATUS:</span>
                  <span className="px-2 py-1 bg-bg-tertiary text-text-primary font-medium border border-border-subtle uppercase">
                    {existingBid.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted uppercase">UPDATED:</span>
                  <span className="font-medium text-text-primary">
                    {new Date(existingBid.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <p className="text-2xs text-text-muted leading-relaxed">
                Changes will <span className="text-status-warning">UPDATE</span> your existing bid rather than creating a new one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 🎯 CENTERPIECE: OFFER FIELD - Most important info first */}
        <div className="bg-bg-secondary border border-border-subtle p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-text-accent">$</span>
            <h4 className="text-xs font-medium text-text-accent uppercase tracking-wider">YOUR_OFFER</h4>
          </div>
          <OfferInput
            value={offerData}
            onChange={(data) => setOfferData(data)}
            placeholder="e.g., $500 guarantee, 70/30 door split after $300"
            className="w-full p-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
          />
        </div>

        {/* Artist Selection - Only show if not pre-selected */}
        {!preSelectedArtist && (
          <div className="relative">
            <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              SELECT_ARTIST *
            </label>
            <input
              type="text"
              required
              value={artistSearch}
              onChange={(e) => {
                setArtistSearch(e.target.value);
                setShowArtistDropdown(true);
                setFormData(prev => ({ ...prev, artistId: '', artistName: '' }));
              }}
              onFocus={() => setShowArtistDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowArtistDropdown(false), 200);
              }}
              placeholder="Search by name, genre, or location"
              className="w-full p-3 border border-border-default bg-bg-secondary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
            />
            
            {/* Artist Search Dropdown */}
            {showArtistDropdown && filteredArtists.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-bg-secondary border border-border-default shadow-lg max-h-60 overflow-y-auto">
                {filteredArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => handleArtistSelect(artist)}
                    className="p-3 hover:bg-bg-hover cursor-pointer border-b border-border-subtle last:border-b-0"
                  >
                    <div className="font-medium text-text-primary text-sm">{artist.name}</div>
                    <div className="text-xs text-text-muted">
                      {artist.genres.slice(0, 2).join(', ')} • {artist.city}, {artist.state}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {formData.artistId && (
              <p className="text-xs text-status-success mt-1 uppercase">
                ✓ SELECTED: {formData.artistName}
              </p>
            )}
          </div>
        )}

        {/* Show selected artist info if pre-selected */}
        {preSelectedArtist && (
          <div className="bg-status-success/10 border border-status-success/30 p-4">
            <div className="flex items-center gap-2">
              <span className="text-status-success">✓</span>
              <span className="font-medium text-status-success text-sm uppercase">MAKING OFFER TO: {preSelectedArtist.name}</span>
            </div>
          </div>
        )}

        {/* Show Details - Consistent grouping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              PROPOSED_DATE *
            </label>
            <input
              type="date"
              required
              value={formData.proposedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, proposedDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-border-default bg-bg-secondary text-text-primary focus:outline-none focus:border-text-accent"
            />
          </div>
          
          <div>
            <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
              AGE_RESTRICTION
            </label>
            <select
              value={formData.ageRestriction}
              onChange={(e) => setFormData(prev => ({ ...prev, ageRestriction: e.target.value as any }))}
              className="w-full p-3 border border-border-default bg-bg-secondary text-text-primary focus:outline-none focus:border-text-accent"
            >
              <option value="all-ages">ALL_AGES</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
          </div>
        </div>

        {/* Billing Position - Clean, professional section */}
        <div className="bg-bg-secondary border border-border-subtle p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-text-accent">#</span>
            <h4 className="text-xs font-medium text-text-accent uppercase tracking-wider">BILLING_POSITION *</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                ROLE
              </label>
              <select
                required
                value={formData.billingPosition}
                onChange={(e) => setFormData(prev => ({ ...prev, billingPosition: e.target.value as any }))}
                className="w-full p-3 border border-border-default bg-bg-tertiary text-text-primary focus:outline-none focus:border-text-accent"
              >
                <option value="headliner">HEADLINER</option>
                <option value="support">SUPPORT</option>
                <option value="local-support">LOCAL_SUPPORT</option>
                <option value="co-headliner">CO_HEADLINER</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                SET_LENGTH (min)
              </label>
              <input
                type="number"
                value={formData.setLength || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, setLength: e.target.value }))}
                placeholder="60"
                min="15"
                max="180"
                className="w-full p-3 border border-border-default bg-bg-tertiary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
              />
            </div>
          </div>
          <p className="text-2xs text-text-muted mt-2 uppercase">
            {formData.billingPosition === 'headliner' && '→ Main draw, top billing (45-90 min)'}
            {formData.billingPosition === 'support' && '→ Opening act (30-45 min)'}
            {formData.billingPosition === 'local-support' && '→ Local opener (20-30 min)'}
            {formData.billingPosition === 'co-headliner' && '→ Shared top billing (45-75 min)'}
          </p>
          
          {/* Smart validation warning for potential billing conflicts */}
          {formData.billingPosition === 'headliner' && formData.proposedDate && (
            <div className="mt-2 p-2 bg-status-warning/10 border border-status-warning/30 text-2xs text-status-warning">
              <span className="font-medium uppercase">[!] HEADLINER: </span>
              <span>Ensure no date conflicts. Consider support acts.</span>
            </div>
          )}
          
          {formData.billingPosition === 'co-headliner' && formData.proposedDate && (
            <div className="mt-2 p-2 bg-status-warning/10 border border-status-warning/30 text-2xs text-status-warning">
              <span className="font-medium uppercase">[!] CO_HEADLINER: </span>
              <span>Confirm other headliner or specify in message.</span>
            </div>
          )}
        </div>

        {/* Personal Message */}
        <div>
          <label className="block text-2xs font-medium text-text-muted mb-2 uppercase tracking-wider">
            MESSAGE (optional)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Tell the artist why you'd like them to play..."
            rows={4}
            className="w-full p-3 border border-border-default bg-bg-secondary text-text-primary placeholder-text-muted focus:outline-none focus:border-text-accent"
          />
          <p className="text-2xs text-text-muted mt-1">
            Customize or leave default message.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
          {/* 🎯 UX IMPROVEMENT: Cancel on left - just backing out */}
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-text-secondary bg-bg-secondary border border-border-default hover:bg-bg-hover transition-colors text-xs uppercase tracking-wider"
            >
              [CANCEL]
            </button>
          </div>
          
          {/* 🎯 UX IMPROVEMENT: Resolution actions grouped together on right */}
          <div className="flex space-x-3">
            {/* Universal destructive action - adapts text based on context */}
            {(existingBid && onDelete || !existingBid && onDismiss) && (
              <button
                type="button"
                onClick={async () => {
                  const action = existingBid ? 'delete' : 'dismiss';
                  const confirmText = existingBid 
                    ? 'Are you sure you want to delete this offer? This action cannot be undone.'
                    : 'Remove this show request from your timeline? You can still find it in the general show requests if you change your mind.';
                  
                  if (window.confirm(confirmText)) {
                    setIsDeleting(true);
                    try {
                      if (existingBid && onDelete) {
                        await onDelete();
                      } else if (onDismiss) {
                        await onDismiss();
                      }
                    } catch (error) {
                      console.error(`${action} failed:`, error);
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                disabled={loading || isDeleting}
                className="px-4 py-2 text-status-error bg-status-error/10 border border-status-error/30 hover:bg-status-error/20 disabled:opacity-50 transition-colors flex items-center gap-2 text-xs uppercase tracking-wider"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDeleting ? '[REMOVING...]' : (existingBid ? '[DELETE]' : '[NOT_INTERESTED]')}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || isDeleting || (!preSelectedArtist && !formData.artistId) || !formData.proposedDate || !formData.billingPosition}
              className="px-6 py-2 bg-text-accent text-bg-primary hover:bg-text-primary transition-colors disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-wider font-medium"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? (existingBid ? '[UPDATING...]' : '[SENDING...]') : (existingBid ? '[UPDATE_BID]' : `[${submitButtonText.toUpperCase().replace(/\s+/g, '_')}]`)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 
