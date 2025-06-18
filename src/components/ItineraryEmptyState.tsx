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
      <td colSpan={venueId ? 9 : 10} className="px-6 py-8 text-center text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📅</span>
        </div>
        {stableMonthTabs.every(tab => tab.count === 0) ? (
          <>
            <p className="mb-2 font-medium">No shows booked</p>
            <p className="text-sm">
              {editable 
                ? "Get started by adding your first date below"
                : "Confirmed bookings will appear here"
              }
            </p>
          </>
        ) : (
          <>
            <p className="mb-2">No shows this month</p>
            <p className="text-sm">Check other months for upcoming shows</p>
          </>
        )}
      </td>
    </tr>
  );
} 