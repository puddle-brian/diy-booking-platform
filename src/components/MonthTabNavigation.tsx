interface MonthTabGroup {
  monthKey: string;
  monthLabel: string;
  count: number;
}

interface MonthTabNavigationProps {
  stableMonthTabs: MonthTabGroup[];
  activeMonthTab: string;
  onMonthChange: (monthKey: string) => void;
}

export function MonthTabNavigation({
  stableMonthTabs,
  activeMonthTab,
  onMonthChange
}: MonthTabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="px-6">
        <nav className="flex space-x-4 overflow-x-auto">
          {stableMonthTabs.map((group) => (
            <button
              key={group.monthKey}
              onClick={() => onMonthChange(group.monthKey)}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeMonthTab === group.monthKey
                  ? 'border-blue-500 text-blue-600'
                  : group.count > 0 
                    ? 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                    : 'border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-200'
              }`}
            >
              {group.monthLabel} {group.count > 0 && `(${group.count})`}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 