'use client';

import React, { useState, useEffect } from 'react';
import { ArtistTemplate, TemplateSelectorProps, TEMPLATE_TYPE_LABELS } from '../../types/templates';

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  artistId,
  onTemplateApply,
  className = '',
  disabled = false
}) => {
  const [templates, setTemplates] = useState<ArtistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

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
      // Visual feedback without annoying popup - keep selection to show which template was used
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
        No templates available. Create your first template to save time on future requests!
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Quick Fill:</span>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          disabled={disabled}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} 
              {template.isDefault && ' ⭐'} 
              ({TEMPLATE_TYPE_LABELS[template.type]})
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
            Auto-Fill
          </button>
        )}
      </div>
      
      {selectedTemplateId && (
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-md">
          {(() => {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (!template) return null;
            
            return (
              <div>
                <strong>{template.name}</strong>
                {template.description && (
                  <div className="mt-1">{template.description}</div>
                )}
                <div className="mt-1 text-gray-500">
                  Will auto-fill technical requirements, business terms, and logistics.
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector; 