# Living Show Document - Modular Booking System

## 🎯 Vision

The **Living Show Document** is a revolutionary approach to music booking that creates a single, dynamic document for each potential show. It combines all the modular components (venue offers, artist requirements, show schedules) into one place with smart state management.

## 🚀 Core Concept

Instead of scattered emails and forms, every show gets a **living document** that:

1. **Contains all modular components** from existing templates and forms
2. **Shows ownership** (artist-owned vs venue-owned sections)
3. **Tracks commitment states** (draft → proposed → committed → locked)
4. **Evolves through the booking workflow** from initial request to confirmed show
5. **Becomes the single source of truth** for all show details

## 📊 Three-Module Structure

### 1. 🏢 **Venue Offer & Terms**
- **Owner:** Venue
- **Contains:** Financial terms, venue details, equipment provided, promotion commitments
- **States:** 
  - `draft` - Venue hasn't made offer yet
  - `proposed` - Venue has submitted terms
  - `committed` - Artist accepted terms

### 2. 🎸 **Artist Requirements**
- **Owner:** Artist  
- **Contains:** Technical rider, hospitality needs, equipment requirements, set details
- **States:**
  - `draft` - Artist hasn't finalized requirements
  - `proposed` - Artist has submitted requirements
  - `committed` - Venue accepted requirements

### 3. ⏰ **Show Schedule**
- **Owner:** Shared (both parties contribute)
- **Contains:** Load-in, soundcheck, doors, set times, curfew
- **States:**
  - `draft` - No schedule set
  - `proposed` - One party proposed times
  - `committed` - Both parties agreed on schedule

## 🔄 Workflow States

### **Tour Request Stage**
```
Venue Offer: [Waiting for offers] (draft)
Artist Requirements: [Filled from template] (proposed)  
Show Schedule: [To be determined] (draft)
```

### **Venue Bid Stage**
```
Venue Offer: [Venue's proposal] (proposed)
Artist Requirements: [From tour request] (proposed)
Show Schedule: [Venue's suggested times] (proposed)
```

### **Accepted Bid Stage**
```
Venue Offer: [Accepted terms] (committed)
Artist Requirements: [Confirmed needs] (committed)
Show Schedule: [Needs finalization] (proposed)
```

### **Confirmed Show Stage**
```
Venue Offer: [Locked financial terms] (locked)
Artist Requirements: [Locked rider] (locked)
Show Schedule: [Final schedule] (locked)
```

## 🛠 Current Implementation

### ✅ **Completed**
1. **ShowDocumentModal Component** (`src/components/ShowDocumentModal.tsx`)
   - 3-module structure
   - State-aware section headers
   - Data extraction from shows, bids, and tour requests
   - Modal integration with TabbedTourItinerary

2. **Integration Points**
   - Document icons in tour request, bid, and show rows
   - Proper viewer type detection for venue users on artist pages
   - Clean "Make Offer" UX language

3. **Data Flow**
   - Extracts venue offer data from VenueBid objects
   - Extracts artist requirements from TourRequest objects
   - Shows proper empty states for missing sections

### 🚧 **Next Baby Steps**

#### **Phase 1: Edit Functionality**
- Make section "Edit" buttons functional
- Allow inline editing of unlocked sections
- Save changes back to database

#### **Phase 2: State Transitions**
- "Commit" buttons to lock in agreements
- State progression workflow
- Notification system for state changes

#### **Phase 3: Template Integration**
- Pull artist requirements from actual template modules
- Use TemplateFormRenderer for editing
- Connect to existing technical/hospitality components

#### **Phase 4: Schedule Management**
- Collaborative schedule building
- Time conflict detection
- Timeline visualization

## 📁 File Structure

```
src/components/
├── ShowDocumentModal.tsx          # Main living document modal
├── TabbedTourItinerary.tsx        # Integration point
├── TemplateFormRenderer.tsx       # Template modules (existing)
├── TechnicalRequirementsTable.tsx # Technical specs (existing)
└── HospitalityRiderTable.tsx      # Hospitality rider (existing)

src/components/profile/
└── ProfileLayout.tsx              # Viewer type handling
```

## 🎮 User Experience Flow

### **Artist Creates Tour Request**
1. Fills out template-driven form
2. Creates tour request with requirements
3. Document shows: Artist Requirements (filled) + empty venue/schedule sections

### **Venue Views Tour Request**
1. Sees "Make Offer" button (improved UX language)
2. Clicks to open VenueBidForm
3. Submits bid with venue terms

### **Artist Reviews Bids**
1. Sees document icon next to each bid
2. Opens living document showing:
   - Venue's proposed terms
   - Artist's requirements 
   - Draft schedule
3. Can accept/decline/hold bids

### **Show Confirmation**
1. Document becomes canonical source
2. Locked sections prevent changes
3. Final details accessible to both parties

## 🔮 Future Vision

The Living Show Document will eventually become:

- **Industry Standard:** Replace email chains and scattered docs
- **Legal Framework:** Binding agreements with digital signatures
- **Integration Hub:** Connect to calendars, payment systems, promotion tools
- **Analytics Platform:** Track booking metrics and relationship health
- **Collaboration Tool:** Real-time editing and communication

## 🎯 Success Metrics

- **Reduced booking time** from weeks to days
- **Fewer missed details** through structured templates
- **Better relationships** via transparent process
- **Professional image** for DIY venues and artists
- **Scalable workflow** that grows with user needs

---

*This document evolves as we build. Last updated: Current session* 