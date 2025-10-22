/**
 * MetricsDashboard Component
 *
 * Comprehensive dashboard for viewing processing metrics across all engines including:
 * - Engine performance statistics (success rate, processing times, element counts)
 * - Recent failures with error details
 * - Performance trends by file size
 * - CSV export functionality
 * - Engine comparison (when multiple engines are available)
 */

import React, { useState, useEffect } from 'react';
import {
  getEngineStatistics,
  getFailures,
  getPerformanceByFileSize,
  downloadMetricsCSV,
  type EngineStatisticsResponse,
  type FailureReportResponse,
  type PerformanceByFileSizeResponse,
} from '../../services/api/metricsApi';

interface MetricsDashboardProps {
  /** Dark mode state */
  darkMode: boolean;
}

export function MetricsDashboard({ darkMode }: MetricsDashboardProps) {
  const [selectedEngine, setSelectedEngine] = useState<'IfcOpenShell' | 'Xbim'>('IfcOpenShell');
  const [statistics, setStatistics] = useState<EngineStatisticsResponse | null>(null);
  const [failures, setFailures] = useState<FailureReportResponse[]>([]);
  const [performanceBySize, setPerformanceBySize] = useState<PerformanceByFileSizeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedEngine]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data in parallel
      const [statsData, failuresData, perfData] = await Promise.all([
        getEngineStatistics(selectedEngine),
        getFailures(selectedEngine, 10),
        getPerformanceByFileSize(),
      ]);

      setStatistics(statsData);
      setFailures(failuresData);
      setPerformanceBySize(perfData.filter((p) => p.processingEngine === selectedEngine));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const filename = `${selectedEngine.toLowerCase()}-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      await downloadMetricsCSV(selectedEngine, undefined, undefined, filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatFileSize = (mb: number | null): string => {
    if (mb === null) return 'N/A';
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Processing Metrics Dashboard
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Performance analysis and reliability metrics for IFC processing engines
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </>
          )}
        </button>
      </div>

      {/* Engine Selector */}
      <div
        className={`inline-flex rounded-lg p-1 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'
        } border`}
      >
        <button
          onClick={() => setSelectedEngine('IfcOpenShell')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedEngine === 'IfcOpenShell'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-blue-600 shadow-sm'
              : darkMode
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          IfcOpenShell
        </button>
        <button
          onClick={() => setSelectedEngine('Xbim')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedEngine === 'Xbim'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-blue-600 shadow-sm'
              : darkMode
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          XBIM Toolkit
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && !error && statistics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Jobs"
              value={statistics.totalJobs.toLocaleString()}
              darkMode={darkMode}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />
            <SummaryCard
              title="Success Rate"
              value={`${statistics.successRatePercent.toFixed(1)}%`}
              subtitle={`${statistics.successfulJobs} successful, ${statistics.failedJobs} failed`}
              darkMode={darkMode}
              valueColor={statistics.successRatePercent >= 90 ? 'text-green-600' : statistics.successRatePercent >= 70 ? 'text-yellow-600' : 'text-red-600'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <SummaryCard
              title="Avg Processing Time"
              value={formatDuration(statistics.averageProcessingTimeMs)}
              subtitle={`Median: ${formatDuration(statistics.medianProcessingTimeMs)}`}
              darkMode={darkMode}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <SummaryCard
              title="Total Elements"
              value={statistics.totalElementsProcessed.toLocaleString()}
              subtitle={`Avg: ${statistics.averageElementCount?.toLocaleString() ?? 'N/A'} per file`}
              darkMode={darkMode}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              }
            />
          </div>

          {/* Performance by File Size */}
          {performanceBySize.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Performance by File Size
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-2 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>File Size Range</th>
                      <th className={`text-right py-2 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jobs</th>
                      <th className={`text-right py-2 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg Time</th>
                      <th className={`text-right py-2 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg Elements</th>
                      <th className={`text-right py-2 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ms/Element</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceBySize.map((perf, index) => (
                      <tr key={index} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className={`py-2 px-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{perf.fileSizeRange}</td>
                        <td className={`text-right py-2 px-3 font-mono ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{perf.jobCount}</td>
                        <td className={`text-right py-2 px-3 font-mono ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{formatDuration(perf.avgProcessingTimeMs)}</td>
                        <td className={`text-right py-2 px-3 font-mono ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{perf.avgElementCount?.toFixed(0) ?? 'N/A'}</td>
                        <td className={`text-right py-2 px-3 font-mono ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{perf.msPerElement?.toFixed(2) ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Failures */}
          {failures.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Failures ({failures.length})
              </h2>
              <div className="space-y-3">
                {failures.map((failure) => (
                  <div
                    key={failure.metricId}
                    className={`p-4 rounded border ${darkMode ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {failure.ifcFileName}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatFileSize(failure.fileSizeMb)} | {new Date(failure.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-500 text-white rounded">
                        Revision #{failure.revisionId}
                      </span>
                    </div>
                    <p className="text-xs text-red-600 font-mono mt-2">{failure.errorMessage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Failure Reasons */}
          {statistics.topFailureReasons && statistics.topFailureReasons.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Failure Reasons
              </h2>
              <div className="space-y-2">
                {statistics.topFailureReasons.map((reason, index) => (
                  <div key={index} className={`p-3 rounded ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {reason.errorMessage}
                      </span>
                      <span className="text-xs px-2 py-1 bg-red-500 text-white rounded">
                        {reason.count} ({reason.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${reason.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper component for summary cards
function SummaryCard({
  title,
  value,
  subtitle,
  darkMode,
  icon,
  valueColor,
}: {
  title: string;
  value: string;
  subtitle?: string;
  darkMode: boolean;
  icon?: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        {icon && <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{icon}</div>}
      </div>
      <p className={`text-2xl font-bold ${valueColor || (darkMode ? 'text-white' : 'text-gray-900')}`}>{value}</p>
      {subtitle && <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>}
    </div>
  );
}
