'use client';

import React from 'react';
import { Show, TourRequest, VenueBid } from '../../types';
import ModularShowDocument from './ModularShowDocument';

interface ShowDocumentModalProps {
  show?: Show;
  bid?: VenueBid;
  tourRequest?: TourRequest;
  isOpen: boolean;
  onClose: () => void;
  viewerType: 'artist' | 'venue' | 'public';
  onUpdate?: (data: any) => void;
}

/**
 * 🎯 UPDATED: Now uses the new ModularShowDocument system
 * 
 * This component is now just a simple wrapper that passes props to
 * the fully functional ModularShowDocument component with working
 * edit forms and save functionality.
 */
export default function ShowDocumentModal({
  show,
  bid,
  tourRequest,
  isOpen,
  onClose,
  viewerType,
  onUpdate
}: ShowDocumentModalProps) {
  
  return (
    <ModularShowDocument
      show={show}
      bid={bid}
      tourRequest={tourRequest}
      isOpen={isOpen}
      onClose={onClose}
      viewerType={viewerType}
      onUpdate={onUpdate}
    />
  );
} 