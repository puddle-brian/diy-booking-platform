# 🎵 **SHOW ITINERARY FOR DUMMIES**
## *The Complete Guide to Understanding DIY Show Booking*

**Version**: 1.0  
**Date**: January 2025  
**Purpose**: Understand the booking system architecture, terminology, and debugging context

---

## 🎯 **EXECUTIVE SUMMARY**

This platform is a **modern successor to "Book Your Own Fuckin' Life"** - the legendary DIY booking zine. It connects **142+ artists** with **207+ venues** for show booking. The itinerary system is the core interface where artists and venues manage their bookings.

**Key Insight**: The itinerary is **hierarchical** - it shows parent rows (show requests) that expand to reveal child rows (competing venue bids). This complexity is **essential** for the booking workflow.

---

## 🏗️ **THE BOOKING WORKFLOW**

### **Step 1: Initiation (Two Ways)**

```
ARTIST-INITIATED                    VENUE-INITIATED
┌─────────────────┐                ┌─────────────────┐
│ Artist creates  │                │ Venue creates   │
│ "Show Request"  │                │ "Venue Offer"   │
│                 │                │                 │
│ "We want to     │                │ "We want you    │
│ play in Boston  │                │ to play here    │
│ on Aug 15"      │                │ on Aug 15"      │
└─────────────────┘                └─────────────────┘
        │                                   │
        ▼                                   ▼
   Posted publicly                    Sent directly
   for venues to bid                  to specific artist
```

### **Step 2: Competition Phase**

**Multiple venues can bid on the same show request:**

```
SHOW REQUEST: "Lightning Bolt wants to play Boston, Aug 15"
├── 🏢 Lost Bag (Providence, RI) bids $800 + door deal
├── 🏢 The Sinclair (Cambridge, MA) bids $1200 guarantee  
├── 🏢 Great Scott (Allston, MA) bids $600 + 70/30 split
└── 🏢 Brighton Music Hall bids $1000 + lodging
```

### **Step 3: Artist Decision**

The artist can:
- **Accept** one bid → Venue must confirm, other bids may be frozen
- **Request hold** on one bid → Venue must approve hold request (status: PENDING)
- **Decline** bids → Removes them from consideration  
- **Ignore** → Bids remain open

### **🔒 Hold System** (Mutual Agreement Required)
- **Either party requests hold** → Other party sees PENDING hold request
- **Hold approved** → All competing bids frozen during hold period
- **Hold denied** → Bid returns to normal competition
- **Hold expires** → All bids return to active status

### **Step 4: Venue Confirmation**

When artist accepts a bid:
- **Venue can confirm** → Creates confirmed show
- **Venue can decline** → Bid returns to open status, artist can choose another

---

## 📊 **ITINERARY STRUCTURE EXPLAINED**

### **What You See: Row Types**

The itinerary displays different types of rows:

#### **1. Show Request Rows (Parent Rows)**
```
📅 Fri, Aug 15 | 🎸 Lightning Bolt | 📍 Boston, MA | 💰 $800-1200 | 🔓 Open | [🔽] 
```
- **Purpose**: Artist is looking for venues on this date
- **Status**: Open (accepting bids), Hold (considering options), Confirmed (show booked)
- **Expandable**: Click 🔽 to see competing venue bids

#### **2. Venue Bid Rows (Child Rows)**
```
                |                   | 🏢 Lost Bag     | 💰 $800 + door | ✅ Accepted | [📄][💬]
                |                   | 🏢 The Sinclair | 💰 $1200       | ⏳ Pending  | [📄][💬]
                |                   | 🏢 Great Scott  | 💰 $600 + 70/30| 🔒 Frozen   | [📄][💬]
```
- **Purpose**: Individual venue responses to the show request
- **Hierarchy**: Indented under parent show request
- **Actions**: View details, accept/decline, make counter-offers

#### **3. Confirmed Show Rows**
```
📅 Fri, Aug 15 | 🎸 Lightning Bolt | 🏢 Lost Bag | 💰 $800 + door | ✅ Confirmed | [📄][🎵]
```
- **Purpose**: Finalized bookings with confirmed venue
- **Status**: Always "Confirmed"
- **Actions**: View show document, manage lineup, cancel if needed

### **Visual Hierarchy Example**

