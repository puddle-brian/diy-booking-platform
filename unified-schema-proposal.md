# Unified ShowRequest Schema Proposal

## Problem
Currently we have two separate models for the same concept:
- `TourRequest` (artist-initiated requests)
- `VenueOffer` (venue-initiated requests)

This creates:
- Duplicate rows in itinerary (multiple offers for same date)
- Complex synthetic conversion logic  
- Two separate API endpoints
- Unnecessary code complexity

## Solution: Single ShowRequest Model

```prisma
model ShowRequest {
  id              String      @id @default(cuid())
  
  // WHO: Core entities (one or both present)
  artistId        String
  venueId         String?     // null = open to any venue
  
  // WHAT: Request details
  title           String
  description     String?
  requestedDate   DateTime    // Single date (no more ranges)
  
  // WHO INITIATED: Request source
  initiatedBy     RequestInitiator  // 'ARTIST' | 'VENUE'
  createdById     String
  
  // STATUS: Unified workflow  
  status          ShowRequestStatus @default(OPEN)
  
  // FINANCIAL TERMS (from VenueOffer)
  amount          Float?      // Guarantee amount
  doorDeal        Json?       // Door split terms
  ticketPrice     Json?       // Advance/door pricing
  merchandiseSplit String?    // e.g., "90/10"
  
  // SHOW DETAILS (from VenueOffer)
  billingPosition String?     // headliner, support, opener
  lineupPosition  Int?        // 1 = headliner, 2 = support, etc.
  setLength       Int?        // Minutes
  otherActs       String?     // Other acts on the bill
  billingNotes    String?     // Additional billing context
  
  // VENUE DETAILS (from VenueOffer)
  capacity        Int?
  ageRestriction  String?
  
  // EQUIPMENT & LOGISTICS (from VenueOffer)
  equipmentProvided Json?     // PA, mics, drums, etc.
  loadIn          String?
  soundcheck      String?
  doorsOpen       String?
  showTime        String?
  curfew          String?
  
  // ADDITIONAL VALUE (from VenueOffer)
  promotion       Json?       // Social, flyers, radio, etc.
  lodging         Json?       // Floor space, couch, private room
  additionalTerms String?
  message         String?     // Personal pitch
  
  // TOUR CONTEXT (from TourRequest)
  targetLocations String[]    // For artist-initiated requests
  genres          String[]    // For filtering
  
  // EXPIRATION
  expiresAt       DateTime?   // Auto-expire requests
  
  // SYSTEM FIELDS
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // RELATIONS
  artist          Artist      @relation(fields: [artistId], references: [id])
  venue           Venue?      @relation(fields: [venueId], references: [id])
  createdBy       User        @relation(fields: [createdById], references: [id])
  bids            ShowRequestBid[] // Rename from Bid to ShowRequestBid
  
  // PREVENT DUPLICATES: Same venue can't make multiple offers to same artist on same date
  @@unique([artistId, venueId, requestedDate], name: "unique_artist_venue_date")
  
  @@index([artistId])
  @@index([venueId])  
  @@index([requestedDate])
  @@index([status])
  @@index([initiatedBy])
  @@index([createdAt])
  @@map("show_requests")
}

// Rename Bid to ShowRequestBid for clarity
model ShowRequestBid {
  id               String           @id @default(cuid())
  showRequestId    String
  venueId          String
  bidderId         String
  proposedDate     DateTime?
  message          String?
  amount           Float?
  status           BidStatus        @default(PENDING)
  
  // ... all existing bid fields ...
  
  showRequest      ShowRequest      @relation(fields: [showRequestId], references: [id])
  venue            Venue            @relation(fields: [venueId], references: [id])
  bidder           User             @relation(fields: [bidderId], references: [id])
  
  @@index([showRequestId])
  @@index([venueId])
  @@index([status])
  @@map("show_request_bids")
}

enum RequestInitiator {
  ARTIST
  VENUE
}

enum ShowRequestStatus {
  OPEN        // Artist-initiated, accepting bids
  PENDING     // Venue-initiated, awaiting artist response
  CONFIRMED   // Accepted, becomes a Show
  DECLINED    // Artist declined venue offer
  CANCELLED   // Cancelled by creator
  EXPIRED     // Expired without response
}
```

## Usage Patterns

### Artist-Initiated Request
```typescript
// Artist posts: "Looking for shows June 15th"
{
  artistId: "lightning-bolt-id",
  venueId: null,  // ✅ Open to any venue
  requestedDate: "2025-06-15",
  initiatedBy: "ARTIST",
  status: "OPEN"
}
// Venues bid on this request
```

### Venue-Initiated Request  
```typescript
// Venue posts: "Want Lightning Bolt for June 15th"
{
  artistId: "lightning-bolt-id", 
  venueId: "lost-bag-id",  // ✅ Specific venue
  requestedDate: "2025-06-15",
  initiatedBy: "VENUE", 
  status: "PENDING"
}
// No bidding - direct artist response
```

## Benefits

### 1. ✅ Solves Duplicate Row Issue
- **One row per artist+date combination**
- Multiple venue offers become "bids" under single row
- Natural deduplication via unique constraint

### 2. ✅ Unified API
```typescript
// Single endpoint replaces both:
// /api/tour-requests + /api/venues/[id]/offers
GET /api/show-requests
POST /api/show-requests  
PUT /api/show-requests/[id]
```

### 3. ✅ Simplified UI Logic
- No more synthetic conversion
- Same component handles both flows
- Consistent status management

### 4. ✅ Prevents Duplicates at Database Level
```sql
-- Constraint prevents: Same venue making multiple offers to same artist on same date
UNIQUE(artistId, venueId, requestedDate)
```

### 5. ✅ Cleaner Codebase
- Single model instead of two
- Unified types and interfaces  
- Less complex conversion logic

## Migration Strategy

1. **Create new ShowRequest table**
2. **Migrate existing data:**
   - TourRequest → ShowRequest (venueId = null, initiatedBy = ARTIST)
   - VenueOffer → ShowRequest (venueId populated, initiatedBy = VENUE)  
3. **Update API endpoints**
4. **Update UI components**
5. **Remove old tables**

This unification eliminates the core complexity while solving your duplicate row issue naturally! 