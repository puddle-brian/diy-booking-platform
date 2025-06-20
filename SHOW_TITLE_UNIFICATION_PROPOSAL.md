# Show Title Generation Unification Proposal

## **Problem Summary**

The DIY booking platform currently has **3 different show title generation systems** scattered across the codebase. This fragmentation makes maintenance difficult and prevents us from implementing consistent improvements across all components. Our attempts to fix title generation issues have failed because changes to one system don't affect the others.

## **Current Fragmented Architecture**

### **System 1: Legacy System** (`src/utils/showUtils.ts`)
- **Used by**: `ShowHeaderRow.tsx` (confirmed show headers)
- **Function**: `generateSmartShowTitle(lineup: LineupItem[]): string`
- **Logic**: Sorts by `performanceOrder` (1, 2, 3, 4, 5)
- **Status**: Works as designed, but isolated from other systems
- **Returns**: Plain string

### **System 2: Unified System** (`src/utils/showNaming.ts`)
- **Used by**: `ShowRequestRow.tsx` (show request rows), `TabbedTourItinerary.tsx`
- **Function**: `generateSmartShowTitle({ headlinerName, supportActs }): { title, tooltip }`
- **Logic**: Sophisticated billing position hierarchy with multiple scenarios
- **Features**: Rich tooltips, flexible input options, consistent formatting
- **Status**: Most advanced system, but only used in 2 places
- **Returns**: `{ title: string, tooltip?: string }` object

### **System 3: Local Function** (`src/app/shows/page.tsx`)
- **Used by**: Shows page listing
- **Function**: Local `generateSmartShowTitle(show: ShowWithLineup): string`
- **Logic**: Custom implementation, different from the other two
- **Status**: Works for its specific use case, but completely isolated
- **Returns**: Plain string

## **Why Unification Matters**

**The Core Issue**: When we try to improve title generation (like prioritizing headliners, adding tooltips, or changing formatting), we have to update 3 different systems with 3 different interfaces. This leads to:

- **Inconsistent behavior** across the platform
- **Failed fixes** because changes only affect one system
- **Maintenance overhead** of keeping 3 systems in sync
- **Developer confusion** about which system to use or modify

**The Solution**: Move everything to the most sophisticated system (`src/utils/showNaming.ts`) first, then make improvements in one place that affect the entire platform.

## **Components Affected**

### **Timeline Row Components**
1. ✅ **ShowHeaderRow.tsx** - Confirmed show headers (uses legacy system)
2. ✅ **ShowRequestRow.tsx** - Show request rows (already uses unified system)
3. ✅ **Shows Page** (`src/app/shows/page.tsx`) - Show listings (uses local function)

