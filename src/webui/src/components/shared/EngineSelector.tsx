/**
 * EngineSelector Component
 *
 * Toggle button to switch between IfcOpenShell and XBIM processing engines
 * Used during IFC file upload to specify which backend engine should process the file
 */

import React from 'react';

export type ProcessingEngine = 'IfcOpenShell' | 'Xbim';

interface EngineSelectorProps {
  /** Currently selected engine */
  selectedEngine: ProcessingEngine;

  /** Callback when engine selection changes */
  onSelect: (engine: ProcessingEngine) => void;

  /** Dark mode state */
  darkMode?: boolean;

  /** Whether XBIM option is enabled (default: true - XBIM is now available on .NET 9) */
  xbimEnabled?: boolean;
}

export function EngineSelector({
  selectedEngine,
  onSelect,
  darkMode = false,
  xbimEnabled = true,
}: EngineSelectorProps) {
  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Processing Engine
      </label>
      <div
        className={`inline-flex rounded-lg p-1 w-full ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'
        } border`}
      >
        <button
          type="button"
          onClick={() => onSelect('IfcOpenShell')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedEngine === 'IfcOpenShell'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-blue-600 shadow-sm'
              : darkMode
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>IfcOpenShell</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                selectedEngine === 'IfcOpenShell'
                  ? 'bg-green-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              Python
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => xbimEnabled && onSelect('Xbim')}
          disabled={!xbimEnabled}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedEngine === 'Xbim'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-blue-600 shadow-sm'
              : xbimEnabled
              ? darkMode
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
              : darkMode
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title={
            !xbimEnabled
              ? 'XBIM engine currently unavailable'
              : undefined
          }
        >
          <div className="flex items-center justify-center gap-2">
            <span>XBIM Toolkit</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                selectedEngine === 'Xbim'
                  ? 'bg-purple-500 text-white'
                  : !xbimEnabled
                  ? darkMode
                    ? 'bg-gray-700 text-gray-600'
                    : 'bg-gray-300 text-gray-500'
                  : darkMode
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {xbimEnabled ? 'C#' : 'Coming Soon'}
            </span>
          </div>
        </button>
      </div>

      {/* Description of selected engine */}
      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {selectedEngine === 'IfcOpenShell' ? (
          <div className="flex items-start gap-1.5">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Python-based IFC processing with IfcOpenShell library. Mature, stable, and widely used in the
              industry.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-1.5">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {xbimEnabled
                ? 'Native C# IFC processing with XBIM Toolkit 6.0 on .NET 9. Optimized for .NET environments with potential performance benefits.'
                : 'Native C# IFC processing with XBIM Toolkit. Currently unavailable.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
