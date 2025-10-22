/**
 * Metrics API Client
 *
 * Provides methods to interact with the Metrics endpoints for:
 * - Fetching processing metrics for individual revisions
 * - Comparing performance between IfcOpenShell and XBIM engines
 * - Viewing aggregate statistics and failure reports
 * - Exporting metrics to CSV
 */

const API_BASE_URL = '/api';

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  message?: string;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface TimingMetrics {
  totalProcessingTimeMs: number | null;
  parseTimeMs: number | null;
  elementExtractionTimeMs: number | null;
  spatialTreeTimeMs: number | null;
  gltfExportTimeMs: number | null;
  parsePercent: number | null;
  elementExtractionPercent: number | null;
  spatialTreePercent: number | null;
  gltfExportPercent: number | null;
}

export interface ElementStatistics {
  totalElementCount: number;
  ifcWallCount: number;
  ifcSlabCount: number;
  ifcBeamCount: number;
  ifcColumnCount: number;
  ifcDoorCount: number;
  ifcWindowCount: number;
  ifcStairCount: number;
  ifcRailingCount: number;
  ifcRoofCount: number;
  ifcCoveringCount: number;
  ifcFurnishingCount: number;
  ifcSpaceCount: number;
  otherElementCount: number;
}

export interface PropertyStatistics {
  totalPropertySets: number;
  totalProperties: number;
  totalQuantities: number;
}

export interface OutputStatistics {
  gltfFileSizeBytes: number | null;
  gltfFileSizeMb: number | null;
  spatialTreeDepth: number | null;
  spatialTreeNodeCount: number | null;
}

export interface ResourceMetrics {
  peakMemoryMb: number | null;
  cpuTimeMs: number | null;
}

export interface ProcessingMetricsResponse {
  id: number;
  revisionId: number;
  processingEngine: string;
  fileSizeBytes: number;
  fileSizeMb: number;
  fileName: string;
  timings: TimingMetrics | null;
  elements: ElementStatistics | null;
  properties: PropertyStatistics | null;
  outputs: OutputStatistics | null;
  resources: ResourceMetrics | null;
  success: boolean;
  errorMessage: string | null;
  warningCount: number;
  startedAt: string;
  completedAt: string | null;
  totalDurationSeconds: number | null;
}

export interface ComparisonSummary {
  fasterEngine: string | null;
  speedDifferenceMs: number | null;
  speedDifferencePercent: number | null;
  speedSummary: string | null;
  elementCountsMatch: boolean;
  elementCountDifference: number | null;
  elementCountSummary: string | null;
  moreReliableEngine: string | null;
  warningDifference: number | null;
  reliabilitySummary: string | null;
  smallerGltfEngine: string | null;
  gltfSizeDifferenceBytes: number | null;
  gltfSizeDifferenceMb: number | null;
  gltfSizeSummary: string | null;
  recommendation: string | null;
}

export interface ComparisonInfo {
  fileName: string;
  fileSizeBytes: number;
  fileSizeMb: number;
  comparisonDate: string;
}

export interface EngineComparisonResponse {
  comparison: ComparisonInfo;
  ifcOpenShell: ProcessingMetricsResponse | null;
  xbim: ProcessingMetricsResponse | null;
  summary: ComparisonSummary;
}

export interface FailureReason {
  errorMessage: string;
  count: number;
  percentage: number;
}

export interface EngineStatisticsResponse {
  engine: string;
  startDate: string | null;
  endDate: string | null;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  successRatePercent: number;
  averageProcessingTimeMs: number | null;
  medianProcessingTimeMs: number | null;
  minProcessingTimeMs: number | null;
  maxProcessingTimeMs: number | null;
  averageElementCount: number | null;
  totalElementsProcessed: number;
  averageFileSizeMb: number | null;
  minFileSizeMb: number | null;
  maxFileSizeMb: number | null;
  topFailureReasons: FailureReason[] | null;
}

export interface FailureReportResponse {
  metricId: number;
  revisionId: number;
  processingEngine: string;
  ifcFileName: string;
  fileSizeMb: number;
  errorMessage: string;
  errorStackTrace: string | null;
  startedAt: string;
  completedAt: string | null;
  totalProcessingTimeMs: number | null;
}

export interface ProcessingLogResponse {
  id: number;
  revisionId: number;
  processingEngine: string;
  logLevel: string;
  message: string;
  exception: string | null;
  additionalData: Record<string, any> | null;
  timestamp: string;
}

