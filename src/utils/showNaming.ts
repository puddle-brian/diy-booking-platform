interface SupportAct {
  artistName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  billingPosition?: 'headliner' | 'support' | 'co-headliner' | 'local-support';
}

interface ShowNamingOptions {
  headlinerName: string;
  supportActs: SupportAct[];
  includeStatusInCount?: boolean;
  maxNameLength?: number;
}

/**
 * 🎯 CENTRALIZED BILLING PRIORITY FUNCTION
 * Single source of truth for billing order across parent rows and child rows
 * 
 * Priority order:
 * 1. headliner
 * 2. co-headliner  
 * 3. undefined positions (fallback for legacy data)
 * 4. support
 * 5. local-support
 * 6. fallback
 */
export function getBillingPriority(item: {
  artistName?: string;
  billingPosition?: string;
}): number {
  const pos = item.billingPosition;
  if (pos === 'headliner') return 1;
  if (pos === 'co-headliner') return 2;
  if (pos === undefined) return 3; // All undefined positions treated equally
  if (pos === 'support') return 4;
  if (pos === 'local-support') return 5;
  return 6;
}

/**
 * Universal Show Naming System
 * Creates consistent, intelligent show titles across all contexts
 * 
 * Examples:
 * - "Lightning Bolt" (solo)
 * - "Lightning Bolt & Techno Barkley" (duo)
 * - "Lightning Bolt + 2 more" (headliner + support)
 * - "Lightning Bolt & AIDS Wolf + 1 more" (co-headliners + support)
 * - "Lightning Bolt, Techno Barkley + 1 more" (co-equal artists)
 * - "3 artists" (all equal status)
 */
export function generateSmartShowTitle({
  headlinerName,
  supportActs,
  includeStatusInCount = false,
  maxNameLength = 50
}: ShowNamingOptions): { title: string; tooltip?: string } {
  // Filter support acts based on status
  const confirmedSupport = supportActs.filter(act => act.status === 'accepted');
  const pendingSupport = supportActs.filter(act => act.status === 'pending');
  const allActiveSupport = includeStatusInCount ? 
    [...confirmedSupport, ...pendingSupport] : 
    confirmedSupport;

  // Detect headliners and co-headliners
  const coHeadliners = supportActs.filter(act => 
    act.billingPosition === 'headliner' || act.billingPosition === 'co-headliner'
  );
  const regularSupport = supportActs.filter(act => 
    !act.billingPosition || act.billingPosition === 'support'
  );

  const totalActiveSupport = allActiveSupport.length;
  const totalCoHeadliners = coHeadliners.filter(act => 
    includeStatusInCount ? 
      ['accepted', 'pending'].includes(act.status) : 
      act.status === 'accepted'
  ).length;

  // Create tooltip with full lineup
  const fullLineup = [headlinerName, ...allActiveSupport.map(act => act.artistName)];
  const tooltip = fullLineup.length > 2 ? fullLineup.join(', ') : undefined;

  // Scenario 1: Solo show (no support acts)
  if (totalActiveSupport === 0) {
    return { title: headlinerName, tooltip };
  }

  // Scenario 2: Two artists only
  if (totalActiveSupport === 1) {
    const supportAct = allActiveSupport[0];
    const connector = totalCoHeadliners > 0 ? '&' : '&';
    return { 
      title: `${headlinerName} ${connector} ${supportAct.artistName}`,
      tooltip 
    };
  }

  // Scenario 3: Multiple co-headliners
  if (totalCoHeadliners >= 1) {
    const coHeadlinerNames = coHeadliners
      .filter(act => includeStatusInCount ? 
        ['accepted', 'pending'].includes(act.status) : 
        act.status === 'accepted'
      )
      .map(act => act.artistName);
    
    const remainingSupport = totalActiveSupport - totalCoHeadliners;
    
    if (remainingSupport === 0) {
      // Only co-headliners
      return { 
        title: `${headlinerName} & ${coHeadlinerNames.join(' & ')}`,
        tooltip 
      };
    } else {
      // Co-headliners + additional support
      return { 
        title: `${headlinerName} & ${coHeadlinerNames.join(' & ')} + ${remainingSupport} more`,
        tooltip 
      };
    }
  }

  // Scenario 4: All artists appear to be equal status (no clear headliner hierarchy)
  const allArtists = [headlinerName, ...allActiveSupport.map(act => act.artistName)];
  if (allArtists.every(name => name.length < 15) && allArtists.length <= 4) {
    // Short names, can show as comma-separated
    const remainingCount = allArtists.length - 2;
    if (remainingCount === 1) {
      return { 
        title: `${allArtists[0]}, ${allArtists[1]} + 1 more`,
        tooltip 
      };
    }
  }

  // Scenario 5: Clear headliner + support acts
  if (totalActiveSupport === 2) {
    return { 
      title: `${headlinerName} + ${allActiveSupport.map(act => act.artistName).join(' + ')}`,
      tooltip 
    };
  }

  // Scenario 6: Headliner + many support acts
  return { 
    title: `${headlinerName} + ${totalActiveSupport} more`,
    tooltip 
  };
}

/**
 * Simplified version for cases where we don't have detailed support act data
 */
export function generateSimpleShowTitle(
  headlinerName: string, 
  supportActNames: string[],
  includeAllInCount: boolean = false
): { title: string; tooltip?: string } {
  const supportActs: SupportAct[] = supportActNames.map(name => ({
    artistName: name,
    status: 'accepted' as const
  }));

  return generateSmartShowTitle({
    headlinerName,
    supportActs,
    includeStatusInCount: includeAllInCount
  });
}

/**
 * For cases where all artists are equal (no clear headliner)
 */
export function generateEqualArtistsTitle(artistNames: string[]): { title: string; tooltip?: string } {
  if (artistNames.length === 0) return { title: 'No artists' };
  if (artistNames.length === 1) return { title: artistNames[0] };
  if (artistNames.length === 2) return { title: artistNames.join(' & ') };
  
  const tooltip = artistNames.join(', ');
  
  // For 3+ artists, show count with tooltip
  return { 
    title: `${artistNames.length} artists`,
    tooltip 
  };
} 