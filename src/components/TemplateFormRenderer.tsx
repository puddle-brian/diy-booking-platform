import React from 'react';
import { ArtistTemplate, TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import TechnicalRequirementsTable from './TechnicalRequirementsTable';
import HospitalityRiderTable from './HospitalityRiderTable';

interface TemplateFormRendererProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  template?: ArtistTemplate;
  mode: 'request' | 'confirmed' | 'offer';
  showTemplateSelector?: boolean;
  templateSelectorComponent?: React.ReactNode;
  className?: string;
}

export const TemplateFormRenderer: React.FC<TemplateFormRendererProps> = ({
  formData,
  onChange,
  template,
  mode,
  showTemplateSelector = false,
  templateSelectorComponent,
  className = ''
}) => {
  
  // Helper function to update nested form data
  const updateFormField = (field: string, value: any) => {
    onChange(field, value);
  };

  // Helper function to update nested objects
  const updateNestedField = (parentField: string, childField: string, value: any) => {
    const currentParent = formData[parentField] || {};
    onChange(parentField, {
      ...currentParent,
      [childField]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Template Selector */}
      {showTemplateSelector && templateSelectorComponent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {templateSelectorComponent}
        </div>
      )}

      {/* Business Terms Module */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Business Terms</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Guarantee ($)
            </label>
            <input
              type="number"
              min="0"
              value={formData.guaranteeRange?.min || ''}
              onChange={(e) => updateNestedField('guaranteeRange', 'min', parseInt(e.target.value) || 0)}
              placeholder="e.g., 500"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Restriction
            </label>
            <select
              value={formData.ageRestriction || 'flexible'}
              onChange={(e) => updateFormField('ageRestriction', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="flexible">Flexible</option>
              <option value="all-ages">All Ages</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.acceptsDoorDeals || false}
              onChange={(e) => updateFormField('acceptsDoorDeals', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Accepts Door Deals</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.merchandising || false}
              onChange={(e) => updateFormField('merchandising', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Merchandising</span>
          </label>
        </div>
      </div>

      {/* Travel & Logistics Module */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Travel & Logistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Travel Method
            </label>
            <select
              value={formData.travelMethod || 'van'}
              onChange={(e) => updateFormField('travelMethod', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="van">Van/Vehicle</option>
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
              value={formData.lodging || 'flexible'}
              onChange={(e) => updateFormField('lodging', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="flexible">Flexible</option>
              <option value="floor-space">Floor Space</option>
              <option value="hotel">Hotel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Technical Requirements Module */}
      <div>
        <TechnicalRequirementsTable
          requirements={formData.technicalRequirements || []}
          onChange={(requirements) => updateFormField('technicalRequirements', requirements)}
        />
      </div>

      {/* Hospitality Rider Module */}
      <div>
        <HospitalityRiderTable
          requirements={formData.hospitalityRequirements || []}
          onChange={(requirements) => updateFormField('hospitalityRequirements', requirements)}
        />
      </div>

      {/* Notes Module - Matches template structure */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes & Requirements
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => updateFormField('notes', e.target.value)}
          placeholder="Special setup requirements, accessibility needs, unique equipment, stage plot details, or any other important information for venues..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          Examples: "Need 20ft ceiling clearance for light show", "Drummer uses double kick setup", 
          "Requires specific stage dimensions", "Has pyrotechnics that need approval"
        </p>
      </div>
    </div>
  );
};

export default TemplateFormRenderer; 