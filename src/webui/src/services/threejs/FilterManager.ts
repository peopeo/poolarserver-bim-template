/**
 * FilterManager Service
 *
 * Handles filtering of BIM elements based on type and properties
 */

import * as THREE from 'three';
import type { BIMElement, FilterCriteria, FilterResult, FilterOperator } from '../../types/threejs';

/**
 * Service for managing object filtering
 */
export class FilterManager {
  private scene: THREE.Scene | null = null;
  private activeFilter: FilterCriteria | null = null;

  constructor(scene?: THREE.Scene) {
    this.scene = scene || null;
  }

  /**
   * Set the scene to filter
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /**
   * Apply filter to objects in scene
   */
  applyFilter(criteria: FilterCriteria): FilterResult {
    if (!this.scene) {
      return {
        matchCount: 0,
        totalCount: 0,
        matchingIds: [],
        executionTime: 0
      };
    }

    const startTime = performance.now();
    const matchingIds: string[] = [];
    let totalCount = 0;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.bimData) {
        totalCount++;
        const element: BIMElement = object.userData.bimData;

        if (this.matches(element, criteria)) {
          object.visible = true;
          matchingIds.push(element.id);
        } else {
          object.visible = false;
        }
      }
    });

    this.activeFilter = criteria;
    const executionTime = performance.now() - startTime;

    return {
      matchCount: matchingIds.length,
      totalCount,
      matchingIds,
      executionTime
    };
  }

  /**
   * Reset filter - show all objects
   */
  resetFilter(): FilterResult {
    if (!this.scene) {
      return {
        matchCount: 0,
        totalCount: 0,
        matchingIds: [],
        executionTime: 0
      };
    }

    const startTime = performance.now();
    let totalCount = 0;
    const matchingIds: string[] = [];

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.bimData) {
        object.visible = true;
        totalCount++;
        const element: BIMElement = object.userData.bimData;
        matchingIds.push(element.id);
      }
    });

    this.activeFilter = null;
    const executionTime = performance.now() - startTime;

    return {
      matchCount: totalCount,
      totalCount,
      matchingIds,
      executionTime
    };
  }

  /**
   * Check if element matches filter criteria
   */
  private matches(element: BIMElement, criteria: FilterCriteria): boolean {
    // Type filter
    if (criteria.types && criteria.types.length > 0) {
      if (!criteria.types.includes(element.type)) {
        return false;
      }
    }

    // Property filters
    if (criteria.propertyFilters && criteria.propertyFilters.length > 0) {
      for (const propFilter of criteria.propertyFilters) {
        if (!this.matchesPropertyFilter(element, propFilter)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if element matches a property filter
   */
  private matchesPropertyFilter(element: BIMElement, filter: any): boolean {
    const { propertyName, operator, value, propertySet } = filter;

    // Find matching properties
    const matchingProps = element.properties.filter(p => {
      const nameMatch = p.name === propertyName;
      const setMatch = !propertySet || p.propertySet === propertySet;
      return nameMatch && setMatch;
    });

    if (matchingProps.length === 0) {
      // Property doesn't exist
      return operator === 'notExists';
    }

    // Property exists
    if (operator === 'exists') {
      return true;
    }

    if (operator === 'notExists') {
      return false;
    }

    // Check each matching property
    for (const prop of matchingProps) {
      if (this.matchesOperator(prop.value, operator as FilterOperator, value)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if value matches operator
   */
  private matchesOperator(
    propValue: string | number | boolean | null,
    operator: FilterOperator,
    filterValue: any
  ): boolean {
    if (propValue === null || propValue === undefined) {
      return false;
    }

    switch (operator) {
      case 'equals':
        return propValue === filterValue;

      case 'notEquals':
        return propValue !== filterValue;

      case 'contains':
        if (typeof propValue === 'string' && typeof filterValue === 'string') {
          return propValue.toLowerCase().includes(filterValue.toLowerCase());
        }
        return false;

      case 'startsWith':
        if (typeof propValue === 'string' && typeof filterValue === 'string') {
          return propValue.toLowerCase().startsWith(filterValue.toLowerCase());
        }
        return false;

      case 'endsWith':
        if (typeof propValue === 'string' && typeof filterValue === 'string') {
          return propValue.toLowerCase().endsWith(filterValue.toLowerCase());
        }
        return false;

      case 'greaterThan':
        if (typeof propValue === 'number' && typeof filterValue === 'number') {
          return propValue > filterValue;
        }
        return false;

      case 'lessThan':
        if (typeof propValue === 'number' && typeof filterValue === 'number') {
          return propValue < filterValue;
        }
        return false;

      case 'greaterOrEqual':
        if (typeof propValue === 'number' && typeof filterValue === 'number') {
          return propValue >= filterValue;
        }
        return false;

      case 'lessOrEqual':
        if (typeof propValue === 'number' && typeof filterValue === 'number') {
          return propValue <= filterValue;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Get current filter
   */
  getActiveFilter(): FilterCriteria | null {
    return this.activeFilter;
  }

  /**
   * Check if filter is active
   */
  hasActiveFilter(): boolean {
    return this.activeFilter !== null;
  }
}
