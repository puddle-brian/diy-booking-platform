import { prisma } from '../../lib/prisma';

// Tier limits
export const TIER_LIMITS = {
  FREE: {
    dailyAgentChats: 3,
    transactionFeePercent: 3,
  },
  PRO: {
    dailyAgentChats: Infinity,
    transactionFeePercent: 0,
    monthlyPrice: 1000, // $10 in cents
  },
  VENUE_PRO: {
    dailyAgentChats: Infinity,
    transactionFeePercent: 0,
    monthlyPrice: 2500, // $25 in cents
  },
};

// Token cost estimation (per 1M tokens, in cents)
const TOKEN_COSTS = {
  'claude-sonnet-4-20250514': {
    input: 300,   // $3.00 per 1M input tokens
    output: 1500, // $15.00 per 1M output tokens
  },
};

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  tier: string;
  upgradeMessage?: string;
}

export interface RecordUsageParams {
  userId: string;
  type?: 'AGENT_CHAT' | 'SEARCH' | 'BOOKING_CONFIRMED';
  inputTokens?: number;
  outputTokens?: number;
  entityType?: string;
  entityId?: string;
  toolsUsed?: string[];
  responseTimeMs?: number;
}

/**
 * Get or create a user's subscription (defaults to FREE tier)
 */
export async function getOrCreateSubscription(userId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        tier: 'FREE',
        status: 'ACTIVE',
      },
    });
  }

  return subscription;
}

/**
 * Get today's usage summary for a user
 */
async function getTodayUsageSummary(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let summary = await prisma.dailyUsageSummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!summary) {
    summary = await prisma.dailyUsageSummary.create({
      data: {
        userId,
        date: today,
        agentChats: 0,
        totalTokens: 0,
        estimatedCost: 0,
      },
    });
  }

  return summary;
}

/**
 * Check if a user can make an agent request
 */
export async function checkUsageLimit(userId: string): Promise<UsageCheckResult> {
  const subscription = await getOrCreateSubscription(userId);
  const tierLimits = TIER_LIMITS[subscription.tier as keyof typeof TIER_LIMITS];
  
  // Pro tiers have unlimited access
  if (subscription.tier !== 'FREE') {
    return {
      allowed: true,
      tier: subscription.tier,
      remaining: Infinity,
    };
  }

  // Check daily limit for free tier
  const todaySummary = await getTodayUsageSummary(userId);
  const remaining = tierLimits.dailyAgentChats - todaySummary.agentChats;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Daily limit reached',
      remaining: 0,
      limit: tierLimits.dailyAgentChats,
      tier: subscription.tier,
      upgradeMessage: 'Upgrade to Pro for unlimited agent conversations! Only $10/month.',
    };
  }

  return {
    allowed: true,
    remaining,
    limit: tierLimits.dailyAgentChats,
    tier: subscription.tier,
  };
}

/**
 * Record a usage event
 */
export async function recordUsage(params: RecordUsageParams) {
  const {
    userId,
    type = 'AGENT_CHAT',
    inputTokens = 0,
    outputTokens = 0,
    entityType,
    entityId,
    toolsUsed = [],
    responseTimeMs,
  } = params;

  const totalTokens = inputTokens + outputTokens;
  
  // Estimate cost in cents (per 1M tokens)
  const costPerMToken = TOKEN_COSTS['claude-sonnet-4-20250514'];
  const estimatedCost = Math.ceil(
    (inputTokens * costPerMToken.input / 1_000_000) +
    (outputTokens * costPerMToken.output / 1_000_000)
  );

  // Create the usage record
  const usageRecord = await prisma.usageRecord.create({
    data: {
      userId,
      type,
      inputTokens,
      outputTokens,
      totalTokens,
      entityType: entityType as any,
      entityId,
      toolsUsed,
      responseTimeMs,
      estimatedCost,
    },
  });

  // Update daily summary
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyUsageSummary.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      agentChats: type === 'AGENT_CHAT' ? 1 : 0,
      totalTokens,
      estimatedCost,
    },
    update: {
      agentChats: type === 'AGENT_CHAT' ? { increment: 1 } : undefined,
      totalTokens: { increment: totalTokens },
      estimatedCost: { increment: estimatedCost },
    },
  });

  return usageRecord;
}

