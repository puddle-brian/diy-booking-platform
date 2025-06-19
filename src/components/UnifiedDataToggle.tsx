'use client';

import React, { useState, useEffect } from 'react';

interface UnifiedDataToggleProps {
  initialValue?: boolean;
  onChange?: (useUnified: boolean) => void;
  className?: string;
}

/**
 * 🔄 PHASE 4.2: UNIFIED DATA TOGGLE COMPONENT
 * 
 * Provides a visual toggle to switch between legacy and unified data systems.
 * Supports URL parameter override (?useUnified=true) and local state persistence.
 */
export const UnifiedDataToggle: React.FC<UnifiedDataToggleProps> = ({ 
  initialValue = false, 
  onChange,
  className = ''
}) => {
  const [useUnified, setUseUnified] = useState(initialValue);
  const [urlOverride, setUrlOverride] = useState(false);

  useEffect(() => {
    // Check URL parameter for override
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToggle = urlParams.get('useUnified') === 'true';
      setUrlOverride(urlToggle);
      
      if (urlToggle !== useUnified) {
        setUseUnified(urlToggle);
        onChange?.(urlToggle);
      }
    }
  }, []);

  const handleToggle = () => {
    const newValue = !useUnified;
    setUseUnified(newValue);
    onChange?.(newValue);

    // Update URL parameter to persist state
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newValue) {
        url.searchParams.set('useUnified', 'true');
      } else {
        url.searchParams.delete('useUnified');
      }
      window.history.replaceState({}, '', url.toString());
    }

    console.log(`🔄 TOGGLE: Switched to ${newValue ? 'UNIFIED' : 'LEGACY'} data system`);
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${
      useUnified 
        ? 'from-green-50 to-blue-50 border-green-200' 
        : 'from-gray-50 to-gray-100 border-gray-200'
    } border rounded-lg mb-4 transition-all duration-300 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
            useUnified ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <div>
            <h3 className={`font-semibold transition-colors duration-300 ${
              useUnified ? 'text-green-800' : 'text-gray-700'
            }`}>
              Data System: {useUnified ? 'Unified API' : 'Legacy APIs'}
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              useUnified ? 'text-green-600' : 'text-gray-500'
            }`}>
              {useUnified 
                ? '✨ Using new unified booking opportunities system'
                : '🔧 Using legacy multi-API system (show-requests, venue-offers, shows)'
              }
            </p>
            {urlOverride && (
              <p className="text-xs text-blue-600 mt-1">
                🔗 Activated via URL parameter (?useUnified=true)
              </p>
            )}
          </div>
        </div>
      </div>
      
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          useUnified
            ? 'bg-green-500 focus:ring-green-500'
            : 'bg-gray-300 focus:ring-gray-400'
        }`}
        aria-label={`Switch to ${useUnified ? 'legacy' : 'unified'} data system`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
            useUnified ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}; 