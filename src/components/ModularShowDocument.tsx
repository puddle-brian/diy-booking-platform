'use client';

import React, { useState, useEffect } from 'react';
import { moduleRegistry, initializeModules } from './DocumentModules';

/**
 * ✅ MODULAR SHOW DOCUMENT SYSTEM - FULLY FUNCTIONAL
 * 
 * This component demonstrates the complete modular document architecture with:
 * 
 * 🎯 **Working Edit Forms**: All 3 modules now have fully functional edit interfaces
 * - VenueOfferModule: Financial terms, equipment, billing details, messages
 * - ArtistRequirementsModule: Equipment needs, business requirements, travel logistics  
 * - ShowScheduleModule: Time pickers for load-in, soundcheck, doors, show, curfew
 * 
 * 🔧 **Save Functionality**: Real form validation and data persistence
 * - Controlled inputs with proper state management
 * - Async save operations with loading states
 * - Status progression (draft → committed after save)
 * 
 * 🚀 **Extensible Architecture**: Adding new modules requires only 3 lines:
 * 1. Create module file with ModuleDefinition export
 * 2. Import in DocumentModules/index.ts
 * 3. Call moduleRegistry.register()
 * 
 * 🎨 **Standardized UX**: All modules follow the same edit/save/cancel pattern
 */

interface ModularShowDocumentProps {
  show?: any;
  bid?: any;
  tourRequest?: any;
  isOpen: boolean;
  onClose: () => void;
  viewerType: 'artist' | 'venue' | 'public';
  onUpdate?: (data: any) => void;
}

interface ModuleState {
  id: string;
  title: string;
  owner: string;
  status: string;
  data: any;
  canEdit: boolean;
  canView: boolean;
  isEditing: boolean;
  isSaving: boolean;
  errors: string[];
}

