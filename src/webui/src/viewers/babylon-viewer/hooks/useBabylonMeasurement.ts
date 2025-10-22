/**
 * Hook for measurement tools in Babylon.js
 * Provides distance and area measurement capabilities
 */

import { useState, useCallback } from 'react';
import type { Scene, AbstractMesh, Nullable } from '@babylonjs/core';
import { Vector3, LinesMesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
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
}

/**
 * Hook for measurement tools
 */
export function useBabylonMeasurement(
  scene: Scene | null,
  canvas: HTMLCanvasElement | null
): UseBabylonMeasurementReturn {
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('none');
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [measurementPoints, setMeasurementPoints] = useState<Vector3[]>([]);

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
    });

    setMeasurements([]);
    setMeasurementPoints([]);
    console.log('🧹 Cleared all measurements');
  }, [scene, measurements]);

  /**
   * Add a measurement point from pick result
   */
  const addMeasurementPoint = useCallback((point: Vector3) => {
    if (!scene || measurementMode === 'none') return;

    const newPoints = [...measurementPoints, point];
    setMeasurementPoints(newPoints);

    // For distance: need 2 points
    if (measurementMode === 'distance' && newPoints.length === 2) {
      const distance = Vector3.Distance(newPoints[0], newPoints[1]);

      // Create line
      const line = MeshBuilder.CreateLines(`distance_${Date.now()}`, {
        points: newPoints
      }, scene);

      const lineMaterial = new StandardMaterial(`distanceMat_${Date.now()}`, scene);
      lineMaterial.emissiveColor = Color3.Red();
      line.color = Color3.Red();

      const measurement: MeasurementData = {
        id: `dist_${Date.now()}`,
        type: 'distance',
        value: distance,
        points: newPoints,
        line
      };

      setMeasurements(prev => [...prev, measurement]);
      setMeasurementPoints([]);

      console.log(`📏 Distance: ${distance.toFixed(2)} units`);
    }
  }, [scene, measurementMode, measurementPoints]);

  return {
    measurementMode,
    setMeasurementMode,
    clearMeasurements,
    measurements
  };
}
