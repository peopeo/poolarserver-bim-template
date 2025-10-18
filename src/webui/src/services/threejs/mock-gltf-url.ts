/**
 * Mock glTF Model URLs for Development
 *
 * These URLs point to test glTF/GLB models for development and testing
 * without requiring the backend API to be fully implemented.
 */

/**
 * URL to a publicly available test glTF model
 * (Using a simple box for initial testing)
 */
export const MOCK_GLTF_URL = '/public/models/test-model.glb';

/**
 * Alternative: Use a simple online glTF model for initial testing
 * This is a small building model from Khronos glTF samples
 */
export const MOCK_GLTF_URL_ONLINE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb';

/**
 * Mock model registry - maps model IDs to URLs
 * This simulates what the backend API would return
 */
export const MOCK_MODEL_REGISTRY: Record<string, string> = {
  'mock-box': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
  'mock-building': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb',
  'mock-hospital': '/api/models/mock-hospital-model-001/geometry/gltf?format=glb' // Will be replaced with actual backend
};

/**
 * Get mock model URL by ID
 */
export function getMockModelUrl(modelId: string): string {
  return MOCK_MODEL_REGISTRY[modelId] || MOCK_GLTF_URL_ONLINE;
}

/**
 * Check if a model URL is a mock/test URL
 */
export function isMockUrl(url: string): boolean {
  return url.includes('khronos') || url.includes('mock-') || url.startsWith('/public/models/');
}

/**
 * Default model ID for development
 */
export const DEFAULT_MOCK_MODEL_ID = 'mock-box';

/**
 * List of all available mock models
 */
export const AVAILABLE_MOCK_MODELS = Object.keys(MOCK_MODEL_REGISTRY);
