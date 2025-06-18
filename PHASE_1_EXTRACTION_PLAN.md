# Phase 1: Extract Business Logic (Week 1-2)

## **Goal**: Reduce TabbedTourItinerary.tsx from 2,359 lines to under 800 lines

### **Step 1.1: Extract Bid Logic** 
**Target**: Move all bid-related business logic out of the component

**Create**: `src/services/BidService.ts`
```typescript
export class BidService {
  // Move all bid action handlers
  static async acceptBid(bid: VenueBid, reason?: string) { ... }
  static async declineBid(bid: VenueBid, reason?: string) { ... }
  static async cancelBid(bid: VenueBid) { ... }
  
  // Move bid status logic  
  static getEffectiveBidStatus(bid: VenueBid): string { ... }
  static getBidStatusBadge(bid: VenueBid) { ... }
  
  // Move bid filtering logic
  static filterActiveBids(bids: VenueBid[]): VenueBid[] { ... }
  static groupBidsByRequest(bids: VenueBid[]) { ... }
}
```

**Lines Removed**: ~300 lines of bid logic

### **Step 1.2: Extract Timeline Utils**
**Target**: Move timeline grouping/filtering logic

**Create**: `src/utils/TimelineUtils.ts`
```typescript
export class TimelineUtils {
  // Move timeline entry creation
  static createTimelineEntries(shows: Show[], requests: any[], bids: VenueBid[]) { ... }
  
  // Move grouping logic
  static groupEntriesByMonth(entries: TimelineEntry[]) { ... }
  static groupEntriesByDate(entries: TimelineEntry[]) { ... }
  
  // Move filtering logic
  static filterEntriesForMonth(entries: TimelineEntry[], month: string) { ... }
  static extractDateFromEntry(entry: TimelineEntry): string { ... }
}
```

**Lines Removed**: ~200 lines of timeline logic

### **Step 1.3: Extract Form Logic**
**Target**: Move all form handling out of main component

**Create**: `src/components/forms/AddDateFormModal.tsx`
```typescript
// Move the entire addDateForm state and handlers
// This is a complete modal component, not inline JSX
export function AddDateFormModal({
  isOpen,
  onClose,
  artistId,
  venueId,
  onSuccess
}: AddDateFormModalProps) {
  // All the form state and submission logic goes here
}
```

**Lines Removed**: ~400 lines of form logic

### **Step 1.4: Extract Modal Management**
**Target**: Move all modal state/handlers

**Create**: `src/hooks/useModalState.ts`
```typescript
export function useModalState() {
  // Move all modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  // ... all other modal states
  
  // Move all modal handlers
  const handleShowDetailModal = (show: Show) => { ... };
  const handleShowDocumentModal = (show: Show) => { ... };
  // ... all other modal handlers
  
  return {
    // Modal states
    modals: { showDetailModal, showDocumentModal, ... },
    // Modal handlers  
    handlers: { handleShowDetailModal, handleShowDocumentModal, ... }
  };
}
```

**Lines Removed**: ~200 lines of modal logic

### **Step 1.5: Extract Action Handlers**
**Target**: Move all action handlers to custom hooks

**Create**: `src/hooks/useTimelineActions.ts`
```typescript
export function useTimelineActions() {
  // Move expansion handlers
  const toggleShowExpansion = (showId: string) => { ... };
  const toggleRequestExpansion = (requestId: string) => { ... };
  
  // Move delete handlers
  const handleDeleteShow = async (showId: string, showName: string) => { ... };
  const handleDeleteRequest = async (requestId: string, requestName: string) => { ... };
  
  return {
    toggleShowExpansion,
    toggleRequestExpansion,
    handleDeleteShow,
    handleDeleteRequest
  };
}
```

**Lines Removed**: ~150 lines of action handlers

## **After Phase 1 Completion**

### **New File Structure**
```
src/
├── services/
│   └── BidService.ts (300 lines)
├── utils/  
│   └── TimelineUtils.ts (200 lines)
├── components/forms/
│   └── AddDateFormModal.tsx (400 lines)
├── hooks/
│   ├── useModalState.ts (200 lines)
│   └── useTimelineActions.ts (150 lines)
└── components/
    └── TabbedTourItinerary.tsx (800 lines) ✅
```

### **TabbedTourItinerary.tsx After Phase 1**
```typescript
export default function TabbedTourItinerary(props) {
  // Clean, focused component that ONLY handles:
  // 1. Data fetching (via existing hooks)
  // 2. State management (via existing hooks) 
  // 3. Rendering (much simpler now)
  
  const bidService = new BidService();
  const timelineUtils = new TimelineUtils();
  const { modals, handlers } = useModalState();
  const actions = useTimelineActions();
  
  // Simple, clean rendering logic
  return (
    <div>
      <TimelineTable 
        entries={timelineUtils.createTimelineEntries(shows, requests, bids)}
        onBidAction={bidService.acceptBid}
        onToggleExpansion={actions.toggleShowExpansion}
      />
      <AddDateFormModal {...modalProps} />
    </div>
  );
}
```

## **Benefits After Phase 1**
1. **Maintainable size** - Main component under 800 lines
2. **Testable logic** - Business logic in separate, testable services
3. **Reusable utilities** - Timeline logic can be reused elsewhere
4. **Clear separation** - Each file has one clear responsibility
5. **Easier debugging** - Logic is isolated and focused

## **Phase 1 Success Criteria**
- [ ] TabbedTourItinerary.tsx under 800 lines
- [ ] All bid logic extracted to BidService
- [ ] All timeline logic extracted to TimelineUtils
- [ ] All form logic extracted to AddDateFormModal
- [ ] All modal logic extracted to useModalState
- [ ] All action handlers extracted to useTimelineActions
- [ ] **Site still works exactly the same**

## **Time Estimate**: 1-2 weeks
- Each extraction can be done incrementally
- Test after each extraction to ensure nothing breaks
- No functionality changes, just code organization 