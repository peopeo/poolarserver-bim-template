/**
 * Filtering Type Definitions
 *
 * Types for filtering BIM elements based on type and properties
 */

/**
 * Filter operator for property comparisons
 */
export type FilterOperator =
  | 'equals'           // Exact match
  | 'notEquals'        // Not equal
  | 'contains'         // String contains (case-insensitive)
  | 'startsWith'       // String starts with
  | 'endsWith'         // String ends with
  | 'greaterThan'      // Numeric >
  | 'lessThan'         // Numeric <
  | 'greaterOrEqual'   // Numeric >=
  | 'lessOrEqual'      // Numeric <=
  | 'exists'           // Property exists
  | 'notExists';       // Property doesn't exist

/**
 * Property filter condition
 */
export interface PropertyFilter {
  /** Property name to filter on */
  propertyName: string;

  /** Operator to use */
  operator: FilterOperator;

  /** Value to compare against (not needed for exists/notExists) */
  value?: string | number | boolean;

  /** Optional: PropertySet to look in (if null, searches all) */
  propertySet?: string;
}

/**
 * Complete filter criteria
 */
export interface FilterCriteria {
  /** Filter by IFC type(s) - if empty, all types are included */
  types?: string[];

  /** Property-based filters - all conditions must match (AND logic) */
  propertyFilters?: PropertyFilter[];

  /** Optional: Filter by storey IDs */
  storeyIds?: string[];

  /** Optional: Filter by spatial structure IDs */
  spatialIds?: string[];
}

/**
 * Filter result information
 */
export interface FilterResult {
  /** Number of elements matching the filter */
  matchCount: number;

  /** Total number of elements */
  totalCount: number;

  /** IDs of matching elements */
  matchingIds: string[];

  /** Filter execution time in ms */
  executionTime?: number;
}

/**
 * Saved filter preset
 */
export interface FilterPreset {
  /** Preset ID */
  id: string;

  /** Preset name (e.g., "All Walls", "F90 Fire Walls") */
  name: string;

  /** Preset description */
  description?: string;

  /** Filter criteria */
  criteria: FilterCriteria;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Filter mode - how to apply visibility changes
 */
export type FilterMode =
  | 'show'      // Show only matching elements
  | 'hide'      // Hide matching elements
  | 'isolate'   // Same as 'show' but with grey-out
  | 'highlight'; // Highlight matching elements

/**
 * Active filter state
 */
export interface ActiveFilter {
  /** Filter criteria */
  criteria: FilterCriteria;

  /** Filter mode */
  mode: FilterMode;

  /** Filter result */
  result: FilterResult;

  /** Whether filter is active */
  isActive: boolean;
}
