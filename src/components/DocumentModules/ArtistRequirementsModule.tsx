import React from 'react';
import { ModuleDefinition, ModuleComponentProps } from './ModuleRegistry';

/**
 * Artist Requirements & Rider Module Component
 */
function ArtistRequirementsComponent({
  data,
  isEditing,
  status,
  viewerType,
  canEdit,
  onDataChange,
  onSave,
  onCancel,
  onStartEdit,
  isSaving = false,
  errors = []
}: ModuleComponentProps) {

  // Show empty state if no artist requirements data
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎸</span>
        </div>
        <p className="font-medium mb-2">No Artist Requirements Set</p>
        <p className="text-sm">
          {viewerType === 'artist' 
            ? "Set your technical and hospitality requirements here."
            : "Artist requirements will appear here when specified."
          }
        </p>
        {viewerType === 'artist' && (
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Add Requirements
          </button>
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Equipment Needs Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Equipment Needs</h5>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries({
              needsPA: 'PA System Required',
              needsMics: 'Microphones Required',
              needsDrums: 'Drum Kit Required', 
              needsAmps: 'Amplifiers Required',
              acoustic: 'Acoustic Performance'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!(data.equipment && data.equipment[key])}
                  onChange={(e) => onDataChange({ 
                    ...data, 
                    equipment: { 
                      ...data.equipment, 
                      [key]: e.target.checked 
                    } 
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Business Requirements Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Business Requirements</h5>
          <div className="space-y-4">
            {/* Guarantee Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guarantee Range ($)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={data.guaranteeRange?.min || ''}
                  onChange={(e) => onDataChange({ 
                    ...data, 
                    guaranteeRange: { 
                      ...data.guaranteeRange, 
                      min: parseInt(e.target.value) || 0 
                    } 
                  })}
                  placeholder="Minimum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={data.guaranteeRange?.max || ''}
                  onChange={(e) => onDataChange({ 
                    ...data, 
                    guaranteeRange: { 
                      ...data.guaranteeRange, 
                      max: parseInt(e.target.value) || 0 
                    } 
                  })}
                  placeholder="Maximum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Door Deals & Merchandising */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.acceptsDoorDeals}
                  onChange={(e) => onDataChange({ ...data, acceptsDoorDeals: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Accept Door Deals</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.merchandising}
                  onChange={(e) => onDataChange({ ...data, merchandising: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Merchandising Required</span>
              </label>
            </div>

            {/* Age Restriction Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age Restriction Preference
              </label>
              <select
                value={data.ageRestriction || ''}
                onChange={(e) => onDataChange({ ...data, ageRestriction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No preference</option>
                <option value="all-ages">All Ages</option>
                <option value="18+">18+</option>
                <option value="21+">21+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Travel & Logistics Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Travel & Logistics</h5>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Method
              </label>
              <select
                value={data.travelMethod || ''}
                onChange={(e) => onDataChange({ ...data, travelMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not specified</option>
                <option value="van">Van/Drive</option>
                <option value="flying">Flying</option>
                <option value="train">Train</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lodging Preference
              </label>
              <select
                value={data.lodging || ''}
                onChange={(e) => onDataChange({ ...data, lodging: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Flexible</option>
                <option value="floor-space">Floor Space</option>
                <option value="hotel">Hotel</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority Level
              </label>
              <select
                value={data.priority || ''}
                onChange={(e) => onDataChange({ ...data, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not specified</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tour Information Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Tour Information</h5>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Draw (people)
                </label>
                <input
                  type="number"
                  value={data.expectedDraw || ''}
                  onChange={(e) => onDataChange({ ...data, expectedDraw: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tour Status
                </label>
                <select
                  value={data.tourStatus || ''}
                  onChange={(e) => onDataChange({ ...data, tourStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not specified</option>
                  <option value="active">Active Tour</option>
                  <option value="building">Building Tour</option>
                  <option value="single-show">Single Show</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={data.description || ''}
                onChange={(e) => onDataChange({ ...data, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your music, tour, or special requirements..."
              />
            </div>
          </div>
        </div>

        {/* Technical Requirements Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Technical Requirements</h5>
          <div className="text-sm text-gray-600 mb-2">
            Advanced technical requirements and hospitality rider editing will be implemented with template integration.
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-sm text-blue-800">
              🔧 Template integration coming soon - this will pull from your saved technical and hospitality templates
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            value={data.artistNotes || ''}
            onChange={(e) => onDataChange({ ...data, artistNotes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special requests or additional information..."
          />
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex space-x-2 pt-4 border-t">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : '✓ Save Requirements'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  // Regular view mode
  return (
    <div className="space-y-4">
      {/* Equipment Needs */}
      {data.equipment && Object.values(data.equipment).some(Boolean) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Equipment Needs</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {data.equipment.needsPA && <div className="text-gray-900">• PA System Required</div>}
            {data.equipment.needsMics && <div className="text-gray-900">• Microphones Required</div>}
            {data.equipment.needsDrums && <div className="text-gray-900">• Drum Kit Required</div>}
            {data.equipment.needsAmps && <div className="text-gray-900">• Amplifiers Required</div>}
            {data.equipment.acoustic && <div className="text-gray-900">• Acoustic Performance</div>}
          </div>
        </div>
      )}

      {/* Business Requirements */}
      {(data.guaranteeRange || data.acceptsDoorDeals || data.merchandising || data.ageRestriction) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Business Requirements</h5>
          <div className="space-y-2 text-sm">
            {data.guaranteeRange && (data.guaranteeRange.min > 0 || data.guaranteeRange.max > 0) && (
              <div>
                <span className="font-medium text-gray-700">Guarantee Range:</span>
                <span className="ml-2 text-gray-900">
                  ${data.guaranteeRange.min} - ${data.guaranteeRange.max}
                </span>
              </div>
            )}
            {data.acceptsDoorDeals !== undefined && (
              <div>
                <span className="font-medium text-gray-700">Door Deals:</span>
                <span className="ml-2 text-gray-900">
                  {data.acceptsDoorDeals ? 'Accepted' : 'Not Accepted'}
                </span>
              </div>
            )}
            {data.merchandising !== undefined && (
              <div>
                <span className="font-medium text-gray-700">Merchandising:</span>
                <span className="ml-2 text-gray-900">
                  {data.merchandising ? 'Required' : 'Not Required'}
                </span>
              </div>
            )}
            {data.ageRestriction && (
              <div>
                <span className="font-medium text-gray-700">Age Restriction Preference:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {data.ageRestriction.replace('_', '-')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Travel & Logistics */}
      {(data.travelMethod || data.lodging || data.priority) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Travel & Logistics</h5>
          <div className="space-y-2 text-sm">
            {data.travelMethod && (
              <div>
                <span className="font-medium text-gray-700">Travel Method:</span>
                <span className="ml-2 text-gray-900 capitalize">{data.travelMethod}</span>
              </div>
            )}
            {data.lodging && (
              <div>
                <span className="font-medium text-gray-700">Lodging Preference:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {data.lodging.replace('-', ' ')}
                </span>
              </div>
            )}
            {data.priority && (
              <div>
                <span className="font-medium text-gray-700">Priority Level:</span>
                <span className="ml-2 text-gray-900 capitalize">{data.priority}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Requirements */}
      {data.technicalRequirements && data.technicalRequirements.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Technical Requirements</h5>
          <div className="space-y-2">
            {data.technicalRequirements.map((req: any, index: number) => (
              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-700">{req.category}</div>
                <div className="text-gray-900">{req.description}</div>
                {req.critical && (
                  <div className="text-red-600 text-xs mt-1">⚠ Critical Requirement</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospitality Requirements */}
      {data.hospitalityRequirements && data.hospitalityRequirements.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Hospitality Rider</h5>
          <div className="space-y-2">
            {data.hospitalityRequirements.map((req: any, index: number) => (
              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-700">{req.category}</div>
                <div className="text-gray-900">{req.description}</div>
                {req.quantity && (
                  <div className="text-gray-600 text-xs">Quantity: {req.quantity}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tour Details */}
      {(data.expectedDraw || data.description || data.tourStatus || data.flexibility) && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Tour Information</h5>
          <div className="space-y-2 text-sm">
            {data.expectedDraw && (
              <div>
                <span className="font-medium text-gray-700">Expected Draw:</span>
                <span className="ml-2 text-gray-900">{data.expectedDraw} people</span>
              </div>
            )}
            {data.tourStatus && (
              <div>
                <span className="font-medium text-gray-700">Tour Status:</span>
                <span className="ml-2 text-gray-900 capitalize">{data.tourStatus}</span>
              </div>
            )}
            {data.flexibility && (
              <div>
                <span className="font-medium text-gray-700">Flexibility:</span>
                <span className="ml-2 text-gray-900 capitalize">{data.flexibility}</span>
              </div>
            )}
            {data.description && (
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <div className="ml-2 text-gray-900 bg-gray-50 p-2 rounded mt-1">
                  {data.description}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Artist Notes */}
      {data.artistNotes && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Additional Notes</h5>
          <div className="text-sm">
            <div className="text-gray-900 bg-gray-50 p-2 rounded">{data.artistNotes}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Artist Requirements Module Definition
 */
export const artistRequirementsModule: ModuleDefinition = {
  id: 'artist-requirements',
  title: 'Artist Requirements & Rider',
  owner: 'artist',
  order: 2,
  defaultStatus: 'draft',
  
  canEdit: (viewerType: string, status: string) => {
    return viewerType === 'artist' && status !== 'locked';
  },
  
  canView: (viewerType: string) => {
    return true; // Everyone can view artist requirements
  },
  
  extractData: (context: any) => {
    if (context.show) {
      // Confirmed show - minimal artist requirements for now
      return {
        technicalRequirements: [],
        hospitalityRequirements: [],
        equipment: {}
      };
    }
    
    if (context.bid) {
      // Venue bid - artist hasn't filled requirements yet
      return {
        technicalRequirements: [],
        hospitalityRequirements: [],
        equipment: {},
        travelMethod: undefined,
        lodging: undefined,
        merchandising: undefined,
        artistNotes: undefined
      };
    }
    
    if (context.tourRequest) {
      // Tour request - artist has specified their requirements
      return {
        equipment: context.tourRequest.equipment,
        guaranteeRange: context.tourRequest.guaranteeRange,
        acceptsDoorDeals: context.tourRequest.acceptsDoorDeals,
        merchandising: context.tourRequest.merchandising,
        ageRestriction: context.tourRequest.ageRestriction,
        travelMethod: context.tourRequest.travelMethod,
        lodging: context.tourRequest.lodging,
        priority: context.tourRequest.priority,
        technicalRequirements: context.tourRequest.technicalRequirements || [],
        hospitalityRequirements: context.tourRequest.hospitalityRequirements || [],
        expectedDraw: context.tourRequest.expectedDraw,
        description: context.tourRequest.description,
        tourStatus: context.tourRequest.tourStatus,
        flexibility: context.tourRequest.flexibility
      };
    }
    
    return {};
  },
  
  component: ArtistRequirementsComponent
}; 