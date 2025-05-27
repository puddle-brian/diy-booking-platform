import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch all feedback
    const feedback = await prisma.feedback.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    // Parse context for each feedback item
    const feedbackWithContext = feedback.map((item: any) => ({
      ...item,
      context: JSON.parse(item.context || '{}')
    }));

    // Generate analysis summary
    const analysis = {
      summary: {
        total: feedback.length,
        new: feedback.filter(f => f.status === 'NEW').length,
        critical: feedback.filter(f => f.priority === 'CRITICAL').length,
        high: feedback.filter(f => f.priority === 'HIGH').length,
        bugs: feedback.filter(f => f.type === 'BUG').length,
        features: feedback.filter(f => f.type === 'FEATURE').length,
        ux: feedback.filter(f => f.type === 'UX').length,
      },
      
      // AI-ready prompt
      aiPrompt: `Please analyze the following feedback data from my DIY booking platform and provide:

1. **Priority Ranking**: Rank all feedback items by urgency and impact
2. **Quick Wins**: Identify items that can be implemented quickly (< 2 hours)
3. **Long-term Improvements**: Items requiring significant development time
4. **Implementation Order**: Suggested sequence for maximum user impact
5. **Patterns & Themes**: Common issues or requests you notice
6. **Risk Assessment**: Any critical bugs that could affect user experience

**Platform Context**: This is a DIY music booking platform connecting underground artists with venues. Users are primarily musicians, venue owners, and DIY show organizers.

**Feedback Data**:`,

      // Structured data for AI analysis
      feedbackData: feedbackWithContext.map(item => ({
        id: item.id,
        type: item.type,
        priority: item.priority,
        status: item.status,
        title: item.title,
        description: item.description,
        url: item.context?.url,
        userType: item.context?.userType,
        timestamp: item.createdAt,
        viewport: item.context?.viewport,
      })),

      // Quick stats for human review
      quickStats: {
        mostCommonType: getMostCommon(feedback.map(f => f.type)),
        mostCommonPriority: getMostCommon(feedback.map(f => f.priority)),
        mostCommonPage: getMostCommon(feedbackWithContext.map(f => f.context?.url).filter(Boolean)),
        avgFeedbackPerDay: feedback.length > 0 ? 
          feedback.length / Math.max(1, Math.ceil((Date.now() - new Date(feedback[feedback.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0,
      }
    };

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Feedback analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze feedback' },
      { status: 500 }
    );
  }
}

// Helper function to find most common value
function getMostCommon(arr: any[]) {
  if (arr.length === 0) return null;
  
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
} 