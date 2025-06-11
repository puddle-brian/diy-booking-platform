'use client';

import React, { useState, useEffect } from 'react';

interface HoldScenario {
  id: string;
  name: string;
  description: string;
  artistId: string;
  artistName: string;
  tourRequestId: string;
  tourRequestTitle: string;
  heldVenue: {
    id: string;
    name: string;
    bidId: string;
  };
  frozenVenues: Array<{
    id: string;
    name: string;
    bidId: string;
  }>;
  holdDuration: number; // hours
  holdReason: string;
  isActive: boolean;
  createdAt: string;
}

interface PresetScenario {
  name: string;
  description: string;
  artistId: string;
  artistName: string;
  holdReason: string;
  holdDuration: number;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    name: "Lightning Bolt Multi-City Hold",
    description: "Lightning Bolt has a hold on one venue with 3 frozen competing bids",
    artistId: "1748101913848",
    artistName: "Lightning Bolt",
    holdReason: "Finalizing routing details with management",
    holdDuration: 48
  },
  {
    name: "Quick Hold Test",
    description: "Simple hold scenario for UI testing",
    artistId: "1748101913848", 
    artistName: "Lightning Bolt",
    holdReason: "Quick UI test scenario",
    holdDuration: 24
  }
];

export default function AdminHoldsPage() {
  const [scenarios, setScenarios] = useState<HoldScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const response = await fetch('/api/admin/holds/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const createPresetScenario = async (preset: PresetScenario) => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/holds/create-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Created "${preset.name}" - ${result.summary}`);
        loadScenarios();
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to create scenario: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllHolds = async () => {
    if (!window.confirm('🚨 Clear ALL hold states and reset to AVAILABLE? This will affect all bids.')) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/holds/clear-all', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Cleared all holds - ${result.summary}`);
        loadScenarios();
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to clear holds: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const releaseHold = async (scenarioId: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/admin/holds/release/${scenarioId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Released hold - ${result.summary}`);
        loadScenarios();
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to release hold: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hold System Testing</h1>
          <p className="mt-2 text-gray-600">
            Create and manage hold scenarios for testing the timeline UI. Holds create parent rows with frozen child bids.
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearAllHolds}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '⏳ Clearing...' : '🧹 Clear All Holds'}
            </button>
            
            <button
              onClick={loadScenarios}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Preset Scenarios */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create Preset Scenarios</h2>
          
          <div className="grid gap-4">
            {PRESET_SCENARIOS.map((preset) => (
              <div key={preset.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div>Artist: {preset.artistName}</div>
                      <div>Reason: "{preset.holdReason}"</div>
                      <div>Duration: {preset.holdDuration} hours</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => createPresetScenario(preset)}
                    disabled={loading}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? '⏳' : '🎯 Create'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Scenarios */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Active Hold Scenarios</h2>
          
          {scenarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔓</div>
              <p>No active hold scenarios</p>
              <p className="text-sm">Create a preset scenario above to test hold functionality</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          scenario.isActive 
                            ? 'bg-violet-100 text-violet-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {scenario.isActive ? '🔒 Active' : '🔓 Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <div className="font-medium">Artist: {scenario.artistName}</div>
                          <div>Tour: {scenario.tourRequestTitle}</div>
                        </div>
                        <div>
                          <div className="font-medium text-violet-700">
                            🎯 HELD: {scenario.heldVenue.name}
                          </div>
                          <div className="text-slate-600">
                            ❄️ FROZEN: {scenario.frozenVenues.map(v => v.name).join(', ')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-400">
                        Reason: "{scenario.holdReason}" | Created: {new Date(scenario.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    {scenario.isActive && (
                      <button
                        onClick={() => releaseHold(scenario.id)}
                        disabled={loading}
                        className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        {loading ? '⏳' : '🔓 Release'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testing Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🧪 Testing Guide</h2>
          
          <div className="text-sm text-blue-800 space-y-2">
            <div><strong>1. Create a hold scenario</strong> → This will create HELD and FROZEN bids</div>
            <div><strong>2. View artist itinerary</strong> → Should see parent row like "Venue Name +3" in purple</div>
            <div><strong>3. Check frozen bids</strong> → Action buttons should be replaced with ❄️ snowflake</div>
            <div><strong>4. Test interactions</strong> → Document access should be disabled for frozen bids</div>
            <div><strong>5. Release hold</strong> → All bids should return to normal AVAILABLE state</div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <div className="text-xs text-blue-700">
              <strong>Timeline Expected Behavior:</strong><br/>
              • Parent row: <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">🎯 Venue Name +3</span> (purple background)<br/>
              • Child rows: <span className="px-2 py-1 bg-yellow-50 text-gray-700 rounded text-xs">❄️ Frozen venues</span> (no action buttons)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 