/**
 * Get usage stats for a user
 */
export async function getUserUsageStats(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const summaries = await prisma.dailyUsageSummary.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  const totals = summaries.reduce(
    (acc, s) => ({
      agentChats: acc.agentChats + s.agentChats,
      totalTokens: acc.totalTokens + s.totalTokens,
      estimatedCost: acc.estimatedCost + s.estimatedCost,
    }),
    { agentChats: 0, totalTokens: 0, estimatedCost: 0 }
  );

  const subscription = await getOrCreateSubscription(userId);
  const todaySummary = await getTodayUsageSummary(userId);
  const tierLimits = TIER_LIMITS[subscription.tier as keyof typeof TIER_LIMITS];

  return {
    subscription: {
      tier: subscription.tier,
      status: subscription.status,
    },
    today: {
      agentChats: todaySummary.agentChats,
      remaining: subscription.tier === 'FREE' 
        ? Math.max(0, tierLimits.dailyAgentChats - todaySummary.agentChats)
        : Infinity,
      limit: tierLimits.dailyAgentChats,
    },
    period: {
      days,
      ...totals,
      estimatedCostDollars: (totals.estimatedCost / 100).toFixed(2),
    },
    dailyBreakdown: summaries.map(s => ({
      date: s.date.toISOString().split('T')[0],
      agentChats: s.agentChats,
      totalTokens: s.totalTokens,
      estimatedCostCents: s.estimatedCost,
    })),
  };
}

/**
 * Upgrade a user's subscription (placeholder for Stripe integration)
 */
export async function upgradeSubscription(
  userId: string, 
  tier: 'PRO' | 'VENUE_PRO',
  stripeData?: { customerId: string; subscriptionId: string }
) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier,
      status: 'ACTIVE',
      stripeCustomerId: stripeData?.customerId,
      stripeSubscriptionId: stripeData?.subscriptionId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      tier,
      status: 'ACTIVE',
      stripeCustomerId: stripeData?.customerId,
      stripeSubscriptionId: stripeData?.subscriptionId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });
}

/**
 * Downgrade to free tier
 */
export async function downgradeToFree(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      tier: 'FREE',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });
}

/**
 * Admin: Get platform-wide usage stats
 */
export async function getPlatformUsageStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totalUsage, subscriptionCounts, topUsers] = await Promise.all([
    // Total usage in period
    prisma.usageRecord.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    }),
    
    // Subscription tier distribution
    prisma.subscription.groupBy({
      by: ['tier'],
      _count: true,
    }),
    
    // Top users by usage
    prisma.dailyUsageSummary.groupBy({
      by: ['userId'],
      where: { date: { gte: startDate } },
      _sum: {
        agentChats: true,
        totalTokens: true,
        estimatedCost: true,
      },
      orderBy: {
        _sum: { totalTokens: 'desc' },
      },
      take: 10,
    }),
  ]);

  return {
    period: { days, startDate: startDate.toISOString() },
    totals: {
      apiCalls: totalUsage._count,
      inputTokens: totalUsage._sum.inputTokens || 0,
      outputTokens: totalUsage._sum.outputTokens || 0,
      totalTokens: totalUsage._sum.totalTokens || 0,
      estimatedCostCents: totalUsage._sum.estimatedCost || 0,
      estimatedCostDollars: ((totalUsage._sum.estimatedCost || 0) / 100).toFixed(2),
    },
    subscriptions: subscriptionCounts.reduce((acc, s) => {
      acc[s.tier] = s._count;
      return acc;
    }, {} as Record<string, number>),
    topUsers: topUsers.map(u => ({
      userId: u.userId,
      agentChats: u._sum.agentChats || 0,
      totalTokens: u._sum.totalTokens || 0,
      estimatedCostCents: u._sum.estimatedCost || 0,
    })),
  };
}
