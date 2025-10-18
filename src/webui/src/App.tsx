import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { XeokitViewer } from './components/viewer/XeokitViewer';
import { ThreeJsViewer } from './viewers/threejs-viewer';
import { ViewerSelector } from './components/shared';
import { useDarkMode } from './hooks/useDarkMode';
import type { ViewerType } from './types/threejs';

export default function Dashboard(): JSX.Element {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [activeViewer, setActiveViewer] = useState<ViewerType>('xeokit');

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        {/* Viewer Selector */}
        <div className={`px-4 py-3 ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
          <ViewerSelector
            activeViewer={activeViewer}
            onSelect={setActiveViewer}
            darkMode={darkMode}
          />
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Conditional Viewer Rendering */}
          {activeViewer === 'xeokit' ? (
            <XeokitViewer darkMode={darkMode} />
          ) : (
            <ThreeJsViewer darkMode={darkMode} />
          )}
        </div>
      </div>
    </div>
  );
}
