import React from 'react';
import { ArtistTemplate, TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import TechnicalRequirementsTable from './TechnicalRequirementsTable';
import HospitalityRiderTable from './HospitalityRiderTable';

interface TemplateFormCoreProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  template?: ArtistTemplate;
  mode?: 'template' | 'request' | 'confirmed' | 'offer';
  showTemplateSelector?: boolean;
  templateSelectorComponent?: React.ReactNode;
  className?: string;
}

/**
 * 🎯 TEMPLATE FORM CORE - Single Source of Truth
 * 
 * This component defines the canonical template form structure.
 * Used by:
 * - TemplateManager (for editing templates)
 * - TemplateFormRenderer (for show requests/documents)
 * - Any other component that needs template form fields
 * 
 * Add new template fields here and they appear everywhere automatically.
 */
export const TemplateFormCore: React.FC<TemplateFormCoreProps> = ({
  formData,
  onChange,
  template,
  mode = 'template',
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
      {/* Template Selector (optional) */}
      {showTemplateSelector && templateSelectorComponent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {templateSelectorComponent}
        </div>
      )}

      {/* Template Name & Description (only for template mode) */}
      {mode === 'template' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => updateFormField('name', e.target.value)}
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
              value={formData.description || ''}
              onChange={(e) => updateFormField('description', e.target.value)}
              placeholder="Brief description"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Business Terms Module */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Business Terms</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {mode === 'template' && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum amount needed to cover costs
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Guarantee ($)
            </label>
            <input
              type="number"
              min="0"
              value={formData.guaranteeRange?.max || ''}
              onChange={(e) => updateNestedField('guaranteeRange', 'max', parseInt(e.target.value) || 0)}
              placeholder="e.g., 1500"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            {mode === 'template' && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum reasonable guarantee
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority || 'medium'}
              onChange={(e) => updateFormField('priority', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {mode === 'template' && (
              <p className="text-xs text-gray-500 mt-1">
                Booking priority level
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Equipment Module */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Equipment Requirements</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.equipment?.needsPA || false}
              onChange={(e) => updateNestedField('equipment', 'needsPA', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">PA System</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.equipment?.needsMics || false}
              onChange={(e) => updateNestedField('equipment', 'needsMics', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Microphones</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.equipment?.needsDrums || false}
              onChange={(e) => updateNestedField('equipment', 'needsDrums', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Drum Kit</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.equipment?.needsAmps || false}
              onChange={(e) => updateNestedField('equipment', 'needsAmps', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Amplifiers</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.equipment?.acoustic || false}
              onChange={(e) => updateNestedField('equipment', 'acoustic', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Acoustic Setup</span>
          </label>
        </div>
        {mode === 'template' && (
          <p className="text-xs text-gray-500 mt-2">
            Check the equipment you need venues to provide. This helps venues understand your technical requirements.
          </p>
        )}
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

      {/* Notes Module */}
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

      {/* Default Template Setting (only for template mode) */}
      {mode === 'template' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.isDefault || false}
              onChange={(e) => updateFormField('isDefault', e.target.checked)}
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
      )}
    </div>
  );
};

export default TemplateFormCore; 