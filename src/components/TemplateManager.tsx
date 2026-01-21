'use client';

import React, { useState, useEffect } from 'react';
import { ArtistTemplate, TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import TemplateFormCore from './TemplateFormCore';

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
    <div className={`bg-bg-primary ${className}`}>
      {/* Header */}
      {!className.includes('border-0 shadow-none') && (
        <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-sm font-medium text-text-accent uppercase tracking-wider">
              <span className="text-text-muted mr-2">&gt;</span>
              TEMPLATES [{templates.length}]
            </h3>
            <svg 
              className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <p className="text-2xs text-text-muted mt-1 uppercase tracking-wider">
            Save requirements and terms for auto-fill
          </p>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-accent"></div>
              <span className="text-xs text-text-muted uppercase tracking-wider">LOADING_TEMPLATES...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info about default templates */}
              {templates.length > 0 && (
                <div className="bg-bg-secondary border border-border-subtle p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-text-accent flex-shrink-0">[i]</span>
                    <div className="text-xs">
                      <p className="text-text-accent font-medium uppercase">DEFAULT_AUTO_FILL</p>
                      <p className="text-text-secondary mt-1">
                        Your default template (marked with ✓) will automatically fill new show request forms.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Templates List */}
              {templates.length > 0 ? (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div 
                      key={template.id} 
                      className={`border p-4 transition-all ${
                        template.isDefault 
                          ? 'border-text-accent bg-bg-tertiary' 
                          : 'border-border-subtle bg-bg-secondary'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-text-primary text-sm uppercase">
                              {template.name}
                            </h4>
                            {template.isDefault && (
                              <span className="inline-flex items-center px-2 py-1 text-2xs font-medium bg-text-accent/20 text-text-accent border border-text-accent/30 uppercase">
                                ✓ DEFAULT
                              </span>
                            )}
                          </div>
                          
                          {template.description && (
                            <p className="text-xs text-text-secondary mb-2">{template.description}</p>
                          )}
                          
                          <div className="text-2xs text-text-muted flex flex-wrap gap-1">
                            {template.equipment?.needsPA && <span className="bg-bg-tertiary border border-border-subtle px-2 py-1 uppercase">PA</span>}
                            {template.equipment?.needsMics && <span className="bg-bg-tertiary border border-border-subtle px-2 py-1 uppercase">MICS</span>}
                            {template.equipment?.needsDrums && <span className="bg-bg-tertiary border border-border-subtle px-2 py-1 uppercase">DRUMS</span>}
                            {template.equipment?.needsAmps && <span className="bg-bg-tertiary border border-border-subtle px-2 py-1 uppercase">AMPS</span>}
                            {template.guaranteeRange?.min && (
                              <span className="bg-status-success/10 text-status-success border border-status-success/30 px-2 py-1 uppercase">
                                ${template.guaranteeRange.min}+
                              </span>
                            )}
                            <span className="bg-bg-tertiary border border-border-subtle px-2 py-1 uppercase">
                              {template.travelMethod}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {!template.isDefault && (
                            <button
                              onClick={() => handleSetDefault(template.id, true)}
                              className="text-2xs text-text-accent hover:text-text-primary px-2 py-1 border border-text-accent/30 hover:bg-text-accent/10 transition-colors uppercase"
                              title="Set as default template"
                            >
                              [SET_DEFAULT]
                            </button>
                          )}
                          
                          {template.isDefault && (
                            <button
                              onClick={() => handleSetDefault(template.id, false)}
                              className="text-2xs text-text-muted hover:text-text-primary px-2 py-1 border border-border-subtle hover:bg-bg-hover transition-colors uppercase"
                              title="Remove as default"
                            >
                              [REMOVE]
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEdit(template)}
                            className="text-status-info hover:text-text-primary text-2xs px-2 py-1 hover:bg-status-info/10 transition-colors uppercase"
                          >
                            [EDIT]
                          </button>
                          
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="text-status-error hover:text-text-primary text-2xs px-2 py-1 hover:bg-status-error/10 transition-colors uppercase"
                          >
                            [DELETE]
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted border border-border-subtle bg-bg-secondary">
                  <div className="text-2xl mb-2">◇</div>
                  <p className="text-text-secondary uppercase text-xs tracking-wider">NO_TEMPLATES</p>
                  <p className="text-2xs mt-1">Create your first template to save time</p>
                </div>
              )}

              {/* Create/Edit Form */}
              {showCreateForm ? (
                <form onSubmit={handleSubmit} className="border border-border-subtle p-4 bg-bg-secondary">
                  <h4 className="font-medium text-text-accent mb-4 text-xs uppercase tracking-wider">
                    <span className="text-text-muted mr-2">&gt;</span>
                    {editingTemplate ? 'EDIT_TEMPLATE' : 'NEW_TEMPLATE'}
                  </h4>
                  
                  {/* 🎯 USE SHARED TEMPLATE FORM CORE - Single Source of Truth */}
                  <TemplateFormCore
                    formData={templateForm}
                    onChange={(field, value) => setTemplateForm(prev => ({ ...prev, [field]: value }))}
                    mode="template"
                  />

                  {/* Form Actions */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-text-accent text-bg-primary px-4 py-2 hover:bg-text-primary transition-colors text-xs uppercase tracking-wider font-medium"
                    >
                      {editingTemplate ? '[UPDATE]' : '[CREATE]'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-bg-tertiary border border-border-default text-text-secondary px-4 py-2 hover:bg-bg-hover transition-colors text-xs uppercase tracking-wider"
                    >
                      [CANCEL]
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-bg-secondary border border-border-default text-text-accent py-3 px-4 hover:bg-bg-hover hover:border-text-accent transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-medium"
                >
                  <span>+</span>
                  CREATE_NEW_TEMPLATE
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