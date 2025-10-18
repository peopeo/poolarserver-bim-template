/**
 * ViewerSelector Component
 *
 * Toggle button to switch between xeokit and Three.js viewers
 */

import React from 'react';
import type { ViewerType } from '../../types/threejs';

interface ViewerSelectorProps {
  /** Currently active viewer */
  activeViewer: ViewerType;

  /** Callback when viewer selection changes */
  onSelect: (viewer: ViewerType) => void;

  /** Dark mode state */
  darkMode?: boolean;
}

export function ViewerSelector({ activeViewer, onSelect, darkMode = false }: ViewerSelectorProps) {
  return (
    <div
      className={`inline-flex rounded-lg p-1 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'
      } border`}
    >
      <button
        onClick={() => onSelect('xeokit')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeViewer === 'xeokit'
            ? darkMode
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-blue-600 shadow-sm'
            : darkMode
            ? 'text-gray-300 hover:text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        xeokit Viewer
      </button>
      <button
        onClick={() => onSelect('threejs')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeViewer === 'threejs'
            ? darkMode
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-blue-600 shadow-sm'
            : darkMode
            ? 'text-gray-300 hover:text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Three.js Viewer
        <span
          className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
            activeViewer === 'threejs'
              ? 'bg-blue-500 text-white'
              : darkMode
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-300 text-gray-600'
          }`}
        >
          PoC
        </span>
      </button>
    </div>
  );
}
