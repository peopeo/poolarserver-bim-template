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

  /** Measurement mode - disable selection when measuring */
  measurementMode?: 'none' | 'distance' | 'area';
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
  const { scene, canvas, measurementMode = 'none' } = options;

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

  // Handle click events (distinguish between click and drag)
  useEffect(() => {
    if (!scene || !canvas || !selectionManagerRef.current) return;

    let pointerDownPosition: { x: number; y: number } | null = null;

    const handlePointerDown = (event: PointerEvent) => {
      // Only track left button
      if (event.button !== 0) return;

      // Skip if measurement mode is active
      if (measurementMode !== 'none') return;

      // Store the initial pointer position
      pointerDownPosition = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!selectionManagerRef.current || !pointerDownPosition) return;

      // Only handle left button
      if (event.button !== 0) return;

      // Skip if measurement mode is active
      if (measurementMode !== 'none') {
        pointerDownPosition = null;
        return;
      }

      // Calculate movement distance
      const dx = event.clientX - pointerDownPosition.x;
      const dy = event.clientY - pointerDownPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only select if minimal movement (< 5px = click, not drag)
      // This prevents selection during camera rotation/panning
      const CLICK_THRESHOLD = 5;

      if (distance < CLICK_THRESHOLD) {
        const result = selectionManagerRef.current.selectMesh(event, canvas);

        setSelectedElement(result.element);
        setSelectedMesh(result.mesh);

        if (result.element) {
          console.log('✅ Selected element:', result.element.type, result.element.name);
        } else {
          console.log('Selection cleared');
        }
      }

      // Clear the stored position
      pointerDownPosition = null;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [scene, canvas, measurementMode]);

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
