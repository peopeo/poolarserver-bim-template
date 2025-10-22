/**
 * Viewer-specific Type Definitions
 *
 * Types for viewer configuration, state, and events
 */

import type * as THREE from 'three';
import type { BIMElement } from './bim.types';

/**
 * Viewer type selector
 */
export type ViewerType = 'xeokit' | 'threejs' | 'babylon';

/**
 * Camera projection types
 */
export type CameraType = 'perspective' | 'orthographic';

/**
 * Viewer configuration options
 */
export interface ViewerConfig {
  /** Enable Ambient Occlusion */
  enableSAO?: boolean;

  /** Enable antialiasing */
  antialias?: boolean;

  /** Enable transparent background */
  transparent?: boolean;

  /** Enable shadows */
  enableShadows?: boolean;

  /** Enable edge rendering */
  showEdges?: boolean;

  /** Background color (if not transparent) */
  backgroundColor?: string;
}

/**
 * Model loading status
 */
export type LoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Model load progress information
 */
export interface LoadProgress {
  /** Current loading status */
  status: LoadingStatus;

  /** Progress percentage (0-100) */
  progress: number;

  /** Status message */
  message: string;

  /** Error message (if status is 'error') */
  error?: string;
}

/**
 * Selection event data
 */
export interface SelectionEvent {
  /** Selected element (null if nothing selected) */
  element: BIMElement | null;

  /** Three.js object that was selected */
  object: THREE.Object3D | null;

  /** Intersection point in world coordinates */
  point?: THREE.Vector3;

  /** Face normal at intersection */
  normal?: THREE.Vector3;
}

/**
 * Camera view configuration
 */
export interface CameraView {
  /** Camera position */
  position: THREE.Vector3;

  /** Camera target/look-at point */
  target: THREE.Vector3;

  /** Camera up vector */
  up: THREE.Vector3;

  /** Camera type */
  type: CameraType;
}

/**
 * Viewer controls configuration
 */
export interface ControlsConfig {
  /** Enable rotation */
  enableRotate?: boolean;

  /** Enable panning */
  enablePan?: boolean;

  /** Enable zooming */
  enableZoom?: boolean;

  /** Auto-rotate */
  autoRotate?: boolean;

  /** Auto-rotate speed */
  autoRotateSpeed?: number;

  /** Damping factor */
  dampingFactor?: number;

  /** Enable damping */
  enableDamping?: boolean;
}

/**
 * Highlighting style
 */
export interface HighlightStyle {
  /** Highlight color */
  color: THREE.Color;

  /** Emissive intensity */
  emissiveIntensity?: number;

  /** Opacity */
  opacity?: number;
}

/**
 * Navigation mode
 */
export type NavigationMode = 'orbit' | 'fly' | 'walk';

/**
 * Measurement type
 */
export type MeasurementType = 'distance' | 'area' | 'angle';

/**
 * Measurement result
 */
export interface Measurement {
  /** Measurement type */
  type: MeasurementType;

  /** Measurement value */
  value: number;

  /** Unit of measurement */
  unit: string;

  /** Points involved in measurement */
  points: THREE.Vector3[];
}
