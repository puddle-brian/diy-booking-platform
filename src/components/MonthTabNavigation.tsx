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
    <div className="border-b border-border-primary bg-bg-secondary">
      <div className="px-6">
        <nav className="flex space-x-1 overflow-x-auto">
          {stableMonthTabs.map((group) => (
            <button
              key={group.monthKey}
              onClick={() => onMonthChange(group.monthKey)}
              className={`py-3 px-4 font-mono text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeMonthTab === group.monthKey
                  ? 'border-status-active text-text-primary bg-bg-tertiary'
                  : group.count > 0 
                    ? 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {group.monthLabel.toUpperCase()} {group.count > 0 && <span className="text-status-active">[{group.count}]</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 