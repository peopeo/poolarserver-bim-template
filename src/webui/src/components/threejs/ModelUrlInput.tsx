/**
 * ModelUrlInput Component
 *
 * UI for loading custom glTF models from URL
 */

import React, { useState } from 'react';
import { Link, X, Upload } from 'lucide-react';

interface ModelUrlInputProps {
  /** Load model from URL */
  onLoadUrl: (url: string) => void;

  /** Current loading status */
  isLoading?: boolean;

  /** Error message */
  error?: string;

  /** Dark mode */
  darkMode?: boolean;
}

// Popular glTF sample models
const SAMPLE_MODELS = [
  {
    name: 'Box (Simple)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb'
  },
  {
    name: 'Duck',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb'
  },
  {
    name: 'Avocado',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb'
  },
  {
    name: 'Damaged Helmet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'
  },
  {
    name: 'Flight Helmet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf'
  },
  {
    name: 'Lantern',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb'
  }
];

export function ModelUrlInput({
  onLoadUrl,
  isLoading = false,
  error,
  darkMode = false
}: ModelUrlInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');

  const handleLoad = () => {
    if (url.trim()) {
      onLoadUrl(url.trim());
      setUrl('');
    }
  };

  const handleLoadSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onLoadUrl(sampleUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      handleLoad();
    }
  };

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'
          } border`}
          title="Load Model from URL"
        >
          <Upload size={18} />
          <span className="text-sm font-medium">Load Model</span>
        </button>
      ) : (
        <div
          className={`w-96 rounded-lg shadow-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Upload size={18} />
              <h3 className="font-semibold text-sm">Load glTF Model</h3>
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
            {/* URL Input */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model URL (.gltf or .glb)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="https://example.com/model.glb"
                  disabled={isLoading}
                  className={`flex-1 px-3 py-2 rounded border text-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={handleLoad}
                  disabled={!url.trim() || isLoading}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    !url.trim() || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Link size={16} />
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}

            {/* Sample Models */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sample Models (Khronos glTF)
              </label>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {SAMPLE_MODELS.map((sample) => (
                  <button
                    key={sample.url}
                    onClick={() => handleLoadSample(sample.url)}
                    disabled={isLoading}
                    className={`w-full text-left px-3 py-2 rounded text-xs ${
                      darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-medium">{sample.name}</div>
                    <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {sample.url}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className={`text-xs p-2 rounded ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              <strong>Tips:</strong>
              <ul className="ml-4 mt-1 list-disc">
                <li>Supports .glb (binary) and .gltf (JSON) formats</li>
                <li>URL must be publicly accessible (CORS enabled)</li>
                <li>Press Enter to load</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
