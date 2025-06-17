# TourRequest System Removal - Implementation Guide

## 🎯 **Project Status: READY TO EXECUTE**

**Assessment Results:**
- ✅ TourRequest table: **0 records** (safe to remove)
- ✅ ShowRequest table: **84 active records** (46 venue-initiated, 38 artist-initiated)
- ✅ Age restriction mismatch confirmed (string vs enum)
- ✅ No foreign key dependencies on TourRequest

## 🏗️ **Architecture Overview**

### Before (Current Complex System)
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ ShowRequest │    │ TourRequest  │    │    Show     │
│ (modern)    │───▶│ (legacy)     │◀───│ (confirmed) │
│ 84 records  │    │ 0 records    │    │ 126 records │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                    │
       └─────────────┬─────────────┬─────────────┘
                     ▼             ▼
            ┌─────────────────────────────┐
            │   Timeline Conversion       │
            │   (Anti-pattern Layer)      │
            │   useTourItineraryData.ts   │
            └─────────────────────────────┘
                     ▼
            ┌─────────────────────────────┐
            │ TourRequestTimelineItem     │
            │ (Legacy Component)          │
            └─────────────────────────────┘
```

### After (Unified Clean System)
```
┌─────────────┐    ┌─────────────┐
│ ShowRequest │    │    Show     │
│ (unified)   │    │ (confirmed) │
│ 84 records  │    │ 126 records │
└─────────────┘    └─────────────┘
       │                   │
       └─────────┬─────────┘
                 ▼
      ┌─────────────────────────────┐
      │ BookingRequestService       │
      │ (Domain Service)            │
      └─────────────────────────────┘
                 ▼
      ┌─────────────────────────────┐
      │ UnifiedTimelineComponent    │
      │ (Single Component)          │
      └─────────────────────────────┘
```

## 📋 **Implementation Phases**

### **Phase 1: Data Consistency Fix (IMMEDIATE)**

#### 1.1 Age Restriction Normalization
The most critical issue is the age restriction format mismatch:
- **ShowRequest**: `"ALL_AGES"` (string)
- **Show**: `ALL_AGES` (enum)

**Action Required:**
```sql
-- Create migration to fix ShowRequest age restrictions
UPDATE show_requests 
SET age_restriction = 
  CASE 
    WHEN age_restriction = 'ALL_AGES' THEN 'ALL_AGES'
    WHEN age_restriction = 'all ages' THEN 'ALL_AGES'
    WHEN age_restriction = '18+' THEN 'EIGHTEEN_PLUS'
    WHEN age_restriction = '21+' THEN 'TWENTY_ONE_PLUS'
    ELSE age_restriction
  END
WHERE age_restriction IS NOT NULL;
```

#### 1.2 Create Domain Foundation
- ✅ **DONE**: `types/booking-domain.ts` - Unified domain types
- ✅ **DONE**: `src/services/BookingRequestService.ts` - Service layer

### **Phase 2: Component Architecture (1-2 days)**

#### 2.1 Create New Timeline Component
Replace `TourRequestTimelineItem` with a unified component:

**Files to Create:**
- `src/components/TimelineItems/BookingRequestTimelineItem.tsx`
- `src/components/TimelineItems/UnifiedTimelineRow.tsx`

**Key Features:**
- Direct ShowRequest integration (no conversion)
- Consistent age restriction display
- Proper TypeScript types
- Existing UI patterns (badge styling, expand/collapse)

#### 2.2 Update Timeline Logic
**Files to Modify:**
- `src/hooks/useTourItineraryData.ts` - Remove conversion layer (lines 232-287)
- `src/components/TabbedTourItinerary.tsx` - Use new component
- `src/utils/timelineUtils.ts` - Simplify entry creation

### **Phase 3: Service Layer Integration (1 day)**

#### 3.1 Replace Hook-Based Data Access
- Integrate `BookingRequestService` into timeline hooks
- Remove conversion functions
- Add proper error handling and loading states

#### 3.2 API Endpoint Updates
**Files to Modify:**
- Timeline-related API endpoints to use service layer
- Remove any remaining TourRequest API references

### **Phase 4: Database Cleanup (1 day)**

#### 4.1 Create Migration
```sql
-- Drop TourRequest table and related indexes
DROP TABLE IF EXISTS tour_requests CASCADE;
DROP TABLE IF EXISTS bids CASCADE; -- Only if it references tour_requests
```

#### 4.2 Prisma Schema Update
- Remove TourRequest model from `prisma/schema.prisma`
- Update relationships
- Generate new Prisma client

### **Phase 5: Code Cleanup (1 day)**

#### 5.1 Remove Legacy Files
- `src/components/TimelineItems/TourRequestTimelineItem.tsx`
- `src/components/TourRequestDetailModal.tsx`
- `types/index.ts` - Remove TourRequest interface
- `src/app/api/tour-requests/` directory

#### 5.2 Update Imports
- Search and replace all TourRequest imports
- Update component exports in index files

## 🛠️ **Detailed Implementation Steps**

### **Step 1: Backup & Safety**
```bash
# Create backup before starting
npm run backup

# Verify backup was created
ls -la backups/
```

### **Step 2: Fix Age Restriction Data**
```typescript
// Create migration script: scripts/fix-age-restrictions.js
const { PrismaClient } = require('@prisma/client');

async function fixAgeRestrictions() {
  const prisma = new PrismaClient();
  
  // Fix ShowRequest age restrictions
  await prisma.showRequest.updateMany({
    where: { ageRestriction: 'ALL_AGES' },
    data: { ageRestriction: 'ALL_AGES' }
  });
  
  console.log('✅ Age restrictions normalized');
  await prisma.$disconnect();
}

