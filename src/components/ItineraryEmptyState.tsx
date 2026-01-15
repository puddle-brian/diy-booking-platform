interface MonthTabGroup {
  monthKey: string;
  monthLabel: string;
  count: number;
}

interface ItineraryEmptyStateProps {
  venueId?: string;
  stableMonthTabs: MonthTabGroup[];
  editable: boolean;
}

export function ItineraryEmptyState({ 
  venueId, 
  stableMonthTabs, 
  editable 
}: ItineraryEmptyStateProps) {
  return (
    <tr>
      <td colSpan={venueId ? 9 : 10} className="px-6 py-8 text-center">
        <div className="w-16 h-16 border border-border-secondary flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-text-muted">📅</span>
        </div>
        {stableMonthTabs.every(tab => tab.count === 0) ? (
          <>
            <p className="mb-2 font-mono text-text-primary">// NO_SHOWS_BOOKED</p>
            <p className="text-sm font-mono text-text-secondary">
              {editable 
                ? "Add your first date below to get started"
                : "Confirmed bookings will appear here"
              }
            </p>
          </>
        ) : (
          <>
            <p className="mb-2 font-mono text-text-primary">// NO_SHOWS_THIS_MONTH</p>
            <p className="text-sm font-mono text-text-secondary">Check other months for upcoming shows</p>
          </>
        )}
      </td>
    </tr>
  );
} 