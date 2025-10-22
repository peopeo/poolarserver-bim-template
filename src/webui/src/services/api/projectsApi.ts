/**
 * Projects and Revisions API Client
 *
 * Provides methods to interact with the Projects and Revisions endpoints for:
 * - Creating, reading, updating, and deleting projects
 * - Managing IFC file revisions within projects
 * - Uploading IFC files as new revisions
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
// Project Types
// ============================================================================

export interface ProjectSummary {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  revisionCount: number;
  latestVersionIdentifier?: string | null;
  activeVersionIdentifier?: string | null;
}

export interface RevisionSummary {
  id: number;
  versionIdentifier: string;
  sequenceNumber: number;
  comment?: string | null;
  uploadedAt: string;
  isActive: boolean;
  ifcFileName: string;
  processingStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  processingError?: string | null;
  elementCount: number;
}

export interface ProjectDetail {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  revisions: RevisionSummary[];
}

export interface RevisionDetail {
  id: number;
  projectId: number;
  versionIdentifier: string;
  sequenceNumber: number;
  comment?: string | null;
  uploadedAt: string;
  isActive: boolean;
  ifcFilePath: string;
  ifcFileName: string;
  gltfFilePath?: string | null;
  processingStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  processingError?: string | null;
  elementCount: number;
  hasSpatialTree: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
}

export interface UploadRevisionResponse {
  id: number;
  projectId: number;
  versionIdentifier: string;
  sequenceNumber: number;
  comment?: string | null;
  uploadedAt: string;
  isActive: boolean;
  ifcFileName: string;
  processingStatus: string;
  message: string;
}

// ============================================================================
// Projects API Methods
// ============================================================================

/**
 * Get list of all projects
 *
 * @returns Promise resolving to array of project summaries
 */
export async function getProjects(): Promise<ProjectSummary[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific project by ID with all revisions
 *
 * @param id - Project ID
 * @returns Promise resolving to project detail
 */
export async function getProject(id: number): Promise<ProjectDetail> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new project
 *
 * @param data - Project creation data
 * @returns Promise resolving to created project
 */
export async function createProject(data: CreateProjectRequest): Promise<ProjectDetail> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Update an existing project
 *
 * @param id - Project ID
 * @param data - Project update data
 * @returns Promise resolving to updated project
 */
export async function updateProject(id: number, data: UpdateProjectRequest): Promise<ProjectDetail> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a project and all its revisions
 *
 * @param id - Project ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }
}

/**
 * Get the active revision for a project
 *
 * @param id - Project ID
 * @returns Promise resolving to active revision summary
 */
export async function getActiveRevision(id: number): Promise<RevisionSummary> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}/active-revision`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Helper Methods
// ============================================================================

/**
 * Get the glTF file URL for a revision
 */
export function getRevisionGltfUrl(projectId: number, revisionId: number): string {
  return `${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}/gltf`;
}

/**
 * Get the glTF file URL for a project's active revision
 */
export function getActiveRevisionGltfUrl(projectId: number): string {
  return `${API_BASE_URL}/projects/${projectId}/revisions/active/gltf`;
}

/**
 * Get the spatial tree for a revision
 */
export async function getRevisionSpatialTree(projectId: number, revisionId: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}/spatial-tree`);

  if (!response.ok) {
    throw new Error(`Failed to fetch spatial tree: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all elements for a revision (for 3D viewer metadata)
 */
export async function getRevisionElements(projectId: number, revisionId: number): Promise<Array<{id: string, type: string, name?: string | null, ifcGuid: string}>> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}/elements`);

  if (!response.ok) {
    throw new Error(`Failed to fetch elements: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get properties for a specific element in a revision
 */
export async function getRevisionElementProperties(projectId: number, revisionId: number, globalId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}/elements/${globalId}/properties`);

  if (!response.ok) {
    throw new Error(`Failed to fetch element properties: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Revisions API Methods
// ============================================================================

/**
 * Get all revisions for a project
 *
 * @param projectId - Project ID
 * @returns Promise resolving to array of revision summaries
 */
export async function getRevisions(projectId: number): Promise<RevisionSummary[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific revision by ID
 *
 * @param projectId - Project ID
 * @param revisionId - Revision ID
 * @returns Promise resolving to revision detail
 */
export async function getRevision(projectId: number, revisionId: number): Promise<RevisionDetail> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a new IFC file as a revision
 *
 * @param projectId - Project ID
 * @param file - IFC file to upload
 * @param comment - Optional comment for this revision
 * @param engine - Processing engine to use ('IfcOpenShell' or 'Xbim'), defaults to 'IfcOpenShell'
 * @returns Promise resolving to upload response
 */
export async function uploadRevision(
  projectId: number,
  file: File,
  comment?: string,
  engine?: 'IfcOpenShell' | 'Xbim'
): Promise<UploadRevisionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (comment) {
    formData.append('comment', comment);
  }

  // Default to IfcOpenShell if not specified
  const selectedEngine = engine || 'IfcOpenShell';

  // Route to appropriate endpoint based on engine selection
  // XBIM: /api/xbim/projects/{id}/revisions/upload (when available)
  // IfcOpenShell: /api/projects/{id}/revisions/upload (current)
  const endpoint = selectedEngine === 'Xbim'
    ? `${API_BASE_URL}/xbim/projects/${projectId}/revisions/upload`
    : `${API_BASE_URL}/projects/${projectId}/revisions/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Update a revision's comment
 *
 * @param projectId - Project ID
 * @param revisionId - Revision ID
 * @param comment - New comment
 * @returns Promise resolving to updated revision
 */
export async function updateRevisionComment(
  projectId: number,
  revisionId: number,
  comment: string
): Promise<RevisionDetail> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}/comment`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Set a revision as the active revision
 *
 * @param projectId - Project ID
 * @param revisionId - Revision ID
 * @returns Promise resolving to updated revision
 */
export async function setActiveRevision(
  projectId: number,
  revisionId: number
): Promise<RevisionDetail> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}/set-active`, {
    method: 'PUT',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a revision
 *
 * @param projectId - Project ID
 * @param revisionId - Revision ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteRevision(projectId: number, revisionId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/revisions/${revisionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