export interface PerformanceByFileSizeResponse {
  processingEngine: string;
  fileSizeRange: string;
  jobCount: number;
  avgProcessingTimeMs: number | null;
  avgElementCount: number | null;
  msPerElement: number | null;
}

// ============================================================================
// Metrics API Methods
// ============================================================================

/**
 * Get processing metrics for a specific revision
 *
 * @param revisionId - Revision ID
 * @returns Promise resolving to processing metrics
 */
export async function getRevisionMetrics(revisionId: number): Promise<ProcessingMetricsResponse> {
  const response = await fetch(`${API_BASE_URL}/metrics/revisions/${revisionId}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Compare two engines processing the same file
 *
 * @param ifcOpenShellRevisionId - IfcOpenShell revision ID
 * @param xbimRevisionId - XBIM revision ID
 * @returns Promise resolving to engine comparison
 */
export async function compareEngines(
  ifcOpenShellRevisionId: number,
  xbimRevisionId: number
): Promise<EngineComparisonResponse> {
  const params = new URLSearchParams({
    ifcOpenShellRevisionId: ifcOpenShellRevisionId.toString(),
    xbimRevisionId: xbimRevisionId.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/metrics/compare?${params}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get aggregate statistics for an engine
 *
 * @param engine - Engine name ('IfcOpenShell' or 'Xbim')
 * @param startDate - Optional start date filter (ISO 8601 format)
 * @param endDate - Optional end date filter (ISO 8601 format)
 * @returns Promise resolving to engine statistics
 */
export async function getEngineStatistics(
  engine: 'IfcOpenShell' | 'Xbim',
  startDate?: string,
  endDate?: string
): Promise<EngineStatisticsResponse> {
  const params = new URLSearchParams({ engine });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(`${API_BASE_URL}/metrics/statistics?${params}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get recent failures for an engine
 *
 * @param engine - Optional engine filter ('IfcOpenShell' or 'Xbim')
 * @param limit - Optional limit (default: 50)
 * @returns Promise resolving to array of failures
 */
export async function getFailures(
  engine?: 'IfcOpenShell' | 'Xbim',
  limit?: number
): Promise<FailureReportResponse[]> {
  const params = new URLSearchParams();
  if (engine) params.append('engine', engine);
  if (limit) params.append('limit', limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}/metrics/failures?${queryString}`
    : `${API_BASE_URL}/metrics/failures`;

  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get processing logs for a revision
 *
 * @param revisionId - Revision ID
 * @param logLevel - Optional log level filter
 * @returns Promise resolving to array of log entries
 */
export async function getRevisionLogs(
  revisionId: number,
  logLevel?: string
): Promise<ProcessingLogResponse[]> {
  const params = new URLSearchParams();
  if (logLevel) params.append('logLevel', logLevel);

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}/metrics/revisions/${revisionId}/logs?${queryString}`
    : `${API_BASE_URL}/metrics/revisions/${revisionId}/logs`;

  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get performance metrics grouped by file size
 *
 * @returns Promise resolving to array of performance metrics
 */
export async function getPerformanceByFileSize(): Promise<PerformanceByFileSizeResponse[]> {
  const response = await fetch(`${API_BASE_URL}/metrics/performance-by-file-size`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Export metrics to CSV
 *
 * @param engine - Optional engine filter ('IfcOpenShell' or 'Xbim')
 * @param startDate - Optional start date filter (ISO 8601 format)
 * @param endDate - Optional end date filter (ISO 8601 format)
 * @returns Promise resolving to CSV string
 */
export async function exportMetricsCSV(
  engine?: 'IfcOpenShell' | 'Xbim',
  startDate?: string,
  endDate?: string
): Promise<string> {
  const params = new URLSearchParams();
  if (engine) params.append('engine', engine);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}/metrics/export/csv?${queryString}`
    : `${API_BASE_URL}/metrics/export/csv`;

  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.text();
}

/**
 * Download metrics CSV file
 *
 * @param engine - Optional engine filter ('IfcOpenShell' or 'Xbim')
 * @param startDate - Optional start date filter (ISO 8601 format)
 * @param endDate - Optional end date filter (ISO 8601 format)
 * @param filename - Optional filename (default: 'metrics.csv')
 */
export async function downloadMetricsCSV(
  engine?: 'IfcOpenShell' | 'Xbim',
  startDate?: string,
  endDate?: string,
  filename: string = 'metrics.csv'
): Promise<void> {
  const csvData = await exportMetricsCSV(engine, startDate, endDate);

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
