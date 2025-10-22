/**
 * useBabylonSelection Hook
 *
 * Hook for managing mesh selection state in Babylon.js
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Scene, AbstractMesh } from '@babylonjs/core';
import { BabylonSelectionManager } from '../services/BabylonSelectionManager';
import type { BIMElement } from '../../../types/threejs';

export interface UseBabylonSelectionOptions {
  /** Babylon.js scene */
  scene: Scene | null;

  /** Canvas element */
  canvas: HTMLCanvasElement | null;
}

export interface UseBabylonSelectionResult {
  /** Currently selected element */
  selectedElement: BIMElement | null;

  /** Selected mesh */
  selectedMesh: AbstractMesh | null;

  /** Clear current selection */
  clearSelection: () => void;

  /** Select by IFC GUID */
  selectByGuid: (guid: string) => void;

  /** Whether something is selected */
  hasSelection: boolean;
}

/**
 * Hook for mesh selection in Babylon.js
 */
export function useBabylonSelection(options: UseBabylonSelectionOptions): UseBabylonSelectionResult {
  const { scene, canvas } = options;

  const [selectedElement, setSelectedElement] = useState<BIMElement | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<AbstractMesh | null>(null);
  const selectionManagerRef = useRef<BabylonSelectionManager | null>(null);

  // Initialize selection manager when scene is available
  useEffect(() => {
    if (scene && !selectionManagerRef.current) {
      selectionManagerRef.current = new BabylonSelectionManager(scene);
      console.log('✅ BabylonSelectionManager initialized');
    }
  }, [scene]);

  // Handle click events
  useEffect(() => {
    if (!scene || !canvas || !selectionManagerRef.current) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectionManagerRef.current) return;

      // Only handle left click
      if (event.button !== 0) return;

      const result = selectionManagerRef.current.selectMesh(event, canvas);

      setSelectedElement(result.element);
      setSelectedMesh(result.mesh);

      if (result.element) {
        console.log('✅ Selected element:', result.element.type, result.element.name);
      } else {
        console.log('Selection cleared');
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [scene, canvas]);

  const clearSelection = useCallback(() => {
    if (selectionManagerRef.current) {
      selectionManagerRef.current.clearSelection();
      setSelectedElement(null);
      setSelectedMesh(null);
    }
  }, []);

  const selectByGuid = useCallback((guid: string) => {
    if (selectionManagerRef.current) {
      const result = selectionManagerRef.current.selectByGuid(guid);
      setSelectedElement(result.element);
      setSelectedMesh(result.mesh);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (selectionManagerRef.current) {
        selectionManagerRef.current.dispose();
        selectionManagerRef.current = null;
      }
    };
  }, []);

  return {
    selectedElement,
    selectedMesh,
    clearSelection,
    selectByGuid,
    hasSelection: selectedElement !== null
  };
}
