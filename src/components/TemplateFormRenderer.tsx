import React from 'react';
import { ArtistTemplate, TechnicalRequirement, HospitalityRequirement } from '../../types/templates';
import TemplateFormCore from './TemplateFormCore';

interface TemplateFormRendererProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  template?: ArtistTemplate;
  mode: 'request' | 'confirmed' | 'offer';
  showTemplateSelector?: boolean;
  templateSelectorComponent?: React.ReactNode;
  className?: string;
}

/**
 * 🎯 TEMPLATE FORM RENDERER - Now just a wrapper around TemplateFormCore
 * 
 * This component is a simple wrapper that passes props to TemplateFormCore.
 * All form structure is defined in TemplateFormCore for consistency.
 */
export const TemplateFormRenderer: React.FC<TemplateFormRendererProps> = (props) => {
  return (
    <TemplateFormCore
      {...props}
      mode={props.mode}
    />
  );
};

export default TemplateFormRenderer; 