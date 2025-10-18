/**
 * useSelection Hook
 *
 * Hook for managing object selection state
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { SelectionManager } from '../../services/threejs/SelectionManager';
import type { BIMElement } from '../../types/threejs';

export interface UseSelectionOptions {
  /** Three.js scene */
  scene: THREE.Scene | null;

  /** Camera */
  camera: THREE.Camera | null;

  /** Canvas element ID */
  canvasId: string;
}

export interface UseSelectionResult {
  /** Currently selected element */
  selectedElement: BIMElement | null;

  /** Selected object */
  selectedObject: THREE.Object3D | null;

  /** Clear current selection */
  clearSelection: () => void;

  /** Whether something is selected */
  hasSelection: boolean;
}

/**
 * Hook for object selection
 */
export function useSelection(options: UseSelectionOptions): UseSelectionResult {
  const { scene, camera, canvasId } = options;

  const [selectedElement, setSelectedElement] = useState<BIMElement | null>(null);
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const selectionManagerRef = useRef<SelectionManager | null>(null);

  // Initialize selection manager
  if (!selectionManagerRef.current) {
    selectionManagerRef.current = new SelectionManager();
  }

  // Handle click events
  useEffect(() => {
    if (!scene || !camera) return;

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const handleClick = (event: MouseEvent) => {
      if (!selectionManagerRef.current || !scene || !camera) return;

      const result = selectionManagerRef.current.selectObject(event, camera, scene, canvas);

      setSelectedElement(result.element);
      setSelectedObject(result.object);

      if (result.element) {
        console.log('Selected element:', result.element);
      } else {
        console.log('Selection cleared');
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [scene, camera, canvasId]);

  const clearSelection = useCallback(() => {
    if (selectionManagerRef.current) {
      selectionManagerRef.current.clearSelection();
      setSelectedElement(null);
      setSelectedObject(null);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (selectionManagerRef.current) {
        selectionManagerRef.current.dispose();
      }
    };
  }, []);

  return {
    selectedElement,
    selectedObject,
    clearSelection,
    hasSelection: selectedElement !== null
  };
}
