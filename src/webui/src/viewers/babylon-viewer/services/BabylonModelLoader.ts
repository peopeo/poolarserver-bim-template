/**
 * BabylonModelLoader Service
 *
 * Handles loading of glTF/GLB models with BIM metadata attachment
 */

import { Scene, AbstractMesh, SceneLoader, Vector3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // Required for glTF loader registration
import type { BIMMetadata, BIMElement } from '../../../types/threejs';

export interface ModelLoadProgress {
  /** Loading progress (0-1) */
  loaded: number;

  /** Total bytes */
  total: number;

  /** Progress percentage (0-100) */
  percentage: number;
}

export interface ModelLoadResult {
  /** Loaded meshes */
  meshes: AbstractMesh[];

  /** BIM metadata */
  metadata: BIMMetadata;

  /** Bounding box min */
  boundingMin: Vector3;

  /** Bounding box max */
  boundingMax: Vector3;
}

/**
 * Service for loading glTF models with BIM metadata
 */
export class BabylonModelLoader {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Load a glTF/GLB model from URL
   */
  async loadModel(
    url: string,
    metadata: BIMMetadata,
    onProgress?: (progress: ModelLoadProgress) => void
  ): Promise<ModelLoadResult> {
    return new Promise((resolve, reject) => {
      // Setup progress tracking
      // Note: Babylon.js progress tracking works differently from Three.js
      // The progress callback is passed to ImportMesh below

      // Babylon.js uses file extension to detect the loader plugin
      // For URLs without extensions, use the pluginExtension parameter (7th param)
      // This tells Babylon.js to use the glTF loader even though the URL lacks .glb/.gltf
      console.log(`📦 Loading glTF from: ${url}`);

      // Load the model
      // SceneLoader.ImportMesh signature:
      // (meshNames, rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension)
      SceneLoader.ImportMesh(
        '',        // Load all meshes
        '',        // Empty rootUrl (full URL in sceneFilename)
        url,       // Full URL to glTF endpoint
        this.scene,
        (meshes, particleSystems, skeletons, animationGroups) => {
          try {
            // Filter out root/empty meshes if needed
            const loadedMeshes = meshes.filter(mesh => mesh.getTotalVertices() > 0);

            // Attach metadata to meshes
            this.attachMetadata(meshes, metadata);

            // Calculate bounding box
            let boundingMin = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            let boundingMax = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

            meshes.forEach(mesh => {
              const meshInfo = mesh.getBoundingInfo();
              if (meshInfo) {
                const min = meshInfo.boundingBox.minimumWorld;
                const max = meshInfo.boundingBox.maximumWorld;

                boundingMin = Vector3.Minimize(boundingMin, min);
                boundingMax = Vector3.Maximize(boundingMax, max);
              }
            });

            resolve({
              meshes: loadedMeshes,
              metadata,
              boundingMin,
              boundingMax
            });
          } catch (error) {
            reject(error);
          }
        },
        (event) => {
          // Progress callback
          if (onProgress && event.lengthComputable) {
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage: (event.loaded / event.total) * 100
            });
          }
        },
        (scene, message, exception) => {
          reject(new Error(`Failed to load model: ${message || exception?.message || 'Unknown error'}`));
        },
        '.glb'  // pluginExtension parameter - tells Babylon.js to use glTF loader
      );
    });
  }

  /**
   * Attach BIM metadata to meshes
   * Maps IFC GUIDs to Babylon.js meshes via metadata property
   */
  private attachMetadata(meshes: AbstractMesh[], metadata: BIMMetadata): void {
    // Create a map of IFC GUID -> BIMElement for fast lookup
    const elementMap = new Map<string, BIMElement>();
    metadata.elements.forEach(element => {
      if (element.ifcGuid) {
        elementMap.set(element.ifcGuid, element);
      }
    });

    // Attach BIM data to meshes based on name matching
    meshes.forEach(mesh => {
      // Babylon.js mesh names from glTF often contain IFC GUIDs
      // Try to extract GUID from mesh name
      const meshName = mesh.name;

      // Look for GUID pattern in name (e.g., "0BTBFw6f90Nfh9rP1dl_39")
      const guidMatch = meshName.match(/([0-9A-Za-z_]{22})/);

      if (guidMatch) {
        const guid = guidMatch[1];
        const bimElement = elementMap.get(guid);

        if (bimElement) {
          // Attach BIM metadata to mesh
          mesh.metadata = {
            ...mesh.metadata,
            bimElement,
            ifcGuid: guid,
            elementType: bimElement.type,
            elementName: bimElement.name,
            properties: bimElement.properties
          };
        }
      }
    });

    console.log(`✅ Attached BIM metadata to ${meshes.length} meshes`);
  }

  /**
   * Get mesh by IFC GUID
   */
  getMeshByGuid(guid: string): AbstractMesh | null {
    return this.scene.meshes.find(
      mesh => mesh.metadata?.ifcGuid === guid
    ) as AbstractMesh || null;
  }

  /**
   * Dispose of all loaded meshes
   */
  dispose(): void {
    // Meshes are managed by the scene, no need to manually dispose
  }
}
