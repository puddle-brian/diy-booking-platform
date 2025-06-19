import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * UNIFIED BOOKING OPPORTUNITIES API
 * 
 * This single endpoint replaces:
 * - /api/show-requests
 * - /api/venue-offers  
 * - /api/shows (with lineup extraction)
 * 
 * Provides consistent data structure for all booking opportunities
 * regardless of their original source.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // QUERY PARAMETERS
    const artistId = searchParams.get('artistId');
    const venueId = searchParams.get('venueId');
    const perspective = searchParams.get('perspective') as 'ARTIST' | 'VENUE';
    const status = searchParams.get('status'); // Optional status filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    
    // BUILD FILTER CONDITIONS
    const whereConditions: any = {};
    
    // Perspective-based filtering
    if (perspective === 'ARTIST' && artistId) {
      whereConditions.artistId = artistId;
    } else if (perspective === 'VENUE' && venueId) {
      whereConditions.venueId = venueId;
    } else {
      return NextResponse.json({ error: 'Must specify perspective and contextId' }, { status: 400 });
    }
    
    // Status filtering
    if (status) {
      const statusList = status.split(',');
      whereConditions.status = { in: statusList };
    }
    
    // Date range filtering
    if (startDate || endDate) {
      whereConditions.proposedDate = {};
      if (startDate) {
        whereConditions.proposedDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereConditions.proposedDate.lte = new Date(endDate);
      }
    }
    
    // Expired filtering
    if (!includeExpired) {
      whereConditions.status = {
        not: 'EXPIRED',
        ...(whereConditions.status || {})
      };
    }
    
    // FETCH BOOKING OPPORTUNITIES
    const opportunities = await prisma.bookingOpportunity.findMany({
      where: whereConditions,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            genres: true,
            images: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            capacity: true,
            venueType: true,
            location: {
              select: {
                city: true,
                stateProvince: true,
                country: true
              }
            }
          }
        },
        initiatedByUser: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        proposedDate: 'asc'
      }
    });
    
    // TRANSFORM TO UNIFIED FORMAT
    const transformedOpportunities = opportunities.map(opp => ({
      // Core identity
      id: opp.id,
      artistId: opp.artistId,
      venueId: opp.venueId,
      
      // Basic info
      title: opp.title,
      description: opp.description,
      proposedDate: opp.proposedDate.toISOString(),
      
      // Who initiated
      initiatedBy: opp.initiatedBy,
      initiatedById: opp.initiatedById,
      initiatedByUser: opp.initiatedByUser,
      
      // Current state
      status: opp.status,
      
      // Financial offer
      financialOffer: {
        guarantee: opp.guarantee,
        doorDeal: opp.doorDeal,
        ticketPrice: opp.ticketPrice,
        merchandiseSplit: opp.merchandiseSplit
      },
      
      // Performance details
      performanceDetails: {
        billingPosition: opp.billingPosition,
        performanceOrder: opp.performanceOrder,
        setLength: opp.setLength,
        otherActs: opp.otherActs,
        billingNotes: opp.billingNotes
      },
      
      // Venue details
      venueDetails: {
        capacity: opp.capacity,
        ageRestriction: opp.ageRestriction,
        equipment: opp.equipmentProvided,
        schedule: {
          loadIn: opp.loadIn,
          soundcheck: opp.soundcheck,
          doorsOpen: opp.doorsOpen,
          showTime: opp.showTime,
          curfew: opp.curfew
        }
      },
      
      // Additional value
      additionalValue: {
        promotion: opp.promotion,
        lodging: opp.lodging,
        additionalTerms: opp.additionalTerms
      },
      
      // Communication
      message: opp.message,
      
      // Metadata
      createdAt: opp.createdAt.toISOString(),
      updatedAt: opp.updatedAt.toISOString(),
      expiresAt: opp.expiresAt?.toISOString(),
      
      // Source tracking
      sourceType: opp.sourceType,
      sourceId: opp.sourceId,
      
      // Status history
      statusHistory: opp.statusHistory,
      acceptedAt: opp.acceptedAt?.toISOString(),
      declinedAt: opp.declinedAt?.toISOString(),
      declinedReason: opp.declinedReason,
      cancelledAt: opp.cancelledAt?.toISOString(),
      cancelledReason: opp.cancelledReason,
      
      // Hold state
      holdState: opp.holdState,
      frozenAt: opp.frozenAt?.toISOString(),
      unfrozenAt: opp.unfrozenAt?.toISOString(),
      activeHolds: [], // TODO: Add back when holdRequests relation is working
      
      // Related entities
      artist: opp.artist,
      venue: opp.venue,
      locationInfo: {
        city: opp.venue.location?.city,
        stateProvince: opp.venue.location?.stateProvince,
        country: opp.venue.location?.country,
        venue: {
          id: opp.venue.id,
          name: opp.venue.name,
          capacity: opp.venue.capacity
        }
      }
    }));
    
    return NextResponse.json({
      opportunities: transformedOpportunities,
      metadata: {
        total: transformedOpportunities.length,
        perspective,
        contextId: perspective === 'ARTIST' ? artistId : venueId,
        filters: {
          status: status?.split(',') || null,
          dateRange: startDate || endDate ? { startDate, endDate } : null,
          includeExpired
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching booking opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch booking opportunities' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // CREATE NEW BOOKING OPPORTUNITY
    const newOpportunity = await prisma.bookingOpportunity.create({
      data: {
        // Core entities
        artistId: body.artistId,
        venueId: body.venueId,
        
        // Basic info
        title: body.title,
        description: body.description,
        proposedDate: new Date(body.proposedDate),
        
        // Initiation
        initiatedBy: body.initiatedBy,
        initiatedById: body.initiatedById,
        
        // Status
        status: body.status || 'OPEN',
        
        // Financial terms
        guarantee: body.financialOffer?.guarantee,
        doorDeal: body.financialOffer?.doorDeal,
        ticketPrice: body.financialOffer?.ticketPrice,
        merchandiseSplit: body.financialOffer?.merchandiseSplit,
        
        // Performance details
        billingPosition: body.performanceDetails?.billingPosition,
        performanceOrder: body.performanceDetails?.performanceOrder,
        setLength: body.performanceDetails?.setLength,
        otherActs: body.performanceDetails?.otherActs,
        billingNotes: body.performanceDetails?.billingNotes,
        
        // Venue details
        capacity: body.venueDetails?.capacity,
        ageRestriction: body.venueDetails?.ageRestriction,
        equipmentProvided: body.venueDetails?.equipment,
        loadIn: body.venueDetails?.schedule?.loadIn,
        soundcheck: body.venueDetails?.schedule?.soundcheck,
        doorsOpen: body.venueDetails?.schedule?.doorsOpen,
        showTime: body.venueDetails?.schedule?.showTime,
        curfew: body.venueDetails?.schedule?.curfew,
        
        // Additional value
        promotion: body.additionalValue?.promotion,
        lodging: body.additionalValue?.lodging,
        additionalTerms: body.additionalValue?.additionalTerms,
        
        // Communication
        message: body.message,
        
        // Metadata
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        
        // Source tracking
        sourceType: body.sourceType || 'BOOKING_OPPORTUNITY',
        sourceId: body.sourceId || 'new'
      },
      include: {
        artist: {
          select: { id: true, name: true }
        },
        venue: {
          select: { id: true, name: true }
        }
      }
    });
    
    return NextResponse.json({
      opportunity: newOpportunity,
      message: 'Booking opportunity created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating booking opportunity:', error);
    return NextResponse.json({ error: 'Failed to create booking opportunity' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // UPDATE BOOKING OPPORTUNITY
    const updatedOpportunity = await prisma.bookingOpportunity.update({
      where: { id },
      data: {
        // Allow updating specific fields
        status: body.status,
        
        // Status history tracking
        ...(body.status === 'CONFIRMED' && { acceptedAt: new Date() }),
        ...(body.status === 'DECLINED' && { 
          declinedAt: new Date(),
          declinedReason: body.declinedReason 
        }),
        ...(body.status === 'CANCELLED' && { 
          cancelledAt: new Date(),
          cancelledReason: body.cancelledReason 
        }),
        
        // Update status history
        statusHistory: body.statusHistory || [],
        
        updatedAt: new Date()
      },
      include: {
        artist: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true } }
      }
    });
    
    return NextResponse.json({
      opportunity: updatedOpportunity,
      message: 'Booking opportunity updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating booking opportunity:', error);
    return NextResponse.json({ error: 'Failed to update booking opportunity' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 