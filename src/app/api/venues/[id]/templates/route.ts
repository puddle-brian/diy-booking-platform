import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

// GET /api/venues/[id]/templates - Get all offer templates for this venue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;

    console.log(`🏢 API: Fetching offer templates for venue ${venueId}`);

    const templates = await prisma.venueOfferTemplate.findMany({
      where: {
        venueId: venueId
      },
      orderBy: [
        { isDefault: 'desc' }, // Default templates first
        { name: 'asc' }
      ]
    });

    console.log(`🏢 API: Found ${templates.length} templates for venue ${venueId}`);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching venue offer templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue offer templates' },
      { status: 500 }
    );
  }
}

// POST /api/venues/[id]/templates - Create a new offer template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    const body = await request.json();
    
    console.log('🏢 API: Creating venue offer template:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // If this is being set as default, unset other defaults
    if (body.isDefault) {
      await prisma.venueOfferTemplate.updateMany({
        where: {
          venueId: venueId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }
    
    // Create new template
    const newTemplate = await prisma.venueOfferTemplate.create({
      data: {
        venueId,
        name: body.name,
        isDefault: body.isDefault || false,
        
        // Financial template
        amount: body.amount ? parseFloat(body.amount) : null,
        doorDeal: body.doorDeal || null,
        ticketPrice: body.ticketPrice || null,
        merchandiseSplit: body.merchandiseSplit || null,
        
        // Show template
        billingPosition: body.billingPosition || null,
        setLength: body.setLength ? parseInt(body.setLength) : null,
        
        // Venue template
        equipmentProvided: body.equipmentProvided || null,
        loadIn: body.loadIn || null,
        soundcheck: body.soundcheck || null,
        doorsOpen: body.doorsOpen || null,
        showTime: body.showTime || null,
        curfew: body.curfew || null,
        
        // Value-add template
        promotion: body.promotion || null,
        lodging: body.lodging || null,
        
        // Message template
        messageTemplate: body.messageTemplate || null,
        additionalTerms: body.additionalTerms || null
      }
    });

    console.log(`✅ Venue offer template created: ${body.name} for venue ${venueId}`);

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating venue offer template:', error);
    return NextResponse.json(
      { error: 'Failed to create venue offer template' },
      { status: 500 }
    );
  }
} 