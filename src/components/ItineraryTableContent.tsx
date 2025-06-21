import React from 'react';
import { ItineraryTableHeader } from './ItineraryTableHeader';
import { ItineraryEmptyState } from './ItineraryEmptyState';
import { SpecializedTimelineGroupRow } from './TimelineItems/SpecializedTimelineGroupRow';
import { groupProcessedEntriesByDate } from '../utils/timelineProcessing';
// 🎯 MICRO-PHASE H: Import consolidated prop interfaces
import { ConsolidatedTimelineProps, extractDataProps, extractInteractionProps, extractStateProps } from '../utils/propConsolidation';

// 🎯 MICRO-PHASE H: Simplified interface using consolidated props
interface ItineraryTableContentProps extends ConsolidatedTimelineProps {}

// 🎯 MICRO-PHASE H: Simplified component signature using consolidated props
export function ItineraryTableContent(props: ItineraryTableContentProps) {
  // 🎯 MICRO-PHASE H: Extract organized prop groups
  const dataProps = extractDataProps(props);
  const interactionProps = extractInteractionProps(props);
  const stateProps = extractStateProps(props);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] table-fixed">
        <ItineraryTableHeader venueId={dataProps.venueId} artistId={dataProps.artistId} />
        <tbody className="divide-y divide-gray-100">
          {/* Empty state */}
          {dataProps.activeMonthEntries.length === 0 && (
            <ItineraryEmptyState
              venueId={dataProps.venueId}
              stableMonthTabs={dataProps.stableMonthTabs}
              editable={stateProps.editable}
            />
          )}
          
          {/* 🎯 MICRO-PHASE H: Consolidated props passed to specialized components */}
          {groupProcessedEntriesByDate(dataProps.processedEntries).map(({ groupDate, groupEntries }) => (
            <SpecializedTimelineGroupRow
              key={groupDate}
              groupDate={groupDate}
              groupEntries={groupEntries}
              {...stateProps}
              {...dataProps}
              {...interactionProps}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
} 