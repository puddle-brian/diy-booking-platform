'use client';

import React, { useState } from 'react';
import TemplateSelector from '../../components/TemplateSelector';
import { ArtistTemplate } from '../../../types/templates';

export default function TestTemplatesPage() {
  const [formData, setFormData] = useState({
    equipment: {
      needsPA: false,
      needsMics: false,
      needsDrums: false,
      needsAmps: false,
      acoustic: false,
    },
    guaranteeRange: { min: 0, max: 0 },
    acceptsDoorDeals: false,
    merchandising: false,
    travelMethod: '',
    lodging: '',
    ageRestriction: '',
    notes: ''
  });

  const [appliedTemplate, setAppliedTemplate] = useState<string>('');

  // Using Lightning Bolt's real artist ID from the database
  const testArtistId = '1748101913848'; // Lightning Bolt artist ID

  const handleTemplateApply = (template: ArtistTemplate) => {
    console.log('Applying template:', template);
    
    // Update form data with template values, ensuring type compatibility
    setFormData(prev => ({
      ...prev,
      equipment: {
        needsPA: template.equipment?.needsPA ?? prev.equipment.needsPA,
        needsMics: template.equipment?.needsMics ?? prev.equipment.needsMics,
        needsDrums: template.equipment?.needsDrums ?? prev.equipment.needsDrums,
        needsAmps: template.equipment?.needsAmps ?? prev.equipment.needsAmps,
        acoustic: template.equipment?.acoustic ?? prev.equipment.acoustic,
      },
      guaranteeRange: template.guaranteeRange || prev.guaranteeRange,
      acceptsDoorDeals: template.acceptsDoorDeals ?? prev.acceptsDoorDeals,
      merchandising: template.merchandising ?? prev.merchandising,
      travelMethod: template.travelMethod || prev.travelMethod,
      lodging: template.lodging || prev.lodging,
      ageRestriction: template.ageRestriction || prev.ageRestriction,
      notes: template.notes || prev.notes
    }));
    
    setAppliedTemplate(template.name);
    
    // Show success message
    setTimeout(() => setAppliedTemplate(''), 3000);
  };

  const createTestTemplate = async () => {
    try {
      const testTemplate = {
        name: 'Full Band Setup',
        type: 'COMPLETE',
        isDefault: true,
        description: 'Standard setup for full band performances',
        equipment: {
          needsPA: true,
          needsMics: true,
          needsDrums: true,
          needsAmps: true,
          acoustic: false,
        },
        guaranteeRange: { min: 500, max: 1200 },
        acceptsDoorDeals: true,
        merchandising: true,
        travelMethod: 'van',
        lodging: 'flexible',
        ageRestriction: 'all-ages',
        notes: 'Standard touring setup with full backline needs'
      };

      const response = await fetch(`/api/artists/${testArtistId}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTemplate),
      });

      if (response.ok) {
        const created = await response.json();
        console.log('Created test template:', created);
        alert('Test template created successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to create template:', error);
        alert('Failed to create template: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🎨 Artist Template System Test
        </h1>
        
        <div className="space-y-6">
          {/* Template Selector */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Template Selector Component
            </h2>
            
            <TemplateSelector
              artistId={testArtistId}
              onTemplateApply={handleTemplateApply}
              className="mb-4"
            />
            
            {appliedTemplate && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center">
                  <div className="text-green-600 mr-2">✅</div>
                  <span className="text-green-800 font-medium">
                    Applied template: {appliedTemplate}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Data Display */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Current Form Data
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Equipment Needs</h3>
                <div className="space-y-1 text-sm">
                  <div>PA System: {formData.equipment.needsPA ? '✅' : '❌'}</div>
                  <div>Microphones: {formData.equipment.needsMics ? '✅' : '❌'}</div>
                  <div>Drums: {formData.equipment.needsDrums ? '✅' : '❌'}</div>
                  <div>Amps: {formData.equipment.needsAmps ? '✅' : '❌'}</div>
                  <div>Acoustic: {formData.equipment.acoustic ? '✅' : '❌'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Business Terms</h3>
                <div className="space-y-1 text-sm">
                  <div>Guarantee: ${formData.guaranteeRange.min} - ${formData.guaranteeRange.max}</div>
                  <div>Door Deals: {formData.acceptsDoorDeals ? '✅' : '❌'}</div>
                  <div>Merchandising: {formData.merchandising ? '✅' : '❌'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Logistics</h3>
                <div className="space-y-1 text-sm">
                  <div>Travel: {formData.travelMethod || 'Not specified'}</div>
                  <div>Lodging: {formData.lodging || 'Not specified'}</div>
                  <div>Age Restriction: {formData.ageRestriction || 'Not specified'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
                <div className="text-sm text-gray-600">
                  {formData.notes || 'No notes'}
                </div>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Test Actions
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={createTestTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
              >
                Create Test Template
              </button>
              
              <div className="text-sm text-gray-600">
                <p>This will create a sample "Full Band Setup" template for testing.</p>
                <p className="mt-1">Artist ID: <code className="bg-gray-100 px-1 rounded">{testArtistId}</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 