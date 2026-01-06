# 📋 DIY Shows Booking Flow Documentation
## Complete Reference for Agent-Based Calendar Replacement

**Purpose**: Document the booking workflow that the complex itinerary implemented, so the new agent + calendar system can replicate all functionality in a simpler way.

---

## 🎯 Core Concept: The Booking Lifecycle

Every booking opportunity flows through these stages:

```
INITIATION → COMPETITION → NEGOTIATION → CONFIRMATION → SHOW DAY
```

---

## 📊 Two-Way Booking Initiation

### Path A: Artist-Initiated (Show Request)

```
Artist creates Show Request
"We want to play Boston on Aug 15"
         │
         ▼
Posted publicly for venues to bid
         │
         ├─── Venue A bids: $800 + door
         ├─── Venue B bids: $1200 guarantee
         └─── Venue C bids: $600 + 70/30
         │
         ▼
Artist reviews competing bids
         │
         ▼
Artist accepts one bid (others frozen/declined)
         │
         ▼
Venue confirms → SHOW CONFIRMED
```

### Path B: Venue-Initiated (Venue Offer)

```
Venue creates targeted offer to specific artist
"We want Lightning Bolt to play here on Sept 5"
         │
         ▼
Sent directly to artist
         │
         ▼
Artist reviews offer
         │
         ├─── Accept → SHOW CONFIRMED
         └─── Decline → Offer removed
```

---

## 🔒 Hold System (Mutual Agreement Required)

The hold system allows either party to "reserve" a date while deciding:

```
NORMAL STATE          REQUEST HOLD         HOLD ACTIVE           DECISION
┌────────────┐       ┌────────────┐       ┌────────────┐       ┌────────────┐
│  Bid Open  │──────▶│   PENDING  │──────▶│    HELD    │──────▶│  CONFIRMED │
│            │       │            │       │            │       │     or     │
│ Competing  │       │ Waiting    │       │ Competitors│       │  DECLINED  │
│ with others│       │ for other  │       │  FROZEN    │       │            │
└────────────┘       │ party      │       └────────────┘       └────────────┘
                     └────────────┘
                            │
                            └─── If declined: Returns to OPEN

Hold Details:
- Duration: Specified in days (e.g., "Hold for 7 days")
- Reason: "Waiting for tour confirmation", "Checking with band members", etc.
- Effect: ALL competing bids for that date become FROZEN
- Expiry: Auto-releases after duration if no decision made
```

---

## 📑 Status Definitions

### Show Request Statuses

| Status | Meaning | Artist Can | Venue Can |
|--------|---------|------------|-----------|
| **OPEN** | Accepting bids | Review bids, Accept/Decline | Submit bids |
| **PENDING** | Hold requested | Approve/Deny hold | Wait |
| **CONFIRMED** | Show booked | View show doc, Cancel | Manage show |
| **DECLINED** | Rejected | N/A | N/A |
| **CANCELLED** | Cancelled after booking | N/A | N/A |
| **EXPIRED** | Time limit passed | N/A | N/A |

### Bid Statuses

| Status | Meaning | Next Steps |
|--------|---------|------------|
| **PENDING** | Awaiting response | Artist can Accept/Decline |
| **ACCEPTED** | Artist chose this | Venue must Confirm |
| **HOLD** | Both agreed to hold | Decision within hold period |
| **FROZEN** | Blocked by competing hold | Wait for hold resolution |
| **CONFIRMED** | Venue confirmed | Show is live |
| **DECLINED** | Rejected | Removed from timeline |
| **WITHDRAWN** | Venue pulled bid | Removed from timeline |
| **CANCELLED** | Post-acceptance cancel | Notification sent |

### Hold States (Separate from Bid Status)

| Hold State | Meaning |
|------------|---------|
| **AVAILABLE** | Normal, can be acted on |
| **HELD** | This bid has an active hold |
| **FROZEN** | Blocked because another bid is held |
| **ACCEPTED_HELD** | Accepted but held for final confirmation |

---

## 📄 Show Document Structure

When a show is confirmed, a **Show Document** is created with these modules:

### 1. Venue Offer Module (Venue's Responsibility)
```
Financial Terms:
  - Guarantee: $800
  - Door Deal: 70/30 split after $500
  - Ticket Price: $15 advance / $20 door
  - Merchandise: 90/10 split

Performance Details:
  - Billing Position: Headliner / Support / Opener
  - Set Length: 45 minutes
  - Other Acts: "Local opener TBA"

Equipment Provided:
  - PA System: ✅
  - Drum Kit: ❌
  - Backline: ✅
  - Mics: ✅ (3 vocal, 2 instrument)
```

