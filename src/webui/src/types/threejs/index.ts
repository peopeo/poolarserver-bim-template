/**
 * Three.js Viewer Type Definitions - Central Export
 *
 * Import all types from this single file:
 * import { BIMElement, FilterCriteria, ViewerConfig } from '@/types/threejs';
 */

// BIM Types
export type {
  BIMProperty,
  BIMElement,
  BIMMetadata,
  BIMStorey,
  BIMSpatialStructure
} from './bim.types';

// Viewer Types
export type {
  ViewerType,
  CameraType,
  ViewerConfig,
  LoadingStatus,
  LoadProgress,
  SelectionEvent,
  CameraView,
  ControlsConfig,
  HighlightStyle,
  NavigationMode,
  MeasurementType,
  Measurement
} from './viewer.types';

// Filter Types
export type {
  FilterOperator,
  PropertyFilter,
  FilterCriteria,
  FilterResult,
  FilterPreset,
  FilterMode,
  ActiveFilter
} from './filter.types';
