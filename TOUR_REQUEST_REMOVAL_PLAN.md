# TourRequest System Removal Plan

## Problem Summary

The platform currently has **three different booking data models** being mixed in the timeline view:
- **`Show` model**: Confirmed shows with `ageRestriction` as `AgeRestriction?` enum (uppercase "ALL_AGES")
- **`ShowRequest` model**: Modern unified system with `ageRestriction` as `String?` (lowercase "all ages")  
- **`TourRequest` model**: Legacy system that's now just a compatibility layer

This mixing causes:
- Title/row mismatches in timeline (show titles don't match expanded content)
- Data type inconsistencies (uppercase vs lowercase age restrictions)
- Complex conversion logic that's hard to maintain
- Technical debt and architectural confusion

## Current Architecture Issues

### Legacy Compatibility Layer
The system currently:
1. Stores data in `ShowRequest` table (modern system)
2. Converts `ShowRequest` → `TourRequest` format in `useTourItineraryData.ts` (lines 232-287)
3. Renders using `TourRequestTimelineItem` component
4. Creates synthetic requests from venue offers/bids for unified display

### Files Involved in Conversion
- `src/hooks/useTourItineraryData.ts` - Main conversion logic
- `src/components/TimelineItems/TourRequestTimelineItem.tsx` - Legacy renderer
- `src/components/TabbedTourItinerary.tsx` - Timeline orchestration
- `src/utils/timelineUtils.ts` - Timeline entry creation
- `types/index.ts` - TourRequest interface definition
- `prisma/schema.prisma` - Database schema

## Refactor Plan

### Phase 1: Database Assessment & Cleanup
1. **Check for actual TourRequest data**:
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function check() { const count = await prisma.tourRequest.count(); console.log('TourRequest records:', count); await prisma.$disconnect(); } check();"
   ```

2. **If TourRequest table has data**: Create migration script to convert to ShowRequest
3. **If TourRequest table is empty**: Proceed with removal

### Phase 2: Create New Timeline Components
**Goal**: Replace `TourRequestTimelineItem` with components that work directly with `ShowRequest` data

1. **Create `ShowRequestTimelineItem.tsx`**:
   - Handle both artist-initiated and venue-initiated requests
   - Work directly with `ShowRequest` interface (no conversion)
   - Maintain same UI/UX as current system

2. **Update `BidTimelineItem.tsx`**:
   - Remove TourRequest dependencies
   - Work directly with ShowRequest data

3. **Create `UnifiedTimelineEntry` interface**:
   ```typescript
   interface UnifiedTimelineEntry {
     type: 'show' | 'show-request';
     date: string;
     data: Show | ShowRequest;
   }
   ```

### Phase 3: Update Timeline Logic
**Goal**: Remove the ShowRequest → TourRequest conversion layer

1. **Update `useTourItineraryData.ts`**:
   - Remove lines 232-287 (conversion logic)
   - Return `ShowRequest[]` directly instead of `TourRequest[]`
   - Update return type interface

2. **Update `timelineUtils.ts`**:
   - Remove TourRequest references
   - Update `createTimelineEntries()` to work with ShowRequest directly
   - Simplify synthetic request creation logic

3. **Update `TabbedTourItinerary.tsx`**:
   - Replace `TourRequestTimelineItem` with `ShowRequestTimelineItem`
   - Remove TourRequest type references
   - Update event handlers to work with ShowRequest

### Phase 4: Type System Cleanup
1. **Remove from `types/index.ts`**:
   - `TourRequest` interface
   - Any TourRequest-related utility types

2. **Update component prop types**:
   - Replace `TourRequest` with `ShowRequest` in all components
   - Update hook return types

### Phase 5: API & Database Cleanup
1. **Remove API endpoints**:
   - `src/app/api/tour-requests/` directory
   - Any remaining TourRequest API references

2. **Database migration**:
   - Create migration to drop `tour_requests` table
   - Remove TourRequest references from schema.prisma

3. **Remove utility files**:
   - `scripts/migrate-to-unified-show-requests.js` (if no longer needed)
   - Any other TourRequest-specific scripts

### Phase 6: Component Cleanup
1. **Remove files**:
   - `src/components/TimelineItems/TourRequestTimelineItem.tsx`
   - `src/components/TourRequestDetailModal.tsx`
   - Update `src/components/TimelineItems/index.ts`

2. **Update imports**:
   - Search for all `TourRequest` imports and remove/replace
   - Update component exports

## Benefits After Refactor

1. **Simplified Architecture**: Single data model for booking requests
2. **Consistent Data Types**: No more mixing of uppercase/lowercase enums
3. **Fixed Timeline Issues**: Show titles will match expanded content
4. **Reduced Technical Debt**: Eliminate conversion layer complexity
5. **Better Maintainability**: Cleaner, more predictable codebase

## Risk Mitigation

1. **Backup Database**: Create full backup before starting
2. **Feature Branch**: Work in isolated branch for easy rollback
3. **Test Coverage**: Verify all timeline functionality works after each phase
4. **Gradual Rollout**: Can be done incrementally, testing at each phase

## Files to Modify (Checklist)

### Core Logic
- [ ] `src/hooks/useTourItineraryData.ts` - Remove conversion layer
- [ ] `src/utils/timelineUtils.ts` - Update timeline creation
- [ ] `src/components/TabbedTourItinerary.tsx` - Update orchestration

### Components
- [ ] Create `src/components/TimelineItems/ShowRequestTimelineItem.tsx`
- [ ] Update `src/components/TimelineItems/BidTimelineItem.tsx`
- [ ] Remove `src/components/TimelineItems/TourRequestTimelineItem.tsx`
- [ ] Remove `src/components/TourRequestDetailModal.tsx`
- [ ] Update `src/components/TimelineItems/index.ts`

### Types & Schema
- [ ] `types/index.ts` - Remove TourRequest interface
- [ ] `prisma/schema.prisma` - Remove TourRequest model
- [ ] Create database migration

### API Cleanup
- [ ] Remove `src/app/api/tour-requests/` directory
- [ ] Search for any remaining TourRequest API calls

### Testing
- [ ] Test artist timeline view
- [ ] Test venue timeline view  
- [ ] Test bid acceptance/decline flows
- [ ] Test offer creation/response flows
- [ ] Verify no console errors or type issues

## Success Criteria

- [ ] Timeline displays correctly for both artists and venues
- [ ] Show titles match expanded row content
- [ ] No data type mixing (consistent age restriction format)
- [ ] All booking flows work (bids, offers, confirmations)
- [ ] No TourRequest references remain in codebase
- [ ] Database is cleaned up
- [ ] Performance is maintained or improved

---

**Next Steps**: Start a fresh chat and begin with Phase 1 (Database Assessment). This refactor should significantly improve the platform's architecture and resolve the data mixing issues. 