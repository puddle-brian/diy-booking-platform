# Hold System Testing Guide

## 🎯 Overview

The hold system allows artists to place temporary "holds" on venue bids, which freezes competing bids for the same date. This creates the **parent/child row pattern** in the timeline UI:

- **Parent Row**: Shows held venue with count `"Venue Name +3"` (purple background)
- **Child Rows**: Shows frozen competing venues (yellow background, no action buttons)

## 🛠️ Testing Tools

### 1. Admin Interface (`/admin/holds`)

**🔗 Access**: Go to `/admin` → "Manage Holds" button

**Features**:
- Create preset hold scenarios with one click
- View all active holds with details
- Release specific holds or clear all holds
- See exactly which bids are HELD vs FROZEN

### 2. Quick Command Line Scripts

```bash
# Create a quick hold scenario
node quick-hold-test.js

# Clear all holds (reset to normal state)
node clear-holds.js

# Check current hold states
node debug-current-state.js
```

## 🧪 Testing Workflow

### Step 1: Create Hold Scenario
```bash
# Option A: Use admin interface
Visit /admin/holds → Click "Create" on "Lightning Bolt Multi-City Hold"

# Option B: Use script
node quick-hold-test.js
```

### Step 2: View Timeline
```bash
# Visit Lightning Bolt's itinerary
Visit /artists/1748101913848

# Expected behavior:
✅ Parent row: "Venue Name +3" (purple background)
✅ Child rows: 3 frozen venues (yellow background)
✅ Frozen bids have ❄️ snowflake instead of action buttons
✅ Document access disabled for frozen bids
```

### Step 3: Test Interactions
- **Action Buttons**: Should be removed/disabled for frozen bids
- **Document Button**: Should be grayed out for frozen bids  
- **Hold State Display**: Purple for held, yellow for frozen
- **Status Badges**: Should show "On Hold" or "Frozen" appropriately

### Step 4: Reset for Next Test
```bash
# Option A: Use admin interface
Visit /admin/holds → Click "Clear All Holds"

# Option B: Use script
node clear-holds.js
```

## 🎨 Expected UI Behavior

### Timeline Parent Row (HELD bid)
```
💜 Purple background
🎯 "Venue Name +3" format
🔘 Normal action buttons still available
📄 Document access still works
```

### Timeline Child Rows (FROZEN bids)
```
💛 Yellow background (same as normal parent rows)
❄️ Snowflake icon instead of action buttons
🚫 Document access grayed out
📄 "Frozen by active hold" tooltip
```

### Action Button States
```javascript
// AVAILABLE bid (normal)
✅ Accept  ⏸ Hold  ✕ Decline

// HELD bid (active hold)  
✅ Accept  ✕ Decline  // No hold button

// FROZEN bid (locked by competing hold)
❄️ // Just snowflake, no buttons
```

## 🔍 Debugging Tips

### Check Current State
```bash
node debug-current-state.js
```

### Common Issues

**❌ "Parent rows not showing"**
- Make sure bid has `holdState: 'HELD'`
- Check timeline logic filters for `bid.holdState === 'HELD'`

**❌ "Action buttons still showing on frozen bids"**
- Verify `bid.holdState === 'FROZEN'`
- Check `BidActionButtons` component logic

**❌ "Wrong timeline grouping"**
- Ensure `frozenByHoldId` matches for related bids
- Check that held/frozen bids share same `showRequestId`

### Database Queries for Manual Checking
```sql
-- Check hold states
SELECT id, venue_id, hold_state, frozen_by_hold_id, status 
FROM bids 
WHERE tour_request_id = 'TOUR_REQUEST_ID';

-- Check active holds
SELECT id, show_request_id, status, reason, expires_at
FROM hold_requests 
WHERE status = 'ACTIVE';
```

## 📊 Test Scenarios

### Scenario 1: Basic Hold Creation
1. Lightning Bolt has 5+ bids on a tour request
2. Create hold on first bid → becomes HELD
3. Next 3 bids → become FROZEN
4. Timeline shows "Venue +3" parent with 3 child rows

### Scenario 2: Hold Release
1. Start with active hold scenario
2. Release hold via admin interface
3. All bids return to AVAILABLE state
4. Timeline returns to normal individual rows

### Scenario 3: Multiple Artists
1. Create holds for multiple artists
2. Verify each artist's timeline shows their holds correctly
3. Verify holds don't interfere between artists

### Scenario 4: Edge Cases
1. Hold with only 1 competing bid → "Venue +1"
2. Hold with no competing bids → Just held bid, no children
3. All bids already accepted → Hold should fail gracefully

## 🔧 Customization

### Add New Preset Scenarios
Edit `/src/app/admin/holds/page.tsx`:

```javascript
const PRESET_SCENARIOS = [
  {
    name: "Your Custom Scenario",
    description: "Description of what this tests",
    artistId: "ARTIST_ID",
    artistName: "Artist Name", 
    holdReason: "Why this hold exists",
    holdDuration: 24 // hours
  }
];
```

### Modify Hold Duration
Default is 48 hours. Change in:
- Admin interface presets
- Quick test script
- API endpoints

## 🚀 Pro Tips

1. **Always backup before testing**: Use `/admin` backup tools
2. **Test mobile view**: Hold UI should work on mobile devices
3. **Test with real dates**: Ensure holds don't expire during testing
4. **Check permissions**: Different users should see appropriate hold states
5. **Verify notifications**: If implemented, test hold notification emails

---

**🎯 Quick Start**: Run `node quick-hold-test.js` then visit `/artists/1748101913848` to see holds in action! 