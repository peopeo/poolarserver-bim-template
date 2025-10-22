/**
 * SpatialTreePanel Component
 *
 * Displays IFC spatial hierarchy in a tree structure
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, X } from 'lucide-react';
import type { SpatialNode } from '../../services/api/ifcIntelligenceApi';

interface SpatialTreePanelProps {
  /** Spatial tree root node */
  spatialTree: SpatialNode | null;

  /** Handler for node selection */
  onSelectNode?: (node: SpatialNode) => void;

  /** Dark mode */
  darkMode?: boolean;

  /** Embedded mode (no button, always show tree) - for use in sidebars */
  embedded?: boolean;
}

interface TreeNodeProps {
  node: SpatialNode;
  level: number;
  onSelectNode?: (node: SpatialNode) => void;
  darkMode: boolean;
}

function TreeNode({ node, level, onSelectNode, darkMode }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  const getTypeColor = (type: string) => {
    if (type.includes('Project')) return 'text-purple-500';
    if (type.includes('Site')) return 'text-blue-500';
    if (type.includes('Building')) return 'text-green-500';
    if (type.includes('Storey')) return 'text-yellow-500';
    if (type.includes('Space')) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getDisplayName = () => {
    if (node.long_name) return node.long_name;
    if (node.name) return node.name;
    return node.ifc_type;
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-opacity-50 ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-gray-500 hover:bg-opacity-20 rounded"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <span className={`text-xs font-medium ${getTypeColor(node.ifc_type)}`}>
          {node.ifc_type}
        </span>

        <span className="text-xs flex-1 truncate" title={getDisplayName()}>
          {getDisplayName()}
        </span>

        {hasChildren && (
          <span className="text-xs text-gray-400">
            ({node.children.length})
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={child.global_id || `${child.name}-${index}`}
              node={child}
              level={level + 1}
              onSelectNode={onSelectNode}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SpatialTreePanel({
  spatialTree,
  onSelectNode,
  darkMode = false,
  embedded = false
}: SpatialTreePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSpatialTree = spatialTree !== null;

  console.log('SpatialTreePanel render - spatialTree:', spatialTree, 'hasSpatialTree:', hasSpatialTree, 'embedded:', embedded);

  // In embedded mode, just render the tree directly
  if (embedded) {
    return (
      <div className="flex-1 overflow-y-auto">
        {hasSpatialTree ? (
          <TreeNode
            node={spatialTree}
            level={0}
            onSelectNode={onSelectNode}
            darkMode={darkMode}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Building2 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">No spatial hierarchy data available</p>
          </div>
        )}
      </div>
    );
  }

  // Normal floating mode
  return (
    <>
      {!isOpen ? (
        <div className="absolute left-4 bottom-4 z-40">
          <button
            onClick={() => setIsOpen(true)}
            disabled={!hasSpatialTree}
            className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
              !hasSpatialTree
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                : darkMode
                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            } border`}
            title={hasSpatialTree ? "Spatial Hierarchy" : "No spatial data available for this model"}
          >
            <Building2 size={18} />
            <span className="text-sm font-medium">Spatial Tree</span>
          </button>
        </div>
      ) : (
        <div
          className={`absolute left-4 top-20 w-[350px] h-[calc(100vh-180px)] rounded-lg shadow-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } flex flex-col`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Building2 size={20} />
              <span className="font-semibold">Spatial Hierarchy</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tree Content */}
          <div className="flex-1 overflow-y-auto">
            {hasSpatialTree ? (
              <TreeNode
                node={spatialTree}
                level={0}
                onSelectNode={onSelectNode}
                darkMode={darkMode}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">No spatial hierarchy data available</p>
                <p className="text-xs mt-2">Load a model from the database to see spatial structure</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-xs text-gray-500`}>
            Click elements to select • Tree shows IFC spatial structure
          </div>
        </div>
      )}
    </>
  );
}
