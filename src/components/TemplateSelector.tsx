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
    <div className={`flex items-center gap-2 ${className}`}>
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
            {template.isDefault && ' ✓'} 
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
  );
};

export default TemplateSelector; 