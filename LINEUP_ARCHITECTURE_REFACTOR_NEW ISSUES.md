# Lineup Architecture Refactor Plan

## 🚨 Root Problem: Legacy "Headliner + Support Acts" Pattern

The DIY booking platform currently uses an outdated architectural pattern that treats shows as "one primary artist + supporting acts" instead of a true multi-artist lineup system. This has been causing persistent bugs, confusing UI behavior, and maintenance nightmares.

### Current Broken Pattern:
```tsx
// ❌ What we have now - Single artist "owns" the show
<ShowRow artist="Against Me!" status="CONFIRMED">
  <LineupRow artist="lightning bolt" status="PENDING" />
  <LineupRow artist="Fugazi" status="CONFIRMED" />
</ShowRow>
```

### Target Architecture:
```tsx
// ✅ What we want - Show is just a container, all artists are equal
<ShowContainer title="DIY Punk Festival" date="2025-06-15" status="CONFIRMED">
  <LineupRow artist="Against Me!" billing="HEADLINER" status="CONFIRMED" />
  <LineupRow artist="lightning bolt" billing="CO_HEADLINER" status="PENDING" />
  <LineupRow artist="Fugazi" billing="SUPPORT" status="CONFIRMED" />
</ShowContainer>
```

## 🐛 Problems Caused by Current Architecture

### 1. **Status Display Bugs**
- Child lineup rows show confusing status badges (all orange, mixed messages)
- Status logic is duplicated and inconsistent across different rendering paths
- Users see "confirmed" shows where individual artists are actually pending/cancelled

### 2. **Complex Component Logic**
- `ShowTimelineItem.tsx` handles multiple responsibilities:
  - Main show row rendering
  - Child lineup row rendering  
  - Different status badge logic for each
  - Conditional display based on viewer type
- Duplicate status badge functions: `getShowStatusBadge()`, `getLineupStatusBadge()`, `getBillingPositionBadge()`

### 3. **Data Model Confusion**
- `Show.artistName` and `Show.artistId` (legacy single-artist fields)
- `Show.lineup[]` array (new multi-artist architecture)
- `Show.status` (show-level) vs. `LineupItem.status` (artist-level)
- API responses mix single-artist and multi-artist patterns

### 4. **UI Inconsistencies**
- Some views show "headliner + X others" titles
- Other views show individual artist names
- Status indicators don't reflect actual booking state
- Action buttons operate on wrong data entities

## 🎯 Architectural Solution

### Core Principle: **Show = Container, Artists = Equal Lineup Items**

1. **Show Entity**: Date, venue, time, capacity - NO artist ownership
2. **Lineup Items**: All artists are equal with individual statuses and billing positions
3. **Show Status**: Derived from lineup items, not a separate field
4. **Show Title**: Generated from lineup composition, not single artist

### Data Model Changes:
```typescript
// ✅ Clean separation
interface Show {
  id: string;
  date: string;
  venueId: string;
  venueName: string;
  title?: string; // Optional custom title
  // Remove: artistId, artistName, status
}

interface LineupItem {
  id: string;
  showId: string;
  artistId: string;
  artistName: string;
  billingPosition: 'HEADLINER' | 'CO_HEADLINER' | 'SUPPORT' | 'OPENER' | 'LOCAL_SUPPORT';
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  performanceOrder: number;
  setLength?: number;
  guarantee?: number;
}
```

## 🔧 Implementation Plan

### Phase 1: Create New Components
**File: `src/components/TimelineItems/ShowHeaderRow.tsx`**
```tsx
// Clean show container - smart title from lineup billing order
function ShowHeaderRow({ show, onExpand, isExpanded }) {
  return (
    <tr className="show-header-row">
      <td>
        <button onClick={() => onExpand(show.id)}>
          {isExpanded ? '−' : '+'}
        </button>
      </td>
      <td>{formatDate(show.date)}</td>
      <td>{show.venueName}</td>
      <td>{generateSmartShowTitle(show.lineup)} at {show.venueName}</td>
      <td>{getAggregateStatus(show.lineup)}</td>
      <td>Actions</td>
    </tr>
  );
}
```

**File: `src/components/TimelineItems/LineupTableSection.tsx`**
```tsx
// Clean lineup display - all artists equal
function LineupTableSection({ lineup, permissions }) {
  return (
    <div className="lineup-table">
      {lineup.map(lineupItem => (
        <LineupItemRow 
          key={lineupItem.id}
          lineupItem={lineupItem}
          permissions={permissions}
        />
      ))}
    </div>
  );
}
```

**File: `src/components/TimelineItems/LineupItemRow.tsx`**
```tsx
// Individual artist row - proper status display
function LineupItemRow({ lineupItem, permissions }) {
  return (
    <tr className="lineup-item-row">
      <td></td> {/* Empty for indentation */}
      <td></td> {/* Empty - parent provides date */}
      <td>
        <ArtistLink artistId={lineupItem.artistId}>
          {lineupItem.artistName}
        </ArtistLink>
      </td>
      <td>
        <StatusBadge status={lineupItem.status} />
      </td>
      <td>
        <BillingBadge position={lineupItem.billingPosition} />
      </td>
      <td>{lineupItem.setLength}min</td>
      <td>${lineupItem.guarantee}</td>
      <td>Actions</td>
    </tr>
  );
}
```

