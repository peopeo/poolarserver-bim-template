/**
 * ClippingPlaneManager Service
 *
 * Manages clipping planes for section views in Three.js
 */

import * as THREE from 'three';

export interface ClippingPlaneConfig {
  /** Unique ID for the plane */
  id: string;

  /** Position point on the plane */
  position: THREE.Vector3;

  /** Normal vector of the plane */
  normal: THREE.Vector3;

  /** Whether the plane is enabled */
  enabled: boolean;

  /** Helper visibility */
  showHelper?: boolean;
}

export interface ClippingPlaneResult {
  /** The created clipping plane */
  plane: THREE.Plane;

  /** Configuration used */
  config: ClippingPlaneConfig;

  /** Helper object (if enabled) */
  helper?: THREE.PlaneHelper;
}

/**
 * Service for managing clipping planes
 */
export class ClippingPlaneManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private planes: Map<string, ClippingPlaneResult> = new Map();
  private helperGroup: THREE.Group;

  constructor(renderer?: THREE.WebGLRenderer, scene?: THREE.Scene) {
    this.renderer = renderer || null;
    this.scene = scene || null;
    this.helperGroup = new THREE.Group();
    this.helperGroup.name = 'ClippingPlaneHelpers';

    if (this.scene) {
      this.scene.add(this.helperGroup);
    }
  }

  /**
   * Set the renderer
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.updateRendererClippingPlanes();
  }

  /**
   * Set the scene
   */
  setScene(scene: THREE.Scene): void {
    // Remove helper group from old scene
    if (this.scene && this.helperGroup.parent === this.scene) {
      this.scene.remove(this.helperGroup);
    }

    this.scene = scene;

    // Add helper group to new scene
    if (this.scene) {
      this.scene.add(this.helperGroup);
    }
  }

  /**
   * Add a new clipping plane
   */
  addPlane(config: ClippingPlaneConfig): ClippingPlaneResult {
    // Create the plane
    const plane = new THREE.Plane(config.normal.clone().normalize(), 0);
    plane.constant = -config.position.dot(plane.normal);

    const result: ClippingPlaneResult = {
      plane,
      config: { ...config }
    };

    // Create helper if requested
    if (config.showHelper !== false) {
      const helper = new THREE.PlaneHelper(plane, 5, 0x00ff00);
      helper.name = `ClippingPlaneHelper-${config.id}`;
      this.helperGroup.add(helper);
      result.helper = helper;
    }

    this.planes.set(config.id, result);
    this.updateRendererClippingPlanes();

    return result;
  }

  /**
   * Remove a clipping plane by ID
   */
  removePlane(id: string): boolean {
    const result = this.planes.get(id);
    if (!result) {
      return false;
    }

    // Remove helper
    if (result.helper) {
      this.helperGroup.remove(result.helper);
      result.helper.dispose();
    }

    this.planes.delete(id);
    this.updateRendererClippingPlanes();

    return true;
  }

  /**
   * Update plane position
   */
  updatePlanePosition(id: string, position: THREE.Vector3): boolean {
    const result = this.planes.get(id);
    if (!result) {
      return false;
    }

    result.config.position.copy(position);
    result.plane.constant = -position.dot(result.plane.normal);

    return true;
  }

  /**
   * Update plane normal
   */
  updatePlaneNormal(id: string, normal: THREE.Vector3): boolean {
    const result = this.planes.get(id);
    if (!result) {
      return false;
    }

    result.config.normal.copy(normal);
    result.plane.normal.copy(normal.clone().normalize());
    result.plane.constant = -result.config.position.dot(result.plane.normal);

    return true;
  }

  /**
   * Enable/disable a plane
   */
  setPlaneEnabled(id: string, enabled: boolean): boolean {
    const result = this.planes.get(id);
    if (!result) {
      return false;
    }

    result.config.enabled = enabled;

    // Update helper visibility
    if (result.helper) {
      result.helper.visible = enabled;
    }

    this.updateRendererClippingPlanes();

    return true;
  }

  /**
   * Toggle plane helper visibility
   */
  setHelperVisible(id: string, visible: boolean): boolean {
    const result = this.planes.get(id);
    if (!result || !result.helper) {
      return false;
    }

    result.helper.visible = visible;
    return true;
  }

  /**
   * Get plane by ID
   */
  getPlane(id: string): ClippingPlaneResult | undefined {
    return this.planes.get(id);
  }

  /**
   * Get all planes
   */
  getAllPlanes(): ClippingPlaneResult[] {
    return Array.from(this.planes.values());
  }

  /**
   * Get enabled planes
   */
  getEnabledPlanes(): THREE.Plane[] {
    return Array.from(this.planes.values())
      .filter(result => result.config.enabled)
      .map(result => result.plane);
  }

  /**
   * Clear all planes
   */
  clearAll(): void {
    // Remove all helpers
    this.planes.forEach(result => {
      if (result.helper) {
        this.helperGroup.remove(result.helper);
        result.helper.dispose();
      }
    });

    this.planes.clear();
    this.updateRendererClippingPlanes();
  }

  /**
   * Update renderer with current enabled clipping planes
   */
  private updateRendererClippingPlanes(): void {
    if (!this.renderer) {
      return;
    }

    const enabledPlanes = this.getEnabledPlanes();
    this.renderer.clippingPlanes = enabledPlanes;
    this.renderer.localClippingEnabled = enabledPlanes.length > 0;
  }

  /**
   * Create a preset clipping plane (common orientations)
   */
  createPresetPlane(
    id: string,
    preset: 'x' | 'y' | 'z' | '-x' | '-y' | '-z',
    offset: number = 0
  ): ClippingPlaneResult {
    const normals = {
      'x': new THREE.Vector3(1, 0, 0),
      'y': new THREE.Vector3(0, 1, 0),
      'z': new THREE.Vector3(0, 0, 1),
      '-x': new THREE.Vector3(-1, 0, 0),
      '-y': new THREE.Vector3(0, -1, 0),
      '-z': new THREE.Vector3(0, 0, -1)
    };

    const normal = normals[preset];
    const position = normal.clone().multiplyScalar(offset);

    return this.addPlane({
      id,
      position,
      normal,
      enabled: true,
      showHelper: true
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clearAll();

    if (this.scene && this.helperGroup.parent === this.scene) {
      this.scene.remove(this.helperGroup);
    }
  }
}
