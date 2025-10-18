/**
 * Mock BIM Metadata for Development and Testing
 *
 * This file contains realistic IFC metadata for testing the Three.js viewer
 * without requiring a backend API.
 */

import type { BIMMetadata, BIMElement, BIMProperty } from '../../types/threejs';

/**
 * Helper function to create a BIM property
 */
function createProperty(
  name: string,
  value: string | number | boolean,
  propertySet: string = 'Pset_Common'
): BIMProperty {
  let type: 'string' | 'number' | 'integer' | 'boolean' = 'string';

  if (typeof value === 'boolean') {
    type = 'boolean';
  } else if (typeof value === 'number') {
    type = Number.isInteger(value) ? 'integer' : 'number';
  }

  return {
    name,
    value,
    type,
    propertySet
  };
}

/**
 * Sample IFC elements for West Riverside Hospital mock model
 */
const mockElements: BIMElement[] = [
  // Walls
  {
    id: 'wall-001',
    ifcGuid: '0SzD7VqVP9b8EFN3Tx9Wy1',
    type: 'IfcWall',
    name: 'Basic Wall:Wall-Ext-1',
    properties: [
      createProperty('Name', 'Basic Wall:Wall-Ext-1', 'IFC'),
      createProperty('ObjectType', 'Wall', 'IFC'),
      createProperty('LoadBearing', true, 'Pset_WallCommon'),
      createProperty('IsExternal', true, 'Pset_WallCommon'),
      createProperty('FireRating', 'F90', 'Pset_WallCommon'),
      createProperty('ThermalTransmittance', 0.24, 'Pset_WallCommon'),
      createProperty('Width', 300, 'Dimensions'),
      createProperty('Height', 3000, 'Dimensions'),
      createProperty('Area', 15.5, 'Quantities'),
      createProperty('Volume', 4.65, 'Quantities')
    ]
  },
  {
    id: 'wall-002',
    ifcGuid: '1TzE8WrWQ0c9FGO4Uy0Xz2',
    type: 'IfcWall',
    name: 'Basic Wall:Wall-Int-1',
    properties: [
      createProperty('Name', 'Basic Wall:Wall-Int-1', 'IFC'),
      createProperty('ObjectType', 'Wall', 'IFC'),
      createProperty('LoadBearing', false, 'Pset_WallCommon'),
      createProperty('IsExternal', false, 'Pset_WallCommon'),
      createProperty('FireRating', 'F30', 'Pset_WallCommon'),
      createProperty('Width', 150, 'Dimensions'),
      createProperty('Height', 3000, 'Dimensions'),
      createProperty('Area', 12.0, 'Quantities'),
      createProperty('Volume', 1.8, 'Quantities')
    ]
  },
  {
    id: 'wall-003',
    ifcGuid: '2UzF9XsXR1d0GHP5Vz1Y03',
    type: 'IfcWall',
    name: 'Basic Wall:Wall-Int-2',
    properties: [
      createProperty('Name', 'Basic Wall:Wall-Int-2', 'IFC'),
      createProperty('ObjectType', 'Wall', 'IFC'),
      createProperty('LoadBearing', false, 'Pset_WallCommon'),
      createProperty('IsExternal', false, 'Pset_WallCommon'),
      createProperty('FireRating', 'F30', 'Pset_WallCommon'),
      createProperty('Width', 100, 'Dimensions'),
      createProperty('Height', 3000, 'Dimensions')
    ]
  },

  // Doors
  {
    id: 'door-001',
    ifcGuid: '3VzG0YtYS2e1HIQ6W02Z14',
    type: 'IfcDoor',
    name: 'Single Door:M_Single-Flush:900x2100mm',
    properties: [
      createProperty('Name', 'Single Door:M_Single-Flush:900x2100mm', 'IFC'),
      createProperty('ObjectType', 'Door', 'IFC'),
      createProperty('IsExternal', false, 'Pset_DoorCommon'),
      createProperty('FireRating', 'F30', 'Pset_DoorCommon'),
      createProperty('HandicapAccessible', true, 'Pset_DoorCommon'),
      createProperty('Width', 900, 'Dimensions'),
      createProperty('Height', 2100, 'Dimensions'),
      createProperty('Material', 'Wood', 'Materials')
    ]
  },
  {
    id: 'door-002',
    ifcGuid: '4WzH1ZuZT3f2IJR7X13a25',
    type: 'IfcDoor',
    name: 'Double Door:M_Double-Flush:1800x2100mm',
    properties: [
      createProperty('Name', 'Double Door:M_Double-Flush:1800x2100mm', 'IFC'),
      createProperty('ObjectType', 'Door', 'IFC'),
      createProperty('IsExternal', true, 'Pset_DoorCommon'),
      createProperty('FireRating', 'F90', 'Pset_DoorCommon'),
      createProperty('HandicapAccessible', true, 'Pset_DoorCommon'),
      createProperty('Width', 1800, 'Dimensions'),
      createProperty('Height', 2100, 'Dimensions'),
      createProperty('Material', 'Steel', 'Materials')
    ]
  },

  // Windows
  {
    id: 'window-001',
    ifcGuid: '5XzI2avbU4g3JKS8Y24b36',
    type: 'IfcWindow',
    name: 'Fixed Window:1200x1500mm',
    properties: [
      createProperty('Name', 'Fixed Window:1200x1500mm', 'IFC'),
      createProperty('ObjectType', 'Window', 'IFC'),
      createProperty('IsExternal', true, 'Pset_WindowCommon'),
      createProperty('GlazingAreaFraction', 0.85, 'Pset_WindowCommon'),
      createProperty('Width', 1200, 'Dimensions'),
      createProperty('Height', 1500, 'Dimensions'),
      createProperty('GlassType', 'Double Glazed', 'Materials')
    ]
  },
  {
    id: 'window-002',
    ifcGuid: '6YzJ3bwcV5h4KLT9Z35c47',
    type: 'IfcWindow',
    name: 'Fixed Window:900x1200mm',
    properties: [
      createProperty('Name', 'Fixed Window:900x1200mm', 'IFC'),
      createProperty('ObjectType', 'Window', 'IFC'),
      createProperty('IsExternal', true, 'Pset_WindowCommon'),
      createProperty('GlazingAreaFraction', 0.8, 'Pset_WindowCommon'),
      createProperty('Width', 900, 'Dimensions'),
      createProperty('Height', 1200, 'Dimensions'),
      createProperty('GlassType', 'Triple Glazed', 'Materials')
    ]
  },

  // Slabs
  {
    id: 'slab-001',
    ifcGuid: '7ZzK4cxdW6i5LMU0a46d58',
    type: 'IfcSlab',
    name: 'Floor:Generic Floor:200mm',
    properties: [
      createProperty('Name', 'Floor:Generic Floor:200mm', 'IFC'),
      createProperty('ObjectType', 'Floor', 'IFC'),
      createProperty('LoadBearing', true, 'Pset_SlabCommon'),
      createProperty('IsExternal', false, 'Pset_SlabCommon'),
      createProperty('Thickness', 200, 'Dimensions'),
      createProperty('Area', 45.2, 'Quantities'),
      createProperty('Volume', 9.04, 'Quantities'),
      createProperty('Material', 'Concrete', 'Materials')
    ]
  },

  // Columns
  {
    id: 'column-001',
    ifcGuid: '8AzL5dyeX7j6MNV1b57e69',
    type: 'IfcColumn',
    name: 'Rectangular Column:400x400mm',
    properties: [
      createProperty('Name', 'Rectangular Column:400x400mm', 'IFC'),
      createProperty('ObjectType', 'Column', 'IFC'),
      createProperty('LoadBearing', true, 'Pset_ColumnCommon'),
      createProperty('FireRating', 'F90', 'Pset_ColumnCommon'),
      createProperty('Width', 400, 'Dimensions'),
      createProperty('Depth', 400, 'Dimensions'),
      createProperty('Height', 3000, 'Dimensions'),
      createProperty('Material', 'Concrete', 'Materials')
    ]
  },

  // Beams
  {
    id: 'beam-001',
    ifcGuid: '9BzM6ezfY8k7NOW2c68f70',
    type: 'IfcBeam',
    name: 'Concrete Beam:300x600mm',
    properties: [
      createProperty('Name', 'Concrete Beam:300x600mm', 'IFC'),
      createProperty('ObjectType', 'Beam', 'IFC'),
      createProperty('LoadBearing', true, 'Pset_BeamCommon'),
      createProperty('FireRating', 'F90', 'Pset_BeamCommon'),
      createProperty('Width', 300, 'Dimensions'),
      createProperty('Height', 600, 'Dimensions'),
      createProperty('Length', 6000, 'Dimensions'),
      createProperty('Material', 'Concrete', 'Materials')
    ]
  },

  // Spaces
  {
    id: 'space-001',
    ifcGuid: '0CzN7f0gZ9l8OPX3d79g81',
    type: 'IfcSpace',
    name: 'Operating Room 1',
    properties: [
      createProperty('Name', 'Operating Room 1', 'IFC'),
      createProperty('ObjectType', 'Space', 'IFC'),
      createProperty('Category', 'Operating Room', 'Pset_SpaceCommon'),
      createProperty('GrossFloorArea', 42.5, 'Quantities'),
      createProperty('NetFloorArea', 39.2, 'Quantities'),
      createProperty('Height', 3.2, 'Dimensions'),
      createProperty('OccupancyNumber', 5, 'Pset_SpaceCommon'),
      createProperty('OccupancyType', 'Medical', 'Pset_SpaceCommon')
    ]
  },

  // MEP - Mechanical
  {
    id: 'duct-001',
    ifcGuid: '1DzO8g1hA0m9PQY4e80h92',
    type: 'IfcDuctSegment',
    name: 'Rectangular Duct:600x300mm',
    properties: [
      createProperty('Name', 'Rectangular Duct:600x300mm', 'IFC'),
      createProperty('ObjectType', 'Duct Segment', 'IFC'),
      createProperty('Width', 600, 'Dimensions'),
      createProperty('Height', 300, 'Dimensions'),
      createProperty('Length', 3000, 'Dimensions'),
      createProperty('Material', 'Galvanized Steel', 'Materials')
    ]
  },

  // MEP - Electrical
  {
    id: 'cable-001',
    ifcGuid: '2EzP9h2iB1n0QRZ5f91i03',
    type: 'IfcCableSegment',
    name: 'Power Cable:5x10mm²',
    properties: [
      createProperty('Name', 'Power Cable:5x10mm²', 'IFC'),
      createProperty('ObjectType', 'Cable Segment', 'IFC'),
      createProperty('CrossSectionalArea', 10, 'Electrical'),
      createProperty('NumberOfCores', 5, 'Electrical'),
      createProperty('Length', 25, 'Dimensions')
    ]
  },

  // Furniture
  {
    id: 'furniture-001',
    ifcGuid: '3FzQ0i3jC2o1RSa6g02j14',
    type: 'IfcFurniture',
    name: 'Desk:Office Desk:1600x800mm',
    properties: [
      createProperty('Name', 'Desk:Office Desk:1600x800mm', 'IFC'),
      createProperty('ObjectType', 'Furniture', 'IFC'),
      createProperty('Width', 1600, 'Dimensions'),
      createProperty('Depth', 800, 'Dimensions'),
      createProperty('Height', 750, 'Dimensions'),
      createProperty('Material', 'Wood', 'Materials')
    ]
  }
];

