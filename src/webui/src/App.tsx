import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { XeokitViewer } from './components/viewer/XeokitViewer';
import { useDarkMode } from './hooks/useDarkMode';
import { MenuSection, SubItem } from './types';

export default function Dashboard(): JSX.Element {
  const { darkMode, toggleDarkMode } = useDarkMode();

  const menuItems: MenuSection[] = [
    {
      category: 'BIM MANAGEMENT',
      items: [
        { label: 'Dashboard', expandable: false, active: true },
        { label: 'Projects', expandable: true, key: 'projects' },
        { label: 'Models', expandable: false }
      ]
    },
    {
      category: 'TRANSFORMATION',
      items: [
        { label: 'Upload IFC', expandable: false },
        { label: 'Job Queue', expandable: false },
        { label: 'History', expandable: false }
      ]
    },
    {
      category: 'SETTINGS',
      items: [
        { label: 'Configuration', expandable: false },
        { label: 'Users', expandable: false, disabled: true }
      ]
    }
  ];

  const subItems: Record<string, SubItem[]> = {
    projects: [
      { label: 'All Projects' },
      { label: 'Active Projects' },
      { label: 'Archived', badge: '5' }
    ]
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Sidebar */}
      <Sidebar darkMode={darkMode} menuItems={menuItems} subItems={subItems} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Full-height Xeokit Viewer */}
          <XeokitViewer darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
