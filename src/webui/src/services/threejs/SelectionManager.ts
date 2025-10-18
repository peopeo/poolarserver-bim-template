/**
 * SelectionManager Service
 *
 * Handles object selection via raycasting and highlighting
 */

import * as THREE from 'three';
import type { BIMElement } from '../../types/threejs';

export interface SelectionResult {
  /** Selected object */
  object: THREE.Object3D | null;

  /** BIM element data */
  element: BIMElement | null;

  /** Intersection point */
  point: THREE.Vector3 | null;

  /** Face normal */
  normal: THREE.Vector3 | null;
}

/**
 * Service for managing object selection
 */
export class SelectionManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedObject: THREE.Mesh | null = null;
  private originalMaterial: THREE.Material | THREE.Material[] | null = null;
  private highlightMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Create highlight material
    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      roughness: 0.5,
      metalness: 0.2
    });
  }

  /**
   * Handle mouse click for selection
   */
  selectObject(
    event: MouseEvent,
    camera: THREE.Camera,
    scene: THREE.Scene,
    canvas: HTMLCanvasElement
  ): SelectionResult {
    // Calculate mouse position in normalized device coordinates
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, camera);

    // Find intersections with selectable objects
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    // Filter for selectable objects
    const selectableIntersects = intersects.filter(
      (intersect) =>
        intersect.object instanceof THREE.Mesh &&
        intersect.object.userData.selectable !== false
    );

    if (selectableIntersects.length > 0) {
      const intersect = selectableIntersects[0];
      const object = intersect.object as THREE.Mesh;

      // Clear previous selection
      this.clearSelection();

      // Highlight new selection
      this.highlightObject(object);

      // Get BIM element data
      const element = object.userData.bimData || null;

      return {
        object,
        element,
        point: intersect.point,
        normal: intersect.face?.normal || null
      };
    } else {
      // Click on empty space - clear selection
      this.clearSelection();

      return {
        object: null,
        element: null,
        point: null,
        normal: null
      };
    }
  }

  /**
   * Highlight an object
   */
  private highlightObject(object: THREE.Mesh): void {
    // Store original material
    this.originalMaterial = object.material;
    this.selectedObject = object;

    // Apply highlight material
    object.material = this.highlightMaterial;
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    if (this.selectedObject && this.originalMaterial) {
      // Restore original material
      this.selectedObject.material = this.originalMaterial;
      this.selectedObject = null;
      this.originalMaterial = null;
    }
  }

  /**
   * Get currently selected object
   */
  getSelectedObject(): THREE.Mesh | null {
    return this.selectedObject;
  }

  /**
   * Get BIM element of selected object
   */
  getSelectedElement(): BIMElement | null {
    if (this.selectedObject) {
      return this.selectedObject.userData.bimData || null;
    }
    return null;
  }

  /**
   * Check if an object is selected
   */
  hasSelection(): boolean {
    return this.selectedObject !== null;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearSelection();
    this.highlightMaterial.dispose();
  }
}