/**
 * Calculate statistics from elements
 */
function calculateStatistics(elements: BIMElement[]) {
  const elementsByType: Record<string, number> = {};

  elements.forEach(element => {
    elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
  });

  return {
    totalElements: elements.length,
    elementsByType
  };
}

/**
 * Extract unique types from elements
 */
function extractTypes(elements: BIMElement[]): string[] {
  const types = new Set<string>();
  elements.forEach(element => types.add(element.type));
  return Array.from(types).sort();
}

/**
 * Extract unique property sets from elements
 */
function extractPropertySets(elements: BIMElement[]): string[] {
  const propertySets = new Set<string>();
  elements.forEach(element => {
    element.properties.forEach(prop => {
      propertySets.add(prop.propertySet);
    });
  });
  return Array.from(propertySets).sort();
}

/**
 * Complete mock metadata for testing
 */
export const mockMetadata: BIMMetadata = {
  modelId: 'mock-hospital-model-001',
  name: 'West Riverside Hospital - Mock Sample',
  elements: mockElements,
  types: extractTypes(mockElements),
  propertySets: extractPropertySets(mockElements),
  statistics: calculateStatistics(mockElements)
};

/**
 * Mock metadata with specific element counts for testing filters
 */
export const mockMetadataLarge: BIMMetadata = {
  ...mockMetadata,
  modelId: 'mock-hospital-model-large',
  name: 'West Riverside Hospital - Large Mock'
  // In a real implementation, this would have hundreds of elements
  // For now, it's the same as mockMetadata
};

/**
 * Get a single element by ID
 */
export function getMockElementById(id: string): BIMElement | undefined {
  return mockElements.find(el => el.id === id);
}

/**
 * Get elements by type
 */
export function getMockElementsByType(type: string): BIMElement[] {
  return mockElements.filter(el => el.type === type);
}

/**
 * Get all available IFC types in mock data
 */
export function getMockTypes(): string[] {
  return extractTypes(mockElements);
}

/**
 * Get all available property sets in mock data
 */
export function getMockPropertySets(): string[] {
  return extractPropertySets(mockElements);
}
