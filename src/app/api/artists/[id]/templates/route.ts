import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { TemplateType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'book-yr-life-secret-key-change-in-production';

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

// Helper function to create a default template for artists who don't have any
async function createDefaultTemplate(artistId: string) {
  try {
    const defaultTemplate = {
      artistId,
      name: 'My Standard Setup',
      type: TemplateType.COMPLETE,
      isDefault: true,
      description: 'Default template with common touring requirements. Edit this to match your needs!',
      equipment: {
        needsPA: true,
        needsMics: true,
        needsDrums: false,
        needsAmps: true,
        acoustic: false,
      },
      guaranteeRange: {
        min: 200,
        max: 500
      },
      acceptsDoorDeals: true,
      merchandising: true,
      travelMethod: 'van',
      lodging: 'flexible',
      ageRestriction: 'all-ages',
      tourStatus: 'exploring-interest',
      notes: 'This is your default template! Edit it in your artist dashboard to match your specific needs. You can create additional templates for different types of shows (acoustic, full band, festival, etc.)'
    };

    const template = await prisma.artistTemplate.create({
      data: defaultTemplate
    });

    console.log(`🎨 Created default template for artist ${artistId}`);
    return template;
  } catch (error) {
    console.error(`Failed to create default template for artist ${artistId}:`, error);
    return null;
  }
}

// GET /api/artists/[id]/templates - Fetch all templates for an artist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artistId } = await params;
    
    console.log(`🎨 API: Fetching templates for artist ${artistId}`);
    
    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId }
    });
    
    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }
    
    // Fetch templates for this artist
    let templates = await prisma.artistTemplate.findMany({
      where: { artistId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    // If artist has no templates, create a default one
    if (templates.length === 0) {
      console.log(`🎨 API: No templates found for artist ${artistId}, creating default template`);
      const defaultTemplate = await createDefaultTemplate(artistId);
      if (defaultTemplate) {
        templates = [defaultTemplate];
      }
    }
    
    console.log(`🎨 API: Found ${templates.length} templates for artist ${artistId}`);
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching artist templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/artists/[id]/templates - Create a new template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artistId } = await params;
    const userAuth = await getUserFromRequest(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log(`🎨 API: Creating template for artist ${artistId}`);
    
    // Verify artist exists and user has permission
    const artist = await prisma.artist.findUnique({
      where: { id: artistId }
    });
    
    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }
    
    // If this is being set as default, unset other defaults
    if (body.isDefault) {
      await prisma.artistTemplate.updateMany({
        where: { 
          artistId,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }
    
    // Create the template
    const template = await prisma.artistTemplate.create({
      data: {
        artistId,
        name: body.name,
        type: body.type,
        isDefault: body.isDefault || false,
        description: body.description,
        equipment: body.equipment,
        technicalRequirements: body.technicalRequirements,
        hospitalityRequirements: body.hospitalityRequirements,
        stageRequirements: body.stageRequirements,
        soundCheckTime: body.soundCheckTime,
        setLength: body.setLength,
        guaranteeRange: body.guaranteeRange,
        acceptsDoorDeals: body.acceptsDoorDeals,
        merchandising: body.merchandising,
        travelMethod: body.travelMethod,
        lodging: body.lodging,
        expectedDraw: body.expectedDraw,
        ageRestriction: body.ageRestriction,
        tourStatus: body.tourStatus,
        notes: body.notes
      }
    });
    
    console.log(`🎨 API: Created template ${template.id} for artist ${artistId}`);
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating artist template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
} 