import React from 'react';

// Global equipment options - centralized list
export const EQUIPMENT_OPTIONS = [
  { key: 'pa', label: 'PA System' },
  { key: 'mics', label: 'Microphones' },
  { key: 'drums', label: 'Drum Kit' },
  { key: 'amps', label: 'Amplifiers' },
  { key: 'piano', label: 'Piano/Keyboard' },
  { key: 'monitors', label: 'Stage Monitors' },
  { key: 'lighting', label: 'Stage Lighting' },
  { key: 'projector', label: 'Projector/Screen' },
] as const;

// Global venue features - centralized list
export const VENUE_FEATURES = [
  'basement',
  'outdoor', 
  'stage',
  'bar',
  'kitchen',
  'parking',
  'accessible',
  'professional',
  'intimate',
  'all-ages-friendly',
  'merch-space',
  'green-room',
  'loading-dock',
  'sound-engineer',
] as const;

export interface EquipmentState {
  [key: string]: boolean;
}

export interface EquipmentFeaturesModuleProps {
  equipment: EquipmentState;
  features: string[];
  onEquipmentChange: (equipment: EquipmentState) => void;
  onFeaturesChange: (features: string[]) => void;
  className?: string;
}

export const EquipmentFeaturesModule: React.FC<EquipmentFeaturesModuleProps> = ({
  equipment,
  features,
  onEquipmentChange,
  onFeaturesChange,
  className = ''
}) => {
  const handleEquipmentChange = (key: string, checked: boolean) => {
    onEquipmentChange({
      ...equipment,
      [key]: checked
    });
  };

  const handleFeatureChange = (feature: string) => {
    const newFeatures = features.includes(feature)
      ? features.filter(f => f !== feature)
      : [...features, feature];
    onFeaturesChange(newFeatures);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Available Equipment */}
      <div>
        <h4 className="text-lg font-medium text-gray-800 mb-3">Available Equipment</h4>
        <p className="text-sm text-gray-600 mb-4">
          What equipment do you have available for performers?
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EQUIPMENT_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={equipment[key] || false}
                onChange={(e) => handleEquipmentChange(key, e.target.checked)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Venue Features */}
      <div>
        <h4 className="text-lg font-medium text-gray-800 mb-3">Venue Features</h4>
        <p className="text-sm text-gray-600 mb-4">
          What makes your space special? Select all that apply.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {VENUE_FEATURES.map(feature => (
            <label key={feature} className="flex items-center">
              <input
                type="checkbox"
                checked={features.includes(feature)}
                onChange={() => handleFeatureChange(feature)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {feature.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}; 