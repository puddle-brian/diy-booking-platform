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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary border border-border-default max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-text-accent uppercase tracking-wider">
              <span className="text-text-muted mr-2">&gt;</span>
              SHOW_REQUEST_TEMPLATES
            </h2>
            <p className="text-2xs text-text-muted mt-1 uppercase tracking-wider">
              Managing templates for {artistName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <span className="text-lg">[×]</span>
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