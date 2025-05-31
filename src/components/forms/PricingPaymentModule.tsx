import React from 'react';

export interface PricingData {
  guarantee: number;
  door: boolean;
  merchandise: boolean;
  // Future pricing features
  ticketSplit?: number;
  minimumPayout?: number;
  paymentMethods?: string[];
  advancePayment?: boolean;
  cancellationPolicy?: string;
}

export interface PricingPaymentModuleProps {
  pricing: PricingData;
  onPricingChange: (pricing: PricingData) => void;
  className?: string;
  showAdvancedOptions?: boolean;
}

export const PricingPaymentModule: React.FC<PricingPaymentModuleProps> = ({
  pricing,
  onPricingChange,
  className = '',
  showAdvancedOptions = false
}) => {
  const handleGuaranteeChange = (value: string) => {
    onPricingChange({
      ...pricing,
      guarantee: parseInt(value) || 0
    });
  };

  const handleCheckboxChange = (field: keyof PricingData, checked: boolean) => {
    onPricingChange({
      ...pricing,
      [field]: checked
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Basic Pricing */}
      <div>
        <h4 className="text-lg font-medium text-gray-800 mb-3">Payment Options</h4>
        <p className="text-sm text-gray-600 mb-4">
          How do you typically compensate performers? You can offer multiple options.
        </p>
        
        <div className="space-y-4">
          {/* Guarantee Amount */}
          <div>
            <label htmlFor="guarantee" className="block text-sm font-medium text-gray-700 mb-2">
              Guarantee Amount ($)
            </label>
            <input
              type="number"
              id="guarantee"
              min="0"
              value={pricing.guarantee}
              onChange={(e) => handleGuaranteeChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Fixed amount you guarantee to pay performers
            </p>
          </div>
          
          {/* Payment Options */}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={pricing.door}
                onChange={(e) => handleCheckboxChange('door', e.target.checked)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-0.5"
              />
              <div className="ml-2">
                <span className="text-sm text-gray-700 font-medium">Door Split Available</span>
                <p className="text-xs text-gray-500">Share ticket/door revenue with performers</p>
              </div>
            </label>
            
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={pricing.merchandise}
                onChange={(e) => handleCheckboxChange('merchandise', e.target.checked)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-0.5"
              />
              <div className="ml-2">
                <span className="text-sm text-gray-700 font-medium">Merchandise Sales Allowed</span>
                <p className="text-xs text-gray-500">Performers can sell merch at your venue</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Options (for future development) */}
      {showAdvancedOptions && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3">Advanced Payment Settings</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 italic">
              🚧 Advanced pricing features coming soon:
            </p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• Custom ticket split percentages</li>
              <li>• Multiple payment methods</li>
              <li>• Advance payment options</li>
              <li>• Cancellation policies</li>
              <li>• Minimum payout guarantees</li>
            </ul>
          </div>
        </div>
      )}

      {/* Helpful Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">💡 Pricing Tips</h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Be transparent about your payment structure</li>
          <li>• Consider offering multiple options (guarantee + door split)</li>
          <li>• Local bands often prefer door splits, touring bands prefer guarantees</li>
          <li>• Merchandise sales are almost always appreciated</li>
        </ul>
      </div>
    </div>
  );
}; 