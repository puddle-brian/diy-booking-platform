import React from 'react';
import { ModuleDefinition, ModuleComponentProps } from './ModuleRegistry';

/**
 * Show Day Schedule Module Component
 */
function ShowScheduleComponent({
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

  // Show empty state if no schedule data
  if (!data || Object.keys(data).length === 0 || 
      (!data.loadIn && !data.soundcheck && !data.doorsOpen && !data.showTime && !data.curfew)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏰</span>
        </div>
        <p className="font-medium mb-2">No Schedule Set</p>
        <p className="text-sm">
          {viewerType === 'public' 
            ? "Show day schedule will appear here when finalized."
            : "Set the show day timeline to coordinate logistics."
          }
        </p>
        {canEdit && (
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Set Schedule
          </button>
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Schedule Times Section */}
        <div>
          <h5 className="font-medium text-gray-800 mb-4">Show Schedule</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🚛 Load-In Time
              </label>
              <input
                type="time"
                value={data.loadIn || ''}
                onChange={(e) => onDataChange({ ...data, loadIn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎤 Soundcheck Time
              </label>
              <input
                type="time"
                value={data.soundcheck || ''}
                onChange={(e) => onDataChange({ ...data, soundcheck: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🚪 Doors Open
              </label>
              <input
                type="time"
                value={data.doorsOpen || ''}
                onChange={(e) => onDataChange({ ...data, doorsOpen: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎸 Show Start Time
              </label>
              <input
                type="time"
                value={data.showTime || ''}
                onChange={(e) => onDataChange({ ...data, showTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔚 Curfew Time
              </label>
              <input
                type="time"
                value={data.curfew || ''}
                onChange={(e) => onDataChange({ ...data, curfew: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Schedule Info */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Additional Information</h5>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Set Length (minutes)
                </label>
                <input
                  type="number"
                  value={data.setLength || ''}
                  onChange={(e) => onDataChange({ ...data, setLength: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 45"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Position
                </label>
                <select
                  value={data.billingPosition || ''}
                  onChange={(e) => onDataChange({ ...data, billingPosition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not specified</option>
                  <option value="headliner">Headliner</option>
                  <option value="co-headliner">Co-Headliner</option>
                  <option value="direct-support">Direct Support</option>
                  <option value="opener">Opener</option>
                  <option value="local-opener">Local Opener</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Acts on Bill
              </label>
              <input
                type="text"
                value={data.otherActs || ''}
                onChange={(e) => onDataChange({ ...data, otherActs: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List other bands performing"
              />
            </div>
          </div>
        </div>

        {/* Schedule Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schedule Notes
          </label>
          <textarea
            value={data.scheduleNotes || ''}
            onChange={(e) => onDataChange({ ...data, scheduleNotes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Load-in instructions, parking info, contact details, special timing requirements..."
          />
        </div>

        {/* Time Zone Helper */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <div className="text-blue-500 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800">
              <div className="font-medium">Time Zone Note</div>
              <div>All times should be in the venue's local time zone. Coordinate with the venue to confirm timing details.</div>
            </div>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex space-x-2 pt-4 border-t">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : '✓ Save Schedule'}
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

  // Helper function to format time
  const formatTime = (timeString: string) => {
    if (!timeString) return null;
    
    try {
      // Handle different time formats
      let time = timeString;
      
      // If it's just time (HH:MM), create a full date for parsing
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        time = `2000-01-01T${timeString}:00`;
      }
      
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString; // Return original if parsing fails
    }
  };

  // Regular view mode
  return (
    <div className="space-y-4">
      {/* Show Day Timeline */}
      <div>
        <h5 className="font-medium text-gray-800 mb-3">Show Day Timeline</h5>
        <div className="space-y-3">
          
          {/* Load-In */}
          {data.loadIn && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🚛</span>
              </div>
              <div>
                <div className="font-medium text-gray-700">Load-In</div>
                <div className="text-gray-900">{formatTime(data.loadIn)}</div>
                <div className="text-xs text-gray-500">Equipment setup & sound prep</div>
              </div>
            </div>
          )}

          {/* Soundcheck */}
          {data.soundcheck && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🎤</span>
              </div>
              <div>
                <div className="font-medium text-gray-700">Soundcheck</div>
                <div className="text-gray-900">{formatTime(data.soundcheck)}</div>
                <div className="text-xs text-gray-500">Audio levels & line check</div>
              </div>
            </div>
          )}

          {/* Doors Open */}
          {data.doorsOpen && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🚪</span>
              </div>
              <div>
                <div className="font-medium text-gray-700">Doors Open</div>
                <div className="text-gray-900">{formatTime(data.doorsOpen)}</div>
                <div className="text-xs text-gray-500">Audience entry begins</div>
              </div>
            </div>
          )}

          {/* Show Time */}
          {data.showTime && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🎸</span>
              </div>
              <div>
                <div className="font-medium text-gray-700">Show Starts</div>
                <div className="text-gray-900 font-semibold">{formatTime(data.showTime)}</div>
                <div className="text-xs text-gray-500">Performance begins</div>
              </div>
            </div>
          )}

          {/* Curfew */}
          {data.curfew && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🔚</span>
              </div>
              <div>
                <div className="font-medium text-gray-700">Curfew</div>
                <div className="text-gray-900">{formatTime(data.curfew)}</div>
                <div className="text-xs text-gray-500">Music must end by this time</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Summary */}
      {(data.loadIn || data.showTime || data.curfew) && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h6 className="font-medium text-gray-700 mb-2 text-sm">Quick Reference</h6>
          <div className="grid grid-cols-3 gap-4 text-xs">
            {data.loadIn && (
              <div>
                <div className="text-gray-500">Load-In</div>
                <div className="font-medium">{formatTime(data.loadIn)}</div>
              </div>
            )}
            {data.showTime && (
              <div>
                <div className="text-gray-500">Show</div>
                <div className="font-medium">{formatTime(data.showTime)}</div>
              </div>
            )}
            {data.curfew && (
              <div>
                <div className="text-gray-500">Curfew</div>
                <div className="font-medium">{formatTime(data.curfew)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Schedule Notes */}
      {data.scheduleNotes && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Schedule Notes</h5>
          <div className="text-sm">
            <div className="text-gray-900 bg-gray-50 p-2 rounded">{data.scheduleNotes}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Show Schedule Module Definition
 */
export const showScheduleModule: ModuleDefinition = {
  id: 'show-schedule',
  title: 'Show Day Schedule',
  owner: 'shared',
  order: 3,
  defaultStatus: 'draft',
  
  canEdit: (viewerType: string, status: string) => {
    return viewerType !== 'public' && status !== 'locked';
  },
  
  canView: (viewerType: string) => {
    return true; // Everyone can view the schedule
  },
  
  extractData: (context: any) => {
    if (context.show) {
      // Confirmed show schedule
      return {
        loadIn: context.show.loadIn,
        soundcheck: context.show.soundcheck,
        doorsOpen: context.show.doorsOpen,
        showTime: context.show.showTime,
        curfew: context.show.curfew,
        scheduleNotes: context.show.scheduleNotes
      };
    }
    
    if (context.bid) {
      // Venue bid schedule proposal - include sample times if none provided
      return {
        loadIn: context.bid.loadIn || '16:00',
        soundcheck: context.bid.soundcheck || '17:30',
        doorsOpen: context.bid.doorsOpen || '19:00',
        showTime: context.bid.showTime || '20:00',
        curfew: context.bid.curfew || '23:00',
        scheduleNotes: context.bid.scheduleNotes || 'Load-in through back entrance. Street parking available.',
        setLength: context.bid.setLength || 45,
        billingPosition: context.bid.billingPosition || 'headliner',
        otherActs: context.bid.otherActs || ''
      };
    }
    
    // Tour request - usually no schedule yet
    return {};
  },
  
  component: ShowScheduleComponent
}; 