### Phase 2: Utility Functions
**File: `src/utils/showUtils.ts`**
```tsx
// Smart show title generation based on billing order
export function generateSmartShowTitle(lineup: LineupItem[]): string {
  if (!lineup?.length) return 'TBA';
  
  const sortedLineup = lineup.sort((a, b) => a.performanceOrder - b.performanceOrder);
  
  if (sortedLineup.length === 1) {
    return sortedLineup[0].artistName;
  } else if (sortedLineup.length === 2) {
    return `${sortedLineup[0].artistName} + ${sortedLineup[1].artistName}`;
  } else if (sortedLineup.length === 3) {
    return `${sortedLineup[0].artistName} + ${sortedLineup[1].artistName} + 1 more`;
  } else {
    const headliner = sortedLineup[0];
    const coHeadliner = sortedLineup[1];
    const othersCount = sortedLineup.length - 2;
    return `${headliner.artistName} + ${coHeadliner.artistName} + ${othersCount} more`;
  }
}

// Aggregate status from lineup
export function getAggregateStatus(lineup: LineupItem[]): string {
  if (!lineup?.length) return 'PENDING';
  
  const confirmedCount = lineup.filter(item => item.status === 'CONFIRMED').length;
  const pendingCount = lineup.filter(item => item.status === 'PENDING').length;
  const cancelledCount = lineup.filter(item => item.status === 'CANCELLED').length;
  
  if (confirmedCount === lineup.length) return 'CONFIRMED';
  if (cancelledCount === lineup.length) return 'CANCELLED';
  if (confirmedCount > 0 && pendingCount > 0) return 'PARTIAL';
  return 'PENDING';
}
```

### Phase 3: Refactor ShowTimelineItem
**File: `src/components/TimelineItems/ShowTimelineItem.tsx`**
```tsx
// Clean composition of new components
export function ShowTimelineItem({ show, permissions, isExpanded, onToggleExpansion, ...props }) {
  return (
    <>
      <ShowHeaderRow 
        show={show}
        onExpand={onToggleExpansion}
        isExpanded={isExpanded}
        permissions={permissions}
      />
      
      {isExpanded && show.lineup?.length > 0 && (
        <tr>
          <td colSpan="100%">
            <LineupTableSection 
              lineup={show.lineup}
              permissions={permissions}
            />
          </td>
        </tr>
      )}
    </>
  );
}
```

### Phase 4: Clean Up Legacy Code
1. **Remove duplicate status badge functions**
2. **Remove Show.artistId and Show.artistName references**
3. **Update API responses to use lineup-first approach**
4. **Fix smart title generation everywhere**
5. **Update action buttons to operate on correct entities**

## 🎨 Expected UI Result

### Before (Broken):
```
► Against Me! at Lost Bag        [CONFIRMED] HL  $1200  [Actions]  ← One artist "owns" show
  ├─ lightning bolt              [Confirmed] CH  $800   [Actions]  ← Orange badge, confusing
  ├─ Fugazi                      [Confirmed] SP  $400   [Actions]  ← All same status
  └─ The Menzingers              [Confirmed] OP  $300   [Actions]  ← Misleading
```

### After (Fixed):
```
► Against Me! + lightning bolt + 2 more at Lost Bag [3/4 CONFIRMED] [Actions]  ← Smart title, no owner
  ├─ Against Me!                 [CONFIRMED] HL  $1200  [Actions]  ← Green badge
  ├─ lightning bolt              [PENDING]   CH  $800   [Actions]  ← Yellow badge  
  ├─ Fugazi                      [CONFIRMED] SP  $400   [Actions]  ← Green badge
  └─ The Menzingers              [CANCELLED] OP  $300   [Actions]  ← Red badge
```

**Key UI Changes:**
- **Parent row**: Smart title generation from billing order (no single artist ownership)
- **Child rows**: Proper status colors reflecting individual artist booking status  
- **Architecture**: Show = container, all artists = equal participants

## 🚀 Implementation Priority

1. **HIGH PRIORITY**: Fix the timeline display bugs by creating new components
2. **MEDIUM PRIORITY**: Clean up data model references and API responses  
3. **LOW PRIORITY**: Update other pages (shows list, admin views) to use new pattern

## 📁 Files to Modify

### New Files to Create:
- `src/components/TimelineItems/ShowHeaderRow.tsx`
- `src/components/TimelineItems/LineupTableSection.tsx` 
- `src/components/TimelineItems/LineupItemRow.tsx`
- `src/utils/showUtils.ts`

### Existing Files to Refactor:
- `src/components/TimelineItems/ShowTimelineItem.tsx` (major refactor)
- `src/utils/showNaming.ts` (update smart title logic)
- `src/app/shows/page.tsx` (update show list display)
- API routes that return show data (ensure lineup is always included)

## 🎯 Success Criteria

✅ **No more status display bugs** - Each artist shows correct status color  
✅ **Clean component separation** - Each component has single responsibility  
✅ **Consistent data model** - Show = container, Lineup = artists  
✅ **Intuitive UI** - Users can see actual booking status at a glance  
✅ **Maintainable code** - No more duplicate status logic  

This refactor will eliminate the architectural debt that's been causing persistent bugs and make the system much more maintainable and intuitive for users. 