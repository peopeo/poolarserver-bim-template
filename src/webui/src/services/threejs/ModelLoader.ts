/**
 * ModelLoader Service
 *
 * Handles loading of glTF/GLB models with BIM metadata attachment
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { BIMMetadata, BIMElement } from '../../types/threejs';

export interface ModelLoadProgress {
  /** Loading progress (0-1) */
  loaded: number;

  /** Total bytes */
  total: number;

  /** Progress percentage (0-100) */
  percentage: number;
}

export interface ModelLoadResult {
  /** Loaded model group */
  model: THREE.Group;

  /** BIM metadata */
  metadata: BIMMetadata;

  /** Bounding box of the model */
  boundingBox: THREE.Box3;
}

/**
 * Service for loading glTF models with BIM metadata
 */
export class ModelLoader {
  private loader: GLTFLoader;
  private loadingManager: THREE.LoadingManager;

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.loader = new GLTFLoader(this.loadingManager);
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
      this.loader.load(
        url,
        (gltf) => {
          try {
            const model = gltf.scene;

            // Attach metadata to model
            this.attachMetadata(model, metadata);

            // Calculate bounding box
            const boundingBox = new THREE.Box3().setFromObject(model);

            resolve({
              model,
              metadata,
              boundingBox
            });
          } catch (error) {
            reject(error);
          }
        },
        (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: (progressEvent.loaded / progressEvent.total) * 100
            });
          }
        },
        (error) => {
          reject(new Error(`Failed to load model: ${error.message || error}`));
        }
      );
    });
  }

  /**
   * Attach BIM metadata to 3D objects
   * Maps IFC GUIDs to Three.js objects via userData
   */
  private attachMetadata(model: THREE.Group, metadata: BIMMetadata): void {
    // Create a map of IFC GUID -> BIMElement for fast lookup
    const elementMap = new Map<string, BIMElement>();
    metadata.elements.forEach(element => {
      if (element.ifcGuid) {
        elementMap.set(element.ifcGuid, element);
      }
      // Also map by ID as fallback
      elementMap.set(element.id, element);
    });

    // Traverse the model and attach metadata
    let attachedCount = 0;
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Try to find matching BIM element
        // First try by name (which might contain IFC GUID)
        let element: BIMElement | undefined;

        if (object.name) {
          element = elementMap.get(object.name);
        }

        // If not found and we have userData.ifcGuid
        if (!element && object.userData.ifcGuid) {
          element = elementMap.get(object.userData.ifcGuid);
        }

        // Attach metadata to userData
        if (element) {
          object.userData.bimData = element;
          attachedCount++;
        } else {
          // Even if no metadata found, mark it as a BIM object
          object.userData.isBimObject = true;
        }

        // Make object selectable
        object.userData.selectable = true;
      }
    });

    console.log(`Attached BIM metadata to ${attachedCount} objects out of ${metadata.elements.length} elements`);
  }

  /**
   * Center model at origin
   */
  centerModel(model: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
  }

  /**
   * Scale model to fit in a target size
   */
  scaleModelToFit(model: THREE.Group, targetSize: number): void {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = targetSize / maxDim;
    model.scale.setScalar(scale);
  }

  /**
   * Get optimal camera position for a model
   */
  getOptimalCameraPosition(boundingBox: THREE.Box3, camera: THREE.PerspectiveCamera): THREE.Vector3 {
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2));

    // Position camera at 45 degrees
    const offset = new THREE.Vector3(
      distance * 0.7,
      distance * 0.5,
      distance * 0.7
    );

    return center.clone().add(offset);
  }

  /**
   * Dispose of loaded model
   */
  disposeModel(model: THREE.Group): void {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();

        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
