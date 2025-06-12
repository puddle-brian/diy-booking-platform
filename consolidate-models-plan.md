# Model Consolidation Plan: TourRequest → ShowRequest

## 🎯 Goal: Eliminate Model Confusion & Fix Hold System

**Current Issue**: Two parallel models causing foreign key failures and confusion
**Solution**: Migrate everything to the unified `ShowRequest` model

## 📊 Current State Analysis

### Data Distribution:
- **TourRequest records**: 3
- **ShowRequest records**: 7  
- **Bid records**: 22 (references TourRequest)
- **ShowRequestBid records**: 22 (references ShowRequest)
- **HoldRequest**: Expects ShowRequest, failing on TourRequest

### UI Usage:
- **artist pages** → `/api/tour-requests` (OLD)
- **itinerary timeline** → `/api/show-requests` (NEW) ✅
- **bidding system** → `/api/show-requests` (NEW) ✅
- **hold system** → `ShowRequest` only (NEW) ✅

**Migration Target**: Move artist pages to ShowRequest, eliminate TourRequest

---

## 🚀 Migration Steps

### Phase 1: Data Migration (Safe)
1. **Backup**: Create full backup before starting
2. **Migrate Data**: Convert remaining TourRequest → ShowRequest
3. **Migrate Bids**: Convert remaining Bid → ShowRequestBid
4. **Verify**: Ensure all data is preserved

### Phase 2: API Consolidation 
5. **Update Artist Pages**: Change `/api/tour-requests` → `/api/show-requests`
6. **Update Tour Browsing**: Venues use ShowRequest for tour discovery
7. **Test**: Verify all existing functionality works

### Phase 3: Schema Cleanup
8. **Remove Old Models**: Drop TourRequest and Bid tables
9. **Update Hold System**: Fix foreign key issues
10. **Test Holds**: Verify hold creation/testing works

### Phase 4: Testing & Verification
11. **Full System Test**: All features working
12. **Hold System Test**: Create/release holds successfully
13. **Timeline Test**: Parent/child rows display correctly

---

## 🔧 Technical Implementation

### Step 1: Data Migration Script
```javascript
// migrate-tourrequest-data.js
async function migrateTourRequestData() {
  // For each TourRequest:
  // 1. Create corresponding ShowRequest
  // 2. Migrate all associated Bids to ShowRequestBids
  // 3. Update any references
}
```

### Step 2: API Route Updates
```javascript
// Update these files:
- src/app/artists/[id]/page.tsx (line 188)
- src/app/page.tsx (line 238)  
- src/components/VenueBidding.tsx (line 68)
- src/components/VenueBidForm.tsx (line 77)
```

### Step 3: Schema Migration
```sql
-- After data migration, safely drop old tables:
DROP TABLE "bids";
DROP TABLE "tour_requests"; 
-- HoldRequest will now work with ShowRequest foreign keys
```

---

## ⚠️ Risk Assessment

### Low Risk:
- ✅ **Data migration**: Both models have same core data
- ✅ **API changes**: Straightforward endpoint swaps
- ✅ **Backup available**: Can restore if issues

### Medium Risk:
- ⚡ **UI compatibility**: Need to test all user flows
- ⚡ **Hold system**: Complex logic to verify

### High Risk:
- 🚨 **Schema changes**: Irreversible table drops
- 🚨 **Production data**: Live user data at stake

### Mitigation:
1. **Thorough backup** before starting
2. **Step-by-step execution** with verification
3. **Test environment** parallel testing
4. **Rollback plan** if any step fails

---

## 🎉 Benefits After Migration

### For Users:
- ✅ **Hold system works** - can create/test holds
- ✅ **Consistent UX** - single model, single behavior
- ✅ **Better performance** - no duplicate data

### For Developers:
- ✅ **Simpler codebase** - one model to maintain
- ✅ **Easier debugging** - clear data relationships  
- ✅ **Future features** - build on solid foundation

### For Hold System:
- ✅ **Foreign keys work** - no constraint violations
- ✅ **Testing possible** - scripts can create holds
- ✅ **UX improvements** - can focus on polish

---

## 🏁 Success Criteria

1. **✅ Hold creation works** - `node quick-hold-test.js` succeeds
2. **✅ Timeline displays correctly** - parent/child rows for holds
3. **✅ All APIs work** - artist pages, venue browsing, bidding
4. **✅ Data integrity** - no lost information
5. **✅ Performance maintained** - no slowdowns

**Timeline**: 2-3 hours for careful execution
**Complexity**: Medium (architectural, but straightforward)
**Impact**: High (fixes fundamental system issue) 