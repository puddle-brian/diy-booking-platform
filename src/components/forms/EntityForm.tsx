import React, { useState } from 'react';
import { 
  EntityFormContext, 
  BaseFormData, 
  VenueFormData, 
  ArtistFormData,
  ExpandableSection,
  DetailedInfoModule,
  AdminOnlyModule,
  FormWrapper
} from './EntityFormModules';

interface EntityFormProps {
  entityType: 'artist' | 'venue';
  context: EntityFormContext;
  initialData?: Partial<VenueFormData | ArtistFormData>;
  entityId?: string;
  onSubmit: (formData: VenueFormData | ArtistFormData) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  submitText?: string;
  // Allow passing in the basic form content as children
  children: React.ReactNode;
  // Flag to disable automatic DetailedInfoModule (when using custom unified modules)
  disableAutoDetailedInfo?: boolean;
  // Flag to disable automatic AdminOnlyModule (when admin forms handle it manually)
  disableAutoAdminSection?: boolean;
}

interface AdminData {
  verified: boolean;
  hasAccount: boolean;
  featured: boolean;
}

export const EntityForm: React.FC<EntityFormProps> = ({
  entityType,
  context,
  initialData,
  entityId,
  onSubmit,
  onCancel,
  title,
  subtitle,
  submitText,
  children,
  disableAutoDetailedInfo,
  disableAutoAdminSection
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showDetailed, setShowDetailed] = useState(false);
  
  // Extended form data for detailed information
  const [detailedData, setDetailedData] = useState<Partial<BaseFormData>>({
    images: initialData?.images || [],
    description: initialData?.description || '',
    website: initialData?.website || '',
    contactPhone: initialData?.contactPhone || ''
  });

  // Admin-only data
  const [adminData, setAdminData] = useState<AdminData>({
    verified: (initialData as any)?.verified || false,
    hasAccount: (initialData as any)?.hasAccount || true,
    featured: (initialData as any)?.featured || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Get the basic form data from the children form
      const formElement = e.target as HTMLFormElement;
      const formData = new FormData(formElement);
      
      // Convert FormData to object (this will be enhanced based on the specific form)
      const basicData: any = {};
      for (const [key, value] of formData.entries()) {
        basicData[key] = value;
      }

      // Merge basic data with detailed and admin data
      const completeData = {
        ...basicData,
        ...detailedData,
        ...(context.mode === 'admin' ? adminData : {})
      };

      await onSubmit(completeData);
      setSubmitMessage(`Success! ${completeData.name} has been ${context.mode === 'edit' ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      setSubmitMessage(`Error: ${error instanceof Error ? error.message : 'Failed to submit'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedDataChange = (updates: Partial<BaseFormData>) => {
    setDetailedData((prev: Partial<BaseFormData>) => ({ ...prev, ...updates }));
  };

  const handleAdminDataChange = (field: string, value: any) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  // Determine if we should show detailed sections
  const showDetailedSection = context.mode === 'edit' || showDetailed;
  const showAdminSection = context.mode === 'admin' || (context.userRole === 'admin' && context.mode === 'edit');

  // Create a complete BaseFormData object for the DetailedInfoModule
  const completeDetailedData: BaseFormData = {
    name: '',
    location: '',
    contactEmail: '',
    images: [],
    ...detailedData
  };

  return (
    <FormWrapper
      title={title || `${context.mode === 'edit' ? 'Edit' : 'Add'} ${entityType === 'venue' ? 'Space' : 'Artist'}`}
      subtitle={subtitle}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      submitText={submitText || `${context.mode === 'edit' ? 'Update' : 'Submit'} ${entityType === 'venue' ? 'Space' : 'Artist'}`}
      submitMessage={submitMessage}
    >
      {/* Basic Information - passed as children */}
      {children}

      {/* Detailed Information - expandable for create, always shown for edit */}
      {!disableAutoDetailedInfo && context.mode === 'create' && (
        <ExpandableSection
          title="Additional Details"
          subtitle="Add images, media links, and detailed information (optional)"
          expanded={showDetailed}
          onToggle={() => setShowDetailed(!showDetailed)}
        >
          <DetailedInfoModule
            entityType={entityType}
            entityId={entityId}
            formData={completeDetailedData}
            onChange={handleDetailedDataChange}
            context={context}
          />
        </ExpandableSection>
      )}

      {!disableAutoDetailedInfo && context.mode === 'edit' && (
        <section className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-6">Additional Details</h3>
          <DetailedInfoModule
            entityType={entityType}
            entityId={entityId}
            formData={completeDetailedData}
            onChange={handleDetailedDataChange}
            context={context}
          />
        </section>
      )}

      {/* Admin-Only Section */}
      {showAdminSection && !disableAutoAdminSection && (
        <ExpandableSection
          title="Admin Settings"
          subtitle="Administrative controls and platform settings"
          expanded={true}
          onToggle={() => {}} // Always expanded for admins
        >
          <AdminOnlyModule
            entityType={entityType}
            data={adminData}
            onChange={handleAdminDataChange}
          />
        </ExpandableSection>
      )}
    </FormWrapper>
  );
};

export default EntityForm; 