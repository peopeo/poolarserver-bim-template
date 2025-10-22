/**
 * Hook for measurement tools in Babylon.js
 * Provides distance and area measurement capabilities
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Scene, AbstractMesh, Nullable, Observer } from '@babylonjs/core';
import { Vector3, LinesMesh, MeshBuilder, StandardMaterial, Color3, Color4, PointerEventTypes, Mesh } from '@babylonjs/core';
import type { PointerInfo } from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Control } from '@babylonjs/gui';

export type MeasurementMode = 'none' | 'distance' | 'area';

export interface MeasurementPoint {
  position: Vector3;
  mesh: AbstractMesh;
}

export interface UseBabylonMeasurementReturn {
  measurementMode: MeasurementMode;
  setMeasurementMode: (mode: MeasurementMode) => void;
  clearMeasurements: () => void;
  measurements: MeasurementData[];
}

export interface MeasurementData {
  id: string;
  type: 'distance' | 'area';
  value: number;
  points: Vector3[];
  line?: LinesMesh;
  label?: TextBlock;
  spheres?: AbstractMesh[]; // Sphere markers at measurement points
}

/**
 * Hook for measurement tools
 */
export function useBabylonMeasurement(
  scene: Scene | null,
  canvas: HTMLCanvasElement | null,
  camera?: any // Camera to detach controls during measurement
): UseBabylonMeasurementReturn {
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('none');
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [measurementPoints, setMeasurementPoints] = useState<Vector3[]>([]);
  const [tempSpheres, setTempSpheres] = useState<AbstractMesh[]>([]); // Track spheres for current measurement

  /**
   * Clear all measurements
   */
  const clearMeasurements = useCallback(() => {
    if (!scene) return;

    // Dispose all measurement visuals
    measurements.forEach(m => {
      if (m.line) {
        m.line.dispose();
      }
      if (m.spheres) {
        m.spheres.forEach(s => s.dispose());
      }
    });

    // Dispose temp spheres
    tempSpheres.forEach(s => s.dispose());

    setMeasurements([]);
    setMeasurementPoints([]);
    setTempSpheres([]);
    console.log('🧹 Cleared all measurements');
  }, [scene, measurements, tempSpheres]);

  /**
   * Add a measurement point from pick result
   */
  const addMeasurementPoint = useCallback((point: Vector3) => {
    if (!scene || measurementMode === 'none') return;

    const newPoints = [...measurementPoints, point];
    setMeasurementPoints(newPoints);

    console.log(`📍 Measurement point ${newPoints.length}/2 added at:`, {
      x: point.x.toFixed(2),
      y: point.y.toFixed(2),
      z: point.z.toFixed(2)
    });

    // Create sphere marker at this point
    // Using HUGE diameter to ensure visibility regardless of model scale
    const sphere = MeshBuilder.CreateSphere(`measurePoint_${Date.now()}`, {
      diameter: 10.0, // HUGE sphere - impossible to miss
      segments: 32
    }, scene);
    sphere.position = point.clone();

    const sphereMat = new StandardMaterial(`measurePointMat_${Date.now()}`, scene);
    sphereMat.diffuseColor = new Color3(1, 0, 0); // Red
    sphereMat.emissiveColor = new Color3(1, 0, 0); // Full red glow for maximum visibility
    sphereMat.specularColor = new Color3(0, 0, 0); // No specular
    sphereMat.backFaceCulling = false; // Render both sides
    sphere.material = sphereMat;
    sphere.isPickable = false; // Don't interfere with picking
    sphere.renderingGroupId = 0; // Use default rendering group
    sphere.visibility = 1.0; // Full opacity

    console.log(`✅ Created sphere: name=${sphere.name}, diameter=10.0, position=(${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
    console.log(`   Sphere visible: ${sphere.isVisible}, enabled: ${sphere.isEnabled()}, renderingGroupId: ${sphere.renderingGroupId}`);
    console.log(`   Total vertices: ${sphere.getTotalVertices()}`);
    console.log(`   Scene has ${scene.meshes.length} meshes total`);
    console.log(`   Sphere bounding info:`, sphere.getBoundingInfo());

    const newSpheres = [...tempSpheres, sphere];
    setTempSpheres(newSpheres);

    // For distance: need 2 points
    if (measurementMode === 'distance' && newPoints.length === 2) {
      const distance = Vector3.Distance(newPoints[0], newPoints[1]);

      console.log(`📏 Creating measurement line between points`);
      console.log(`   Point 1: (${newPoints[0].x.toFixed(2)}, ${newPoints[0].y.toFixed(2)}, ${newPoints[0].z.toFixed(2)})`);
      console.log(`   Point 2: (${newPoints[1].x.toFixed(2)}, ${newPoints[1].y.toFixed(2)}, ${newPoints[1].z.toFixed(2)})`);
      console.log(`   Distance: ${distance.toFixed(2)} units`);

      // Create simple lines (most basic approach - should always work)
      const line = Mesh.CreateLines(`distance_line_${Date.now()}`, newPoints, scene);
      line.color = new Color3(1, 0, 0); // Red
      line.isPickable = false;
      line.renderingGroupId = 0;

      console.log(`✅ Created line: name=${line.name}, length=${distance.toFixed(2)}`);
      console.log(`   Line visible: ${line.isVisible}, enabled: ${line.isEnabled()}, renderingGroupId: ${line.renderingGroupId}`);
      console.log(`   Total vertices: ${line.getTotalVertices()}`);

      const measurement: MeasurementData = {
        id: `dist_${Date.now()}`,
        type: 'distance',
        value: distance,
        points: newPoints,
        line: line as any,
        spheres: newSpheres
      };

      setMeasurements(prev => [...prev, measurement]);
      setMeasurementPoints([]);
      setTempSpheres([]); // Clear temp spheres, they're now in the measurement

      console.log(`📏 Distance: ${distance.toFixed(2)} units (tube + ${newSpheres.length} spheres created)`);
    }
  }, [scene, measurementMode, measurementPoints, tempSpheres]);

  // Disable camera controls during measurement mode to prevent rotation/panning
  useEffect(() => {
    console.log('📹 Camera control effect triggered:', {
      hasCanvas: !!canvas,
      hasCamera: !!camera,
      measurementMode
    });

    if (!canvas || !camera) {
      console.log('⚠️ Missing canvas or camera, skipping camera control management');
      return;
    }

    if (measurementMode !== 'none') {
      console.log('🚫 Detaching camera controls for measurement mode');
      camera.detachControl();
    } else {
      console.log('✅ Reattaching camera controls');
      camera.attachControl(canvas, true);
    }

    return () => {
      // Re-attach controls on cleanup
      if (camera && canvas) {
        console.log('🔄 Cleanup: reattaching camera controls');
        camera.attachControl(canvas, true);
      }
    };
  }, [canvas, camera, measurementMode]);

  // Set cursor to crosshair when measurement mode is active
  useEffect(() => {
    console.log('🖱️ Cursor effect triggered:', {
      hasCanvas: !!canvas,
      measurementMode,
      canvasElement: canvas
    });

    if (!canvas) {
      console.log('⚠️ No canvas available for cursor change');
      return;
    }

    if (measurementMode !== 'none') {
      canvas.style.setProperty('cursor', 'crosshair', 'important');
      console.log('🎯 Cursor set to crosshair. Current cursor style:', canvas.style.cursor);
    } else {
      canvas.style.setProperty('cursor', 'default', 'important');
      console.log('👆 Cursor set to default. Current cursor style:', canvas.style.cursor);
    }

    return () => {
      console.log('🔄 Cleanup: resetting cursor to default');
      canvas.style.setProperty('cursor', 'default', 'important');
    };
  }, [canvas, measurementMode]);

  // Use ref to avoid re-registering observer on every measurement point change
  const addMeasurementPointRef = useRef(addMeasurementPoint);
  useEffect(() => {
    addMeasurementPointRef.current = addMeasurementPoint;
  }, [addMeasurementPoint]);

  // Handle measurement clicks using Babylon.js Observable pattern (the correct way)
  useEffect(() => {
    if (!scene || measurementMode === 'none') return;

    console.log('🎯 Setting up measurement with onPointerObservable');
    console.log('   Scene:', scene ? 'exists' : 'null');
    console.log('   Measurement mode:', measurementMode);

    let pointerDownScreenPos: { x: number; y: number } | null = null;

    // Use Babylon.js's native Observable system for picking
    const observer = scene.onPointerObservable.add((pointerInfo) => {
      console.log('🔔 Observable event:', PointerEventTypes[pointerInfo.type]);

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          // Store screen position to detect drag
          pointerDownScreenPos = { x: scene.pointerX, y: scene.pointerY };
          console.log('⬇️ POINTERDOWN at screen coords:', pointerDownScreenPos);
          break;

        case PointerEventTypes.POINTERUP:
          console.log('⬆️ POINTERUP fired');

          // Check if this was a click (not a drag) by comparing screen positions
          if (pointerDownScreenPos) {
            const upScreenPos = { x: scene.pointerX, y: scene.pointerY };
            const dx = upScreenPos.x - pointerDownScreenPos.x;
            const dy = upScreenPos.y - pointerDownScreenPos.y;
            const screenDistance = Math.sqrt(dx * dx + dy * dy);

            console.log(`   Screen drag distance: ${screenDistance.toFixed(1)}px`);

            // If minimal screen movement (< 5px), consider it a click
            if (screenDistance < 5) {
              // Manually perform picking at current pointer position
              console.log(`   Performing manual pick at (${scene.pointerX}, ${scene.pointerY})`);

              const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
                // Pick only pickable, visible meshes (excludes measurement markers)
                return mesh.isPickable && mesh.isVisible && mesh.isEnabled() && mesh.getTotalVertices() > 0;
              });

              console.log('   Pick result:', {
                hit: pickResult?.hit,
                distance: pickResult?.distance?.toFixed(2),
                meshName: pickResult?.pickedMesh?.name,
                point: pickResult?.pickedPoint ? {
                  x: pickResult.pickedPoint.x.toFixed(2),
                  y: pickResult.pickedPoint.y.toFixed(2),
                  z: pickResult.pickedPoint.z.toFixed(2)
                } : null
              });

              if (pickResult?.hit && pickResult.pickedPoint) {
                const point = pickResult.pickedPoint;
                const mesh = pickResult.pickedMesh;

                console.log('✅ CLICK DETECTED - Picked point for measurement:', {
                  x: point.x.toFixed(2),
                  y: point.y.toFixed(2),
                  z: point.z.toFixed(2),
                  mesh: mesh?.name
                });

                // Use ref to avoid effect re-running
                addMeasurementPointRef.current(point);
              } else {
                console.log('❌ No mesh picked - click directly on visible geometry');
                console.log('   Total meshes in scene:', scene.meshes.length);
                console.log('   Visible meshes:', scene.meshes.filter(m => m.isVisible && m.getTotalVertices() > 0).length);
              }
            } else {
              console.log('   Drag detected, ignoring');
            }
          } else {
            console.log('   No pointerDown position stored');
          }

          pointerDownScreenPos = null;
          break;
      }
    });

    console.log('✅ Measurement observer registered');

    return () => {
      if (observer) {
        scene.onPointerObservable.remove(observer);
        console.log('🧹 Measurement observer removed');
      }
    };
  }, [scene, measurementMode]);

  return {
    measurementMode,
    setMeasurementMode,
    clearMeasurements,
    measurements
  };
}
