import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

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

// PUT /api/artists/[id]/templates/[templateId] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id: artistId, templateId } = await params;
    const userAuth = await getUserFromRequest(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Add debugging for request body
    let body;
    try {
      const rawBody = await request.text();
      console.log(`🎨 API: Raw request body length: ${rawBody.length}`);
      
      if (!rawBody || rawBody.trim() === '') {
        console.error('🎨 API: Empty request body received');
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        );
      }
      
      body = JSON.parse(rawBody);
      console.log(`🎨 API: Successfully parsed JSON body for template ${templateId}`);
    } catch (parseError) {
      console.error('🎨 API: JSON parse error:', parseError);
      console.error('🎨 API: Request content-type:', request.headers.get('content-type'));
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.log(`🎨 API: Updating template ${templateId} for artist ${artistId}`);
    
    // Verify template exists and belongs to this artist
    const existingTemplate = await prisma.artistTemplate.findFirst({
      where: { 
        id: templateId,
        artistId 
      }
    });
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // If this is being set as default, unset other defaults
    if (body.isDefault && !existingTemplate.isDefault) {
      await prisma.artistTemplate.updateMany({
        where: { 
          artistId,
          isDefault: true,
          id: { not: templateId }
        },
        data: { isDefault: false }
      });
    }
    
    // Clean and validate the data before updating
    const updateData = {
      name: body.name,
      type: body.type,
      isDefault: body.isDefault,
      description: body.description,
      equipment: body.equipment,
      technicalRequirements: Array.isArray(body.technicalRequirements) ? body.technicalRequirements : [],
      hospitalityRequirements: Array.isArray(body.hospitalityRequirements) ? body.hospitalityRequirements : [],
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
    };
    
    // Update the template
    const updatedTemplate = await prisma.artistTemplate.update({
      where: { id: templateId },
      data: updateData
    });
    
    console.log(`🎨 API: Updated template ${templateId}`);
    
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating artist template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// PATCH /api/artists/[id]/templates/[templateId] - Partially update a template (e.g., just default status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id: artistId, templateId } = await params;
    const userAuth = await getUserFromRequest(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log(`🎨 API: Partially updating template ${templateId} for artist ${artistId}`);
    
    // Verify template exists and belongs to this artist
    const existingTemplate = await prisma.artistTemplate.findFirst({
      where: { 
        id: templateId,
        artistId 
      }
    });
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // If this is being set as default, unset other defaults
    if (body.isDefault === true && !existingTemplate.isDefault) {
      await prisma.artistTemplate.updateMany({
        where: { 
          artistId,
          isDefault: true,
          id: { not: templateId }
        },
        data: { isDefault: false }
      });
    }
    
    // Update only the provided fields
    const updateData: any = {};
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    
    const updatedTemplate = await prisma.artistTemplate.update({
      where: { id: templateId },
      data: updateData
    });
    
    console.log(`🎨 API: Partially updated template ${templateId}`);
    
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error partially updating artist template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/artists/[id]/templates/[templateId] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id: artistId, templateId } = await params;
    const userAuth = await getUserFromRequest(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`🎨 API: Deleting template ${templateId} for artist ${artistId}`);
    
    // Verify template exists and belongs to this artist
    const existingTemplate = await prisma.artistTemplate.findFirst({
      where: { 
        id: templateId,
        artistId 
      }
    });
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Delete the template
    await prisma.artistTemplate.delete({
      where: { id: templateId }
    });
    
    console.log(`🎨 API: Deleted template ${templateId}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting artist template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
} 