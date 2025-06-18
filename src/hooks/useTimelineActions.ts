import { useState } from 'react';

interface TimelineActionsProps {
  onDeleteShow: (showId: string, showName: string) => Promise<void>;
  onDeleteRequest: (requestId: string, requestName: string) => Promise<void>;
  onToggleShowExpansion: (showId: string) => void;
  onToggleRequestExpansion: (requestId: string) => void;
  onToggleBidExpansion: (requestId: string) => void;
  onBidSuccess: (bid: any) => void;
  onPlaceBid: (tourRequest: any) => void;
  onTemplateApply: (template: any) => void;
}

export function useTimelineActions({
  onDeleteShow,
  onDeleteRequest,
  onToggleShowExpansion,
  onToggleRequestExpansion,
  onToggleBidExpansion,
  onBidSuccess,
  onPlaceBid,
  onTemplateApply
}: TimelineActionsProps) {
  
  // Action handlers
  const handleDeleteShow = async (showId: string, showName: string) => {
    await onDeleteShow(showId, showName);
  };

  const handleDeleteRequest = async (requestId: string, requestName: string) => {
    await onDeleteRequest(requestId, requestName);
  };

  const toggleShowExpansion = (showId: string) => {
    onToggleShowExpansion(showId);
  };

  const toggleRequestExpansion = (requestId: string) => {
    onToggleRequestExpansion(requestId);
  };

  const toggleBidExpansion = (requestId: string) => {
    onToggleBidExpansion(requestId);
  };

  const handleBidSuccess = (bid: any) => {
    onBidSuccess(bid);
  };

  const handlePlaceBid = (tourRequest: any) => {
    onPlaceBid(tourRequest);
  };

  const handleTemplateApply = (template: any) => {
    onTemplateApply(template);
  };

  return {
    handleDeleteShow,
    handleDeleteRequest,
    toggleShowExpansion,
    toggleRequestExpansion,
    toggleBidExpansion,
    handleBidSuccess,
    handlePlaceBid,
    handleTemplateApply,
  };
} 