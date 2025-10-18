/**
 * BIM (Building Information Modeling) Type Definitions
 *
 * These types define the data structures for BIM elements and their properties
 * as used in the Three.js viewer.
 */

/**
 * A single BIM property (e.g., "FireRating": "F90")
 */
export interface BIMProperty {
  /** Property name (e.g., "FireRating", "LoadBearing") */
  name: string;

  /** Property value (can be string, number, or boolean) */
  value: string | number | boolean | null;

  /** JavaScript type of the value */
  type: 'string' | 'number' | 'integer' | 'boolean' | 'null';

  /** PropertySet this property belongs to (e.g., "Pset_WallCommon") */
  propertySet: string;
}

/**
 * A BIM element (e.g., wall, door, window)
 */
export interface BIMElement {
  /** Unique identifier for this element in the viewer */
  id: string;

  /** IFC GlobalId (GUID from the IFC file) */
  ifcGuid?: string;

  /** IFC type (e.g., "IfcWall", "IfcDoor", "IfcWindow") */
  type: string;

  /** Element name (e.g., "Basic Wall:Wall-1") */
  name?: string;

  /** Array of properties associated with this element */
  properties: BIMProperty[];
}

/**
 * Complete metadata for a BIM model
 */
export interface BIMMetadata {
  /** Unique identifier for the model */
  modelId: string;

  /** Model name (e.g., "West Riverside Hospital - Architectural") */
  name?: string;

  /** Array of all elements in the model */
  elements: BIMElement[];

  /** List of all unique IFC types in the model */
  types: string[];

  /** List of all PropertySet names in the model */
  propertySets: string[];

  /** Optional statistics about the model */
  statistics?: {
    /** Total number of elements */
    totalElements: number;

    /** Element count grouped by type */
    elementsByType: Record<string, number>;
  };
}

/**
 * Represents a storey/floor in the building
 */
export interface BIMStorey {
  /** Storey GUID */
  id: string;

  /** Storey name (e.g., "Level 1", "Ground Floor") */
  name: string;

  /** Elevation in meters */
  elevation: number;

  /** Element IDs that belong to this storey */
  elementIds: string[];
}

/**
 * Represents a spatial structure (building, storey, space)
 */
export interface BIMSpatialStructure {
  /** Structure GUID */
  id: string;

  /** Structure type (e.g., "IfcBuilding", "IfcBuildingStorey", "IfcSpace") */
  type: string;

  /** Structure name */
  name: string;

  /** Parent structure ID (null for root) */
  parentId: string | null;

  /** Child structure IDs */
  childIds: string[];

  /** Element IDs contained in this structure */
  elementIds: string[];
}
