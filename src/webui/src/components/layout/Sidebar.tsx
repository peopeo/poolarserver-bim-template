import React, { useState } from 'react';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { MenuItem, MenuSection, SubItem, ExpandedItems } from '../../types';

interface SidebarProps {
  darkMode: boolean;
  menuItems: MenuSection[];
  subItems: Record<string, SubItem[]>;
}

export function Sidebar({ darkMode, menuItems, subItems }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [expandedItems, setExpandedItems] = useState<ExpandedItems>({ components: false });

  const toggleExpandItem = (item: string): void => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 flex flex-col border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          {sidebarOpen && <h1 className="text-2xl font-bold text-blue-600">BIM Portal</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {sidebarOpen ? <ChevronDown size={20} className="rotate-90" /> : <Menu size={20} />}
          </button>
        </div>
        {sidebarOpen && (
          <div className="text-sm">
            <p className="font-semibold">BIM Administrator</p>
            <p className="text-gray-500 text-xs">System Manager</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-3">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {sidebarOpen && <p className="text-xs font-bold text-gray-500 mb-2 px-2">{section.category}</p>}
            {section.items.map((item, itemIdx) => (
              <div key={itemIdx}>
                <button
                  onClick={() => item.expandable && item.key && toggleExpandItem(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? 'bg-blue-600 text-white'
                      : item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : `hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {sidebarOpen && item.label}
                  </span>
                  {sidebarOpen && item.expandable && (
                    <ChevronRight
                      size={16}
                      className={`transition-transform ${item.key && expandedItems[item.key] ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>

                {/* Sub-items */}
                {sidebarOpen && item.expandable && item.key && expandedItems[item.key] && (
                  <div className="ml-4 mt-1">
                    {subItems[item.key]?.map((subItem, subIdx) => (
                      <button
                        key={subIdx}
                        className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        {subItem.label}
                        {subItem.badge && (
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {subItem.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}