### **Other Components**
- **LineupItemRow.tsx** - Individual artists (doesn't generate show titles)
- **TabbedTourItinerary.tsx** - Already uses unified system

## **Migration Proposal**

### **Phase 1: Enhance Unified System**

Extend `src/utils/showNaming.ts` to handle all scenarios:

```typescript
export interface ShowNamingOptions {
  // For confirmed shows (from lineup data)
  lineup?: LineupItem[];
  
  // For show requests (from request data)  
  headlinerName?: string;
  supportActs?: SupportAct[];
  
  // For simple cases
  artistNames?: string[];
  
  // Options
  maxVisible?: number;
  showTooltip?: boolean;
}

export function generateSmartShowTitle(options: ShowNamingOptions): { title: string; tooltip?: string } {
  // Handle lineup data by converting to billing hierarchy
  if (options.lineup) {
    return generateTitleFromLineup(options.lineup, options);
  }
  
  // Handle show request data (already implemented)
  if (options.headlinerName || options.supportActs) {
    return generateTitleFromShowRequest(options);
  }
  
  // Handle simple artist list
  if (options.artistNames) {
    return generateTitleFromArtistList(options.artistNames, options);
  }
  
  return { title: 'Unknown Show' };
}

function generateTitleFromLineup(lineup: LineupItem[], options: ShowNamingOptions) {
  // Convert lineup to billing hierarchy
  const sortedByBilling = lineup.sort((a, b) => {
    const priorityA = getBillingPriority(a.billingPosition);
    const priorityB = getBillingPriority(b.billingPosition);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Lower number = higher priority
    }
    
    // Within same billing tier, sort by performance order
    return (a.performanceOrder || 999) - (b.performanceOrder || 999);
  });
  
  // Generate title with headliners first
  return generateTitleFromSortedArtists(sortedByBilling, options);
}
```

### **Phase 2: Migrate Components**

#### **A. ShowHeaderRow.tsx** (Confirmed Shows)
```typescript
// BEFORE (legacy system)
import { generateSmartShowTitle, generateDetailedShowTitle } from '../../utils/showUtils';

const showTitle = generateSmartShowTitle(lineup);
const detailedTitle = generateDetailedShowTitle(lineup);

// AFTER (unified system)
import { generateSmartShowTitle } from '../../utils/showNaming';

const { title: showTitle, tooltip: detailedTitle } = generateSmartShowTitle({ 
  lineup,
  showTooltip: true 
});
```

#### **B. Shows Page** (`src/app/shows/page.tsx`)
```typescript
// BEFORE (local function)
const generateSmartShowTitle = (show: ShowWithLineup): string => {
  // Custom local implementation...
};

// AFTER (unified system)
import { generateSmartShowTitle } from '../utils/showNaming';

// In component:
const { title } = generateSmartShowTitle({ lineup: show.lineup });
```

#### **C. ShowRequestRow.tsx** (Already Using Unified System)
```typescript
// ✅ Already using unified system - no changes needed
const { title, tooltip } = generateSmartShowTitle({
  headlinerName: headlinerArtist.artistName,
  supportActs: supportActs
});
```

### **Phase 3: Cleanup**

1. **Remove Legacy Functions**:
   - Delete `generateSmartShowTitle` from `src/utils/showUtils.ts`
   - Delete `generateDetailedShowTitle` from `src/utils/showUtils.ts`
   - Remove local function from `src/app/shows/page.tsx`

2. **Update Imports**:
   - Update all components to import from unified system
   - Remove unused imports from legacy system

3. **Type Safety**:
   - Ensure all components use proper TypeScript interfaces
   - Add proper error handling for edge cases

## **Expected Benefits**

### **Immediate Benefits**
- ✅ **Consistent Behavior**: All components use same logic and formatting
- ✅ **Rich Tooltips**: Detailed lineup info on hover everywhere
- ✅ **Future-Proof**: Changes affect entire platform at once

### **Long-term Maintenance**
- ✅ **Single Source of Truth**: Fix bugs in one place
- ✅ **Type Safety**: Proper TypeScript interfaces prevent errors
- ✅ **Extensibility**: Easy to add new title formats/features
- ✅ **Testing**: One system to test thoroughly

## **Risk Assessment**

### **Low Risk Migration**
- **Backwards Compatible**: New system can handle all existing data
- **Incremental**: Can migrate one component at a time
- **Testable**: Can verify each component works before cleanup
- **Rollback Safe**: Can revert individual components if issues arise

### **Testing Strategy**
1. **Unit Tests**: Test unified system with various lineup configurations
2. **Component Tests**: Verify each migrated component displays correctly
3. **Integration Tests**: Ensure titles match across different views
4. **User Acceptance**: Verify show titles display as expected in UI

## **Implementation Timeline**

### **Week 1: Foundation**
- Enhance unified system to handle lineup data
- Add comprehensive unit tests
- Document new interfaces

### **Week 2: Migration**
- Migrate ShowHeaderRow.tsx
- Migrate shows/page.tsx
- Test each migration thoroughly

### **Week 3: Cleanup & Polish**
- Remove legacy systems
- Update documentation
- Final testing and validation

## **Success Criteria**

- [ ] All components use the unified system (`src/utils/showNaming.ts`)
- [ ] Consistent title format and behavior across all components
- [ ] Rich tooltips available everywhere
- [ ] No TypeScript compilation errors
- [ ] All existing functionality preserved
- [ ] Legacy systems completely removed
- [ ] Performance maintained or improved

## **Conclusion**

This migration will solve the current title generation fragmentation by consolidating three different systems into one robust, well-tested solution. Once unified, any improvements to title generation (like billing position priorities, formatting changes, or new features) can be implemented once and will automatically apply across the entire platform. This addresses the root cause of why our previous fix attempts have failed - we were only updating one system at a time. 

## **Refined Implementation Based on Code Analysis**

After reviewing the actual codebase, here's a more specific implementation plan:

### **Enhanced Unified System Interface**

```typescript
// Extend existing showNaming.ts with lineup support
export interface ShowNamingOptions {
  // For confirmed shows (from LineupItem[])
  lineup?: Array<{
    artistId: string;
    artistName: string;
    billingPosition: 'HEADLINER' | 'CO_HEADLINER' | 'SUPPORT' | 'OPENER' | 'LOCAL_SUPPORT';
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
    performanceOrder: number;
    setLength?: number;
    guarantee?: number;
  }>;
  
  // For show requests (existing functionality)
  headlinerName?: string;
  supportActs?: Array<{
    artistName: string;
    status: 'pending' | 'accepted' | 'declined' | 'cancelled';
    billingPosition?: 'headliner' | 'support' | 'co-headliner' | 'local-support';
  }>;
  
  // Options
  includeStatusInCount?: boolean;
  maxNameLength?: number;
  showTooltip?: boolean;
}

export function generateSmartShowTitle(options: ShowNamingOptions): { title: string; tooltip?: string } {
  // Handle LineupItem[] data (from showUtils.ts)
  if (options.lineup) {
    return generateTitleFromLineup(options.lineup, options);
  }
  
  // Handle show request data (existing functionality)
  if (options.headlinerName || options.supportActs) {
    return generateTitleFromShowRequest(options);
  }
  
  return { title: 'TBA' };
}

function generateTitleFromLineup(
  lineup: LineupItem[], 
  options: ShowNamingOptions
): { title: string; tooltip?: string } {
  if (!lineup?.length) return { title: 'TBA' };
  
  // Filter out cancelled acts
  const activeLineup = lineup.filter(item => item.status !== 'CANCELLED');
  
  // Sort by billing priority first, then performance order
  const sortedLineup = activeLineup.sort((a, b) => {
    const priorityA = getBillingPriority({ billingPosition: a.billingPosition });
    const priorityB = getBillingPriority({ billingPosition: b.billingPosition });
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Lower number = higher priority
    }
    
    // Within same billing tier, sort by performance order
    return (a.performanceOrder || 999) - (b.performanceOrder || 999);
  });
  
  // Convert to the existing showNaming.ts format for consistency
  if (sortedLineup.length === 0) return { title: 'TBA' };
  
  const [headliner, ...support] = sortedLineup;
  const supportActs = support.map(item => ({
    artistName: item.artistName,
    status: mapLineupStatusToShowRequestStatus(item.status),
    billingPosition: mapBillingPosition(item.billingPosition)
  }));
  
  // Use existing sophisticated logic
  return generateTitleFromShowRequest({
    headlinerName: headliner.artistName,
    supportActs,
    includeStatusInCount: options.includeStatusInCount,
    maxNameLength: options.maxNameLength
  });
}

// Helper functions to map between the two systems
function mapLineupStatusToShowRequestStatus(status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'): 'accepted' | 'pending' | 'cancelled' {
  switch (status) {
    case 'CONFIRMED': return 'accepted';
    case 'PENDING': return 'pending';
    case 'CANCELLED': return 'cancelled';
    default: return 'pending';
  }
}

function mapBillingPosition(position: string): 'headliner' | 'co-headliner' | 'support' | 'local-support' {
  switch (position) {
    case 'HEADLINER': return 'headliner';
    case 'CO_HEADLINER': return 'co-headliner';
    case 'SUPPORT': return 'support';
    case 'LOCAL_SUPPORT': return 'local-support';
    default: return 'support';
  }
}
```

### **Migration Strategy**

#### **Phase 1: Extend Unified System** (Low Risk)
1. Add lineup support to `showNaming.ts` without breaking existing functionality
2. Add comprehensive unit tests for all scenarios
3. Test with real data from the 202 venues and 142 artists

#### **Phase 2: Migrate ShowHeaderRow.tsx** (Medium Impact)
```typescript
// BEFORE (showUtils.ts)
import { generateSmartShowTitle, generateDetailedShowTitle } from '../../utils/showUtils';
const showTitle = generateSmartShowTitle(lineup);
const detailedTitle = generateDetailedShowTitle(lineup);

// AFTER (unified system)
import { generateSmartShowTitle } from '../../utils/showNaming';
const { title: showTitle, tooltip: detailedTitle } = generateSmartShowTitle({ 
  lineup,
  showTooltip: true 
});
```

#### **Phase 3: Migrate Shows Page** (High Impact - User Facing)
```typescript
// BEFORE (local function in shows/page.tsx)
const generateSmartShowTitle = (show: ShowWithLineup): string => {
  // 30+ lines of custom logic...
};

// AFTER (unified system)
import { generateSmartShowTitle } from '../utils/showNaming';
const { title } = generateSmartShowTitle({ lineup: show.lineup });
```

#### **Phase 4: Cleanup** (Code Quality)
- Remove deprecated functions from `showUtils.ts`
- Remove local function from `shows/page.tsx`
- Update all imports
- Remove unused code

### **Testing Strategy for Live System**

Since this is a production system with real data:

1. **Unit Tests First**: Test all scenarios with sample data
2. **Shadow Testing**: Run both old and new systems in parallel, log differences
3. **Gradual Rollout**: Migrate one component at a time
4. **Rollback Plan**: Keep old functions until migration is complete
5. **User Validation**: Verify titles look correct in production

### **Benefits Specific to Your Platform**

- **Consistent Tooltips**: Rich lineup details on hover everywhere (great for mobile)
- **Billing Position Support**: Proper headliner hierarchy across all views
- **Status Awareness**: Handle pending/confirmed/cancelled states consistently
- **Mobile Optimization**: Better truncation and formatting for touring musicians
- **Future Features**: Easy to add new formatting options platform-wide

## **Recommended Next Steps**

1. **Start with Enhancement**: Extend `showNaming.ts` with lineup support
2. **Write Tests**: Comprehensive test coverage before any migration
3. **Shadow Mode**: Run both systems in parallel to verify consistency
4. **Migrate Incrementally**: One component at a time
5. **Monitor Production**: Watch for any issues with real user data

This approach respects the live production environment while delivering the architectural improvements you've identified. 