### 2. Artist Requirements Module (Artist's Responsibility)
```
Technical Requirements:
  - Need drum kit
  - Need 2 DI boxes
  - Bring own bass amp

Business Requirements:
  - Guarantee: $500 minimum
  - Need contract
  - Need day-of contact

Hospitality:
  - 4 meal buyouts
  - Case of beer
  - Dietary: 1 vegetarian

Travel & Logistics:
  - Driving
  - Need place to stay
  - Parking needed
```

### 3. Show Schedule Module (Both Parties)
```
Times:
  - Load In: 4:00 PM
  - Soundcheck: 5:00 PM
  - Doors: 7:00 PM
  - Show Time: 8:00 PM
  - Curfew: 11:00 PM

Notes:
  - Street parking available
  - Load in through back alley
```

### 4. Lineup Module (for Multi-Artist Shows)
```
Lineup:
  1. HEADLINER: Lightning Bolt ($800)
  2. SUPPORT: Melt-Banana ($400)
  3. LOCAL OPENER: The Worms ($100)
  
Total Payout: $1,300
```

### 5. Messaging Module
```
Thread of messages between artist and venue
- Coordination details
- Questions and answers
- Last-minute changes
```

---

## 👀 Perspective Differences

### Artist's Calendar View Should Show:

1. **Their Show Requests** (dates they're looking for shows)
   - With competing venue bids underneath
   - Accept/Decline buttons on bids

2. **Incoming Venue Offers** (venues that want them)
   - Accept/Decline buttons

3. **Confirmed Shows** (finalized bookings)
   - Link to show document
   - Venue contact info

4. **Holds** (dates they're considering)
   - Time remaining on hold
   - Frozen competing bids

### Venue's Calendar View Should Show:

1. **Their Outgoing Bids** (shows they bid on)
   - Status of each bid
   - Artist response status

2. **Their Outgoing Offers** (artists they invited)
   - Acceptance status

3. **Confirmed Shows at Their Venue**
   - Link to show document
   - Artist contact info

4. **Holds They've Granted**
   - Time remaining
   - Decision pending

---

## 🤖 Agent's Required Capabilities

To replace the itinerary, the agent needs these tools:

### Data Reading Tools
```
search_show_requests(artistId?, venueId?, status?, dateRange?)
search_bids(showRequestId?, venueId?, status?)
search_shows(artistId?, venueId?, status?, dateRange?)
search_venue_offers(artistId?, venueId?, status?)
get_calendar_for_date(entityId, date)
get_competing_bids(showRequestId)
```

### Data Writing Tools
```
create_show_request(artistId, title, dates, locations, details)
create_venue_bid(showRequestId, venueId, offer_details)
create_venue_offer(venueId, artistId, offer_details)

update_bid_status(bidId, newStatus, reason?)
update_show_request_status(requestId, newStatus)
update_show(showId, updates)

request_hold(bidId, duration, reason)
approve_hold(holdRequestId)
deny_hold(holdRequestId)
release_hold(holdRequestId)

cancel_show(showId, reason)
withdraw_bid(bidId, reason)
```

### Notification Tools
```
notify_competing_bidders(showRequestId, message)
notify_show_parties(showId, message)
send_message(conversationId, content)
```

---

## 📅 Calendar View Requirements

### Monthly Grid View
```
August 2025
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │     │     │  1  │  2  │
│     │     │     │     │     │     │  ●  │ ← Has activity
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  3  │  4  │  5  │  6  │  7  │  8  │  9  │
│     │     │  ★  │     │  ○  │     │     │
│     │     │ ^   │     │ ^   │     │     │
│     │confirmed  │     │hold │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Legend:
  ● = Activity (bids, inquiries, requests)
  ★ = Confirmed show
  ○ = Active hold
  ◐ = Pending (awaiting response)
```

### Date Detail View (Click on a date)
```
┌─────────────────────────────────────────────────────────────┐
│  📅 August 5, 2025 - Boston Area                            │
├─────────────────────────────────────────────────────────────┤
│  ★ CONFIRMED                                                │
│  Lightning Bolt at Lost Bag                                 │
│  $800 guarantee + 70% door                                  │
│  [View Show Document] [Message Venue]                       │
├─────────────────────────────────────────────────────────────┤
│  Other activity for this date:                              │
│  ┌────────────┬───────────┬─────────┬───────────────────┐   │
│  │ Venue      │ Offer     │ Status  │ Actions           │   │
│  ├────────────┼───────────┼─────────┼───────────────────┤   │
│  │ Sinclair   │ $1200 gua │ DECLINED│ -                 │   │
│  │ Great Scott│ $600+split│ DECLINED│ -                 │   │
│  └────────────┴───────────┴─────────┴───────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  💬 Chat with agent about this date...                      │
│  [Ask about changing venue] [Cancel show] [Add support act] │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Key Interactions the Agent Must Handle

### 1. Artist Looking for Shows
```
Artist: "I want to play Chicago in August"
Agent: "I can create a show request for you. What dates work?"
Artist: "August 10-15, anywhere in the Chicago area"
Agent: "Got it. What's your typical guarantee range?"
Artist: "$400-600 or 70% door deal"
Agent: *creates show request* 
       "Done! Your request is now visible to Chicago venues. 
        I'll notify you when bids come in."
```

### 2. Artist Reviewing Bids
```
Agent: "You have 3 new bids for your Chicago date:
        1. Empty Bottle - $500 + 60% door
        2. Subterranean - $400 flat
        3. Beat Kitchen - $350 + lodging
        
        Empty Bottle has the best financial terms. 
        Want me to show details or help you decide?"
        
Artist: "Accept Empty Bottle"
Agent: "Accepted! Empty Bottle now needs to confirm. 
        The other bids are frozen until they respond."
```

### 3. Venue Making an Offer
```
Venue: "I want to book Lightning Bolt on September 5"
Agent: "I'll create an offer to Lightning Bolt. What terms?
        - Your typical guarantee for touring bands is $500-800
        - Last 3 headliners got $600 average"
Venue: "$700 plus door deal"
Agent: *creates venue offer*
       "Sent! Lightning Bolt will see this in their calendar."
```

### 4. Managing Holds
```
Artist: "I want to hold the Empty Bottle bid while I check with my bandmates"
Agent: "How long do you need? (Holds typically last 3-7 days)"
Artist: "5 days"
Agent: *creates hold request*
       "Hold request sent to Empty Bottle. 
        If they approve, other bids will be frozen."
        
[Later]

Agent: "Empty Bottle approved your hold! 
        You have until August 10 to decide.
        Reminder: Subterranean and Beat Kitchen bids are now frozen."
```

### 5. Show Day Coordination
```
Artist: "What's the schedule for tonight?"
Agent: "Tonight at Lost Bag:
        - Load in: 5:00 PM (2 hours from now)
        - Soundcheck: 6:00 PM
        - Doors: 8:00 PM
        - You're on at 9:30 PM
        - Curfew: 11:00 PM
        
        Day-of contact: Mike (401-555-1234)
        Parking: Street parking on Elbow St"
```

---

## 📱 Mobile Experience Priorities

Since DIY musicians are often on the road:

1. **Quick Actions**
   - One-tap accept/decline on bids
   - Swipe to see next date
   
2. **At-a-Glance Status**
   - Color-coded calendar dots
   - Push notifications for bid activity
   
3. **Offline Access**
   - Cached show documents
   - Queue actions for when back online

4. **Voice-Friendly**
   - "Show me my August dates"
   - "What's my next confirmed show?"
   - "Accept the highest bid for Chicago"

---

## 🚫 What the Old Itinerary Got Wrong

These are the complexity traps we want to avoid:

1. **Multiple data models for same concept**
   - TourRequest, VenueOffer, ShowRequest, Show all representing "booking opportunity"
   - Solution: Agent abstracts this away, user just sees dates

2. **Complex nested UI**
   - Parent rows expanding to child rows with status badges
   - Solution: Calendar view with modal details

3. **Synthetic data conversions**
   - Converting VenueOffers to "synthetic ShowRequests" for display
   - Solution: Agent handles data mapping, UI stays simple

4. **571 lines of timeline processing**
   - Solution: Agent manages complexity, calendar just shows results

5. **Permission spaghetti**
   - 25+ props passed through components
   - Solution: Agent knows the user's role and shows appropriate actions

---

## ✅ Success Criteria for New System

The agent + calendar system works if:

1. [ ] Artist can see all their bookings on a calendar
2. [ ] Artist can create show requests via conversation
3. [ ] Artist can accept/decline bids via conversation
4. [ ] Venue can see all their activity on a calendar
5. [ ] Venue can make offers via conversation
6. [ ] Both can view show documents for confirmed shows
7. [ ] Hold system works via conversation
8. [ ] Notifications work for status changes
9. [ ] Mobile-friendly calendar view
10. [ ] Search/filter by date range, status, location

---

*This document captures the essential functionality of the booking system. The agent's job is to make all of this feel like a simple conversation + calendar, hiding the complexity from users.*


