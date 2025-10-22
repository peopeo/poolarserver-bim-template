import React, { useEffect, useRef, useState } from 'react';
import { useXeokit } from '../../hooks/useXeokit';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './TreeView.css';

interface XeokitViewerProps {
  darkMode: boolean;
  projectId?: number | null;
}

export function XeokitViewer({ darkMode, projectId }: XeokitViewerProps) {
  const canvasId = 'xeokit-canvas';
  const treeViewContainerId = 'xeokit-treeview';
  const navCubeCanvasId = 'xeokit-navcube';

  const { viewerRef, treeViewRef, navCubeRef, isLoading, loadingStatus, reloadModels } = useXeokit(
    canvasId,
    treeViewContainerId,
    navCubeCanvasId
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [treeViewOpen, setTreeViewOpen] = useState<boolean>(true);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (canvas) {
          canvas.width = containerRef.current.offsetWidth;
          canvas.height = containerRef.current.offsetHeight;
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial resize
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResetView = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.eye = [110.27, 172.88, -6.49];
      viewerRef.current.camera.look = [33.88, 177.99, -101.79];
      viewerRef.current.camera.up = [0.02, 0.99, 0.03];
    }
  };

  const handleToggleEdges = () => {
    if (viewerRef.current) {
      const scene = viewerRef.current.scene;
      for (const id in scene.models) {
        const model = scene.models[id];
        model.edges = !model.edges;
      }
    }
  };

  const handleFitToView = () => {
    if (viewerRef.current) {
      viewerRef.current.cameraFlight.flyTo(viewerRef.current.scene);
    }
  };

  const handleReloadModel = () => {
    // Reload models without refreshing the page
    reloadModels();
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 m-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg overflow-hidden flex flex-col shadow-xl`}
    >
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <h2 className="text-lg font-semibold">BIM Model Viewer - West Riverside Hospital</h2>
        <p className={`text-sm mt-1 ${isLoading ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`}>
          {loadingStatus}
        </p>
      </div>

      <div className="flex-1 relative">
        {/* TreeView Panel */}
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-300 z-10 ${
            treeViewOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div
            className={`h-full ${
              darkMode ? 'bg-gray-800 bg-opacity-95' : 'bg-white bg-opacity-95'
            } ${treeViewOpen ? 'border-r' : ''} ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } overflow-hidden flex flex-col`}
            style={{ visibility: treeViewOpen ? 'visible' : 'hidden' }}
          >
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="font-semibold text-sm">Model Structure</h3>
            </div>
            <div
              id={treeViewContainerId}
              className={`flex-1 overflow-auto p-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* TreeView Toggle Button */}
        <button
          onClick={() => setTreeViewOpen(!treeViewOpen)}
          className={`absolute ${
            treeViewOpen ? 'left-80' : 'left-0'
          } top-4 z-20 transition-all duration-300 ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
          } p-2 rounded-r shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          title={treeViewOpen ? 'Hide Structure' : 'Show Structure'}
        >
          {treeViewOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Main Canvas */}
        <canvas
          id={canvasId}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* NavCube Canvas */}
        <canvas
          id={navCubeCanvasId}
          className="absolute"
          style={{
            width: '200px',
            height: '200px',
            bottom: '120px',
            right: '20px',
            zIndex: 1000,
            pointerEvents: 'all'
          }}
        />
      </div>

      <div
        className={`px-6 py-3 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        } flex gap-2 flex-wrap`}
      >
        <button
          onClick={handleResetView}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Reset View
        </button>
        <button
          onClick={handleToggleEdges}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Toggle Edges
        </button>
        <button
          onClick={handleFitToView}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Fit to View
        </button>
        <button
          onClick={() => setTreeViewOpen(!treeViewOpen)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {treeViewOpen ? 'Hide' : 'Show'} Structure
        </button>
        <button
          onClick={handleReloadModel}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium ml-auto ${
            isLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Reload Model
        </button>
      </div>
    </div>
  );
}
