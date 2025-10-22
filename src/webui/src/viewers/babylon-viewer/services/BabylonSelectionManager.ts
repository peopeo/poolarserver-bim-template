/**
 * BabylonSelectionManager Service
 *
 * Handles mesh selection via picking and highlighting using HighlightLayer
 */

import { Scene, AbstractMesh, HighlightLayer, Color3, Vector3 } from '@babylonjs/core';
import type { BIMElement } from '../../../types/threejs';

export interface SelectionResult {
  /** Selected mesh */
  mesh: AbstractMesh | null;

  /** BIM element data */
  element: BIMElement | null;

  /** Intersection point */
  point: Vector3 | null;

  /** Face normal */
  normal: Vector3 | null;
}

/**
 * Service for managing mesh selection in Babylon.js
 */
export class BabylonSelectionManager {
  private scene: Scene;
  private highlightLayer: HighlightLayer;
  private selectedMesh: AbstractMesh | null = null;

  constructor(scene: Scene) {
    this.scene = scene;

    // Create HighlightLayer for selection highlighting
    this.highlightLayer = new HighlightLayer('selectionHighlight', scene, {
      isStroke: false,
      blurHorizontalSize: 1,
      blurVerticalSize: 1,
      mainTextureRatio: 1
    });

    // Set highlight color (green)
    this.highlightLayer.innerGlow = false;
    this.highlightLayer.outerGlow = true;
  }

  /**
   * Handle mouse click for selection
   */
  selectMesh(
    event: PointerEvent,
    canvas: HTMLCanvasElement
  ): SelectionResult {
    if (!this.scene) {
      return {
        mesh: null,
        element: null,
        point: null,
        normal: null
      };
    }

    // Use Babylon's built-in picking system
    const pickResult = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (mesh) => {
        // Filter for pickable meshes
        return mesh.isPickable && mesh.isVisible && mesh.getTotalVertices() > 0;
      }
    );

    if (pickResult && pickResult.hit && pickResult.pickedMesh) {
      const mesh = pickResult.pickedMesh;

      // Clear previous selection
      this.clearSelection();

      // Highlight new selection
      this.highlightMesh(mesh);

      // Get BIM element data from mesh metadata
      const element = mesh.metadata?.bimElement || null;

      return {
        mesh,
        element,
        point: pickResult.pickedPoint || null,
        normal: pickResult.getNormal(true) || null
      };
    } else {
      // Click on empty space - clear selection
      this.clearSelection();

      return {
        mesh: null,
        element: null,
        point: null,
        normal: null
      };
    }
  }

  /**
   * Highlight a mesh using HighlightLayer
   */
  private highlightMesh(mesh: AbstractMesh): void {
    this.selectedMesh = mesh;

    // Add mesh to highlight layer with green color
    // Cast to any to handle AbstractMesh vs Mesh type difference
    this.highlightLayer.addMesh(mesh as any, Color3.Green());

    console.log('✅ Highlighted mesh:', mesh.name);
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    if (this.selectedMesh && this.highlightLayer) {
      this.highlightLayer.removeMesh(this.selectedMesh as any);
      this.selectedMesh = null;
    }
  }

  /**
   * Select mesh by IFC GUID
   */
  selectByGuid(guid: string): SelectionResult {
    const mesh = this.scene.meshes.find(
      (m) => m.metadata?.ifcGuid === guid
    ) as AbstractMesh;

    if (mesh) {
      this.clearSelection();
      this.highlightMesh(mesh);

      return {
        mesh,
        element: mesh.metadata?.bimElement || null,
        point: null,
        normal: null
      };
    }

    return {
      mesh: null,
      element: null,
      point: null,
      normal: null
    };
  }

  /**
   * Dispose of selection manager
   */
  dispose(): void {
    this.clearSelection();
    if (this.highlightLayer) {
      this.highlightLayer.dispose();
    }
  }
}
