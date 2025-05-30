'use client';

import React, { useState, useEffect } from 'react';
import { ArtistTemplate, TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import TechnicalRequirementsTable from './TechnicalRequirementsTable';
import HospitalityRiderTable from './HospitalityRiderTable';

interface TemplateManagerProps {
  artistId: string;
  className?: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ artistId, className = '' }) => {
  const [templates, setTemplates] = useState<ArtistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ArtistTemplate | null>(null);
  const [isExpanded, setIsExpanded] = useState(className.includes('border-0 shadow-none'));

  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'COMPLETE' as 'TECH_RIDER' | 'BUSINESS' | 'LOGISTICS' | 'COMPLETE',
    isDefault: false,
    description: '',
    equipment: {
      needsPA: false,
      needsMics: false,
      needsDrums: false,
      needsAmps: false,
      acoustic: false,
    },
    technicalRequirements: [] as TechnicalRequirement[],
    hospitalityRequirements: [] as HospitalityRequirement[],
    guaranteeRange: { min: 0, max: 0 },
    acceptsDoorDeals: true,
    merchandising: true,
    travelMethod: 'van' as 'van' | 'flying' | 'train' | 'other',
    lodging: 'flexible' as 'floor-space' | 'hotel' | 'flexible',
    ageRestriction: 'all-ages' as 'all-ages' | '18+' | '21+',
    notes: ''
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/artists/${artistId}/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [artistId]);

  const resetForm = () => {
    setTemplateForm({
      name: '',
      type: 'COMPLETE',
      isDefault: false,
      description: '',
      equipment: {
        needsPA: false,
        needsMics: false,
        needsDrums: false,
        needsAmps: false,
        acoustic: false,
      },
      technicalRequirements: [],
      hospitalityRequirements: [],
      guaranteeRange: { min: 0, max: 0 },
      acceptsDoorDeals: true,
      merchandising: true,
      travelMethod: 'van',
      lodging: 'flexible',
      ageRestriction: 'all-ages',
      notes: ''
    });
    setEditingTemplate(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTemplate 
        ? `/api/artists/${artistId}/templates/${editingTemplate.id}`
        : `/api/artists/${artistId}/templates`;
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      // Clean the data to ensure no undefined values or circular references
      const cleanData = {
        name: templateForm.name || '',
        type: templateForm.type || 'COMPLETE',
        isDefault: Boolean(templateForm.isDefault),
        description: templateForm.description || '',
        equipment: {
          needsPA: Boolean(templateForm.equipment?.needsPA),
          needsMics: Boolean(templateForm.equipment?.needsMics),
          needsDrums: Boolean(templateForm.equipment?.needsDrums),
          needsAmps: Boolean(templateForm.equipment?.needsAmps),
          acoustic: Boolean(templateForm.equipment?.acoustic),
        },
        technicalRequirements: Array.isArray(templateForm.technicalRequirements) 
          ? templateForm.technicalRequirements.map(req => ({
              id: req.id || '',
              requirement: req.requirement || '',
              required: Boolean(req.required)
            }))
          : [],
        hospitalityRequirements: Array.isArray(templateForm.hospitalityRequirements)
          ? templateForm.hospitalityRequirements.map(req => ({
              id: req.id || '',
              requirement: req.requirement || '',
              required: Boolean(req.required)
            }))
          : [],
        guaranteeRange: {
          min: Number(templateForm.guaranteeRange?.min) || 0,
          max: 0
        },
        acceptsDoorDeals: Boolean(templateForm.acceptsDoorDeals),
        merchandising: Boolean(templateForm.merchandising),
        travelMethod: templateForm.travelMethod || 'van',
        lodging: templateForm.lodging || 'flexible',
        ageRestriction: templateForm.ageRestriction || 'all-ages',
        notes: templateForm.notes || ''
      };
      
      console.log('Sending template data:', cleanData);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });

      if (response.ok) {
        await fetchTemplates();
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Template save error:', errorData);
        alert(`Error saving template: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template: Network or serialization error');
    }
  };

  const handleEdit = (template: ArtistTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      isDefault: template.isDefault,
      description: template.description || '',
      equipment: {
        needsPA: template.equipment?.needsPA ?? false,
        needsMics: template.equipment?.needsMics ?? false,
        needsDrums: template.equipment?.needsDrums ?? false,
        needsAmps: template.equipment?.needsAmps ?? false,
        acoustic: template.equipment?.acoustic ?? false,
      },
      technicalRequirements: template.technicalRequirements || [],
      hospitalityRequirements: template.hospitalityRequirements || [],
      guaranteeRange: { 
        min: template.guaranteeRange?.min || 0, 
        max: 0 
      },
      acceptsDoorDeals: template.acceptsDoorDeals ?? true,
      merchandising: template.merchandising ?? true,
      travelMethod: (template.travelMethod as any) || 'van',
      lodging: (template.lodging as any) || 'flexible',
      ageRestriction: (template.ageRestriction as any) || 'all-ages',
      notes: template.notes || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/artists/${artistId}/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTemplates();
      } else {
        alert('Error deleting template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const handleSetDefault = async (templateId: string, isDefault: boolean) => {
    try {
      const response = await fetch(`/api/artists/${artistId}/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault }),
      });

      if (response.ok) {
        await fetchTemplates();
      } else {
        alert('Error updating default template');
      }
    } catch (error) {
      console.error('Error updating default template:', error);
      alert('Error updating default template');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      {!className.includes('border-0 shadow-none') && (
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Show Request Templates ({templates.length})
            </h3>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Save your technical requirements and business terms to auto-fill show requests
          </p>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading templates...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info about default templates */}
              {templates.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      <p className="text-blue-800 font-medium">Default Template Auto-Fill</p>
                      <p className="text-blue-700 mt-1">
                        Your default template (marked with ✓) will automatically fill new show request forms. 
                        This saves time by pre-populating your usual requirements and terms.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Templates List */}
              {templates.length > 0 ? (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div 
                      key={template.id} 
                      className={`border rounded-lg p-4 transition-all ${
                        template.isDefault 
                          ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {template.name}
                            </h4>
                            {template.isDefault && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                ✓ Default
                              </span>
                            )}
                          </div>
                          
                          {template.description && (
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          )}
                          
                          <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                            {template.equipment?.needsPA && <span className="bg-gray-100 px-2 py-1 rounded">PA</span>}
                            {template.equipment?.needsMics && <span className="bg-gray-100 px-2 py-1 rounded">Mics</span>}
                            {template.equipment?.needsDrums && <span className="bg-gray-100 px-2 py-1 rounded">Drums</span>}
                            {template.equipment?.needsAmps && <span className="bg-gray-100 px-2 py-1 rounded">Amps</span>}
                            {template.guaranteeRange?.min && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                ${template.guaranteeRange.min} min
                              </span>
                            )}
                            <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                              {template.travelMethod}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {!template.isDefault && (
                            <button
                              onClick={() => handleSetDefault(template.id, true)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                              title="Set as default template"
                            >
                              Set Default
                            </button>
                          )}
                          
                          {template.isDefault && (
                            <button
                              onClick={() => handleSetDefault(template.id, false)}
                              className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                              title="Remove as default"
                            >
                              Remove Default
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEdit(template)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎸</div>
                  <p>No templates yet</p>
                  <p className="text-sm">Create your first template to save time on show requests!</p>
                </div>
              )}

              {/* Create/Edit Form */}
              {showCreateForm ? (
                <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Full Band Setup"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Guarantee Range */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Guarantee ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={templateForm.guaranteeRange.min}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        guaranteeRange: { ...prev.guaranteeRange, min: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="e.g., 500"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum amount needed to cover costs (travel, accommodation, etc.)
                    </p>
                  </div>

                  {/* Travel & Logistics */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Travel Method
                      </label>
                      <select
                        value={templateForm.travelMethod}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, travelMethod: e.target.value as any }))}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="van">Van</option>
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
                        value={templateForm.lodging}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, lodging: e.target.value as any }))}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="flexible">Flexible</option>
                        <option value="floor-space">Floor Space</option>
                        <option value="hotel">Hotel</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={templateForm.notes}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Special requirements, setup notes, etc..."
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Dynamic Technical Requirements Table - Moved to bottom */}
                  <div className="mt-6">
                    <TechnicalRequirementsTable
                      requirements={templateForm.technicalRequirements}
                      onChange={(requirements) => setTemplateForm(prev => ({ ...prev, technicalRequirements: requirements }))}
                    />
                  </div>

                  {/* Dynamic Hospitality Rider Table - Moved to bottom */}
                  <div className="mt-6">
                    <HospitalityRiderTable
                      requirements={templateForm.hospitalityRequirements}
                      onChange={(requirements) => setTemplateForm(prev => ({ ...prev, hospitalityRequirements: requirements }))}
                    />
                  </div>

                  {/* Default Template */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={templateForm.isDefault}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Set as default template</span>
                        <p className="text-xs text-gray-600 mt-1">
                          The default template will automatically fill new show request forms, saving you time. 
                          Only one template can be default at a time.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Template
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateManager; 