```
TIMELINE VIEW (Artist Perspective)
┌─────────────────────────────────────────────────────────────────────────┐
│ 📅 Fri, Aug 15 | Lightning Bolt | Boston, MA | $800-1200 | Open    [🔽] │ ← PARENT ROW
├─────────────────────────────────────────────────────────────────────────┤
│                 |                | Lost Bag      | $800+door | Accept [📄] │ ← CHILD ROW  
│                 |                | The Sinclair  | $1200     | Pend   [📄] │ ← CHILD ROW
│                 |                | Great Scott   | $600+split| Pend   [📄] │ ← CHILD ROW
├─────────────────────────────────────────────────────────────────────────┤
│ 📅 Sat, Aug 16 | Lightning Bolt | Lost Bag    | $800+door | Confirmed [📄] │ ← CONFIRMED
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎭 **PERSPECTIVE DIFFERENCES**

### **Artist View vs Venue View**

The same data looks different depending on who's viewing:

#### **Artist Timeline (Lightning Bolt's view)**
- Shows **their** show requests with competing venue bids
- Focus: "Which venues want us?"
- Actions: Accept/decline bids, create new requests

#### **Venue Timeline (Lost Bag's view)**  
- Shows **their** bids on various artist requests
- Focus: "Which artists are we bidding on?"
- Actions: Make bids, confirm accepted shows

### **Example: Same Booking, Different Views**

**Artist sees:**
```
Show Request: "Lightning Bolt → Boston, Aug 15"
├── Lost Bag bid: $800 + door deal [ACCEPTED]
├── The Sinclair bid: $1200 guarantee [PENDING]
└── Great Scott bid: $600 + 70/30 split [PENDING]
```

**Lost Bag venue sees:**
```
Our Bid: "Lost Bag → Lightning Bolt, Aug 15"
Status: ACCEPTED by artist
Next step: [CONFIRM SHOW] or [DECLINE]
```

---

## 🔄 **STATUS WORKFLOW**

### **Show Request Statuses**

| Status | Meaning | Artist Actions | Venue Actions |
|--------|---------|----------------|---------------|
| **Open** | Accepting bids | Review bids, accept/decline | Submit bids |
| **Hold** | Hold request approved by both parties | Decide on held bid | Wait for decision |
| **Confirmed** | Show booked | Manage show details | Prepare for show |

### **Bid Statuses**

| Status | Meaning | What Happens Next |
|--------|---------|-------------------|
| **Pending** | Awaiting artist response | Artist can accept/decline |
| **Accepted** | Artist chose this bid | Venue must confirm or decline |
| **Hold** | Both parties agreed to hold | Other bids frozen until decision |
| **Frozen** | Blocked by another hold | Wait for hold to resolve |
| **Confirmed** | Venue confirmed acceptance | Show is finalized |
| **Declined** | Rejected by artist or venue | Bid removed from timeline |

---

## 🔧 **TECHNICAL ARCHITECTURE**

### **Database Models (Simplified)**

```typescript
ShowRequest {
  id: string
  artistId: string
  title: "Lightning Bolt Boston Tour"
  startDate: "2024-08-15"
  location: "Boston, MA"
  status: "OPEN" | "CONFIRMED" | "CANCELLED"
  initiatedBy: "ARTIST" | "VENUE"
}

VenueBid {
  id: string
  showRequestId: string  // Links to parent request
  venueId: string
  amount: 800
  doorDeal: { split: "70/30", minimum: 300 }
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  holdState: "AVAILABLE" | "HELD" | "FROZEN"
}

Show {
  id: string
  artistId: string
  venueId: string
  date: "2024-08-15"
  status: "CONFIRMED"
  // Created when venue confirms an accepted bid
}
```

### **Component Architecture**

```
TabbedTourItinerary (Main Component)
├── TimelineGroupRow (Parent rows - show requests)
│   └── ShowRequestProcessor (Handles request logic)
│       └── ShowRequestRow (Visual row component)
└── TimelineDetailRow (Child rows - venue bids)
    └── BidTimelineItem (Individual bid display)
        └── ExpandedBidsSection (When request is expanded)
