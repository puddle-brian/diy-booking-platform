import { useState } from 'react';
import { Show, VenueBid } from '../../types';

interface ModalStates {
  showBidDetailsModal: boolean;
  showDetailModal: boolean;
  showDocumentModal: boolean;
  isAddAnotherArtistModalOpen: boolean;
  showAddDateForm: boolean;
}

interface ModalData {
  selectedBid: VenueBid | null;
  selectedShowForDetail: Show | null;
  selectedDocumentShow: Show | null;
  selectedDocumentBid: VenueBid | null;
  selectedDocumentTourRequest: any | null;
  addAnotherArtistDate: string;
  addAnotherArtistShowId: string;
}

interface ModalHandlers {
  handleShowDetailModal: (show: Show) => void;
  handleShowDocumentModal: (show: Show) => void;
  handleBidDocumentModal: (bid: VenueBid) => void;
  handleTourRequestDocumentModal: (request: any) => void;
  closeShowDetailModal: () => void;
  closeShowDocumentModal: () => void;
  openAddAnotherArtistModal: (showId: string, date: string) => void;
  closeAddAnotherArtistModal: () => void;
  openAddDateForm: () => void;
  closeAddDateForm: () => void;
}

export function useModalState() {
  // Modal visibility states
  const [showBidDetailsModal, setShowBidDetailsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isAddAnotherArtistModalOpen, setIsAddAnotherArtistModalOpen] = useState(false);
  const [showAddDateForm, setShowAddDateForm] = useState(false);

  // Modal data states
  const [selectedBid, setSelectedBid] = useState<VenueBid | null>(null);
  const [selectedShowForDetail, setSelectedShowForDetail] = useState<Show | null>(null);
  const [selectedDocumentShow, setSelectedDocumentShow] = useState<Show | null>(null);
  const [selectedDocumentBid, setSelectedDocumentBid] = useState<VenueBid | null>(null);
  const [selectedDocumentTourRequest, setSelectedDocumentTourRequest] = useState<any | null>(null);
  const [addAnotherArtistDate, setAddAnotherArtistDate] = useState<string>('');
  const [addAnotherArtistShowId, setAddAnotherArtistShowId] = useState<string>('');

  // Modal handlers
  const handleShowDetailModal = (show: Show) => {
    setSelectedShowForDetail(show);
    setShowDetailModal(true);
  };

  const handleShowDocumentModal = (show: Show) => {
    setSelectedDocumentShow(show);
    setShowDocumentModal(true);
  };

  const handleBidDocumentModal = (bid: VenueBid) => {
    setSelectedDocumentBid(bid);
    setShowDocumentModal(true);
  };

  const handleTourRequestDocumentModal = (request: any) => {
    setSelectedDocumentTourRequest(request);
    setShowDocumentModal(true);
  };

  const closeShowDetailModal = () => {
    setShowDetailModal(false);
    setSelectedShowForDetail(null);
  };

  const closeShowDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocumentShow(null);
    setSelectedDocumentBid(null);
    setSelectedDocumentTourRequest(null);
  };

  const openAddAnotherArtistModal = (showId: string, date: string) => {
    setAddAnotherArtistShowId(showId);
    setAddAnotherArtistDate(date);
    setIsAddAnotherArtistModalOpen(true);
  };

  const closeAddAnotherArtistModal = () => {
    setIsAddAnotherArtistModalOpen(false);
    setAddAnotherArtistDate('');
    setAddAnotherArtistShowId('');
  };

  const openAddDateForm = () => {
    setShowAddDateForm(true);
  };

  const closeAddDateForm = () => {
    setShowAddDateForm(false);
  };

  // Modal states object
  const modals: ModalStates = {
    showBidDetailsModal,
    showDetailModal,
    showDocumentModal,
    isAddAnotherArtistModalOpen,
    showAddDateForm,
  };

  // Modal data object
  const modalData: ModalData = {
    selectedBid,
    selectedShowForDetail,
    selectedDocumentShow,
    selectedDocumentBid,
    selectedDocumentTourRequest,
    addAnotherArtistDate,
    addAnotherArtistShowId,
  };

  // Modal handlers object
  const handlers: ModalHandlers = {
    handleShowDetailModal,
    handleShowDocumentModal,
    handleBidDocumentModal,
    handleTourRequestDocumentModal,
    closeShowDetailModal,
    closeShowDocumentModal,
    openAddAnotherArtistModal,
    closeAddAnotherArtistModal,
    openAddDateForm,
    closeAddDateForm,
  };

  return {
    modals,
    modalData,
    handlers,
    // Legacy individual state setters for backward compatibility during transition
    setShowBidDetailsModal,
    setSelectedBid,
  };
} 