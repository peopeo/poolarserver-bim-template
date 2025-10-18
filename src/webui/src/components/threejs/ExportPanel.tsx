/**
 * ExportPanel Component
 *
 * UI for exporting 2D screenshots/images of the 3D view
 */

import React, { useState } from 'react';
import { Download, X, Camera } from 'lucide-react';

interface ExportPanelProps {
  /** Export current view */
  onExport: (options: ExportOptionsUI) => void;

  /** Export orthographic view */
  onExportOrthographic: (axis: 'x' | 'y' | 'z', options: ExportOptionsUI) => void;

  /** Last export result info */
  lastExportInfo?: {
    width: number;
    height: number;
    size: number;
    timestamp: Date;
  };

  /** Dark mode */
  darkMode?: boolean;
}

export interface ExportOptionsUI {
  width?: number;
  height?: number;
  format: 'png' | 'jpeg';
  quality?: number;
  transparent?: boolean;
  backgroundColor?: string;
  filename?: string;
}

export function ExportPanel({
  onExport,
  onExportOrthographic,
  lastExportInfo,
  darkMode = false
}: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [transparent, setTransparent] = useState(false);
  const [quality, setQuality] = useState(92);
  const [resolution, setResolution] = useState<'current' | '1080p' | '4k'>('current');
  const [filename, setFilename] = useState('');

  const resolutionMap = {
    'current': undefined,
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 }
  };

  const handleExport = () => {
    const dims = resolutionMap[resolution];
    const options: ExportOptionsUI = {
      format,
      quality: quality / 100,
      transparent: format === 'png' ? transparent : false,
      filename: filename || `export-${Date.now()}.${format}`,
      ...(dims || {})
    };

    onExport(options);
  };

  const handleExportOrtho = (axis: 'x' | 'y' | 'z') => {
    const dims = resolutionMap[resolution];
    const axisNames = { x: 'front', y: 'top', z: 'side' };
    const options: ExportOptionsUI = {
      format,
      quality: quality / 100,
      transparent: format === 'png' ? transparent : false,
      filename: filename || `export-${axisNames[axis]}-${Date.now()}.${format}`,
      ...(dims || {})
    };

    onExportOrthographic(axis, options);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleTimeString();
  };

  return (
    <div className="absolute bottom-4 right-4 z-10">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'
          } border`}
          title="Open Export Panel"
        >
          <Download size={18} />
          <span className="text-sm font-medium">Export</span>
        </button>
      ) : (
        <div
          className={`w-80 rounded-lg shadow-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Download size={18} />
              <h3 className="font-semibold text-sm">Export 2D Image</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Format Selection */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('png')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    format === 'png'
                      ? 'bg-blue-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setFormat('jpeg')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    format === 'jpeg'
                      ? 'bg-blue-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  JPEG
                </button>
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as 'current' | '1080p' | '4k')}
                className={`w-full px-3 py-2 rounded border text-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="current">Current View</option>
                <option value="1080p">1080p (1920×1080)</option>
                <option value="4k">4K (3840×2160)</option>
              </select>
            </div>

            {/* PNG Options */}
            {format === 'png' && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(e) => setTransparent(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Transparent Background
                  </span>
                </label>
              </div>
            )}

            {/* Quality (JPEG only) */}
            {format === 'jpeg' && (
              <div>
                <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Filename */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filename (optional)
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={`export-${Date.now()}.${format}`}
                className={`w-full px-3 py-2 rounded border text-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Export Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Camera size={16} />
                Export Current View
              </button>

              <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-3 mb-1`}>
                Orthographic Views
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExportOrtho('x')}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Front (X)
                </button>
                <button
                  onClick={() => handleExportOrtho('y')}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Top (Y)
                </button>
                <button
                  onClick={() => handleExportOrtho('z')}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Side (Z)
                </button>
              </div>
            </div>

            {/* Last Export Info */}
            {lastExportInfo && (
              <div className={`text-xs p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Last export: {lastExportInfo.width}×{lastExportInfo.height}
                </div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {formatFileSize(lastExportInfo.size)} • {formatDate(lastExportInfo.timestamp)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
