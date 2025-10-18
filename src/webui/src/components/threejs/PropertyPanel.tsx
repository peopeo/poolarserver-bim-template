/**
 * PropertyPanel Component
 *
 * Displays BIM properties of selected elements
 */

import React from 'react';
import { X } from 'lucide-react';
import type { BIMElement, BIMProperty } from '../../types/threejs';

interface PropertyPanelProps {
  /** Selected BIM element */
  element: BIMElement | null;

  /** Close callback */
  onClose: () => void;

  /** Dark mode state */
  darkMode?: boolean;
}

export function PropertyPanel({ element, onClose, darkMode = false }: PropertyPanelProps) {
  if (!element) return null;

  // Group properties by PropertySet
  const groupedProperties: Record<string, BIMProperty[]> = {};
  element.properties.forEach(prop => {
    if (!groupedProperties[prop.propertySet]) {
      groupedProperties[prop.propertySet] = [];
    }
    groupedProperties[prop.propertySet].push(prop);
  });

  const propertySets = Object.keys(groupedProperties).sort();

  return (
    <div
      className={`absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] flex flex-col ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border rounded-lg shadow-xl z-10`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">Element Properties</h3>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
            {element.type}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`ml-2 p-1 rounded ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Element Name */}
        {element.name && (
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              Name
            </div>
            <div className="text-sm">{element.name}</div>
          </div>
        )}

        {/* IFC GUID */}
        {element.ifcGuid && (
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              IFC GUID
            </div>
            <div className="text-xs font-mono break-all">{element.ifcGuid}</div>
          </div>
        )}

        {/* Property Sets */}
        {propertySets.map((psetName) => (
          <div key={psetName} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`px-4 py-2 ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
              <div className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {psetName}
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {groupedProperties[psetName].map((prop, idx) => (
                <div key={`${psetName}-${prop.name}-${idx}`} className="px-4 py-2">
                  <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {prop.name}
                  </div>
                  <div className="text-sm mt-0.5">
                    {formatPropertyValue(prop.value, prop.type)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* No Properties */}
        {element.properties.length === 0 && (
          <div className={`px-4 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">No properties available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {element.properties.length} {element.properties.length === 1 ? 'property' : 'properties'}
        </div>
      </div>
    </div>
  );
}

/**
 * Format property value for display
 */
function formatPropertyValue(value: string | number | boolean | null, type: string): string {
  if (value === null || value === undefined) {
    return '-';
  }

  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'number':
    case 'integer':
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return String(value);
    default:
      return String(value);
  }
}
