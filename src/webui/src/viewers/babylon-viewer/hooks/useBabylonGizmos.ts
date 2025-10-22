/**
 * Hook for managing Babylon.js gizmos and advanced viewer features
 * - Axis viewer gizmo for navigation
 * - Measurement tools
 * - Section planes
 */

import { useEffect, useState, useCallback } from 'react';
import type { Scene, ArcRotateCamera, Nullable } from '@babylonjs/core';
import { AxesViewer, Vector3, Color3 } from '@babylonjs/core';

export interface UseBabylonGizmosReturn {
  axesViewer: Nullable<AxesViewer>;
  toggleAxes: () => void;
  axesVisible: boolean;
}

/**
 * Hook for managing Babylon.js gizmos
 */
export function useBabylonGizmos(
  scene: Scene | null,
  camera: ArcRotateCamera | null
): UseBabylonGizmosReturn {
  const [axesViewer, setAxesViewer] = useState<Nullable<AxesViewer>>(null);
  const [axesVisible, setAxesVisible] = useState(true);

  // Setup axes viewer
  useEffect(() => {
    if (!scene) return;

    // Create axes viewer (small coordinate system indicator)
    const axes = new AxesViewer(scene, 2); // 2 units size
    setAxesViewer(axes);

    console.log('✅ Axes viewer initialized');

    return () => {
      axes.dispose();
    };
  }, [scene]);

  const toggleAxes = useCallback(() => {
    if (!scene) {
      console.log('⚠️ Cannot toggle axes: scene not ready');
      return;
    }

    console.log(`🔄 Toggle axes called - current state: visible=${axesVisible}, viewer=${axesViewer ? 'exists' : 'null'}`);

    if (axesVisible && axesViewer) {
      // Hide: dispose the current axes
      console.log('🔲 Hiding axes...');
      axesViewer.dispose();
      setAxesViewer(null);
      setAxesVisible(false);
    } else {
      // Show: create new axes
      console.log('✅ Showing axes...');
      const axes = new AxesViewer(scene, 2);
      setAxesViewer(axes);
      setAxesVisible(true);
    }
  }, [scene, axesVisible, axesViewer]);

  return {
    axesViewer,
    toggleAxes,
    axesVisible
  };
}

/**
 * Set camera to a preset view
 */
export function setCameraView(
  camera: ArcRotateCamera | null,
  view: 'top' | 'front' | 'side' | 'isometric'
): void {
  if (!camera) return;

  const radius = camera.radius;

  switch (view) {
    case 'top':
      // Top view (looking down)
      camera.alpha = -Math.PI / 2;
      camera.beta = 0.1; // Almost 0, but not exactly to avoid gimbal lock
      break;

    case 'front':
      // Front view
      camera.alpha = -Math.PI / 2;
      camera.beta = Math.PI / 2;
      break;

    case 'side':
      // Side view (right side)
      camera.alpha = 0;
      camera.beta = Math.PI / 2;
      break;

    case 'isometric':
      // Isometric view
      camera.alpha = -Math.PI / 4;
      camera.beta = Math.PI / 3;
      break;
  }
}
