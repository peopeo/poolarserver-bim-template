import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { XeokitViewer } from './components/viewer/XeokitViewer';
import { ThreeJsViewer } from './viewers/threejs-viewer';
import { ViewerSelector } from './components/shared';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { useDarkMode } from './hooks/useDarkMode';
import type { ViewerType } from './types/threejs';

type PageType = 'projects' | 'viewer' | 'project-detail';

export default function Dashboard(): JSX.Element {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [activePage, setActivePage] = useState<PageType>('projects');
  const [activeViewer, setActiveViewer] = useState<ViewerType>('xeokit');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [viewerProjectId, setViewerProjectId] = useState<number | null>(null);
  const [viewerRevisionId, setViewerRevisionId] = useState<number | null>(null);

  // Handle hash-based routing for project details
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const projectMatch = hash.match(/#\/projects\/(\d+)/);
      if (projectMatch) {
        setSelectedProjectId(parseInt(projectMatch[1]));
        setActivePage('project-detail');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleBackToProjects = () => {
    window.location.hash = '';
    setActivePage('projects');
    setSelectedProjectId(null);
  };

  const handleViewRevisionIn3D = (projectId: number, revisionId: number) => {
    setViewerProjectId(projectId);
    setViewerRevisionId(revisionId);
    setActivePage('viewer');
    setActiveViewer('threejs'); // Use ThreeJS viewer for project revisions
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        {/* Navigation Tabs */}
        <div className={`px-4 py-3 ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex gap-4">
            <button
              onClick={() => setActivePage('projects')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePage === 'projects'
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActivePage('viewer')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePage === 'viewer'
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Viewer
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activePage === 'projects' ? (
            <ProjectsPage darkMode={darkMode} />
          ) : activePage === 'project-detail' && selectedProjectId ? (
            <ProjectDetailPage
              darkMode={darkMode}
              projectId={selectedProjectId}
              onBack={handleBackToProjects}
              onViewRevisionIn3D={handleViewRevisionIn3D}
            />
          ) : (
            <div className="h-full flex flex-col">
              {/* Viewer Selector */}
              <div className={`px-4 py-3 ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
                <ViewerSelector
                  activeViewer={activeViewer}
                  onSelect={setActiveViewer}
                  darkMode={darkMode}
                />
              </div>

              {/* Viewer */}
              <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                {activeViewer === 'xeokit' ? (
                  <XeokitViewer darkMode={darkMode} projectId={viewerProjectId} />
                ) : (
                  <ThreeJsViewer darkMode={darkMode} projectId={viewerProjectId} revisionId={viewerRevisionId} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
