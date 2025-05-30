'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

interface ProfileTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ 
  tabs, 
  defaultTab, 
  onTabChange, 
  children, 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    if (tabs.find(tab => tab.id === tabId)?.disabled) return;
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : tab.disabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon && <span className="text-base">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`
                  ml-1 py-0.5 px-2 rounded-full text-xs font-medium
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && 
              typeof child.props === 'object' && 
              child.props !== null && 
              'tabId' in child.props && 
              child.props.tabId === activeTab) {
            return child;
          }
          return null;
        })}
      </div>
    </div>
  );
};

// Tab Panel Component
interface TabPanelProps {
  tabId: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ tabId, children, className = '' }) => {
  return (
    <div className={`tab-panel ${className}`} data-tab={tabId}>
      {children}
    </div>
  );
};

export default ProfileTabs; 