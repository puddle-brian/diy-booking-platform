'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

/**
 * CalendarView - V02 Booking Spreadsheet
 * 
 * Ultra-simple spreadsheet using the new DateEntry model.
 * One table, simple data, agent collaboration.
 */

interface CalendarViewProps {
  artistId?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  showTitle?: boolean;
  editable?: boolean;
  viewerType?: 'artist' | 'venue' | 'public';
  // Map interactivity
  highlightedDateId?: string | null;
  onDateHover?: (dateId: string | null) => void;
}

interface Deal {
  type: 'GUARANTEE' | 'DOOR' | 'SPLIT' | 'GUARANTEE_VS_PERCENT' | 'GUARANTEE_PLUS_SPLIT';
  amount?: number;
  percent?: number;
  expenses?: number;
  artistPercent?: number;
  venuePercent?: number;
  guarantee?: number;
  threshold?: number;
}

interface ShowDetails {
  loadIn?: string;
  soundcheck?: string;
  doors?: string;
  setTime?: string;
  curfew?: string;
  ageRestriction?: string;
  capacity?: number;
  ticketPrice?: { advance?: number; door?: number };
  hospitality?: string;
  greenRoom?: boolean;
  parking?: string;
  lodging?: string;
  guestList?: number;
  merch?: string;
  backline?: Record<string, boolean | number>;
  promotion?: string;
}

interface DateEntry {
  id: string;
  date: string;
  artistId: string;
  artistName: string;
  venueId: string;
  venueName: string;
  city: string | null;
  state: string | null;
  status: string;
  billing: string | null;
  setLength: number | null;
  deal: Deal | null;
  guarantee: number | null;  // Legacy
  door: string | null;       // Legacy
  details: ShowDetails | null;
  holdUntil: string | null;
  holdReason: string | null;
  notes: string | null;
}

