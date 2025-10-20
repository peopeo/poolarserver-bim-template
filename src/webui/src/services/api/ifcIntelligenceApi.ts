/**
 * IFC Intelligence API Client
 *
 * Provides methods to interact with the IFC backend API for:
 * - Parsing IFC files and extracting metadata
 * - Extracting spatial hierarchies
 * - Extracting element properties
 * - Exporting IFC to glTF/GLB format
 */

const API_BASE_URL = '/api/ifc-intelligence';

/**
 * IFC Metadata returned from parse endpoint
 */
export interface IfcMetadata {
  model_id: string;
  project_name: string;
  schema: string;
  entity_counts: Record<string, number>;
  author?: string | null;
  organization?: string | null;
  application?: string | null;
}

/**
 * Spatial tree node representing IFC spatial hierarchy
 */
export interface SpatialNode {
  global_id: string;
  name: string | null;
  ifc_type: string;
  description?: string | null;
  long_name?: string | null;
  children: SpatialNode[];
}

/**
 * Element properties returned from extract-properties endpoint
 */
export interface IfcElementProperties {
  global_id: string;
  element_type: string;
  name?: string | null;
  description?: string | null;
  property_sets: Record<string, Record<string, any>>;
  quantities: Record<string, Record<string, any>>;
  type_properties: Record<string, Record<string, any>>;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
}

/**
 * Stored IFC Model (from database)
 */
export interface StoredIfcModel {
  id: number;
  fileName: string;
  fileHash: string;
  projectName?: string | null;
  schema?: string | null;
  modelId?: string | null;
  entityCounts?: Record<string, number>;
  spatialTree?: SpatialNode;
  author?: string | null;
  organization?: string | null;
  application?: string | null;
  fileSizeBytes: number;
  gltfFileSizeBytes?: number | null;
  conversionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  conversionError?: string | null;
  uploadedAt: string;
  lastAccessedAt?: string | null;
  convertedAt?: string | null;
  description?: string | null;
  tags?: string | null;
  hasGltf: boolean;
}

/**
 * Model list response with pagination
 */
export interface StoredModelsResponse {
  totalCount: number;
  skip: number;
  take: number;
  models: Omit<StoredIfcModel, 'entityCounts' | 'spatialTree' | 'fileHash'>[];
}

/**
 * Upload response from database persistence
 */
export interface UploadIfcResponse {
  id: number;
  fileName: string;
  projectName?: string | null;
  schema?: string | null;
  modelId?: string | null;
  entityCounts: Record<string, number>;
  author?: string | null;
  organization?: string | null;
  application?: string | null;
  fileSizeBytes: number;
  uploadedAt: string;
  conversionStatus: string;
  message: string;
}

/**
 * Parse an IFC file and extract metadata
 *
 * @param file - IFC file to parse
 * @returns Promise resolving to IFC metadata
 */
export async function parseIfcFile(file: File): Promise<IfcMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Extract spatial hierarchy tree from IFC file
 *
 * @param file - IFC file to process
 * @param flat - If true, returns flat list instead of tree (default: false)
 * @returns Promise resolving to spatial tree or flat list
 */
export async function extractSpatialTree(
  file: File,
  flat: boolean = false
): Promise<SpatialNode> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/extract-spatial-tree${flat ? '?flat=true' : ''}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Extract properties for a specific IFC element
 *
 * @param file - IFC file containing the element
 * @param elementGuid - GlobalId (GUID) of the element
 * @returns Promise resolving to element properties
 */
export async function extractElementProperties(
  file: File,
  elementGuid: string
): Promise<IfcElementProperties> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('elementGuid', elementGuid);

  const response = await fetch(`${API_BASE_URL}/extract-properties`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Export IFC file to glTF/GLB format
 *
 * @param file - IFC file to export
 * @param binary - If true, export as GLB (binary), otherwise glTF (default: true)
 * @returns Promise resolving to Blob containing the glTF/GLB data
 */
export async function exportToGltf(
  file: File,
  binary: boolean = true
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/export-gltf?binary=${binary}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.blob();
}

/**
 * Check health status of IFC Intelligence service
 *
 * @returns Promise resolving to health status
 */
export async function checkHealth(): Promise<{
  service: string;
  status: string;
  version: string;
  timestamp: string;
  features: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Database Persistence API Methods
// ============================================================================

/**
 * Upload IFC file to database with persistent storage
 *
 * This uploads the IFC file, stores it in the database, extracts metadata
 * and spatial tree, and triggers background glTF conversion.
 *
 * @param file - IFC file to upload
 * @param description - Optional description for the model
 * @param tags - Optional comma-separated tags
 * @returns Promise resolving to upload response with model ID
 */
export async function uploadIfcModelToDatabase(
  file: File,
  description?: string,
  tags?: string
): Promise<UploadIfcResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (description) formData.append('description', description);
  if (tags) formData.append('tags', tags);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get list of stored IFC models from database
 *
 * @param skip - Number of records to skip (pagination)
 * @param take - Number of records to return (max 100)
 * @param schema - Filter by IFC schema (e.g., "IFC2X3", "IFC4")
 * @param conversionStatus - Filter by conversion status
 * @returns Promise resolving to models list with pagination info
 */
export async function getStoredModels(
  skip: number = 0,
  take: number = 20,
  schema?: string,
  conversionStatus?: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<StoredModelsResponse> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    take: take.toString(),
  });

  if (schema) params.append('schema', schema);
  if (conversionStatus) params.append('conversionStatus', conversionStatus);

  const response = await fetch(`${API_BASE_URL}/models?${params.toString()}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific stored IFC model by ID with full details
 *
 * Includes entity counts, spatial tree, and all metadata.
 * Updates the lastAccessedAt timestamp in the database.
 *
 * @param id - Model ID
 * @returns Promise resolving to full model details
 */
export async function getStoredModel(id: number): Promise<StoredIfcModel> {
  const response = await fetch(`${API_BASE_URL}/models/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Download glTF/GLB file for a stored IFC model
 *
 * This endpoint is used by the frontend viewer to load the 3D model.
 *
 * @param id - Model ID
 * @returns Promise resolving to Blob containing the glTF/GLB data
 */
export async function getStoredModelGltf(id: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/models/${id}/gltf`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.blob();
}

/**
 * Create a URL to load glTF file in viewer
 *
 * @param id - Model ID
 * @returns URL string for glTF endpoint
 */
export function getStoredModelGltfUrl(id: number): string {
  return `${API_BASE_URL}/models/${id}/gltf`;
}

// ============================================================================
// Convenience Methods
// ============================================================================

/**
 * Upload IFC file and get comprehensive model data (legacy method)
 *
 * NOTE: This method does NOT persist to database. For persistence,
 * use uploadIfcModelToDatabase() instead.
 *
 * Convenience method that combines multiple API calls:
 * - Parse metadata
 * - Extract spatial tree
 *
 * @param file - IFC file to process
 * @returns Promise resolving to combined model data
 */
export async function uploadIfcModel(file: File): Promise<{
  metadata: IfcMetadata;
  spatialTree: SpatialNode;
}> {
  const [metadata, spatialTree] = await Promise.all([
    parseIfcFile(file),
    extractSpatialTree(file),
  ]);

  return {
    metadata,
    spatialTree,
  };
}