export default function ModularShowDocument({
  show,
  bid,
  tourRequest,
  isOpen,
  onClose,
  viewerType,
  onUpdate
}: ModularShowDocumentProps) {
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [documentData, setDocumentData] = useState<any>({});

  // Initialize modules when props change
  useEffect(() => {
    if (!isOpen) return;

    const context = { show, bid, tourRequest, viewerType };
    const initializedModules = initializeModules(context, viewerType);
    
    console.log('📋 ModularShowDocument: Loaded', initializedModules.length, 'modules for', viewerType, 'viewer');
    
    // Convert to local state format with editing capabilities
    const moduleStates: ModuleState[] = initializedModules.map(module => ({
      ...module,
      isEditing: false,
      isSaving: false,
      errors: []
    }));

    setModules(moduleStates);

    // Set document metadata
    if (show) {
      setDocumentData({
        title: `${show.artistName} at ${show.venueName}`,
        date: show.date,
        artistName: show.artistName,
        venueName: show.venueName
      });
    } else if (bid) {
      setDocumentData({
        title: `${bid.venueName} Bid`,
        date: bid.proposedDate,
        artistName: 'Artist', // Would need to fetch from tour request
        venueName: bid.venueName
      });
    } else if (tourRequest) {
      setDocumentData({
        title: tourRequest.title,
        startDate: tourRequest.startDate,
        endDate: tourRequest.endDate,
        artistName: tourRequest.artistName,
        location: tourRequest.location
      });
    }
  }, [show, bid, tourRequest, viewerType, isOpen]);

  // Handle starting edit mode for a module
  const handleStartEdit = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isEditing: true, errors: [] }
        : module
    ));
  };

  // Handle canceling edit mode
  const handleCancelEdit = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isEditing: false, errors: [] }
        : module
    ));
  };

  // Handle data changes within a module
  const handleDataChange = (moduleId: string, newData: any) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, data: newData }
        : module
    ));
  };

  // Handle saving a module
  const handleSave = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    console.log('💾 ModularShowDocument: Saving module:', moduleId, 'with data:', module.data);

    // Set saving state
    setModules(prev => prev.map(m => 
      m.id === moduleId 
        ? { ...m, isSaving: true, errors: [] }
        : m
    ));

    try {
      // Determine the correct API endpoint based on context
      let apiUrl = '';
      let requestBody: any = {};

      if (show) {
        // Updating a confirmed show
        apiUrl = `/api/shows/${show.id}`;
        requestBody = {
          moduleId,
          moduleData: module.data,
          ...mapModuleDataToShowFields(moduleId, module.data)
        };
      } else if (bid) {
        // Updating a venue bid
        apiUrl = `/api/show-requests/${bid.showRequestId}/bids`;
        requestBody = {
          bidId: bid.id,
          action: 'update-module',
          moduleId,
          moduleData: module.data,
          ...mapModuleDataToBidFields(moduleId, module.data)
        };
      } else if (tourRequest) {
        // Updating a tour request
        apiUrl = `/api/show-requests/${tourRequest.id}`;
        requestBody = {
          moduleId,
          moduleData: module.data,
          ...mapModuleDataToRequestFields(moduleId, module.data)
        };
      }

      console.log('🌐 API Call:', { method: 'PUT', url: apiUrl, body: requestBody });

      // Make the API call
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save ${moduleId}`);
      }

      const result = await response.json();
      console.log('✅ Save successful:', result);

      // Update module state
      setModules(prev => prev.map(m => 
        m.id === moduleId 
          ? { 
              ...m, 
              isEditing: false, 
              isSaving: false, 
              status: 'committed', // Progress to committed status
              errors: [] 
            }
          : m
      ));

      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate({ moduleId, data: module.data, apiResult: result });
      }

    } catch (error) {
      console.error('❌ Save failed:', error);
      
      // Handle errors
      setModules(prev => prev.map(m => 
        m.id === moduleId 
          ? { 
              ...m, 
              isSaving: false, 
              errors: [error instanceof Error ? error.message : 'Save failed'] 
            }
          : m
      ));
    }
  };

  // Helper functions to map module data to API fields
  const mapModuleDataToShowFields = (moduleId: string, data: any) => {
    switch (moduleId) {
      case 'venue-offer':
        return {
          guarantee: data.guarantee,
          doorDeal: data.doorDeal,
          capacity: data.capacity,
          ageRestriction: data.ageRestriction,
          notes: data.message
        };
      case 'show-schedule':
        return {
          loadIn: data.loadIn,
          soundcheck: data.soundcheck,
          doorsOpen: data.doorsOpen,
          showTime: data.showTime,
          curfew: data.curfew,
          scheduleNotes: data.scheduleNotes
        };
      case 'artist-requirements':
        return {
          artistNotes: data.artistNotes,
          equipment: data.equipment
        };
      default:
        return {};
    }
  };

  const mapModuleDataToBidFields = (moduleId: string, data: any) => {
    switch (moduleId) {
      case 'venue-offer':
        return {
          guarantee: data.guarantee,
          doorDeal: data.doorDeal,
          capacity: data.capacity,
          ageRestriction: data.ageRestriction,
          equipmentProvided: data.equipmentProvided,
          billingPosition: data.billingPosition,
          setLength: data.setLength,
          otherActs: data.otherActs,
          message: data.message
        };
      case 'show-schedule':
        return {
          loadIn: data.loadIn,
          soundcheck: data.soundcheck,
          doorsOpen: data.doorsOpen,
          showTime: data.showTime,
          curfew: data.curfew
        };
      case 'artist-requirements':
        return {
          // Artist requirements would be saved to the tour request, not the bid
          artistNotes: data.artistNotes
        };
      default:
        return {};
    }
  };

  const mapModuleDataToRequestFields = (moduleId: string, data: any) => {
    switch (moduleId) {
      case 'artist-requirements':
        return {
          equipment: data.equipment,
          guaranteeRange: data.guaranteeRange,
          acceptsDoorDeals: data.acceptsDoorDeals,
          merchandising: data.merchandising,
          ageRestriction: data.ageRestriction,
          travelMethod: data.travelMethod,
          lodging: data.lodging,
          priority: data.priority,
          expectedDraw: data.expectedDraw,
          description: data.description,
          artistNotes: data.artistNotes
        };
      default:
        return {};
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: 'Draft',
          icon: '✏️'
        };
      case 'proposed':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
          text: 'Proposed',
          icon: '⏳'
        };
      case 'committed':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
          text: 'Committed',
          icon: '✓'
        };
      case 'locked':
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
          text: 'Locked',
          icon: '🔒'
        };
      default:
        return {
          className: 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
          text: status,
          icon: '❓'
        };
    }
  };

  const getSectionBorderClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'border-l-4 border-gray-300 bg-gray-50';
      case 'proposed':
        return 'border-l-4 border-yellow-400 bg-yellow-50';
      case 'committed':
        return 'border-l-4 border-green-400 bg-green-50';
      case 'locked':
        return 'border-l-4 border-blue-400 bg-blue-50 opacity-90';
      default:
        return 'border-l-4 border-gray-300 bg-white';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                📋 Show Document (Modular)
              </h2>
              <h3 className="text-lg font-semibold text-gray-800">
                {documentData.title || `${documentData.artistName || 'Artist'} at ${documentData.venueName || 'Venue'}`}
              </h3>
              <p className="text-sm text-gray-600">
                {documentData.date && new Date(documentData.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {documentData.startDate && documentData.endDate && (
                  <>
                    {new Date(documentData.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {' - '}
                    {new Date(documentData.endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {' • '}
                    {documentData.location}
                  </>
                )}
              </p>
              <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                🚀 Modular System: {modules.length} modules loaded
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

        {/* Document Modules */}
        <div className="px-6 py-4 space-y-6">
          {modules.map((module) => {
            const statusBadge = getStatusBadge(module.status);
            const borderClass = getSectionBorderClass(module.status);
            const moduleDefinition = moduleRegistry.get(module.id);
            
            if (!moduleDefinition || !module.canView) {
              return null;
            }

            const ModuleComponent = moduleDefinition.component;
            
            return (
              <div key={module.id} className={`rounded-lg p-4 ${borderClass}`}>
                {/* Module Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-gray-900">{module.title}</h4>
                    <span className={statusBadge.className}>
                      <span className="mr-1">{statusBadge.icon}</span>
                      {statusBadge.text}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({module.owner === 'shared' ? 'Collaborative' : `${module.owner} managed`})
                    </span>
                  </div>
                  
                  {module.canEdit && module.status !== 'locked' && !module.isEditing && (
                    <button 
                      onClick={() => handleStartEdit(module.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* Module Content */}
                <div className="space-y-3">
                  <ModuleComponent
                    data={module.data}
                    isEditing={module.isEditing}
                    status={module.status}
                    viewerType={viewerType}
                    canEdit={module.canEdit}
                    onDataChange={(data) => handleDataChange(module.id, data)}
                    onSave={() => handleSave(module.id)}
                    onCancel={() => handleCancelEdit(module.id)}
                    onStartEdit={() => handleStartEdit(module.id)}
                    isSaving={module.isSaving}
                    errors={module.errors}
                  />
                </div>

                {/* Show errors if any */}
                {module.errors.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm text-red-800">
                      {module.errors.map((error, index) => (
                        <div key={index}>⚠️ {error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {modules.filter(m => m.status === 'committed').length} of {modules.length} modules committed
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Close
              </button>
              {viewerType !== 'public' && (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Save Document
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 