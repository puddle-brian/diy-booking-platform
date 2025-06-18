import React, { useState, useEffect } from 'react';
import { ModuleDefinition, ModuleComponentProps } from './ModuleRegistry';
import { ArtistTemplate } from '../../../types/templates';
import TemplateFormCore from '../TemplateFormCore';

/**
 * Artist Requirements & Rider Module Component
 * 🎯 NOW WITH TEMPLATE INTEGRATION - Template is source of truth, using TemplateFormRenderer directly
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

  // 🎯 NEW: Template integration state
  const [artistTemplate, setArtistTemplate] = useState<ArtistTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  // 🎯 FIX: Local form state for immediate responsiveness
  const [localFormChanges, setLocalFormChanges] = useState<any>({});
  const [preservedContext, setPreservedContext] = useState<any>(null);
  
  // 🎯 PRESERVE: Save context when we have valid artistId  
  useEffect(() => {
    const artistId = data?.artistId || data?.artist?.id;
    if (artistId && (!preservedContext || preservedContext.artistId !== artistId)) {
      const context = {
        artistId,
        artist: data?.artist || { id: artistId, name: data?.artistName },
      };
      console.log('🎭 ArtistRequirementsModule: Preserving context:', context);
      setPreservedContext(context);
    }
  }, [data?.artistId, data?.artist?.id, preservedContext]);

  // 🎯 NEW: Fetch artist's default template
  useEffect(() => {
    const fetchArtistTemplate = async () => {
      try {
        setTemplateLoading(true);
        setTemplateError(null);
        
        // Extract artistId from context data OR preserved context
        const artistId = data?.artistId || data?.artist?.id || preservedContext?.artistId;
        
        if (!artistId) {
          console.warn('🎭 ArtistRequirementsModule: No artistId found (data:', data?.artistId, 'preserved:', preservedContext?.artistId, '), using fallback data');
          setArtistTemplate(null);
          setTemplateLoading(false);
          return;
        }

        console.log('🎭 ArtistRequirementsModule: Fetching template for artist:', artistId);
        
        const response = await fetch(`/api/artists/${artistId}/templates`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.status}`);
        }

        const result = await response.json();
        
        // Find the default template, or use the first COMPLETE template, or fall back to first template
        const defaultTemplate = result.templates?.find((t: ArtistTemplate) => t.isDefault) ||
                               result.templates?.find((t: ArtistTemplate) => t.type === 'COMPLETE') ||
                               result.templates?.[0];

        console.log('🎭 ArtistRequirementsModule: Found template:', defaultTemplate?.name);
        setArtistTemplate(defaultTemplate || null);
        
      } catch (error) {
        console.error('🎭 ArtistRequirementsModule: Template fetch error:', error);
        setTemplateError(error instanceof Error ? error.message : 'Failed to load template');
        setArtistTemplate(null);
      } finally {
        setTemplateLoading(false);
      }
    };

    fetchArtistTemplate();
  }, [data?.artistId, data?.artist?.id, preservedContext?.artistId]);

  // 🎯 FIX: Clear local form changes when parent data updates (prevents conflicts)
  // But ONLY if we're not currently editing to prevent losing unsaved changes
  React.useEffect(() => {
    if (!isEditing) {
      console.log('🎭 ArtistRequirementsModule: Clearing local changes (not editing)');
      setLocalFormChanges({});
    } else {
      console.log('🎭 ArtistRequirementsModule: Preserving local changes (currently editing)');
    }
  }, [data, isEditing]);

  // 🎯 FIXED: Compute effective data using useMemo to prevent double renders
  const effectiveData = React.useMemo(() => {
    if (!artistTemplate) {
      // No template - use document data as-is (fallback behavior) + local changes
      return { ...(data || {}), ...localFormChanges };
    }

    // Merge template data with document overrides and local form changes
    const merged = {
      // Start with template as base
      equipment: artistTemplate.equipment || {},
      guaranteeRange: artistTemplate.guaranteeRange || { min: 0, max: 0 },
      acceptsDoorDeals: artistTemplate.acceptsDoorDeals ?? true,
      merchandising: artistTemplate.merchandising ?? true,
      ageRestriction: artistTemplate.ageRestriction || 'all-ages',
      travelMethod: artistTemplate.travelMethod || 'van',
      lodging: artistTemplate.lodging || 'flexible',
      priority: artistTemplate.priority || 'medium',
      technicalRequirements: artistTemplate.technicalRequirements || [],
      hospitalityRequirements: artistTemplate.hospitalityRequirements || [],
      expectedDraw: artistTemplate.expectedDraw || null,
      description: artistTemplate.description || '',
      tourStatus: artistTemplate.tourStatus || '',
      notes: artistTemplate.notes || '',
      
      // 🎯 CRITICAL: Apply document-specific overrides on top
      ...data,
      
      // 🎯 NEW: Apply local form changes for immediate responsiveness
      ...localFormChanges,
      
      // 🎯 META: Include template info for display
      _templateSource: {
        templateId: artistTemplate.id,
        templateName: artistTemplate.name,
        templateType: artistTemplate.type
      }
    };

    console.log('🎭 ArtistRequirementsModule: Computed effective data:', {
      hasTemplate: !!artistTemplate,
      templateName: artistTemplate.name,
      hasOverrides: !!data && Object.keys(data).length > 0,
      hasLocalChanges: Object.keys(localFormChanges).length > 0,
      effectiveKeys: Object.keys(merged)
    });
    
    // 🔍 DEBUG: Track checkbox values in effective data specifically
    console.log('🔍 EFFECTIVE DATA CHECKBOXES:', {
      merchandising: merged.merchandising,
      acceptsDoorDeals: merged.acceptsDoorDeals,
      'from template': {
        merchandising: artistTemplate?.merchandising,
        acceptsDoorDeals: artistTemplate?.acceptsDoorDeals
      },
      'from data overrides': {
        merchandising: data?.merchandising,
        acceptsDoorDeals: data?.acceptsDoorDeals
      },
      'from local changes': {
        merchandising: localFormChanges?.merchandising,
        acceptsDoorDeals: localFormChanges?.acceptsDoorDeals
      }
    });

    return merged;
  }, [artistTemplate, data, localFormChanges]);

  // 🎯 FIXED: Handle template form changes with immediate feedback + persistence
  const handleTemplateFormChange = (field: string, value: any) => {
    // 🎯 IMMEDIATE: Update local form state for instant responsiveness
    console.log('🎭 ArtistRequirementsModule: Field changed:', field, '=', value);
    
    // 🔍 DEBUG: Special logging for checkbox fields to track the issue
    if (field === 'merchandising' || field === 'acceptsDoorDeals') {
      console.log('🔍 CHECKBOX DEBUG: Before change');
      console.log('🔍 Current effective data:', {
        merchandising: effectiveData.merchandising,
        acceptsDoorDeals: effectiveData.acceptsDoorDeals
      });
      console.log('🔍 Current local changes:', localFormChanges);
    }
    
    setLocalFormChanges((prev: any) => {
      const newChanges = { ...prev, [field]: value };
      console.log('🎭 ArtistRequirementsModule: New local changes:', newChanges);
      
      // 🔍 DEBUG: More checkbox debugging
      if (field === 'merchandising' || field === 'acceptsDoorDeals') {
        console.log('🔍 CHECKBOX DEBUG: After local change update');
        console.log('🔍 New local changes for checkboxes:', {
          merchandising: newChanges.merchandising,
          acceptsDoorDeals: newChanges.acceptsDoorDeals
        });
      }
      
      return newChanges;
    });
    
    // 🎯 PERSISTENCE: Calculate what the new effective data would be for saving
    const newEffectiveData = { ...effectiveData, [field]: value };
    
    // 🎯 SMART: Only store fields that differ from template
    const overrides: any = {};
    
    if (artistTemplate) {
      // Compare each field with template and only store differences
      Object.keys(newEffectiveData).forEach(key => {
        if (key.startsWith('_')) return; // Skip meta fields
        
        const templateValue = (artistTemplate as any)[key];
        const newValue = newEffectiveData[key];
        
        // Deep comparison for objects, simple comparison for primitives
        if (JSON.stringify(templateValue) !== JSON.stringify(newValue)) {
          overrides[key] = newValue;
        }
      });
      
      console.log('🎭 ArtistRequirementsModule: Storing overrides:', overrides);
    } else {
      // No template - store all data (excluding meta fields)
      Object.keys(newEffectiveData).forEach(key => {
        if (!key.startsWith('_')) {
          overrides[key] = newEffectiveData[key];
        }
      });
    }

    // Pass overrides to parent (this will trigger re-render with new data)
    onDataChange(overrides);
  };

  // Debug: Log data changes to understand what's happening
  React.useEffect(() => {
    console.log('🎭 ArtistRequirementsComponent: Data updated:', {
      isEditing,
      templateLoading,
      hasTemplate: !!artistTemplate,
      templateName: artistTemplate?.name,
      dataKeys: data ? Object.keys(data) : [],
      effectiveDataKeys: Object.keys(effectiveData),
      hasEquipment: !!effectiveData?.equipment,
      hasGuaranteeRange: !!effectiveData?.guaranteeRange,
      acceptsDoorDeals: effectiveData?.acceptsDoorDeals,
      merchandising: effectiveData?.merchandising
    });
  }, [data, isEditing, artistTemplate, effectiveData, templateLoading]);

  // 🎯 ENHANCED: Show template loading state
  if (templateLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl">🎸</span>
        </div>
        <p className="font-medium mb-2">Loading Artist Template...</p>
        <p className="text-sm">Fetching requirements and rider information</p>
      </div>
    );
  }

  // 🎯 ENHANCED: Show template error state
  if (templateError) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="font-medium mb-2 text-red-600">Template Load Error</p>
        <p className="text-sm text-red-500">{templateError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // 🎯 ENHANCED: Show empty state with template guidance
  if (!effectiveData || Object.keys(effectiveData).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎸</span>
        </div>
        <p className="font-medium mb-2">No Artist Requirements Set</p>
        <p className="text-sm">
          {artistTemplate 
            ? `Using template: ${artistTemplate.name}` 
            : viewerType === 'artist' 
              ? "Set your technical and hospitality requirements in your artist template."
              : "Artist requirements will appear here when specified."
          }
        </p>
        {viewerType === 'artist' && !artistTemplate && (
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Create Template
          </button>
        )}
      </div>
    );
  }

  // 🎯 EDITING MODE: Use TemplateFormCore directly (same as template system)
  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* 🎯 NEW: Template source indicator */}
        {effectiveData._templateSource && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🎨</span>
              <div className="text-sm">
                <span className="font-medium text-blue-800">
                  Based on template: {effectiveData._templateSource.templateName}
                </span>
                <span className="text-blue-600 ml-2">
                  ({effectiveData._templateSource.templateType})
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Changes made here will override your template for this show only
            </p>
          </div>
        )}

        {/* 🎯 SELECTIVE FORM: Only show fields that have actual values in template/document */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-6">
          
          {/* Business Terms - Only if template/data has these fields */}
          {(effectiveData.guaranteeRange || effectiveData.ageRestriction || effectiveData.acceptsDoorDeals !== undefined || effectiveData.merchandising !== undefined || effectiveData.priority) && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Business Terms</h4>
              <div className="space-y-4">
                
                {/* Guarantee Range - Only if set in template */}
                {effectiveData.guaranteeRange && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Guarantee ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={effectiveData.guaranteeRange?.min || ''}
                        onChange={(e) => handleTemplateFormChange('guaranteeRange', {
                          ...effectiveData.guaranteeRange,
                          min: parseInt(e.target.value) || 0
                        })}
                        placeholder="e.g., 500"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {effectiveData.guaranteeRange?.max !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Guarantee ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={effectiveData.guaranteeRange?.max || ''}
                          onChange={(e) => handleTemplateFormChange('guaranteeRange', {
                            ...effectiveData.guaranteeRange,
                            max: parseInt(e.target.value) || 0
                          })}
                          placeholder="e.g., 1500"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Age Restriction - Only if set in template */}
                {effectiveData.ageRestriction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Restriction
                    </label>
                    <select
                      value={effectiveData.ageRestriction || 'flexible'}
                      onChange={(e) => handleTemplateFormChange('ageRestriction', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="flexible">Flexible</option>
                      <option value="all-ages">All Ages</option>
                      <option value="18+">18+</option>
                      <option value="21+">21+</option>
                    </select>
                  </div>
                )}

                {/* Priority - Only if set in template */}
                {effectiveData.priority && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={effectiveData.priority || 'medium'}
                      onChange={(e) => handleTemplateFormChange('priority', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}

                {/* Checkboxes - Only if explicitly set in template/data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {effectiveData.acceptsDoorDeals !== undefined && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={effectiveData.acceptsDoorDeals || false}
                        onChange={(e) => handleTemplateFormChange('acceptsDoorDeals', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Accepts Door Deals</span>
                    </label>
                  )}
                  {effectiveData.merchandising !== undefined && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={effectiveData.merchandising || false}
                        onChange={(e) => handleTemplateFormChange('merchandising', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Merchandising</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
                    )}

          {/* Equipment - Only show if template actually defines specific equipment */}
          {effectiveData.equipment && Object.keys(effectiveData.equipment).some(key => effectiveData.equipment[key] === true) && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Equipment Requirements</h4>
              <div className="space-y-2 text-sm">
                {effectiveData.equipment.needsPA && (
                  <div>
                    <span className="font-medium text-gray-700">PA System:</span>
                    <span className="ml-2 text-green-600">Required</span>
                  </div>
                )}
                {effectiveData.equipment.needsMics && (
                  <div>
                    <span className="font-medium text-gray-700">Microphones:</span>
                    <span className="ml-2 text-green-600">Required</span>
                  </div>
                )}
                {effectiveData.equipment.needsDrums && (
                  <div>
                    <span className="font-medium text-gray-700">Drum Kit:</span>
                    <span className="ml-2 text-green-600">Required</span>
                  </div>
                )}
                {effectiveData.equipment.needsAmps && (
                  <div>
                    <span className="font-medium text-gray-700">Amplifiers:</span>
                    <span className="ml-2 text-green-600">Required</span>
                  </div>
                )}
                {effectiveData.equipment.acoustic && (
                  <div>
                    <span className="font-medium text-gray-700">Acoustic Setup:</span>
                    <span className="ml-2 text-green-600">Required</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Equipment requirements are set in your artist template and cannot be changed per show.
              </p>
            </div>
          )}

          {/* Travel & Logistics - Only if set in template */}
          {(effectiveData.travelMethod || effectiveData.lodging) && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Travel & Logistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {effectiveData.travelMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Travel Method
                    </label>
                    <select
                      value={effectiveData.travelMethod || 'van'}
                      onChange={(e) => handleTemplateFormChange('travelMethod', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="van">Van/Vehicle</option>
                      <option value="flying">Flying</option>
                      <option value="train">Train</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
                {effectiveData.lodging && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lodging Preference
                    </label>
                    <select
                      value={effectiveData.lodging || 'flexible'}
                      onChange={(e) => handleTemplateFormChange('lodging', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="flexible">Flexible</option>
                      <option value="floor-space">Floor Space</option>
                      <option value="hotel">Hotel</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Requirements - Only if set in template */}
          {effectiveData.technicalRequirements && effectiveData.technicalRequirements.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Technical Requirements</h4>
              <div className="space-y-2">
                {effectiveData.technicalRequirements.map((req: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">{req.category}</div>
                    <div className="text-gray-900 mt-1">{req.description}</div>
                    {req.critical && (
                      <div className="text-red-600 text-xs mt-1">⚠ Critical Requirement</div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                To modify technical requirements, edit your artist template.
              </p>
            </div>
          )}

          {/* Hospitality Requirements - Only if set in template */}
          {effectiveData.hospitalityRequirements && effectiveData.hospitalityRequirements.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Hospitality Rider</h4>
              <div className="space-y-2">
                {effectiveData.hospitalityRequirements.map((req: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">{req.category}</div>
                    <div className="text-gray-900 mt-1">{req.description}</div>
                    {req.quantity && (
                      <div className="text-gray-600 text-xs mt-1">Quantity: {req.quantity}</div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                To modify hospitality requirements, edit your artist template.
              </p>
            </div>
          )}

          {/* Notes - Only if set in template */}
          {effectiveData.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes & Requirements
              </label>
              <textarea
                value={effectiveData.notes || ''}
                onChange={(e) => handleTemplateFormChange('notes', e.target.value)}
                placeholder="Special setup requirements, accessibility needs, unique equipment, stage plot details..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              console.log('🎭 ArtistRequirements SAVE: Starting save process');
              console.log('🎭 ArtistRequirements SAVE: Local changes:', localFormChanges);
              
              if (Object.keys(localFormChanges).length === 0) {
                console.log('🎭 ArtistRequirements SAVE: No changes to save, just closing');
                onCancel();
                return;
              }
              
              try {
                // 🎯 SIMPLE: Just prepare the data and let parent handle the API call
                const contextData = {
                  artistId: data?.artistId || preservedContext?.artistId,
                  artist: data?.artist || preservedContext?.artist,
                };
                
                const saveData = { ...contextData, ...localFormChanges };
                console.log('🎭 ArtistRequirements SAVE: Sending to parent for API call:', saveData);
                
                // Let parent component handle the save
                onDataChange(saveData);
                await onSave(); // This should trigger the parent's save logic
                
                // Clear local changes and close edit mode
                setLocalFormChanges({});
                onCancel();
                
                console.log('🎭 ArtistRequirements SAVE: Success!');
                
              } catch (error) {
                console.error('🎭 ArtistRequirements SAVE: Error:', error);
                alert(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            )}
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // 🎯 DISPLAY MODE: Mirror the exact structure of TemplateFormRenderer
  return (
    <div className="space-y-6">
      {/* 🎯 NEW: Template source indicator */}
      {effectiveData._templateSource && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🎨</span>
              <div className="text-sm">
                <span className="font-medium text-blue-800">
                  From template: {effectiveData._templateSource.templateName}
                </span>
                <span className="text-blue-600 ml-2">
                  ({effectiveData._templateSource.templateType})
                </span>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={onStartEdit}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
              >
                Override
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🎯 BUSINESS TERMS: Mirror TemplateFormRenderer structure */}
      {(effectiveData.guaranteeRange || effectiveData.ageRestriction || effectiveData.acceptsDoorDeals !== undefined || effectiveData.merchandising !== undefined) && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Business Terms</h4>
          <div className="space-y-2 text-sm">
            {effectiveData.guaranteeRange && effectiveData.guaranteeRange.min > 0 && (
              <div>
                <span className="font-medium text-gray-700">Minimum Guarantee:</span>
                <span className="ml-2 text-gray-900">${effectiveData.guaranteeRange.min}</span>
              </div>
            )}
            {effectiveData.ageRestriction && (
              <div>
                <span className="font-medium text-gray-700">Age Restriction:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {effectiveData.ageRestriction.replace(/[_-]/g, ' ')}
                </span>
              </div>
            )}
            {effectiveData.acceptsDoorDeals !== undefined && (
              <div>
                <span className="font-medium text-gray-700">Door Deals:</span>
                <span className={`ml-2 ${effectiveData.acceptsDoorDeals ? 'text-green-600' : 'text-red-600'}`}>
                  {effectiveData.acceptsDoorDeals ? 'Accepted' : 'Not Accepted'}
                </span>
              </div>
            )}
            {effectiveData.merchandising !== undefined && (
              <div>
                <span className="font-medium text-gray-700">Merchandising:</span>
                <span className={`ml-2 ${effectiveData.merchandising ? 'text-green-600' : 'text-red-600'}`}>
                  {effectiveData.merchandising ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎯 TRAVEL & LOGISTICS: Mirror TemplateFormRenderer structure */}
      {(effectiveData.travelMethod || effectiveData.lodging) && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Travel & Logistics</h4>
          <div className="space-y-2 text-sm">
            {effectiveData.travelMethod && (
              <div>
                <span className="font-medium text-gray-700">Travel Method:</span>
                <span className="ml-2 text-gray-900 capitalize">{effectiveData.travelMethod}</span>
              </div>
            )}
            {effectiveData.lodging && (
              <div>
                <span className="font-medium text-gray-700">Lodging Preference:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {effectiveData.lodging.replace('-', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎯 TECHNICAL REQUIREMENTS: Same as TemplateFormRenderer */}
      {effectiveData.technicalRequirements && effectiveData.technicalRequirements.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Technical Requirements</h5>
          <div className="space-y-2">
            {effectiveData.technicalRequirements.map((req: any, index: number) => (
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

      {/* 🎯 HOSPITALITY REQUIREMENTS: Same as TemplateFormRenderer */}
      {effectiveData.hospitalityRequirements && effectiveData.hospitalityRequirements.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Hospitality Rider</h5>
          <div className="space-y-2">
            {effectiveData.hospitalityRequirements.map((req: any, index: number) => (
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

      {/* 🎯 NOTES: Same as TemplateFormRenderer */}
      {effectiveData.notes && (
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Additional Notes & Requirements</h5>
          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
            {effectiveData.notes}
          </p>
        </div>
      )}

      {/* Edit Button */}
      {canEdit && !isEditing && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onStartEdit}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Requirements
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Artist Requirements Module Definition
 * 🎯 ENHANCED: Now with template integration and context-aware data extraction
 */
export const artistRequirementsModule: ModuleDefinition = {
  id: 'artist-requirements',
  title: 'Artist Requirements & Rider',
  owner: 'artist',
  order: 3, // After messaging and venue offer
  defaultStatus: 'draft',
  
  canEdit: (viewerType: string, status: string) => {
    return viewerType === 'artist' && status !== 'locked';
  },
  
  canView: (viewerType: string) => {
    return true; // Everyone can view artist requirements
  },
  
  extractData: (context: any) => {
    // 🎯 ENHANCED: Context-aware data extraction with artistId preservation
    
    if (context.show) {
      // Confirmed show - extract artist ID for template lookup from lineup or legacy fields
      const headliner = context.show.lineup?.find((item: any) => item.billingPosition === 'HEADLINER') || context.show.lineup?.[0];
      const artistId = headliner?.artistId || context.show.artistId;
      const artistName = headliner?.artistName || context.show.artistName;
      
      return {
        artistId,
        artist: { id: artistId, name: artistName },
        // Include any existing override data
        technicalRequirements: context.show.technicalRequirements || [],
        hospitalityRequirements: context.show.hospitalityRequirements || [],
        equipment: context.show.equipment || {},
        artistNotes: context.show.artistNotes
      };
    }
    
    if (context.bid) {
      // Venue bid - check for persisted overrides first, include artist context
      const baseData = {
        artistId: context.bid.artistId || (context.bid.tourRequest && context.bid.tourRequest.artistId),
        artist: context.bid.artist || (context.bid.tourRequest && { 
          id: context.bid.tourRequest.artistId, 
          name: context.bid.tourRequest.artistName 
        })
      };
      
      if (context.bid.artistRequirements) {
        // Return persisted override data with artist context
        return {
          ...baseData,
          ...context.bid.artistRequirements
        };
      }
      
      // No overrides - template will be used as base (artist context provided)
      return baseData;
    }
    
    if (context.tourRequest) {
      // Tour request - artist has specified their requirements
      return {
        artistId: context.tourRequest.artistId,
        artist: { id: context.tourRequest.artistId, name: context.tourRequest.artistName },
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
    
    // No context - return empty (template will provide base data if available)
    return {};
  },
  
  component: ArtistRequirementsComponent
}; 