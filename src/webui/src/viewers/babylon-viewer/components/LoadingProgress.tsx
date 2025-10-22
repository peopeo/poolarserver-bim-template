/**
 * LoadingProgress Component
 *
 * Displays loading progress for model loading in Babylon.js viewer
 */

import React from 'react';
import type { LoadingStatus } from '../../../types/threejs';

interface LoadingProgressProps {
  /** Loading status */
  status: LoadingStatus;

  /** Progress percentage (0-100) */
  progress: number;

  /** Status message */
  message: string;

  /** Error message if any */
  error?: string | null;

  /** Dark mode */
  darkMode?: boolean;
}

export function LoadingProgress({
  status,
  progress,
  message,
  error,
  darkMode = false
}: LoadingProgressProps): JSX.Element | null {
  // Don't show anything if idle or already loaded
  if (status === 'idle' || status === 'loaded') {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Status Header */}
        <div className="flex items-center gap-3 mb-4">
          {status === 'loading' ? (
            <>
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="text-lg font-semibold">Loading Model</h3>
            </>
          ) : status === 'error' ? (
            <>
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-xl">✕</span>
              </div>
              <h3 className="text-lg font-semibold text-red-500">Error</h3>
            </>
          ) : null}
        </div>

        {/* Status Message */}
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {message}
        </p>

        {/* Progress Bar (only show when loading) */}
        {status === 'loading' && (
          <div className="mb-2">
            <div
              className={`w-full h-2 rounded-full overflow-hidden ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className={`text-xs text-right mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {Math.round(progress)}%
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