interface DateGroup {
  date: string;
  entries: DateEntry[];
  status: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format deal for display
function formatDeal(entry: DateEntry): string {
  if (entry.deal) {
    const d = entry.deal;
    switch (d.type) {
      case 'GUARANTEE':
        return `$${d.amount}`;
      case 'DOOR':
        return d.expenses ? `${d.percent}% after $${d.expenses}` : `${d.percent}% door`;
      case 'SPLIT':
        return `${d.artistPercent}/${d.venuePercent} split`;
      case 'GUARANTEE_VS_PERCENT':
        return `$${d.guarantee} vs ${d.percent}%`;
      case 'GUARANTEE_PLUS_SPLIT':
        return `$${d.guarantee} + ${d.artistPercent}% after $${d.threshold}`;
      default:
        return '—';
    }
  }
  // Legacy fallback
  if (entry.guarantee) return `$${entry.guarantee}`;
  if (entry.door) return entry.door;
  return '—';
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  'inquiry': 'text-blue-600',
  'pending': 'text-amber-600',
  'hold_requested': 'text-purple-400',
  'hold': 'text-purple-600',
  'confirmed': 'text-green-600',
  'declined': 'text-red-600',
  'cancelled': 'text-gray-400',
};

// Context-aware actions based on current status and who's viewing
function getAvailableActions(status: string, entityType: 'artist' | 'venue'): Array<{value: string, label: string}> {
  if (entityType === 'artist') {
    // Artist actions on venue offers
    switch (status) {
      case 'inquiry':
        return [
          { value: 'inquiry', label: 'inquiry' },
        ];
      case 'pending':
        return [
          { value: 'pending', label: 'pending' },
          { value: 'confirmed', label: 'accept' },
          { value: 'declined', label: 'decline' },
          { value: 'hold_requested', label: 'request hold' },
        ];
      case 'hold_requested':
        return [
          { value: 'hold_requested', label: 'hold requested' },
          { value: 'pending', label: 'cancel request' },
        ];
      case 'hold':
        return [
          { value: 'hold', label: 'on hold' },
          { value: 'confirmed', label: 'accept' },
          { value: 'declined', label: 'decline' },
          { value: 'pending', label: 'release hold' },
        ];
      case 'confirmed':
        return [
          { value: 'confirmed', label: 'confirmed' },
          { value: 'cancelled', label: 'cancel show' },
        ];
      case 'declined':
        return [{ value: 'declined', label: 'declined' }];
      case 'cancelled':
        return [{ value: 'cancelled', label: 'cancelled' }];
      default:
        return [{ value: status, label: status }];
    }
  } else {
    // Venue actions on their bookings
    switch (status) {
      case 'inquiry':
        return [
          { value: 'inquiry', label: 'inquiry' },
          { value: 'pending', label: 'make offer' },
          { value: 'declined', label: 'pass' },
        ];
      case 'pending':
        return [
          { value: 'pending', label: 'offer sent' },
          { value: 'cancelled', label: 'withdraw offer' },
        ];
      case 'hold_requested':
        return [
          { value: 'hold_requested', label: 'hold requested' },
          { value: 'hold', label: 'approve hold' },
          { value: 'pending', label: 'deny hold' },
        ];
      case 'hold':
        return [
          { value: 'hold', label: 'on hold' },
          // Venue waits for artist decision during hold
        ];
      case 'confirmed':
        return [
          { value: 'confirmed', label: 'confirmed' },
          { value: 'cancelled', label: 'cancel show' },
        ];
      case 'declined':
        return [{ value: 'declined', label: 'declined' }];
      case 'cancelled':
        return [{ value: 'cancelled', label: 'cancelled' }];
      default:
        return [{ value: status, label: status }];
    }
  }
}

// Legacy STATUS_OPTIONS for backwards compat
const STATUS_OPTIONS = [
  { value: 'inquiry', label: 'inquiry', color: 'text-blue-600' },
  { value: 'pending', label: 'pending', color: 'text-amber-600' },
  { value: 'hold_requested', label: 'hold requested', color: 'text-purple-400' },
  { value: 'hold', label: 'hold', color: 'text-purple-600' },
  { value: 'confirmed', label: 'confirmed', color: 'text-green-600' },
  { value: 'declined', label: 'declined', color: 'text-red-600' },
  { value: 'cancelled', label: 'cancelled', color: 'text-gray-400' },
];

export default function CalendarView({
  artistId,
  artistName,
  venueId,
  venueName,
  title = "Dates",
  showTitle = true,
  editable = false,
  highlightedDateId,
  onDateHover,
}: CalendarViewProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(now.getMonth());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DateEntry | null>(null);
  const [entries, setEntries] = useState<DateEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const entityType = artistId ? 'artist' : 'venue';
  const entityId = artistId || venueId || '';
  const entityName = artistName || venueName || 'Unknown';

  // Fetch data from new simple API
  const fetchDates = async () => {
    setLoading(true);
    try {
      const param = artistId ? `artistId=${artistId}` : `venueId=${venueId}`;
      const res = await fetch(`/api/dates?${param}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.dates || []);
      }
    } catch (err) {
      console.error('Failed to fetch dates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) fetchDates();
  }, [entityId]);

  // Update a single entry's status
  const updateStatus = async (entryId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/dates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId, status: newStatus })
      });
      if (res.ok) {
        // Update local state immediately for snappy UI
        setEntries(prev => prev.map(e => 
          e.id === entryId ? { ...e, status: newStatus } : e
        ));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Group entries by date
  const dateGroups = useMemo(() => {
    const groups: Record<string, DateGroup> = {};
    
    for (const entry of entries) {
      if (!groups[entry.date]) {
        groups[entry.date] = {
          date: entry.date,
          entries: [],
          status: 'inquiry',
        };
      }
      groups[entry.date].entries.push(entry);
    }

    // Determine group status (confirmed > hold > pending > inquiry)
    for (const group of Object.values(groups)) {
      const hasConfirmed = group.entries.some(e => e.status === 'confirmed');
      const hasHold = group.entries.some(e => e.status === 'hold');
      const hasPending = group.entries.some(e => e.status === 'pending');
      
      if (hasConfirmed) group.status = 'confirmed';
      else if (hasHold) group.status = 'hold';
      else if (hasPending) group.status = 'pending';
      else group.status = 'inquiry';

      // Sort entries: confirmed first, then by guarantee
      group.entries.sort((a, b) => {
        if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
        if (b.status === 'confirmed' && a.status !== 'confirmed') return 1;
        return (b.guarantee || 0) - (a.guarantee || 0);
      });
    }

    return Object.values(groups).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries]);

  // Filter by month (shows all years, not just current)
  const filteredGroups = useMemo(() => {
    if (selectedMonth === 'all') return dateGroups;
    return dateGroups.filter(g => {
      const d = new Date(g.date + 'T12:00:00');
      return d.getMonth() === selectedMonth;
    });
  }, [dateGroups, selectedMonth]);

  // Month counts (all years)
  const monthCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const group of dateGroups) {
      const d = new Date(group.date + 'T12:00:00');
      counts[d.getMonth()] = (counts[d.getMonth()] || 0) + 1;
    }
    return counts;
  }, [dateGroups]);

  const toggleExpand = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const mainColHeader = entityType === 'venue' ? 'artist' : 'venue';

  return (
    <div className="bg-white border border-gray-300 rounded overflow-hidden font-mono text-sm">
      {/* Header */}
      <div className="border-b border-gray-300 bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showTitle && <span className="font-bold">{title}</span>}
          <span className="text-gray-500">{dateGroups.length} dates</span>
        </div>
        {editable && (
          <button 
            onClick={() => setShowAgentChat(true)}
            className="px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-700 rounded text-xs flex items-center gap-1.5"
          >
            <span>💬</span> agent
          </button>
        )}
      </div>

      {/* Month tabs */}
      <div className="border-b border-gray-300 bg-gray-100 flex overflow-x-auto">
        <button
          onClick={() => setSelectedMonth('all')}
          className={`px-3 py-1.5 text-xs border-r border-gray-300 ${
            selectedMonth === 'all' ? 'bg-white font-bold' : 'hover:bg-gray-200'
          }`}
        >
          all
        </button>
        {MONTHS.map((month, i) => {
          const count = monthCounts[i] || 0;
          const isCurrent = i === now.getMonth();
          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(i)}
              className={`px-3 py-1.5 text-xs border-r border-gray-300 ${
                selectedMonth === i ? 'bg-white font-bold' : 'hover:bg-gray-200'
              } ${isCurrent && selectedMonth !== i ? 'text-blue-600' : ''}`}
            >
              {month.toLowerCase()}
              {count > 0 && <span className="ml-1 text-gray-400">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 border-b border-gray-300 bg-gray-100 text-xs text-gray-600">
        <div className="col-span-2 px-3 py-2 border-r border-gray-200">date</div>
        <div className="col-span-4 px-3 py-2 border-r border-gray-200">{mainColHeader}</div>
        <div className="col-span-2 px-3 py-2 border-r border-gray-200">status</div>
        <div className="col-span-2 px-3 py-2 border-r border-gray-200">terms</div>
        <div className="col-span-2 px-3 py-2"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-400">loading...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">
            no dates{selectedMonth !== 'all' ? ` in ${MONTHS[selectedMonth as number].toLowerCase()}` : ''}
            {editable && (
              <button
                onClick={() => setShowAgentChat(true)}
                className="ml-2 text-blue-600 hover:underline"
              >
                add one
              </button>
            )}
          </div>
        ) : (
          filteredGroups.map(group => (
            <DateGroupRow
              key={group.date}
              group={group}
              entityType={entityType}
              editable={editable}
              isExpanded={expandedDates.has(group.date)}
              onToggle={() => toggleExpand(group.date)}
              onStatusChange={updateStatus}
              onSelectEntry={setSelectedEntry}
              highlightedDateId={highlightedDateId}
              onDateHover={onDateHover}
            />
          ))
        )}
      </div>

      {/* Details Modal */}
      {selectedEntry && (
        <DetailsModal
          entry={selectedEntry}
          entityType={entityType}
          editable={editable}
          onClose={() => setSelectedEntry(null)}
          onOpenAgent={() => {
            setShowAgentChat(true);
          }}
          onStatusChange={(status) => {
            updateStatus(selectedEntry.id, status);
            setSelectedEntry({ ...selectedEntry, status });
          }}
        />
      )}

      {/* Agent Chat */}
      {showAgentChat && (
        <AgentPanel
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          selectedEntry={selectedEntry}
          onClose={() => {
            setShowAgentChat(false);
            setSelectedEntry(null);
            fetchDates(); // Refresh after agent actions
          }}
        />
      )}
    </div>
  );
}

// Status Dropdown - context-aware based on who's viewing
function StatusDropdown({ 
  entry, 
  entityType,
  onStatusChange 
}: { 
  entry: DateEntry;
  entityType: 'artist' | 'venue';
  onStatusChange: (id: string, status: string) => void;
}) {
  const actions = getAvailableActions(entry.status, entityType);
  const currentColor = STATUS_COLORS[entry.status] || 'text-gray-600';
  
  // If only one action (current status), just show text
  if (actions.length <= 1) {
    return <span className={currentColor}>{actions[0]?.label || entry.status}</span>;
  }
  
  return (
    <select
      value={entry.status}
      onChange={(e) => {
        e.stopPropagation();
        onStatusChange(entry.id, e.target.value);
      }}
      onClick={(e) => e.stopPropagation()}
      className={`bg-transparent border-none cursor-pointer font-mono text-sm focus:outline-none ${currentColor}`}
    >
      {actions.map(opt => (
        <option key={opt.value} value={opt.value} className="text-gray-900">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Date Group Row
function DateGroupRow({
  group,
  entityType,
  editable,
  isExpanded,
  onToggle,
  onStatusChange,
  onSelectEntry,
  highlightedDateId,
  onDateHover,
}: {
  group: DateGroup;
  entityType: 'artist' | 'venue';
  editable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: string) => void;
  onSelectEntry: (entry: DateEntry) => void;
  highlightedDateId?: string | null;
  onDateHover?: (dateId: string | null) => void;
}) {
  const { date, entries, status } = group;
  const count = entries.length;
  const hasMultiple = count > 1;
  const primary = entries[0];

  // Date display
  const d = new Date(date + 'T12:00:00'); // Noon to avoid timezone issues
  const dateDisplay = `${d.getMonth() + 1}/${d.getDate()}`;
  const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];

  // Main display
  let displayName: string;
  let displayLink: string | null = null;
  
  if (entityType === 'venue') {
    // Venue sees artists
    displayName = hasMultiple ? `${primary.artistName} +${count - 1}` : primary.artistName;
    displayLink = `/artists/${primary.artistId}`;
  } else {
    // Artist sees venues
    const confirmed = entries.find(e => e.status === 'confirmed');
    if (confirmed) {
      displayName = confirmed.venueName;
      displayLink = `/venues/${confirmed.venueId}`;
    } else if (hasMultiple) {
      displayName = `${count} offers`;
    } else {
      displayName = primary.venueName;
      displayLink = `/venues/${primary.venueId}`;
    }
  }

  // Terms display - use formatDeal helper
  let termsDisplay: string;
  if (hasMultiple) {
    // Show range or total for multiple entries
    const amounts = entries.map(e => e.deal?.amount || e.guarantee || 0).filter(a => a > 0);
    if (amounts.length > 1) {
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      termsDisplay = min === max ? `$${min}` : `$${min}-${max}`;
    } else if (amounts.length === 1) {
      termsDisplay = `$${amounts[0]}`;
    } else {
      termsDisplay = '—';
    }
  } else {
    termsDisplay = formatDeal(primary);
  }

  // For single entries or when not editable, show simple status
  // For multiple entries, show summary then dropdowns in expanded view
  let statusContent;
  if (!editable) {
    // Read-only: just show text
    const statusColor = STATUS_OPTIONS.find(o => o.value === status)?.color || 'text-gray-600';
    statusContent = <span className={statusColor}>{status}</span>;
  } else if (hasMultiple) {
    // Multiple entries: show count, expand to see dropdowns
    const pendingCount = entries.filter(e => e.status === 'pending').length;
    const confirmedCount = entries.filter(e => e.status === 'confirmed').length;
    if (confirmedCount > 0) {
      statusContent = <span className="text-green-600">confirmed</span>;
    } else if (pendingCount > 0) {
      statusContent = <span className="text-amber-600">{pendingCount} pending</span>;
    } else {
      statusContent = <span className="text-blue-600">{count} inquiry</span>;
    }
  } else {
    // Single entry + editable: show dropdown
    statusContent = <StatusDropdown entry={primary} entityType={entityType} onStatusChange={onStatusChange} />;
  }

  const handleRowClick = () => {
    if (hasMultiple) {
      onToggle();
    } else {
      onSelectEntry(primary);
    }
  };

  // Check if this row is highlighted (any entry in group matches)
  const isHighlighted = entries.some(e => e.id === highlightedDateId);

  return (
    <>
      <div 
        className={`grid grid-cols-12 cursor-pointer transition-colors duration-150 ${
          isHighlighted 
            ? 'bg-indigo-100 ring-2 ring-indigo-400 ring-inset' 
            : isExpanded 
              ? 'bg-gray-50' 
              : 'hover:bg-yellow-50'
        }`}
        onClick={handleRowClick}
        onMouseEnter={() => onDateHover?.(primary.id)}
        onMouseLeave={() => onDateHover?.(null)}
        id={`date-row-${primary.id}`}
      >
        <div className="col-span-2 px-3 py-2 border-r border-gray-100">
          <span className="text-gray-400">{dayName}</span>{' '}{dateDisplay}
        </div>

        <div className="col-span-4 px-3 py-2 border-r border-gray-100 flex items-center gap-2 truncate">
          {hasMultiple && <span className="text-gray-400 text-xs">{isExpanded ? '▼' : '▶'}</span>}
          {displayLink && !hasMultiple ? (
            <Link href={displayLink} className="text-blue-600 hover:underline truncate" onClick={e => e.stopPropagation()}>
              {displayName}
            </Link>
          ) : (
            <span className={hasMultiple ? 'font-medium' : ''}>{displayName}</span>
          )}
        </div>

        <div className="col-span-2 px-3 py-2 border-r border-gray-100" onClick={e => e.stopPropagation()}>
          {statusContent}
        </div>

        <div className="col-span-2 px-3 py-2 border-r border-gray-100">
          {termsDisplay}
        </div>

        <div className="col-span-2 px-3 py-2 text-right text-gray-400 text-xs">
          {hasMultiple ? (isExpanded ? '▲' : '▼') : 'details →'}
        </div>
      </div>

      {isExpanded && entries.map((entry, i) => (
        <SubRow 
          key={entry.id} 
          entry={entry} 
          entityType={entityType} 
          editable={editable}
          isLast={i === entries.length - 1}
          onStatusChange={onStatusChange}
          onSelectEntry={onSelectEntry}
          isHighlighted={entry.id === highlightedDateId}
          onDateHover={onDateHover}
        />
      ))}
    </>
  );
}

// Sub-row (expanded view for multiple entries)
function SubRow({
  entry,
  entityType,
  editable,
  isLast,
  onStatusChange,
  onSelectEntry,
  isHighlighted,
  onDateHover,
}: {
  entry: DateEntry;
  entityType: 'artist' | 'venue';
  editable: boolean;
  isLast: boolean;
  onStatusChange: (id: string, status: string) => void;
  onSelectEntry: (entry: DateEntry) => void;
  isHighlighted?: boolean;
  onDateHover?: (dateId: string | null) => void;
}) {
  const name = entityType === 'venue' ? entry.artistName : entry.venueName;
  const linkPath = entityType === 'venue' ? `/artists/${entry.artistId}` : `/venues/${entry.venueId}`;
  const detail = entityType === 'venue' ? (entry.billing || '') : 
    (entry.city ? `${entry.city}${entry.state ? ', ' + entry.state : ''}` : '');

  const statusColor = STATUS_OPTIONS.find(o => o.value === entry.status)?.color || 'text-gray-600';

  return (
    <div 
      className={`grid grid-cols-12 text-gray-600 text-xs cursor-pointer transition-colors duration-150 ${
        isHighlighted 
          ? 'bg-indigo-100 ring-2 ring-indigo-400 ring-inset' 
          : 'bg-gray-50 hover:bg-yellow-50'
      }`}
      onClick={() => onSelectEntry(entry)}
      onMouseEnter={() => onDateHover?.(entry.id)}
      onMouseLeave={() => onDateHover?.(null)}
      id={`date-row-${entry.id}`}
    >
      <div className="col-span-2 px-3 py-1.5 border-r border-gray-100">
        <span className="text-gray-300 pl-4">{isLast ? '└' : '├'}</span>
      </div>
      <div className="col-span-4 px-3 py-1.5 border-r border-gray-100 truncate">
        <Link href={linkPath} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{name}</Link>
        {detail && <span className="text-gray-400 ml-2">({detail})</span>}
      </div>
      <div className="col-span-2 px-3 py-1.5 border-r border-gray-100" onClick={e => e.stopPropagation()}>
        {editable ? (
          <StatusDropdown entry={entry} entityType={entityType} onStatusChange={onStatusChange} />
        ) : (
          <span className={statusColor}>{entry.status}</span>
        )}
      </div>
      <div className="col-span-2 px-3 py-1.5 border-r border-gray-100">{formatDeal(entry)}</div>
      <div className="col-span-2 px-3 py-1.5 text-right text-gray-400">details →</div>
    </div>
  );
}

// Details Modal - shows full booking info
function DetailsModal({
  entry,
  entityType,
  editable,
  onClose,
  onOpenAgent,
  onStatusChange,
}: {
  entry: DateEntry;
  entityType: 'artist' | 'venue';
  editable: boolean;
  onClose: () => void;
  onOpenAgent: () => void;
  onStatusChange: (status: string) => void;
}) {
  const d = new Date(entry.date + 'T12:00:00');
  const dateDisplay = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const statusColor = STATUS_OPTIONS.find(o => o.value === entry.status)?.color || 'text-gray-600';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white border border-gray-300 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto font-mono text-sm shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-bold text-base">
              {entityType === 'venue' ? entry.artistName : entry.venueName}
            </div>
            <div className="text-gray-500 text-xs">{dateDisplay}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status & Billing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 text-xs mb-1">status</div>
              {editable ? (
                (() => {
                  const actions = getAvailableActions(entry.status, entityType);
                  if (actions.length <= 1) {
                    return <span className={statusColor}>{actions[0]?.label || entry.status}</span>;
                  }
                  return (
                    <select
                      value={entry.status}
                      onChange={(e) => onStatusChange(e.target.value)}
                      className={`bg-white border border-gray-300 rounded px-2 py-1 ${statusColor}`}
                    >
                      {actions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  );
                })()
              ) : (
                <span className={statusColor}>{entry.status}</span>
              )}
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">billing</div>
              <span>{entry.billing || '—'}</span>
            </div>
          </div>

          {/* Deal */}
          <div>
            <div className="text-gray-500 text-xs mb-1">deal</div>
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <div className="font-medium">{formatDeal(entry)}</div>
              {entry.deal && (
                <div className="text-gray-500 text-xs mt-1">
                  {entry.deal.type.toLowerCase().replace(/_/g, ' ')}
                </div>
              )}
              {entry.setLength && (
                <div className="text-gray-500 text-xs mt-1">{entry.setLength} min set</div>
              )}
            </div>
          </div>

          {/* Show Details */}
          {entry.details && (
            <div>
              <div className="text-gray-500 text-xs mb-1">show details</div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1 text-xs">
                {entry.details.loadIn && <div><span className="text-gray-500">load-in:</span> {entry.details.loadIn}</div>}
                {entry.details.soundcheck && <div><span className="text-gray-500">soundcheck:</span> {entry.details.soundcheck}</div>}
                {entry.details.doors && <div><span className="text-gray-500">doors:</span> {entry.details.doors}</div>}
                {entry.details.setTime && <div><span className="text-gray-500">set time:</span> {entry.details.setTime}</div>}
                {entry.details.curfew && <div><span className="text-gray-500">curfew:</span> {entry.details.curfew}</div>}
                {entry.details.ageRestriction && <div><span className="text-gray-500">ages:</span> {entry.details.ageRestriction}</div>}
                {entry.details.ticketPrice && (
                  <div>
                    <span className="text-gray-500">tickets:</span> ${entry.details.ticketPrice.advance} adv / ${entry.details.ticketPrice.door} door
                  </div>
                )}
                {entry.details.hospitality && <div><span className="text-gray-500">hospitality:</span> {entry.details.hospitality}</div>}
                {entry.details.lodging && <div><span className="text-gray-500">lodging:</span> {entry.details.lodging}</div>}
                {entry.details.guestList !== undefined && <div><span className="text-gray-500">guest list:</span> {entry.details.guestList}</div>}
                {entry.details.merch && <div><span className="text-gray-500">merch:</span> {entry.details.merch}</div>}
                {entry.details.backline && (
                  <div>
                    <span className="text-gray-500">backline:</span>{' '}
                    {Object.entries(entry.details.backline).map(([k, v]) => 
                      typeof v === 'boolean' ? (v ? k : null) : `${k}: ${v}`
                    ).filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="text-gray-500 text-xs mb-1">notes</div>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 min-h-[60px] whitespace-pre-wrap text-xs">
              {entry.notes || <span className="text-gray-400 italic">no notes yet</span>}
            </div>
          </div>

          {/* Hold info */}
          {entry.holdUntil && (
            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <div className="text-purple-700 font-medium">On Hold</div>
              <div className="text-purple-600 text-xs">
                Until {entry.holdUntil}
                {entry.holdReason && ` — ${entry.holdReason}`}
              </div>
            </div>
          )}

          {/* Location (for artists) */}
          {entityType === 'artist' && (entry.city || entry.state) && (
            <div>
              <div className="text-gray-500 text-xs mb-1">location</div>
              <Link href={`/venues/${entry.venueId}`} className="text-blue-600 hover:underline">
                {entry.venueName}
              </Link>
              <span className="text-gray-500 ml-2">
                {[entry.city, entry.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        {editable && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 px-4 py-3">
            <button
              onClick={onOpenAgent}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              edit with agent...
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Agent Panel - with persistent conversation history
function AgentPanel({
  entityType,
  entityId,
  entityName,
  selectedEntry,
  onClose,
}: {
  entityType: 'artist' | 'venue';
  entityId: string;
  entityName: string;
  selectedEntry: DateEntry | null;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp?: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const param = entityType === 'artist' ? `artistId=${entityId}` : `venueId=${entityId}`;
        const res = await fetch(`/api/agent/conversation?${param}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load conversation history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [entityType, entityId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;
    
    setInput('');
    setIsLoading(true);
    
    // Add user message to UI immediately
    const timestamp = new Date().toISOString();
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp }]);

    try {
      // Send to agent
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.slice(-20), // Last 20 messages for context
          context: { 
            entityType, 
            entityId, 
            entityName,
            dateEntryId: selectedEntry?.id,
            dateEntryDate: selectedEntry?.date,
            dateEntryArtist: selectedEntry?.artistName,
            dateEntryVenue: selectedEntry?.venueName,
          }
        })
      });

      const data = await response.json();
      const assistantMessage = data.message || 'error';
      
      // Add assistant message to UI
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() }]);

      // Save both messages to persistent storage
      await fetch('/api/agent/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: entityType === 'artist' ? entityId : null,
          venueId: entityType === 'venue' ? entityId : null,
          userMessage,
          assistantMessage,
        })
      });

    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'error - try again' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear all conversation history?')) return;
    try {
      const param = entityType === 'artist' ? `artistId=${entityId}` : `venueId=${entityId}`;
      await fetch(`/api/agent/conversation?${param}`, { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // Context-aware examples
  const examples = selectedEntry
    ? [
        '"change the deal to $500"',
        '"add a note: discussed hospitality"',
        '"set load-in at 5pm, doors at 8pm"',
      ]
    : entityType === 'venue' 
      ? ['"book lightning bolt on jan 15"', '"what artists are looking for shows?"']
      : ['"find venues in boston for july"', '"what offers do I have pending?"'];
  
  const contextMessage = selectedEntry 
    ? `Editing: ${selectedEntry.artistName} @ ${selectedEntry.venueName} on ${selectedEntry.date}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border-l border-gray-300 flex flex-col font-mono text-sm">
        {/* Header */}
        <div className="border-b border-gray-300 px-4 py-2 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="font-medium">agent</span>
            <span className="text-gray-400 text-xs">• {entityName}</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={clearHistory} className="text-gray-400 hover:text-red-500 text-xs">
                clear
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {contextMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs text-blue-700">
              {contextMessage}
            </div>
          )}
          
          {loadingHistory ? (
            <div className="text-gray-400">loading history...</div>
          ) : messages.length === 0 ? (
            <div className="text-gray-400">
              hi! i'm your booking assistant. i can help manage your dates, negotiate deals, and keep track of everything.
              <br /><br />
              try:
              {examples.map((ex, i) => <React.Fragment key={i}><br />• {ex}</React.Fragment>)}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
                <div className={`inline-block max-w-[85%] ${msg.role === 'user' ? 'bg-blue-100 px-3 py-2 rounded-lg' : ''}`}>
                  {msg.content}
                </div>
                {msg.timestamp && (
                  <div className="text-gray-300 text-xs mt-0.5">
                    {new Date(msg.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && <div className="text-gray-400">thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-300 p-3 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="> type here"
              className="flex-1 px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:border-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
