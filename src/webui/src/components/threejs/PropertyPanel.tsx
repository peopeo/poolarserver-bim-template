/**
 * PropertyPanel Component
 *
 * Displays detailed IFC element properties including property sets, quantities,
 * and type properties for the selected spatial tree element.
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import type { IfcElementProperties } from '../../services/api/ifcIntelligenceApi';

interface PropertyPanelProps {
  /** Element properties to display */
  properties: IfcElementProperties | null;

  /** Loading state */
  isLoading?: boolean;

  /** Error message if loading failed */
  error?: string | null;

  /** Handler for closing the panel */
  onClose?: () => void;

  /** Dark mode */
  darkMode?: boolean;
}

interface PropertySectionProps {
  title: string;
  data: Record<string, Record<string, any>>;
  darkMode: boolean;
  defaultExpanded?: boolean;
}

function PropertySection({ title, data, darkMode, defaultExpanded = false }: PropertySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasData = Object.keys(data).length > 0;

  if (!hasData) {
    return null;
  }

  return (
    <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-gray-500">({Object.keys(data).length})</span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3">
          {Object.entries(data).map(([setName, properties]) => (
            <div key={setName} className="mb-3">
              <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {setName}
              </div>
              <div className="space-y-1">
                {Object.entries(properties).map(([propName, propValue]) => (
                  <div
                    key={propName}
                    className={`flex justify-between text-xs py-1 px-2 rounded ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{propName}</span>
                    <span className="font-mono ml-2 text-right break-all max-w-[60%]">
                      {formatPropertyValue(propValue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatPropertyValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  if (typeof value === 'number') {
    // Format numbers with reasonable precision
    return Number.isInteger(value) ? value.toString() : value.toFixed(3);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function PropertyPanel({
  properties,
  isLoading = false,
  error = null,
  onClose,
  darkMode = false
}: PropertyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const hasProperties = properties !== null;
  const hasData = hasProperties && (
    Object.keys(properties.property_sets).length > 0 ||
    Object.keys(properties.quantities).length > 0 ||
    Object.keys(properties.type_properties).length > 0
  );

  return (
    <>
      {!isOpen ? (
        <div className="absolute right-4 bottom-40 z-40">
          <button
            onClick={() => setIsOpen(true)}
            disabled={!hasProperties && !isLoading && !error}
            className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
              !hasProperties && !isLoading && !error
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                : darkMode
                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            } border`}
            title={
              hasProperties
                ? 'Element Properties'
                : isLoading
                ? 'Loading properties...'
                : error
                ? 'Error loading properties'
                : 'Select an element to view properties'
            }
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            <span className="text-sm font-medium">Properties</span>
          </button>
        </div>
      ) : (
        <div
          className={`absolute right-4 top-20 w-[400px] h-[calc(100vh-180px)] rounded-lg shadow-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } flex flex-col`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <span className="font-semibold">Element Properties</span>
            </div>
            <button
              onClick={handleClose}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 size={48} className="mx-auto mb-4 opacity-50 animate-spin" />
                <p className="text-sm text-gray-500">Loading properties...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium mb-2">Error Loading Properties</p>
                <p className="text-xs text-gray-500">{error}</p>
              </div>
            ) : !hasProperties ? (
              <div className="p-8 text-center text-gray-500">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">No element selected</p>
                <p className="text-xs mt-2">Select an element from the spatial tree to view properties</p>
              </div>
            ) : (
              <>
                {/* Basic Info */}
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Element Type</div>
                      <div className="text-sm font-medium">{properties.element_type}</div>
                    </div>
                    {properties.name && (
                      <div>
                        <div className="text-xs text-gray-500">Name</div>
                        <div className="text-sm font-medium">{properties.name}</div>
                      </div>
                    )}
                    {properties.description && (
                      <div>
                        <div className="text-xs text-gray-500">Description</div>
                        <div className="text-sm">{properties.description}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500">Global ID</div>
                      <div className="text-xs font-mono break-all">{properties.global_id}</div>
                    </div>
                  </div>
                </div>

                {/* Property Sets */}
                <PropertySection
                  title="Property Sets"
                  data={properties.property_sets}
                  darkMode={darkMode}
                  defaultExpanded={true}
                />

                {/* Quantities */}
                <PropertySection
                  title="Quantities"
                  data={properties.quantities}
                  darkMode={darkMode}
                  defaultExpanded={false}
                />

                {/* Type Properties */}
                <PropertySection
                  title="Type Properties"
                  data={properties.type_properties}
                  darkMode={darkMode}
                  defaultExpanded={false}
                />

                {!hasData && (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No additional properties available for this element</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {hasProperties && (
            <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-xs text-gray-500`}>
              {Object.keys(properties.property_sets).length} property sets •{' '}
              {Object.keys(properties.quantities).length} quantities •{' '}
              {Object.keys(properties.type_properties).length} type properties
            </div>
          )}
        </div>
      )}
    </>
  );
}
