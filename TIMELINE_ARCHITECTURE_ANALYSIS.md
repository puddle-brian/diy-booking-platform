# Timeline Architecture Analysis

## Current System Overview

### **Data Models**
- `Show` - Confirmed bookings with venues
- `TourRequest` - Artist requests for shows (being phased out)
- `ShowRequest` - New unified request model
- `VenueBid` - Venue responses to requests
- `VenueOffer` - Venue-initiated offers

### **Timeline Rendering Systems**

#### **System 1: Confirmed Shows**
- **Component**: `ShowTimelineItem`
- **Data Source**: `shows` array
- **Expansion**: Shows lineup details, support acts
- **State**: `expandedShows` Set

#### **System 2: Open Requests**  
- **Component**: Inline table rows in `TabbedTourItinerary.tsx`
- **Data Source**: `tourRequests` array
- **Expansion**: Shows venue bids table
- **State**: `expandedRequests` Set

### **The Problem**
Two completely different rendering systems for what should be the same UI pattern:
1. **Different components** (ShowTimelineItem vs inline rows)
2. **Different state management** (expandedShows vs expandedRequests)
3. **Different expansion content** (lineup vs bids)
4. **Different styling systems**
5. **Different data handling logic**

### **Current File Sizes**
- `TabbedTourItinerary.tsx`: **2,359 lines** (MASSIVE)
- `ShowTimelineItem.tsx`: ~300 lines
- `BidTimelineItem.tsx`: ~200 lines

### **Key Complexity Sources**
1. **Inline rendering logic** - 400+ lines of conditional JSX in TabbedTourItinerary
2. **Mixed concerns** - Data fetching + rendering + business logic in one file
3. **Complex bid filtering** - Different logic for venue-initiated vs artist-initiated
4. **State interdependencies** - Multiple expansion states that interact

## **Root Cause Analysis**

### **Why Refactoring Keeps Failing**
1. **No separation of concerns** - Everything is tangled together
2. **Too many responsibilities** - Single component doing 10+ different things
3. **Complex state management** - Multiple interdependent state systems
4. **Inline business logic** - Complex filtering/grouping mixed with rendering

### **What Needs to Happen**
1. **Extract business logic** from rendering components
2. **Separate data fetching** from presentation
3. **Standardize state management** across timeline systems
4. **Create focused, single-responsibility components**

## **Success Metrics**
- No single component over 500 lines
- Clear separation between data/logic/presentation
- Consistent state management patterns
- Unified timeline rendering (eventual goal)

## **Next Steps**
1. **Phase 1**: Extract business logic from TabbedTourItinerary
2. **Phase 2**: Create focused timeline components
3. **Phase 3**: Standardize data interfaces
4. **Phase 4**: Unify rendering systems 