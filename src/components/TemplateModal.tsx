'use client';

import React from 'react';
import TemplateManager from './TemplateManager';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  artistId, 
  artistName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Show Request Templates
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage templates for {artistName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <TemplateManager
            artistId={artistId}
            className="border-0 shadow-none rounded-none"
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateModal; 