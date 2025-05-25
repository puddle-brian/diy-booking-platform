import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // First, restore The Menzingers' tour requests that were deleted
    const tourRequestsPath = path.join(dataDir, 'tour-requests.json');
    const tourRequestsData = fs.readFileSync(tourRequestsPath, 'utf8');
    const tourRequests = JSON.parse(tourRequestsData);
    
    // Check if Menzingers tour requests exist
    const menzingersRequests = tourRequests.filter((req: any) => req.artistId === "2");
    
    // If missing, add them back
    const requiredMenzingersRequests = [
      {
        "id": "tour-req-004-sf",
        "artistId": "2",
        "artistName": "The Menzingers",
        "title": "San Francisco Show - May 2025",
        "description": "Seeking all-ages venues throughout California. Committed to inclusive shows and community building.",
        "startDate": "2025-05-15",
        "endDate": "2025-05-16",
        "location": "San Francisco, CA",
        "radius": 50,
        "flexibility": "exact-cities",
        "genres": ["indie rock", "punk", "alternative"],
        "expectedDraw": {
          "min": 200,
          "max": 300,
          "description": "Strong SF following, prefer 200-300 cap venues"
        },
        "tourStatus": "flexible-routing",
        "ageRestriction": "all-ages",
        "equipment": {
          "needsPA": true,
          "needsMics": true,
          "needsDrums": true,
          "needsAmps": true,
          "acoustic": false
        },
        "guaranteeRange": {
          "min": 800,
          "max": 1200
        },
        "acceptsDoorDeals": true,
        "merchandising": true,
        "travelMethod": "van",
        "lodging": "flexible",
        "status": "active",
        "priority": "medium",
        "responses": 2,
        "createdAt": "2024-02-10T16:45:00Z",
        "updatedAt": "2024-02-10T16:45:00Z",
        "expiresAt": "2025-12-05T00:00:00Z"
      },
      {
        "id": "tour-req-004-la",
        "artistId": "2",
        "artistName": "The Menzingers",
        "title": "Los Angeles Show - May 2025",
        "description": "Seeking all-ages venues throughout California. Committed to inclusive shows and community building.",
        "startDate": "2025-05-17",
        "endDate": "2025-05-18",
        "location": "Los Angeles, CA",
        "radius": 50,
        "flexibility": "exact-cities",
        "genres": ["indie rock", "punk", "alternative"],
        "expectedDraw": {
          "min": 250,
          "max": 400,
          "description": "Growing LA following, prefer 250-400 cap venues"
        },
        "tourStatus": "flexible-routing",
        "ageRestriction": "all-ages",
        "equipment": {
          "needsPA": true,
          "needsMics": true,
          "needsDrums": true,
          "needsAmps": true,
          "acoustic": false
        },
        "guaranteeRange": {
          "min": 1000,
          "max": 1500
        },
        "acceptsDoorDeals": true,
        "merchandising": true,
        "travelMethod": "van",
        "lodging": "flexible",
        "status": "active",
        "priority": "medium",
        "responses": 1,
        "createdAt": "2024-02-10T16:45:00Z",
        "updatedAt": "2024-02-10T16:45:00Z",
        "expiresAt": "2025-12-05T00:00:00Z"
      },
      {
        "id": "tour-req-004-sd",
        "artistId": "2",
        "artistName": "The Menzingers",
        "title": "San Diego Show - September 2025",
        "description": "Seeking all-ages venues throughout California. Committed to inclusive shows and community building.",
        "startDate": "2025-09-11",
        "endDate": "2025-09-12",
        "location": "San Diego, CA",
        "radius": 50,
        "flexibility": "exact-cities",
        "genres": ["indie rock", "punk", "alternative"],
        "expectedDraw": {
          "min": 150,
          "max": 250,
          "description": "Growing San Diego following, prefer 150-250 cap venues"
        },
        "tourStatus": "flexible-routing",
        "ageRestriction": "all-ages",
        "equipment": {
          "needsPA": true,
          "needsMics": true,
          "needsDrums": true,
          "needsAmps": true,
          "acoustic": false
        },
        "guaranteeRange": {
          "min": 600,
          "max": 1000
        },
        "acceptsDoorDeals": true,
        "merchandising": true,
        "travelMethod": "van",
        "lodging": "flexible",
        "status": "active",
        "priority": "medium",
        "responses": 1,
        "createdAt": "2024-02-10T16:45:00Z",
        "updatedAt": "2024-02-10T16:45:00Z",
        "expiresAt": "2025-12-05T00:00:00Z"
      },
      {
        "id": "tour-req-004-sac",
        "artistId": "2",
        "artistName": "The Menzingers",
        "title": "Sacramento Show - September 2025",
        "description": "Seeking all-ages venues throughout California. Committed to inclusive shows and community building.",
        "startDate": "2025-09-13",
        "endDate": "2025-09-14",
        "location": "Sacramento, CA",
        "radius": 50,
        "flexibility": "exact-cities",
        "genres": ["indie rock", "punk", "alternative"],
        "expectedDraw": {
          "min": 120,
          "max": 200,
          "description": "Solid Sacramento following, prefer 120-200 cap venues"
        },
        "tourStatus": "flexible-routing",
        "ageRestriction": "all-ages",
        "equipment": {
          "needsPA": true,
          "needsMics": true,
          "needsDrums": true,
          "needsAmps": true,
          "acoustic": false
        },
        "guaranteeRange": {
          "min": 500,
          "max": 800
        },
        "acceptsDoorDeals": true,
        "merchandising": true,
        "travelMethod": "van",
        "lodging": "flexible",
        "status": "active",
        "priority": "medium",
        "responses": 1,
        "createdAt": "2024-02-10T16:45:00Z",
        "updatedAt": "2024-02-10T16:45:00Z",
        "expiresAt": "2025-12-05T00:00:00Z"
      }
    ];

    // Add missing tour requests
    const existingIds = new Set(tourRequests.map((req: any) => req.id));
    const missingRequests = requiredMenzingersRequests.filter(req => !existingIds.has(req.id));
    
    if (missingRequests.length > 0) {
      tourRequests.push(...missingRequests);
      fs.writeFileSync(tourRequestsPath, JSON.stringify(tourRequests, null, 2));
      console.log(`🔄 Admin: Restored ${missingRequests.length} missing tour requests`);
    }

    // Now reset the bids with the complete original demo bids state
    const originalBids = [
      // The Menzingers - San Francisco Show
      {
        "id": "bid-001-sf",
        "tourRequestId": "tour-req-004-sf",
        "venueId": "1",
        "venueName": "The Independent",
        "proposedDate": "2025-05-15",
        "guarantee": 2500,
        "doorDeal": {
          "split": "70/30",
          "minimumGuarantee": 1500
        },
        "ticketPrice": {
          "advance": 25,
          "door": 30
        },
        "capacity": 500,
        "ageRestriction": "all-ages",
        "equipmentProvided": {
          "pa": true,
          "mics": true,
          "drums": false,
          "amps": false,
          "piano": false
        },
        "loadIn": "4:00 PM",
        "soundcheck": "6:00 PM",
        "doorsOpen": "7:00 PM",
        "showTime": "8:30 PM",
        "curfew": "11:00 PM",
        "promotion": {
          "social": true,
          "flyerPrinting": true,
          "radioSpots": false,
          "pressCoverage": true
        },
        "message": "Hey Menzingers! Huge fans here at The Independent. We'd love to have you for this SF date. We can guarantee a great show with our excellent sound system and passionate SF crowd. This is our top choice date and we're prepared to make it happen!",
        "status": "hold",
        "holdPosition": "first",
        "holdNotes": "Top choice for SF show",
        "holdExpiresAt": "2025-01-27T23:59:59.000Z",
        "readByArtist": true,
        "createdAt": "2025-01-24T10:30:00.000Z",
        "updatedAt": "2025-01-25T14:20:00.000Z",
        "expiresAt": "2025-01-31T23:59:59.000Z"
      },
      {
        "id": "bid-002-sf",
        "tourRequestId": "tour-req-004-sf",
        "venueId": "2",
        "venueName": "Bottom of the Hill",
        "proposedDate": "2025-05-15",
        "guarantee": 2000,
        "doorDeal": {
          "split": "65/35",
          "minimumGuarantee": 1200
        },
        "ticketPrice": {
          "advance": 22,
          "door": 27
        },
        "capacity": 300,
        "ageRestriction": "21+",
        "equipmentProvided": {
          "pa": true,
          "mics": true,
          "drums": true,
          "amps": true,
          "piano": false
        },
        "loadIn": "5:00 PM",
        "soundcheck": "6:30 PM",
        "doorsOpen": "7:30 PM",
        "showTime": "9:00 PM",
        "curfew": "12:00 AM",
        "promotion": {
          "social": true,
          "flyerPrinting": false,
          "radioSpots": true,
          "pressCoverage": false
        },
        "message": "Bottom of the Hill would be stoked to host The Menzingers! We're a legendary SF venue that's hosted everyone from Nirvana to Green Day. Great sound, intimate setting, and we know how to treat touring bands right.",
        "status": "hold",
        "holdPosition": "second",
        "holdNotes": "Good backup option",
        "holdExpiresAt": "2025-01-29T23:59:59.000Z",
        "readByArtist": true,
        "createdAt": "2025-01-24T11:15:00.000Z",
        "updatedAt": "2025-01-25T14:25:00.000Z",
        "expiresAt": "2025-01-31T23:59:59.000Z"
      },
      // The Menzingers - Los Angeles Show
      {
        "id": "bid-003-la",
        "tourRequestId": "tour-req-004-la",
        "venueId": "3",
        "venueName": "The Troubadour",
        "proposedDate": "2025-05-17",
        "guarantee": 3000,
        "doorDeal": {
          "split": "75/25",
          "minimumGuarantee": 2000
        },
        "ticketPrice": {
          "advance": 28,
          "door": 35
        },
        "capacity": 400,
        "ageRestriction": "all-ages",
        "equipmentProvided": {
          "pa": true,
          "mics": true,
          "drums": false,
          "amps": false,
          "piano": true
        },
        "loadIn": "3:00 PM",
        "soundcheck": "5:30 PM",
        "doorsOpen": "7:00 PM",
        "showTime": "8:00 PM",
        "curfew": "11:30 PM",
        "promotion": {
          "social": true,
          "flyerPrinting": true,
          "radioSpots": true,
          "pressCoverage": true
        },
        "message": "The Troubadour is iconic LA venue that would be perfect for The Menzingers. We've got the history, the sound, and the crowd. This would be a career-highlight show for sure. Let's make it happen!",
        "status": "pending",
        "readByArtist": true,
        "createdAt": "2025-01-24T09:45:00.000Z",
        "updatedAt": "2025-01-24T09:45:00.000Z",
        "expiresAt": "2025-01-31T23:59:59.000Z"
      },
      // The Menzingers - San Diego Show
      {
        "id": "bid-004-sd",
        "tourRequestId": "tour-req-004-sd",
        "venueId": "5",
        "venueName": "Soda Bar",
        "proposedDate": "2025-09-11",
        "guarantee": 1800,
        "doorDeal": {
          "split": "70/30",
          "minimumGuarantee": 1200
        },
        "ticketPrice": {
          "advance": 20,
          "door": 25
        },
        "capacity": 200,
        "ageRestriction": "all-ages",
        "equipmentProvided": {
          "pa": true,
          "mics": true,
          "drums": true,
          "amps": true,
          "piano": false
        },
        "loadIn": "6:00 PM",
        "soundcheck": "7:00 PM",
        "doorsOpen": "8:00 PM",
        "showTime": "9:00 PM",
        "curfew": "12:00 AM",
        "promotion": {
          "social": true,
          "flyerPrinting": true,
          "radioSpots": false,
          "pressCoverage": false
        },
        "message": "Soda Bar is perfect for The Menzingers! We're San Diego's premier indie venue and would love to host you. Great sound system and passionate local crowd guaranteed.",
        "status": "pending",
        "readByArtist": true,
        "createdAt": "2025-01-24T12:00:00.000Z",
        "updatedAt": "2025-01-24T12:00:00.000Z",
        "expiresAt": "2025-01-31T23:59:59.000Z"
      },
      // The Menzingers - Sacramento Show
      {
        "id": "bid-005-sac",
        "tourRequestId": "tour-req-004-sac",
        "venueId": "6",
        "venueName": "Harlow's",
        "proposedDate": "2025-09-13",
        "guarantee": 2200,
        "doorDeal": {
          "split": "65/35",
          "minimumGuarantee": 1400
        },
        "ticketPrice": {
          "advance": 24,
          "door": 28
        },
        "capacity": 350,
        "ageRestriction": "all-ages",
        "equipmentProvided": {
          "pa": true,
          "mics": true,
          "drums": false,
          "amps": true,
          "piano": true
        },
        "loadIn": "5:00 PM",
        "soundcheck": "6:30 PM",
        "doorsOpen": "7:30 PM",
        "showTime": "8:30 PM",
        "curfew": "11:30 PM",
        "promotion": {
          "social": true,
          "flyerPrinting": true,
          "radioSpots": true,
          "pressCoverage": true
        },
        "message": "Harlow's would be honored to host The Menzingers in Sacramento! We're a historic venue with great acoustics and a dedicated local music scene. This would be an amazing show!",
        "status": "pending",
        "readByArtist": true,
        "createdAt": "2025-01-24T13:30:00.000Z",
        "updatedAt": "2025-01-24T13:30:00.000Z",
        "expiresAt": "2025-01-31T23:59:59.000Z"
      }
    ];

    // Write the complete original bids back to the file
    const bidsFilePath = path.join(dataDir, 'venue-bids.json');
    fs.writeFileSync(bidsFilePath, JSON.stringify(originalBids, null, 2));

    console.log(`🔄 Admin: Reset ${originalBids.length} bids to original demo state`);

    return NextResponse.json({ 
      success: true, 
      message: `Complete reset: ${missingRequests.length} tour requests restored, ${originalBids.length} bids reset`,
      tourRequestsRestored: missingRequests.length,
      bidsReset: originalBids.length 
    });
  } catch (error) {
    console.error('Error resetting bids:', error);
    return NextResponse.json(
      { error: 'Failed to reset bids' },
      { status: 500 }
    );
  }
} 