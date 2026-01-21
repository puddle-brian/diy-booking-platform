'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface StagedEntityData {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  venueType?: string;
  artistType?: string;
  capacity?: number;
  genres?: string[];
  description?: string;
  website?: string;
  contactEmail?: string;
  [key: string]: unknown;
}

interface StagedEntity {
  id: string;
  entityType: 'VENUE' | 'ARTIST' | 'SCENE_INFRASTRUCTURE';
  data: StagedEntityData;
  sourceUrl: string | null;
  sourceType: string | null;
  searchQuery: string | null;
  confidence: number;
  aiNotes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DUPLICATE' | 'NEEDS_INFO';
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  createdEntityId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StagedResponse {
  entities: StagedEntity[];
  total: number;
  counts: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    DUPLICATE: number;
    NEEDS_INFO: number;
  };
}

export default function StagingPage() {
  const [entities, setEntities] = useState<StagedEntity[]>([]);
  const [counts, setCounts] = useState<StagedResponse['counts']>({
    PENDING: 0, APPROVED: 0, REJECTED: 0, DUPLICATE: 0, NEEDS_INFO: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<StagedEntity | null>(null);
  const [editingData, setEditingData] = useState<StagedEntityData | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntityType, setNewEntityType] = useState<'VENUE' | 'ARTIST'>('VENUE');
  const [newEntityData, setNewEntityData] = useState<Partial<StagedEntityData>>({});

  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('entityType', typeFilter);

      const res = await fetch(`/api/admin/staged?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data: StagedResponse = await res.json();
      setEntities(data.entities);
      setCounts(data.counts);
    } catch (error) {
      console.error('Failed to load staged entities:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const handleApprove = async (entity: StagedEntity) => {
    if (!confirm(`Approve "${entity.data.name}" and add to live database?`)) return;
    
    setActionLoading(entity.id);
    try {
      const res = await fetch(`/api/admin/staged/${entity.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: 'Approved via admin UI' })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to approve');
      }
      
      const result = await res.json();
      alert(`✅ Created ${entity.entityType.toLowerCase()}: ${result.createdEntity.name}`);
      setSelectedEntity(null);
      loadEntities();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (entity: StagedEntity) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    setActionLoading(entity.id);
    try {
      const res = await fetch(`/api/admin/staged/${entity.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reject');
      }
      
      setRejectReason('');
      setSelectedEntity(null);
      loadEntities();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async (entity: StagedEntity) => {
    if (!editingData) return;
    
    setActionLoading(entity.id);
    try {
      const res = await fetch(`/api/admin/staged/${entity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: editingData })
      });
      
      if (!res.ok) throw new Error('Failed to update');
      
      setEditingData(null);
      loadEntities();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (entity: StagedEntity) => {
    if (!confirm(`Delete staged entry "${entity.data.name}"?`)) return;
    
    setActionLoading(entity.id);
    try {
      const res = await fetch(`/api/admin/staged/${entity.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      setSelectedEntity(null);
      loadEntities();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNew = async () => {
    if (!newEntityData.name) {
      alert('Name is required');
      return;
    }
    
    setActionLoading('new');
    try {
      const res = await fetch('/api/admin/staged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: newEntityType,
          data: newEntityData,
          sourceType: 'manual',
          confidence: 80
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create');
      }
      
      setShowAddModal(false);
      setNewEntityData({});
      loadEntities();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      APPROVED: 'bg-green-500/20 text-green-400 border-green-500/40',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/40',
      DUPLICATE: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      NEEDS_INFO: 'bg-blue-500/20 text-blue-400 border-blue-500/40'
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/40';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-text-accent">[DATABASE BUILDER]</span>
              <span className="text-2xs text-text-muted uppercase tracking-wider">Staged Entity Review</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/admin" className="btn text-2xs">&lt;&lt; ADMIN HOME</a>
              <a 
                href="/admin/staging/discover"
                className="btn text-2xs bg-status-info/20 border-status-info/40 hover:bg-status-info/30 text-status-info"
              >
                🔍 DISCOVERY AGENT
              </a>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn text-2xs bg-status-active/20 border-status-active/40 hover:bg-status-active/30"
              >
                + ADD MANUALLY
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Counts */}
      <div className="border-b border-border-subtle bg-bg-tertiary">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-4 text-2xs">
            {Object.entries(counts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 border transition-all ${
                  statusFilter === status 
                    ? getStatusBadge(status) 
                    : 'border-border-subtle text-text-muted hover:text-text-primary'
                }`}
              >
                {status}: {count}
              </button>
            ))}
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1 border transition-all ${
                !statusFilter 
                  ? 'border-text-accent text-text-accent' 
                  : 'border-border-subtle text-text-muted hover:text-text-primary'
              }`}
            >
              ALL: {Object.values(counts).reduce((a, b) => a + b, 0)}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border-subtle bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-4 items-center">
            <span className="text-2xs text-text-muted">TYPE:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-bg-tertiary border border-border-subtle text-text-primary text-2xs px-2 py-1"
            >
              <option value="">All Types</option>
              <option value="VENUE">Venues</option>
              <option value="ARTIST">Artists</option>
            </select>
            <button 
              onClick={loadEntities} 
              className="btn text-2xs"
              disabled={loading}
            >
              {loading ? 'LOADING...' : 'REFRESH'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entity List */}
          <div className="lg:col-span-2">
            <div className="module-section">
              <div className="module-header">
                &gt; STAGED ENTITIES [{entities.length}]
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-text-muted">Loading...</div>
              ) : entities.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  <p className="text-sm mb-2">No staged entities found</p>
                  <p className="text-2xs">Add entries manually or run the discovery agent</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {entities.map((entity) => (
                    <div
                      key={entity.id}
                      onClick={() => {
                        setSelectedEntity(entity);
                        setEditingData(null);
                        setRejectReason('');
                      }}
                      className={`p-4 cursor-pointer transition-all hover:bg-bg-hover ${
                        selectedEntity?.id === entity.id ? 'bg-bg-hover border-l-2 border-l-text-accent' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm text-text-primary font-medium">
                            {entity.data.name}
                          </div>
                          <div className="text-2xs text-text-secondary mt-1">
                            {entity.data.city && `${entity.data.city}, `}
                            {entity.data.state && `${entity.data.state} • `}
                            {entity.entityType}
                            {entity.data.venueType && ` • ${entity.data.venueType}`}
                            {entity.data.artistType && ` • ${entity.data.artistType}`}
                          </div>
                          {entity.sourceType && (
                            <div className="text-2xs text-text-muted mt-1">
                              Source: {entity.sourceType}
                              {entity.searchQuery && ` • "${entity.searchQuery}"`}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 text-2xs border ${getStatusBadge(entity.status)}`}>
                            {entity.status}
                          </span>
                          <div className={`text-2xs mt-1 ${getConfidenceColor(entity.confidence)}`}>
                            {entity.confidence}% confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedEntity ? (
              <div className="module-section sticky top-4">
                <div className="module-header flex justify-between items-center">
                  <span>&gt; REVIEW</span>
                  <button 
                    onClick={() => setSelectedEntity(null)}
                    className="text-2xs text-text-muted hover:text-text-primary"
                  >
                    [CLOSE]
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Entity Info */}
                  <div>
                    <h3 className="text-sm font-medium text-text-accent mb-2">
                      {selectedEntity.data.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 text-2xs border ${getStatusBadge(selectedEntity.status)}`}>
                      {selectedEntity.status}
                    </span>
                  </div>

                  {/* Data Fields */}
                  <div className="space-y-2">
                    <h4 className="text-2xs uppercase tracking-wider text-text-muted border-b border-border-subtle pb-1">
                      Data Fields
                    </h4>
                    {editingData ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingData.name || ''}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-1"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={editingData.city || ''}
                          onChange={(e) => setEditingData({ ...editingData, city: e.target.value })}
                          className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-1"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={editingData.state || ''}
                          onChange={(e) => setEditingData({ ...editingData, state: e.target.value })}
                          className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-1"
                          placeholder="State"
                        />
                        <input
                          type="text"
                          value={editingData.website || ''}
                          onChange={(e) => setEditingData({ ...editingData, website: e.target.value })}
                          className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-1"
                          placeholder="Website"
                        />
                        <textarea
                          value={editingData.description || ''}
                          onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                          className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-1 h-20"
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(selectedEntity)}
                            disabled={actionLoading === selectedEntity.id}
                            className="btn text-2xs flex-1"
                          >
                            SAVE
                          </button>
                          <button
                            onClick={() => setEditingData(null)}
                            className="btn text-2xs flex-1"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs space-y-1">
                        {Object.entries(selectedEntity.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-text-muted">{key}:</span>
                            <span className="text-text-primary text-right max-w-[60%] truncate">
                              {Array.isArray(value) ? value.join(', ') : String(value || '—')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Source Info */}
                  {(selectedEntity.sourceUrl || selectedEntity.aiNotes) && (
                    <div className="space-y-2">
                      <h4 className="text-2xs uppercase tracking-wider text-text-muted border-b border-border-subtle pb-1">
                        Source
                      </h4>
                      {selectedEntity.sourceUrl && (
                        <a
                          href={selectedEntity.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xs text-status-info hover:underline block truncate"
                        >
                          {selectedEntity.sourceUrl}
                        </a>
                      )}
                      {selectedEntity.aiNotes && (
                        <p className="text-2xs text-text-secondary">{selectedEntity.aiNotes}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {selectedEntity.status === 'PENDING' || selectedEntity.status === 'NEEDS_INFO' ? (
                    <div className="space-y-3 pt-4 border-t border-border-subtle">
                      <button
                        onClick={() => handleApprove(selectedEntity)}
                        disabled={actionLoading === selectedEntity.id}
                        className="w-full py-2 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 transition-all disabled:opacity-50"
                      >
                        {actionLoading === selectedEntity.id ? 'PROCESSING...' : '✓ APPROVE & ADD TO DATABASE'}
                      </button>
                      
                      <button
                        onClick={() => setEditingData(selectedEntity.data)}
                        className="w-full py-2 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30 transition-all"
                      >
                        ✎ EDIT BEFORE APPROVING
                      </button>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason..."
                          className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-1"
                        />
                        <button
                          onClick={() => handleReject(selectedEntity)}
                          disabled={actionLoading === selectedEntity.id || !rejectReason.trim()}
                          className="w-full py-2 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all disabled:opacity-50"
                        >
                          ✗ REJECT
                        </button>
                      </div>

                      <button
                        onClick={() => handleDelete(selectedEntity)}
                        disabled={actionLoading === selectedEntity.id}
                        className="w-full py-2 text-2xs text-text-muted hover:text-red-400 transition-all"
                      >
                        Delete from staging
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-border-subtle">
                      {selectedEntity.status === 'APPROVED' && selectedEntity.createdEntityId && (
                        <a
                          href={`/${selectedEntity.entityType.toLowerCase()}s/${selectedEntity.createdEntityId}`}
                          className="block w-full py-2 text-center text-xs font-medium bg-status-active/20 text-status-active border border-status-active/40 hover:bg-status-active/30 transition-all"
                        >
                          VIEW CREATED {selectedEntity.entityType}
                        </a>
                      )}
                      {selectedEntity.status === 'REJECTED' && selectedEntity.rejectionReason && (
                        <div className="text-2xs text-red-400">
                          <strong>Rejected:</strong> {selectedEntity.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="module-section">
                <div className="module-header">&gt; INSTRUCTIONS</div>
                <div className="p-4 text-xs text-text-secondary space-y-3">
                  <p>
                    <strong className="text-text-accent">Database Builder</strong> lets you review 
                    AI-discovered venues and artists before adding them to the live database.
                  </p>
                  <p>
                    Click on any entry to review its details, edit the data, 
                    and approve or reject it.
                  </p>
                  
                  <div className="pt-3 border-t border-border-subtle">
                    <p className="text-2xs text-text-muted mb-2">How to add entries:</p>
                    <ul className="text-2xs space-y-1">
                      <li><span className="text-status-info">🔍 Discovery Agent</span> - AI searches web & stages findings</li>
                      <li><span className="text-status-active">+ Add Manually</span> - Enter data yourself for review</li>
                    </ul>
                  </div>
                  
                  <div className="pt-3 border-t border-border-subtle">
                    <p className="text-2xs text-text-muted mb-2">Status meanings:</p>
                    <ul className="text-2xs space-y-1">
                      <li><span className="text-yellow-400">PENDING</span> - Awaiting your review</li>
                      <li><span className="text-green-400">APPROVED</span> - Added to live database</li>
                      <li><span className="text-red-400">REJECTED</span> - Won't be re-discovered</li>
                      <li><span className="text-purple-400">DUPLICATE</span> - Already exists</li>
                      <li><span className="text-blue-400">NEEDS_INFO</span> - Needs more data</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add New Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-border-subtle max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="module-header flex justify-between items-center">
              <span>&gt; ADD STAGED ENTITY</span>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setNewEntityData({});
                }}
                className="text-2xs text-text-muted hover:text-text-primary"
              >
                [CLOSE]
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-2xs text-text-muted block mb-1">Type</label>
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value as 'VENUE' | 'ARTIST')}
                  className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                >
                  <option value="VENUE">Venue</option>
                  <option value="ARTIST">Artist</option>
                </select>
              </div>
              
              <div>
                <label className="text-2xs text-text-muted block mb-1">Name *</label>
                <input
                  type="text"
                  value={newEntityData.name || ''}
                  onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                  placeholder="Entity name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-2xs text-text-muted block mb-1">City</label>
                  <input
                    type="text"
                    value={newEntityData.city || ''}
                    onChange={(e) => setNewEntityData({ ...newEntityData, city: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted block mb-1">State</label>
                  <input
                    type="text"
                    value={newEntityData.state || ''}
                    onChange={(e) => setNewEntityData({ ...newEntityData, state: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                    placeholder="State"
                  />
                </div>
              </div>

              {newEntityType === 'VENUE' && (
                <>
                  <div>
                    <label className="text-2xs text-text-muted block mb-1">Venue Type</label>
                    <select
                      value={newEntityData.venueType || ''}
                      onChange={(e) => setNewEntityData({ ...newEntityData, venueType: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                    >
                      <option value="">Select type...</option>
                      <option value="house-show">House Show</option>
                      <option value="basement">Basement</option>
                      <option value="bar">Bar</option>
                      <option value="club">Club</option>
                      <option value="warehouse">Warehouse</option>
                      <option value="coffee-shop">Coffee Shop</option>
                      <option value="record-store">Record Store</option>
                      <option value="vfw-hall">VFW Hall</option>
                      <option value="community-center">Community Center</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted block mb-1">Capacity</label>
                    <input
                      type="number"
                      value={newEntityData.capacity || ''}
                      onChange={(e) => setNewEntityData({ ...newEntityData, capacity: parseInt(e.target.value) || undefined })}
                      className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                      placeholder="Capacity"
                    />
                  </div>
                </>
              )}

              {newEntityType === 'ARTIST' && (
                <>
                  <div>
                    <label className="text-2xs text-text-muted block mb-1">Artist Type</label>
                    <select
                      value={newEntityData.artistType || ''}
                      onChange={(e) => setNewEntityData({ ...newEntityData, artistType: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                    >
                      <option value="">Select type...</option>
                      <option value="band">Band</option>
                      <option value="solo">Solo</option>
                      <option value="collective">Collective</option>
                      <option value="dj">DJ</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted block mb-1">Genres (comma-separated)</label>
                    <input
                      type="text"
                      value={newEntityData.genres?.join(', ') || ''}
                      onChange={(e) => setNewEntityData({ 
                        ...newEntityData, 
                        genres: e.target.value.split(',').map(g => g.trim()).filter(Boolean) 
                      })}
                      className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                      placeholder="punk, noise rock, experimental"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="text-2xs text-text-muted block mb-1">Website</label>
                <input
                  type="text"
                  value={newEntityData.website || ''}
                  onChange={(e) => setNewEntityData({ ...newEntityData, website: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="text-2xs text-text-muted block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={newEntityData.contactEmail || ''}
                  onChange={(e) => setNewEntityData({ ...newEntityData, contactEmail: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2"
                  placeholder="booking@example.com"
                />
              </div>
              
              <div>
                <label className="text-2xs text-text-muted block mb-1">Description</label>
                <textarea
                  value={newEntityData.description || ''}
                  onChange={(e) => setNewEntityData({ ...newEntityData, description: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border-subtle text-text-primary text-xs px-2 py-2 h-20"
                  placeholder="Description..."
                />
              </div>
              
              <button
                onClick={handleAddNew}
                disabled={actionLoading === 'new' || !newEntityData.name}
                className="w-full py-2 text-xs font-medium bg-status-active/20 text-status-active border border-status-active/40 hover:bg-status-active/30 transition-all disabled:opacity-50"
              >
                {actionLoading === 'new' ? 'ADDING...' : 'ADD TO STAGING QUEUE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
