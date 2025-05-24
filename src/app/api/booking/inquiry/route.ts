import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const inquiryData = await request.json();
    
    // In a real app, you'd:
    // 1. Validate the data
    // 2. Save to database
    // 3. Send email to venue
    // 4. Send confirmation email to artist
    // 5. Maybe add to a booking management system
    
    console.log('Booking inquiry received:', inquiryData);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Inquiry sent successfully',
      inquiryId: `INQ-${Date.now()}`
    });
    
  } catch (error) {
    console.error('Error processing booking inquiry:', error);
    return NextResponse.json({ 
      error: 'Failed to send inquiry' 
    }, { status: 500 });
  }
} 