# 📦 Archive V01 - Legacy Itinerary System

**Archived**: November 2024  
**Reason**: Replaced with agent-powered CalendarView in V02

## What's Here

This folder contains the original itinerary system that was too complex:

- `TabbedTourItinerary.tsx` - Main 400+ line component
- `TabbedTourItinerary/` - Imports and supporting files
- `TimelineItems/` - 18+ timeline row components

## Why Archived

The V01 itinerary had:
- 571+ lines of timeline processing
- 4 different data models (TourRequest, VenueOffer, ShowRequest, Show)
- Synthetic data conversions
- Complex nested parent-child UI
- Permission spaghetti with 25+ props

## V02 Replacement

The new system uses:
- `CalendarView.tsx` - Simple monthly calendar
- Agent chat for booking management  
- `BOOKING_FLOW_DOCUMENTATION.md` - Reference for all booking logic

## Do Not Delete

Keep this archive until the new calendar system is fully functional and tested.
The old code can be referenced if needed, but should not be re-imported.





