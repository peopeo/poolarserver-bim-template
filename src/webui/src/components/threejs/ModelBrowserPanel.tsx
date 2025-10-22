/**
 * ModelBrowserPanel Component
 *
 * Browse and load IFC models from the database
 */

import React, { useState, useEffect } from 'react';
import { Database, X, Download, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { getStoredModels, getStoredModelGltfUrl, type StoredModelsResponse } from '../../services/api/ifcIntelligenceApi';

interface ModelBrowserPanelProps {
  /** Load model from database by ID */
  onLoadModel: (id: number, name: string) => void;

  /** Current loading status */
  isLoading?: boolean;

  /** Dark mode */
  darkMode?: boolean;
}

export function ModelBrowserPanel({
  onLoadModel,
  isLoading = false,
  darkMode = false
}: ModelBrowserPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<StoredModelsResponse | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'IFC4' | 'IFC2X3'>('completed');

  // Load models when panel opens
  useEffect(() => {
    if (isOpen && !models) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    setLoadingModels(true);
    setError(null);

    try {
      const conversionStatus = selectedFilter === 'completed' ? 'completed' : undefined;
      const schema = selectedFilter === 'IFC4' || selectedFilter === 'IFC2X3' ? selectedFilter : undefined;

      const data = await getStoredModels(0, 50, schema, conversionStatus);
      setModels(data);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleLoadModel = (id: number, fileName: string) => {
    onLoadModel(id, fileName);
    setIsOpen(false);
  };

  const handleRefresh = () => {
    setModels(null);
    loadModels();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'processing':
        return <Clock size={16} className="text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'
          } border`}
          title="Browse Database Models"
        >
          <Database size={18} />
          <span className="text-sm font-medium">Browse Models</span>
        </button>
      ) : (
        <div
          className={`absolute top-full right-0 mt-2 w-[600px] rounded-lg shadow-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } max-h-[600px] flex flex-col`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Database size={20} />
              <span className="font-semibold">Stored IFC Models</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loadingModels}
                className={`p-1 rounded ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } ${loadingModels ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh"
              >
                <RefreshCw size={16} className={loadingModels ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex gap-2`}>
            {['all', 'completed', 'IFC4', 'IFC2X3'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setSelectedFilter(filter as any);
                  setModels(null);
                  setTimeout(loadModels, 0);
                }}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  selectedFilter === filter
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {filter === 'all' ? 'All Models' : filter === 'completed' ? 'Ready to Load' : filter}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-4 text-center">
                <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={loadModels}
                  className={`mt-2 px-3 py-1 rounded text-sm ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Retry
                </button>
              </div>
            ) : loadingModels ? (
              <div className="p-8 text-center">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-500">Loading models...</p>
              </div>
            ) : models && models.models.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {models.models.map((model) => (
                  <div
                    key={model.id}
                    className={`p-4 ${
                      darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(model.conversionStatus)}
                          <h3 className="font-medium truncate text-sm">
                            {model.fileName}
                          </h3>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          {model.projectName && (
                            <p className="truncate">
                              <span className="font-medium">Project:</span> {model.projectName}
                            </p>
                          )}
                          <p className="flex items-center gap-3 flex-wrap">
                            {model.schema && (
                              <span className={`px-2 py-0.5 rounded ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                {model.schema}
                              </span>
                            )}
                            <span>{formatFileSize(model.fileSizeBytes)}</span>
                            {model.gltfFileSizeBytes && (
                              <span className="text-green-600">
                                glTF: {formatFileSize(model.gltfFileSizeBytes)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs">
                            Uploaded: {formatDate(model.uploadedAt)}
                          </p>
                          {model.description && (
                            <p className="italic truncate">{model.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {model.conversionStatus === 'completed' ? (
                          <button
                            onClick={() => handleLoadModel(model.id, model.fileName)}
                            disabled={isLoading}
                            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                              isLoading
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : darkMode
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            <Download size={14} />
                            Load
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 text-xs text-gray-500 text-center">
                            {model.conversionStatus === 'processing' ? 'Converting...' :
                             model.conversionStatus === 'failed' ? 'Failed' :
                             'Pending'}
                          </div>
                        )}
                      </div>
                    </div>

                    {model.conversionError && (
                      <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        Error: {model.conversionError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Database size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-500 mb-2">No models found</p>
                <p className="text-xs text-gray-400">
                  Upload IFC files using the upload endpoint to see them here
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {models && models.totalCount > 0 && (
            <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-xs text-gray-500 text-center`}>
              Showing {models.models.length} of {models.totalCount} models
            </div>
          )}
        </div>
      )}
    </div>
  );
}
