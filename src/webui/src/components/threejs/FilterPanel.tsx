/**
 * FilterPanel Component
 *
 * Basic filtering controls for BIM elements
 */

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import type { FilterCriteria } from '../../types/threejs';

interface FilterPanelProps {
  /** Available IFC types */
  availableTypes: string[];

  /** Apply filter callback */
  onFilterApply: (criteria: FilterCriteria) => void;

  /** Reset filter callback */
  onFilterReset: () => void;

  /** Current filter result count */
  matchCount?: number;

  /** Total element count */
  totalCount?: number;

  /** Dark mode */
  darkMode?: boolean;
}

export function FilterPanel({
  availableTypes,
  onFilterApply,
  onFilterReset,
  matchCount,
  totalCount,
  darkMode = false
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const handleApplyTypeFilter = () => {
    if (selectedType) {
      onFilterApply({
        types: [selectedType]
      });
    }
  };

  const handleReset = () => {
    setSelectedType('');
    onFilterReset();
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'
          } border`}
          title="Open Filter Panel"
        >
          <Filter size={18} />
          <span className="text-sm font-medium">Filter</span>
          {matchCount !== undefined && totalCount !== undefined && matchCount < totalCount && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
              {matchCount}/{totalCount}
            </span>
          )}
        </button>
      ) : (
        <div
          className={`w-72 rounded-lg shadow-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <h3 className="font-semibold text-sm">Filter Elements</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Type Filter */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full px-3 py-2 rounded border text-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Results */}
            {matchCount !== undefined && totalCount !== undefined && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {matchCount} of {totalCount} elements
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyTypeFilter}
                disabled={!selectedType}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                  selectedType
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply Filter
              </button>
              <button
                onClick={handleReset}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
