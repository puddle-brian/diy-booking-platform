# Industry-Standard Hold System

## Overview

The booking platform now implements proper industry-standard hold practices that reflect how the music industry actually works. This system ensures fair, transparent, and professional booking processes.

## How It Works

### 1. Venue Requests Hold
- **Venue initiates**: Venues request to hold a date (not artists placing holds)
- **First-come-first-served**: Priority is automatically assigned based on request order
- **Optional message**: Venues can include a message with their hold request

### 2. Artist Grants/Declines Hold
- **Artist controls**: Artists decide whether to grant or decline hold requests
- **Automatic priority**: System assigns 1st, 2nd, or 3rd hold based on order
- **Hold duration**: 
  - 1st hold: 7 days to decide
  - 2nd/3rd hold: 5 days to decide

### 3. Automatic Promotion
- **When holds are declined**: Lower priority holds automatically move up
- **Seamless process**: No manual intervention needed
- **Fair system**: Ensures all venues get proper consideration

## API Actions

### Venue Actions
- `request_hold` - Request to hold a date
- `cancel` - Cancel their bid entirely

### Artist Actions  
- `grant_hold` - Grant hold to venue (auto-assigns priority)
- `decline_hold` - Decline hold request
- `confirm` - Accept bid as confirmed booking
- `decline` - Decline bid entirely

## Hold States

### For Venues
1. **Pending** - Bid submitted, no hold requested
2. **Hold Requested** - Venue requested hold, waiting for artist
3. **1st/2nd/3rd Hold** - Artist granted hold with priority
4. **Confirmed** - Artist accepted the booking

### For Artists
1. **New Hold Request** - Venue wants to hold date
2. **Active Holds** - Holds granted with expiration dates
3. **Confirmed Booking** - Date is locked in

## Benefits

### Industry Accuracy
- Reflects real-world booking practices
- Venues control their own hold requests
- Artists maintain final booking authority

### Fairness
- First-come-first-served priority
- Automatic promotion prevents gaming
- Clear expiration dates

### Transparency
- All parties see hold status
- Clear priority rankings
- Automatic notifications

## Example Workflow

1. **Lightning Bolt** posts tour request for Seattle show
2. **Lost Bag** submits bid and requests hold
3. **The Underground** submits bid and requests hold (gets 2nd priority)
4. **Lightning Bolt** grants both holds:
   - Lost Bag gets 1st hold (7 days to confirm)
   - The Underground gets 2nd hold (5 days after Lost Bag decides)
5. If Lost Bag declines, The Underground automatically promotes to 1st hold
6. **Lightning Bolt** can accept any hold as confirmed booking

## Technical Implementation

### Database Fields
```typescript
// Hold Request (venue-initiated)
holdRequested?: boolean;
holdRequestedAt?: string;
holdRequestMessage?: string;

// Hold Assignment (system/artist-controlled)  
holdPosition?: 'first' | 'second' | 'third';
holdGrantedAt?: string;
holdExpiresAt?: string;
holdNotes?: string;

// Hold Promotion (automatic)
promotedFrom?: 'second' | 'third';
promotedAt?: string;
```

### API Endpoints
- `PUT /api/tour-requests/[id]/bids/[bidId]` - Handle all hold actions
- Automatic promotion logic built into decline/cancel actions
- Real-time status updates for all parties

This system ensures professional, industry-standard booking practices while maintaining fairness and transparency for all parties involved. 