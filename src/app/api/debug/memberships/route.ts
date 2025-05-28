import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking memberships...');
    
    // Check if membership table exists and has data
    const memberships = await (prisma as any).membership.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`📊 Found ${memberships.length} memberships in database`);
    
    // Check Lightning Bolt specifically
    const lightningBoltMemberships = memberships.filter((m: any) => 
      m.entityId === '1748101913848' && m.entityType === 'ARTIST'
    );
    
    console.log(`⚡ Lightning Bolt memberships: ${lightningBoltMemberships.length}`);
    
    // Check what the members API returns for Lightning Bolt
    const membersResponse = await fetch(`${request.nextUrl.origin}/api/members?entityType=artist&entityId=1748101913848`);
    const membersData = await membersResponse.json();
    
    return NextResponse.json({
      success: true,
      data: {
        totalMemberships: memberships.length,
        lightningBoltMemberships: lightningBoltMemberships.length,
        allMemberships: memberships.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          userName: m.user.username,
          entityType: m.entityType,
          entityId: m.entityId,
          role: m.role,
          status: m.status
        })),
        lightningBoltMembers: lightningBoltMemberships.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          userName: m.user.username,
          role: m.role,
          status: m.status
        })),
        membersApiResponse: membersData
      }
    });
    
  } catch (error: any) {
    console.error('❌ Debug failed:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    );
  }
} 