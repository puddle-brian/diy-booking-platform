# 🎵 Lineup Architecture Refactor Plan

## 🎯 **Problem Statement**
The current system models individual artist performances as separate "shows" when real concerts are venue events with multiple artists. This creates:
- Multiple Show records for what should be one event
- Complex workarounds for lineup display
- Cognitive mismatch with real-world booking
- Difficulty understanding the codebase

## 🚀 **Solution: Show as Venue Event Container**

### **Current Broken Model:**
```
Show (artist-owned) → Single artist per show → Multiple shows on same date
```

### **New Correct Model:**
```
Show (venue-owned) → Multiple artists via ShowLineup → Single show per date/venue
```

---

## 📊 **Database Schema Changes**

### **1. New Show Model (Venue-Owned)**
```sql
model Show {
  id             String          @id @default(cuid())
  title          String          -- "Punk Night at The Basement"
  date           DateTime
  venueId        String          -- Show belongs to venue
  description    String?
  ticketPrice    Float?
  ageRestriction AgeRestriction?
  status         ShowStatus      @default(DRAFT)
  createdById    String
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  
  -- Show-level details (not artist-specific)
  capacity       Int?            -- Max capacity for this show
  curfew         String?         -- Hard stop time
  doorDeal       Json?           -- Door split arrangements
  doorsOpen      String?         -- Door time
  loadIn         String?         -- Load-in time
  notes          String?         -- Show-level notes
  showTime       String?         -- Start time
  soundcheck     String?         -- Soundcheck time
  
  -- Remove single artistId - replaced by lineup
  venue          Venue           @relation(fields: [venueId], references: [id])
  createdBy      User            @relation(fields: [createdById], references: [id])
  lineup         ShowLineup[]    -- NEW: Many-to-many with artists
  holdRequests   HoldRequest[]   -- Keep existing hold system
  
  @@index([venueId])
  @@index([date])
  @@index([status])
  @@index([createdAt])
  @@unique([venueId, date]) -- One show per venue per date
}
```

### **2. New ShowLineup Junction Table**
```sql
model ShowLineup {
  id              String         @id @default(cuid())
  showId          String
  artistId        String
  billingPosition BillingPosition
  setLength       Int?           -- Minutes for this artist's set
  guarantee       Float?         -- Payment for this artist
  status          LineupStatus   @default(PENDING)
  performanceOrder Int?          -- Order in lineup (1, 2, 3...)
  notes           String?        -- Artist-specific notes
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  show            Show           @relation(fields: [showId], references: [id], onDelete: Cascade)
  artist          Artist         @relation(fields: [artistId], references: [id])
  
  @@unique([showId, artistId]) -- Artist can only be in lineup once
  @@index([showId])
  @@index([artistId])
  @@index([billingPosition])
}
```

### **3. New Enums**
```sql
enum BillingPosition {
  HEADLINER
  CO_HEADLINER  
  SUPPORT
  OPENER
  LOCAL_SUPPORT
}

enum LineupStatus {
  PENDING       -- Invited but not confirmed
  CONFIRMED     -- Artist confirmed their slot
  CANCELLED     -- Artist cancelled
  COMPLETED     -- Performance finished
}
```

---

## 🔄 **Migration Strategy**

### **Phase 1: Add New Models (Non-Breaking)**
1. Add `ShowLineup` table
2. Add new enums
3. Keep existing `Show` model temporarily

### **Phase 2: Update Show Model**
1. Remove `artistId` from Show
2. Remove artist-specific fields from Show
3. Add `lineup` relation

### **Phase 3: Data Migration** 
1. Create ShowLineup entries for existing shows
2. Update Show records to be venue-owned
3. Clean up duplicate shows on same venue+date

### **Phase 4: API & Frontend Updates**
1. Update show creation/querying logic
2. Rebuild timeline components for lineup display
3. Update test data generation

---

## 🛠️ **Implementation Steps**

### **Step 1: Schema Migration**
- Create new migration file
- Add ShowLineup table and enums
- Modify Show model

### **Step 2: Data Migration Script**
- Convert existing single-artist shows to lineup format
- Merge duplicate shows on same venue+date
- Preserve all existing data

### **Step 3: API Updates**
- Modify show CRUD operations
- Update show querying to include lineup
- Fix timeline data fetching

### **Step 4: Frontend Refactor**
- Update ShowTimelineItem for native lineup display
- Remove workarounds and synthetic lineup logic
- Build lineup management UI

### **Step 5: Test Data Overhaul**
- Generate realistic multi-artist shows
- Create proper lineup scenarios
- Test venue curation workflows

---

## 🎯 **Benefits After Refactor**

### **Simplified Data Model**
- One show per venue per date
- Clear artist roles via billingPosition
- No more synthetic lineup parsing

### **Intuitive UI**
- Shows display as complete lineups
- Venues manage entire events
- Artists see their role in each show

### **Better Performance**
- Fewer database queries
- No complex aggregation logic
- Cleaner data relationships

### **Easier Development**
- Code matches real-world domain
- No more architectural workarounds
- Feature development becomes straightforward

---

## 📋 **Todo Checklist**

- [ ] Create database migration
- [ ] Write data migration script
- [ ] Update Prisma schema
- [ ] Modify API endpoints
- [ ] Refactor timeline components
- [ ] Update test data generation
- [ ] Test venue lineup management
- [ ] Test artist perspective
- [ ] Verify hold system compatibility
- [ ] Update documentation

---

## 🚨 **Risk Mitigation**

### **Data Safety**
- Full backup before migration
- Rollback plan prepared
- Test migration on copy first

### **Feature Compatibility**
- Hold system should work with new model
- Venue offers can target show lineups
- Messaging system remains intact

### **Testing Strategy**
- Create comprehensive test scenarios
- Verify all user workflows
- Check timeline display accuracy

---

This refactor will transform the platform from fighting against the domain model to working naturally with how live music actually operates. 