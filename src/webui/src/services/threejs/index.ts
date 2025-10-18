/**
 * Three.js Services - Central Export
 *
 * Import services from this single file
 */

// Mock data exports
export {
  mockMetadata,
  mockMetadataLarge,
  getMockElementById,
  getMockElementsByType,
  getMockTypes,
  getMockPropertySets
} from './mock-metadata';

export {
  MOCK_GLTF_URL,
  MOCK_GLTF_URL_ONLINE,
  MOCK_MODEL_REGISTRY,
  getMockModelUrl,
  isMockUrl,
  DEFAULT_MOCK_MODEL_ID,
  AVAILABLE_MOCK_MODELS
} from './mock-gltf-url';

// Model loader
export { ModelLoader } from './ModelLoader';
export type { ModelLoadProgress, ModelLoadResult } from './ModelLoader';

// Selection manager
export { SelectionManager } from './SelectionManager';
export type { SelectionResult } from './SelectionManager';

// Filter manager
export { FilterManager } from './FilterManager';

// Clipping plane manager
export { ClippingPlaneManager } from './ClippingPlaneManager';
export type { ClippingPlaneConfig, ClippingPlaneResult } from './ClippingPlaneManager';

// Export manager
export { ExportManager } from './ExportManager';
export type { ExportOptions, ExportResult } from './ExportManager';
