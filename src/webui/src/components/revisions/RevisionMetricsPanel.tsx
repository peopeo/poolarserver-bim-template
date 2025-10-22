/**
 * RevisionMetricsPanel Component
 *
 * Displays detailed processing metrics for a specific revision including:
 * - Timing breakdown (parse, extraction, spatial tree, glTF export)
 * - Element statistics by type
 * - Property and quantity statistics
 * - Output file statistics
 * - Success/failure status with error details
 */

import React, { useState, useEffect } from 'react';
import { getRevisionMetrics, type ProcessingMetricsResponse } from '../../services/api/metricsApi';

interface RevisionMetricsPanelProps {
  /** Revision ID to load metrics for */
  revisionId: number;

  /** Dark mode state */
  darkMode: boolean;

  /** Whether the panel is initially expanded */
  initiallyExpanded?: boolean;
}

export function RevisionMetricsPanel({
  revisionId,
  darkMode,
  initiallyExpanded = false,
}: RevisionMetricsPanelProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ProcessingMetricsResponse | null>(null);

  useEffect(() => {
    if (expanded && !metrics) {
      loadMetrics();
    }
  }, [expanded, revisionId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRevisionMetrics(revisionId);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (bytes === null) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div
      className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${
        expanded ? 'bg-opacity-50' : ''
      }`}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
          darkMode
            ? 'text-gray-300 hover:bg-gray-700/50'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          <span className="text-sm font-medium">Processing Metrics</span>
          {metrics && (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                metrics.success
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {metrics.processingEngine}
            </span>
          )}
        </div>
        {metrics && (
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {formatDuration(metrics.timings?.totalProcessingTimeMs || null)}
          </span>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className={`px-4 pb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {metrics && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div
                className={`p-3 rounded ${
                  metrics.success
                    ? darkMode
                      ? 'bg-green-900/20 border border-green-700'
                      : 'bg-green-50 border border-green-200'
                    : darkMode
                    ? 'bg-red-900/20 border border-red-700'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${metrics.success ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.success ? 'Processing Successful' : 'Processing Failed'}
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Engine: {metrics.processingEngine} | File: {formatFileSize(metrics.fileSizeBytes)}
                    </p>
                  </div>
                  {metrics.warningCount > 0 && (
                    <span className="text-xs px-2 py-1 bg-yellow-500 text-white rounded">
                      {metrics.warningCount} warning{metrics.warningCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {metrics.errorMessage && (
                  <p className="text-xs mt-2 text-red-600 font-mono">{metrics.errorMessage}</p>
                )}
              </div>

              {/* Timing Breakdown */}
              {metrics.timings && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Timing Breakdown</h4>
                  <div className={`space-y-2 text-xs ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} p-3 rounded`}>
                    <TimingRow
                      label="Parse"
                      timeMs={metrics.timings.parseTimeMs}
                      percent={metrics.timings.parsePercent}
                      darkMode={darkMode}
                    />
                    <TimingRow
                      label="Element Extraction"
                      timeMs={metrics.timings.elementExtractionTimeMs}
                      percent={metrics.timings.elementExtractionPercent}
                      darkMode={darkMode}
                    />
                    <TimingRow
                      label="Spatial Tree"
                      timeMs={metrics.timings.spatialTreeTimeMs}
                      percent={metrics.timings.spatialTreePercent}
                      darkMode={darkMode}
                    />
                    <TimingRow
                      label="glTF Export"
                      timeMs={metrics.timings.gltfExportTimeMs}
                      percent={metrics.timings.gltfExportPercent}
                      darkMode={darkMode}
                    />
                    <div className={`pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatDuration(metrics.timings.totalProcessingTimeMs)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Element Statistics */}
              {metrics.elements && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Element Statistics</h4>
                  <div className={`grid grid-cols-2 gap-2 text-xs ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} p-3 rounded`}>
                    <StatItem label="Total Elements" value={metrics.elements.totalElementCount} />
                    <StatItem label="Walls" value={metrics.elements.ifcWallCount} />
                    <StatItem label="Slabs" value={metrics.elements.ifcSlabCount} />
                    <StatItem label="Beams" value={metrics.elements.ifcBeamCount} />
                    <StatItem label="Columns" value={metrics.elements.ifcColumnCount} />
                    <StatItem label="Doors" value={metrics.elements.ifcDoorCount} />
                    <StatItem label="Windows" value={metrics.elements.ifcWindowCount} />
                    <StatItem label="Stairs" value={metrics.elements.ifcStairCount} />
                    <StatItem label="Railings" value={metrics.elements.ifcRailingCount} />
                    <StatItem label="Roofs" value={metrics.elements.ifcRoofCount} />
                    <StatItem label="Coverings" value={metrics.elements.ifcCoveringCount} />
                    <StatItem label="Furnishing" value={metrics.elements.ifcFurnishingCount} />
                    <StatItem label="Spaces" value={metrics.elements.ifcSpaceCount} />
                    <StatItem label="Other" value={metrics.elements.otherElementCount} />
                  </div>
                </div>
              )}

              {/* Properties & Output */}
              <div className="grid grid-cols-2 gap-4">
                {/* Property Statistics */}
                {metrics.properties && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Properties</h4>
                    <div className={`space-y-1 text-xs ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} p-3 rounded`}>
                      <StatItem label="Property Sets" value={metrics.properties.totalPropertySets} />
                      <StatItem label="Properties" value={metrics.properties.totalProperties} />
                      <StatItem label="Quantities" value={metrics.properties.totalQuantities} />
                    </div>
                  </div>
                )}

                {/* Output Statistics */}
                {metrics.outputs && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Output</h4>
                    <div className={`space-y-1 text-xs ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} p-3 rounded`}>
                      <div className="flex justify-between">
                        <span>glTF Size:</span>
                        <span className="font-mono">{formatFileSize(metrics.outputs.gltfFileSizeBytes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tree Depth:</span>
                        <span className="font-mono">{metrics.outputs.spatialTreeDepth ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tree Nodes:</span>
                        <span className="font-mono">{metrics.outputs.spatialTreeNodeCount ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                <p>Started: {new Date(metrics.startedAt).toLocaleString()}</p>
                {metrics.completedAt && (
                  <p>Completed: {new Date(metrics.completedAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper components
function TimingRow({
  label,
  timeMs,
  percent,
  darkMode,
}: {
  label: string;
  timeMs: number | null;
  percent: number | null;
  darkMode: boolean;
}) {
  const formatDuration = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span className="font-mono">
          {formatDuration(timeMs)} {percent !== null && `(${percent.toFixed(1)}%)`}
        </span>
      </div>
      {percent !== null && (
        <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <span className="font-mono font-medium">{value.toLocaleString()}</span>
    </div>
  );
}