```

### **Data Flow**

```
1. useConsolidatedTimelineData → Fetches all data
2. processTimelineEntries → Groups bids under requests  
3. TimelineGroupRow → Renders parent request rows
4. ExpandedBidsSection → Shows child bid rows when expanded
5. BidTimelineItem → Individual bid interactions
```

---

## 🐛 **DEBUGGING TERMINOLOGY**

### **Common Terms for Bug Reports**

| Term | Definition | Example |
|------|------------|---------|
| **Timeline Entry** | Any row in the itinerary | "The timeline entry for Aug 15 is missing" |
| **Parent Row** | Show request row | "Parent row shows wrong date" |
| **Child Row** | Venue bid row | "Child rows not expanding" |
| **Hierarchical Structure** | Parent-child relationship | "Hierarchy is broken - bids showing as parents" |
| **Expansion State** | Whether request is expanded | "Expansion state not persisting" |
| **Bid Competition** | Multiple venues bidding | "Bid competition not showing all venues" |
| **Status Mismatch** | UI vs database status differs | "Status mismatch - shows pending but DB says accepted" |
| **Synthetic Data** | Generated for display consistency | "Synthetic bid missing for venue offer" |

### **Critical Data Relationships**

```
Show Request (1) → Many Venue Bids (N)
    ├── Lost Bag Bid
    ├── Sinclair Bid  
    └── Great Scott Bid

Artist (1) → Many Show Requests (N)
Venue (1) → Many Venue Bids (N)
```

### **Key Debugging Points**

1. **Data Consistency**: Do bids link to correct show requests?
2. **Status Sync**: Do UI statuses match database statuses?
3. **Hierarchy Display**: Are child rows properly nested under parents?
4. **Permission Logic**: Can users see/edit what they should?
5. **Date Grouping**: Are same-date entries properly grouped?

---

## 🎯 **COMPLEXITY REQUIREMENTS**

### **Why This Can't Be "Simple"**

The itinerary **must** handle:

1. **Multiple Viewers**: Same data, different perspectives (artist vs venue)
2. **Hierarchical Relationships**: Requests with competing bids
3. **Real-time Status**: Bids change status as users interact
4. **Business Logic**: Complex rules around holds, freezing, confirmation
5. **Data Transformation**: 4 different database models → unified display

### **Essential Complexity vs Unnecessary Complexity**

✅ **Essential (Keep)**
- Parent-child row hierarchy
- Status-based styling and actions
- Permission-based display logic
- Real-time bid competition display

❌ **Unnecessary (Can Reduce)**
- Excessive prop drilling (25+ props)
- Duplicated component logic
- Over-abstracted state management
- Scattered type definitions (`any` everywhere)

---

## 🚀 **SUCCESS METRICS**

### **How to Know It's Working**

1. **Artist View**: Can see their requests with competing venue bids
2. **Venue View**: Can see their bids on various artist requests  
3. **Expansion**: Clicking request rows shows competing bids
4. **Actions**: Accept/decline buttons work and update statuses
5. **Real-time**: Changes appear immediately without page refresh

### **Common Working Scenarios**

```
✅ Lightning Bolt sees 14 timeline entries (9 requests + 7 shows)
✅ Lost Bag venue sees 39 timeline entries (36 show requests + 3 shows)  
✅ Expanding "Aug 15 request" shows 3 competing venue bids
✅ Accepting Lost Bag bid freezes Sinclair and Great Scott bids
✅ Lost Bag can confirm accepted bid to create confirmed show
```

---

## 📝 **QUICK REFERENCE**

### **For Debugging**

**Check These First:**
1. Timeline entry count matches expected (14 for artists, 39 for venues)
2. Parent rows are expandable (show 🔽 arrow)
3. Child rows are indented and non-expandable
4. Status badges match actual data states
5. Action buttons appear for correct user types

**Common Issues:**
- "Missing timeline entries" → Check data fetching hooks
- "Can't expand requests" → Check expansion state management  
- "Wrong status displayed" → Check status badge logic
- "Actions not working" → Check permission system
- "Duplicate entries" → Check data deduplication logic

### **For Feature Development**

**Key Files:**
- `TabbedTourItinerary.tsx` - Main component
- `ShowRequestProcessor.tsx` - Request logic
- `BidTimelineItem.tsx` - Bid display
- `useConsolidatedTimelineData.ts` - Data fetching
- `timelineUtils.ts` - Data processing

**Key Concepts:**
- Always preserve hierarchical structure
- Respect viewer permissions (artist vs venue)
- Maintain real-time status synchronization
- Handle both artist-initiated and venue-initiated bookings

---

*"The itinerary complexity exists to serve the user experience. Every parent-child relationship, every status transition, every permission check serves the real-world booking workflow that artists and venues depend on."* 