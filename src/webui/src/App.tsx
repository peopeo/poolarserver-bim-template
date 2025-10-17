import React from 'react';
import { Header } from './components/layout/Header';
import { XeokitViewer } from './components/viewer/XeokitViewer';
import { useDarkMode } from './hooks/useDarkMode';

export default function Dashboard(): JSX.Element {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Full-width Xeokit Viewer */}
          <XeokitViewer darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
