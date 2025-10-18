/**
 * ClippingPanel Component
 *
 * UI for creating and managing clipping planes (section cuts)
 */

import React, { useState } from 'react';
import { Scissors, X, Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { ClippingPlaneConfig } from '../../services/threejs/ClippingPlaneManager';
import * as THREE from 'three';

interface ClippingPanelProps {
  /** Available preset orientations */
  onAddPreset: (preset: 'x' | 'y' | 'z' | '-x' | '-y' | '-z', offset: number) => void;

  /** Add custom clipping plane */
  onAddCustom: (config: ClippingPlaneConfig) => void;

  /** Remove plane by ID */
  onRemove: (id: string) => void;

  /** Toggle plane enabled */
  onToggleEnabled: (id: string, enabled: boolean) => void;

  /** Update plane position */
  onUpdatePosition: (id: string, position: THREE.Vector3) => void;

  /** Update plane normal */
  onUpdateNormal: (id: string, normal: THREE.Vector3) => void;

  /** Current active planes */
  activePlanes: Array<{
    id: string;
    position: THREE.Vector3;
    normal: THREE.Vector3;
    enabled: boolean;
  }>;

  /** Dark mode */
  darkMode?: boolean;
}

type PresetType = 'x' | 'y' | 'z' | '-x' | '-y' | '-z';

export function ClippingPanel({
  onAddPreset,
  onAddCustom,
  onRemove,
  onToggleEnabled,
  onUpdatePosition,
  onUpdateNormal,
  activePlanes,
  darkMode = false
}: ClippingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('z');
  const [offset, setOffset] = useState(0);

  const presetLabels: Record<PresetType, string> = {
    'x': 'X Axis →',
    'y': 'Y Axis ↑',
    'z': 'Z Axis ⊙',
    '-x': 'X Axis ←',
    '-y': 'Y Axis ↓',
    '-z': 'Z Axis ⊗'
  };

  const handleAddPreset = () => {
    onAddPreset(selectedPreset, offset);
  };

  return (
    <div className="absolute top-20 left-4 z-10">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'
          } border`}
          title="Open Clipping Panel"
        >
          <Scissors size={18} />
          <span className="text-sm font-medium">Section</span>
          {activePlanes.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">
              {activePlanes.filter(p => p.enabled).length}
            </span>
          )}
        </button>
      ) : (
        <div
          className={`w-80 rounded-lg shadow-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Scissors size={18} />
              <h3 className="font-semibold text-sm">Section Planes</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Add Preset Plane */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Add Section Plane
              </label>
              <div className="space-y-2">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value as PresetType)}
                  className={`w-full px-3 py-2 rounded border text-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {Object.entries(presetLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 items-center">
                  <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-16`}>
                    Offset:
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={offset}
                    onChange={(e) => setOffset(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-12 text-right`}>
                    {offset.toFixed(1)}
                  </span>
                </div>

                <button
                  onClick={handleAddPreset}
                  className="w-full px-3 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Plane
                </button>
              </div>
            </div>

            {/* Active Planes List */}
            {activePlanes.length > 0 && (
              <div>
                <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Active Planes ({activePlanes.length})
                </label>
                <div className="space-y-2">
                  {activePlanes.map((plane) => (
                    <div
                      key={plane.id}
                      className={`p-3 rounded border ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {plane.id}
                          </div>
                          <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Normal: ({plane.normal.x.toFixed(1)}, {plane.normal.y.toFixed(1)}, {plane.normal.z.toFixed(1)})
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Pos: ({plane.position.x.toFixed(1)}, {plane.position.y.toFixed(1)}, {plane.position.z.toFixed(1)})
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onToggleEnabled(plane.id, !plane.enabled)}
                            className={`p-1.5 rounded ${
                              plane.enabled
                                ? darkMode
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-green-500 hover:bg-green-600'
                                : darkMode
                                ? 'bg-gray-600 hover:bg-gray-500'
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            title={plane.enabled ? 'Disable' : 'Enable'}
                          >
                            {plane.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => onRemove(plane.id)}
                            className={`p-1.5 rounded ${
                              darkMode
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-red-500 hover:bg-red-600'
                            } text-white`}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePlanes.length === 0 && (
              <div className={`text-center py-6 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No active section planes.
                <br />
                Add a plane to create a section cut.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