fixAgeRestrictions();
```

### **Step 3: Create Unified Timeline Component**

**File: `src/components/TimelineItems/BookingRequestTimelineItem.tsx`**
```typescript
import React from 'react';
import { ShowRequest, Show } from '@prisma/client';
import { formatDisplayDate } from '@/utils/dateUtils';

interface BookingRequestTimelineItemProps {
  entry: ShowRequest | Show;
  isExpanded: boolean;
  onToggle: () => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}

export const BookingRequestTimelineItem: React.FC<BookingRequestTimelineItemProps> = ({
  entry,
  isExpanded,
  onToggle,
  onAccept,
  onDecline
}) => {
  // Type guard to determine if this is a ShowRequest or Show
  const isShowRequest = 'requestedDate' in entry;
  const isShow = 'date' in entry && !('requestedDate' in entry);
  
  const displayDate = isShowRequest ? entry.requestedDate : entry.date;
  const status = isShowRequest ? entry.status : 'CONFIRMED';
  
  // Consistent badge styling (using existing patterns)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Normalize age restriction display
  const displayAgeRestriction = (ageRestriction: any): string => {
    if (!ageRestriction) return 'flexible';
    
    if (typeof ageRestriction === 'string') {
      return ageRestriction.toLowerCase().replace('_', ' ');
    }
    
    return ageRestriction.toString().toLowerCase().replace('_', ' ');
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
      <td className="px-4 py-1 w-[3%]">
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </td>
      
      <td className="px-4 py-1 w-[12%]">
        <div className="text-sm font-medium text-gray-900">
          {formatDisplayDate(displayDate)}
        </div>
      </td>
      
      <td className="px-4 py-1">
        <div className="text-sm font-medium text-gray-900 truncate">
          {entry.title}
        </div>
      </td>
      
      <td className="px-4 py-1 w-[10%]">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
          {status}
        </span>
      </td>
      
      <td className="px-4 py-1 w-[7%]">
        <div className="text-xs text-gray-600">
          {displayAgeRestriction(entry.ageRestriction)}
        </div>
      </td>
      
      <td className="px-4 py-1 w-[10%]">
        <div className="flex items-center space-x-1">
          {/* Action buttons for pending requests */}
          {status === 'OPEN' && onAccept && onDecline && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline(entry.id);
                }}
                className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs"
              >
                Decline
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(entry.id);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
              >
                Accept
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
```

### **Step 4: Update Timeline Hook**

**File: `src/hooks/useTourItineraryData.ts`**
```typescript
// Remove lines 232-287 (conversion logic)
// Replace with direct BookingRequestService usage

import { BookingRequestService } from '../services/BookingRequestService';

export function useTourItineraryData(artistId?: string, venueId?: string) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const bookingService = new BookingRequestService(prisma);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const participantId = artistId || venueId;
        const participantType = artistId ? 'artist' : 'venue';
        
        if (participantId) {
          const timelineEntries = await bookingService.getTimelineEntries(
            participantId, 
            participantType
          );
          setEntries(timelineEntries);
        }
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [artistId, venueId]);
  
  return { entries, loading };
}
```

### **Step 5: Update Main Timeline Component**

**File: `src/components/TabbedTourItinerary.tsx`**
```typescript
// Replace TourRequestTimelineItem with BookingRequestTimelineItem
import { BookingRequestTimelineItem } from './TimelineItems/BookingRequestTimelineItem';

// Remove TourRequest references and use unified component
{entries.map((entry) => (
  <BookingRequestTimelineItem
    key={entry.id}
    entry={entry}
    isExpanded={expandedRows.has(entry.id)}
    onToggle={() => toggleRow(entry.id)}
    onAccept={handleAcceptRequest}
    onDecline={handleDeclineRequest}
  />
))}
```

## 🧪 **Testing Strategy**

### **Test Cases:**
1. **Timeline Display**: Artist/venue timelines show correct entries
2. **Data Consistency**: Age restrictions display uniformly
3. **Action Buttons**: Accept/decline buttons work correctly
4. **Expand/Collapse**: Row expansion works as expected
5. **Performance**: No conversion layer = faster loading

### **Test Commands:**
```bash
# Test timeline functionality
npm run dev
# Navigate to artist/venue profiles
# Verify timeline displays correctly

# Test data consistency
node scripts/verify-data-consistency.js

# Test performance
# Compare loading times before/after refactor
```

## 🚀 **Deployment Plan**

### **Production Deployment:**
1. **Backup Production Data**
   ```bash
   npm run backup:cloud
   ```

2. **Deploy in Maintenance Window**
   - Deploy new code
   - Run age restriction fix migration
   - Remove TourRequest table
   - Verify functionality

3. **Monitor and Rollback Plan**
   - Monitor error logs
   - Check timeline functionality
   - Ready to rollback if issues arise

## 📊 **Success Metrics**

- ✅ Timeline displays correctly for all users
- ✅ No age restriction format inconsistencies
- ✅ Reduced code complexity (remove ~200 lines of conversion logic)
- ✅ Improved performance (no conversion layer)
- ✅ Unified data model (single source of truth)

## 🎯 **Next Steps**

1. **Execute Phase 1** (Data consistency fix) - **IMMEDIATE**
2. **Create new components** (Phase 2) - **Next 1-2 days**
3. **Test thoroughly** - **Before production deployment**
4. **Deploy with backup plan** - **When confident**

---

**This refactor will significantly improve the platform's architecture and resolve the data mixing issues. The foundation is solid and ready for implementation!** 