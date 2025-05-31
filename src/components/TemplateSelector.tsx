'use client';

import React, { useState, useEffect } from 'react';
import { ArtistTemplate, TemplateSelectorProps, TEMPLATE_TYPE_LABELS } from '../../types/templates';

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  artistId,
  onTemplateApply,
  className = '',
  disabled = false,
  autoFillDefault = true
}) => {
  const [templates, setTemplates] = useState<ArtistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [showAutoFillMessage, setShowAutoFillMessage] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [artistId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/artists/${artistId}/templates`);
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        
        // Auto-select default template if available
        const defaultTemplate = data.templates?.find((t: ArtistTemplate) => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
          
          // Auto-fill with default template immediately (only if autoFillDefault is enabled)
          if (autoFillDefault && !hasAutoFilled) {
            onTemplateApply(defaultTemplate);
            setHasAutoFilled(true);
            
            // Show helpful message for first-time users
            if (defaultTemplate.name === 'My Standard Setup') {
              setShowAutoFillMessage(true);
              // Hide message after 8 seconds
              setTimeout(() => setShowAutoFillMessage(false), 8000);
            }
          }
        }
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleApplyTemplate = () => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      onTemplateApply(selectedTemplate);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No templates available.
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Auto-fill notification message */}
      {showAutoFillMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="text-green-800 font-medium">Form auto-filled with your default template!</p>
              <p className="text-green-700 mt-1">
                We've pre-filled the form below with common touring requirements. You can edit any field before submitting, 
                and customize your template in your artist dashboard.
              </p>
            </div>
            <button
              onClick={() => setShowAutoFillMessage(false)}
              className="text-green-600 hover:text-green-800 ml-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Template selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Quick Fill Template:</span>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          disabled={disabled}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} 
              {template.isDefault && ' (Default)'} 
            </option>
          ))}
        </select>
        
        {selectedTemplateId && (
          <button
            type="button"
            onClick={handleApplyTemplate}
            disabled={disabled}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        )}
      </div>

      {/* Template preview */}
      {selectedTemplateId && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2">
          {(() => {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (!template) return null;
            
            const details = [];
            if (template.guaranteeRange?.min) details.push(`$${template.guaranteeRange.min}+ guarantee`);
            if (template.travelMethod) details.push(`${template.travelMethod} travel`);
            if (template.lodging) details.push(`${template.lodging} lodging`);
            if (template.equipment?.needsPA) details.push('PA needed');
            if (template.equipment?.needsMics) details.push('mics needed');
            
            return details.length > 0 ? `Includes: ${details.join(', ')}` : 'Template will fill form fields below';
          })()}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector; 