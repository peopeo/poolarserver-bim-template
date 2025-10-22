import { useEffect, useState } from 'react';
import { Scene, ArcRotateCamera, Vector3 } from '@babylonjs/core';

interface UseBabylonCameraReturn {
  camera: ArcRotateCamera | null;
}

/**
 * Setup Babylon.js ArcRotateCamera (equivalent to Three.js OrbitControls)
 *
 * ArcRotateCamera provides:
 * - Orbit/rotation around a target point
 * - Panning
 * - Zooming
 * - Smooth inertia
 * - Built-in limits and boundaries
 */
export function useBabylonCamera(
  scene: Scene | null,
  canvas: HTMLCanvasElement | null
): UseBabylonCameraReturn {
  const [camera, setCamera] = useState<ArcRotateCamera | null>(null);

  useEffect(() => {
    if (!scene || !canvas) {
      return;
    }

    // Create ArcRotateCamera
    // Parameters: name, alpha (horizontal), beta (vertical), radius (distance), target, scene
    const newCamera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,  // Alpha: -90 degrees (facing forward)
      Math.PI / 3,   // Beta: 60 degrees (looking slightly down)
      50,            // Radius: distance from target
      Vector3.Zero(), // Target: center of scene
      scene
    );

    // Attach controls to canvas
    newCamera.attachControl(canvas, true);

    // Camera limits and settings
    newCamera.wheelPrecision = 50; // Mouse wheel sensitivity
    newCamera.minZ = 0.1;          // Near clipping plane
    newCamera.maxZ = 10000;        // Far clipping plane

    // Radius limits (zoom limits)
    newCamera.lowerRadiusLimit = 1;    // Min distance from target
    newCamera.upperRadiusLimit = 500;  // Max distance from target

    // Beta limits (vertical rotation)
    newCamera.lowerBetaLimit = 0.1;    // Don't go completely horizontal
    newCamera.upperBetaLimit = Math.PI / 2 + 0.5; // Don't go completely vertical

    // Camera movement settings
    newCamera.inertia = 0.9;              // Smooth camera movements
    newCamera.angularSensibilityX = 1000;  // Horizontal rotation sensitivity
    newCamera.angularSensibilityY = 1000;  // Vertical rotation sensitivity
    newCamera.panningSensibility = 50;     // Panning sensitivity

    // Speed settings
    newCamera.speed = 1.0;
    newCamera.wheelDeltaPercentage = 0.01;

    // Panning is enabled by default with Ctrl+Mouse or middle mouse button
    // Configuration handled by panningSensibility above

    console.log('✅ ArcRotateCamera initialized');

    setCamera(newCamera);

    // Cleanup
    return () => {
      newCamera.dispose();
    };
  }, [scene, canvas]);

  return { camera };
}

/**
 * Helper function to focus camera on a specific position
 */
export function focusCameraOn(
  camera: ArcRotateCamera | null,
  position: Vector3,
  radius: number = 50,
  animate: boolean = true
): void {
  if (!camera) return;

  if (animate) {
    // Smooth animation to target
    camera.setTarget(position);
    camera.radius = radius;
  } else {
    // Instant jump to target
    camera.target = position;
    camera.radius = radius;
  }
}

/**
 * Helper function to reset camera to default view
 */
export function resetCamera(camera: ArcRotateCamera | null): void {
  if (!camera) return;

  camera.alpha = -Math.PI / 2;
  camera.beta = Math.PI / 3;
  camera.radius = 50;
  camera.setTarget(Vector3.Zero());
}
