import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        location: true
      }
    });
    
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Transform data to match frontend expectations
    const transformedVenue = {
      id: venue.id,
      name: venue.name,
      city: venue.location.city,
      state: venue.location.stateProvince,
      country: venue.location.country,
      venueType: venue.venueType.toLowerCase().replace('_', '-'),
      capacity: venue.capacity,
      ageRestriction: venue.ageRestriction?.toLowerCase().replace('_', '-').replace('-plus', '+'),
      equipment: venue.equipment || {},
      features: venue.features || [],
      pricing: venue.pricing || {},
      contact: {
        email: venue.contactEmail,
        phone: venue.contactPhone,
        website: venue.website,
        social: (venue.socialHandles as any)?.social
      },
      description: venue.description,
      images: venue.images || [],
      verified: venue.verified,
      rating: 0, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count from reviews
      showsThisYear: 0, // TODO: Count from shows
      hasAccount: false, // TODO: Check if venue has user account
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt
    };
    
    return NextResponse.json(transformedVenue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json({ error: 'Failed to fetch venue' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedData = await request.json();
    
    // Check if venue exists
    const existingVenue = await prisma.venue.findUnique({
      where: { id }
    });
    
    if (!existingVenue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    // Update venue
    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: {
        name: updatedData.name,
        venueType: updatedData.venueType?.toUpperCase().replace('-', '_'),
        capacity: updatedData.capacity,
        ageRestriction: updatedData.ageRestriction?.toUpperCase().replace('-', '_').replace('+', '_PLUS'),
        contactEmail: updatedData.contact?.email,
        contactPhone: updatedData.contact?.phone,
        website: updatedData.contact?.website,
        socialHandles: updatedData.contact?.social ? { social: updatedData.contact.social } : undefined,
        equipment: updatedData.equipment,
        features: updatedData.features,
        pricing: updatedData.pricing,
        description: updatedData.description,
        images: updatedData.images
      },
      include: {
        location: true
      }
    });
    
    // Transform response
    const transformedVenue = {
      id: updatedVenue.id,
      name: updatedVenue.name,
      city: updatedVenue.location.city,
      state: updatedVenue.location.stateProvince,
      country: updatedVenue.location.country,
      venueType: updatedVenue.venueType.toLowerCase().replace('_', '-'),
      capacity: updatedVenue.capacity,
      ageRestriction: updatedVenue.ageRestriction?.toLowerCase().replace('_', '-').replace('-plus', '+'),
      equipment: updatedVenue.equipment || {},
      features: updatedVenue.features || [],
      pricing: updatedVenue.pricing || {},
      contact: {
        email: updatedVenue.contactEmail,
        phone: updatedVenue.contactPhone,
        website: updatedVenue.website,
        social: (updatedVenue.socialHandles as any)?.social
      },
      description: updatedVenue.description,
      images: updatedVenue.images || [],
      verified: updatedVenue.verified,
      rating: 0,
      reviewCount: 0,
      showsThisYear: 0,
      hasAccount: false,
      createdAt: updatedVenue.createdAt,
      updatedAt: updatedVenue.updatedAt
    };
    
    return NextResponse.json(transformedVenue);
    
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if venue exists
    const existingVenue = await prisma.venue.findUnique({
      where: { id }
    });
    
    if (!existingVenue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    // Delete venue
    await prisma.venue.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Venue "${existingVenue.name}" deleted successfully`,
      deletedVenue: existingVenue
    });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return NextResponse.json({ error: 'Failed to delete venue' }, { status: 500 });
  }
} 