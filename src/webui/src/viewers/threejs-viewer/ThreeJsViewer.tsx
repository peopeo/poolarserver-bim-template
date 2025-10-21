/**
 * ThreeJsViewer Component
 *
 * Main Three.js BIM viewer component
 */

import React, { useRef, useEffect, useState } from 'react';
import { useThreeScene } from '../../hooks/threejs/useThreeScene';
import { useModelLoader } from '../../hooks/threejs/useModelLoader';
import { useSelection } from '../../hooks/threejs/useSelection';
import { PropertyPanel, FilterPanel, ClippingPanel, ExportPanel, NavigationGizmo } from '../../components/threejs';
import { ChevronLeft, ChevronRight, Building2, ChevronDown } from 'lucide-react';
import type { ExportOptionsUI } from '../../components/threejs/ExportPanel';
import { mockMetadata, MOCK_GLTF_URL_ONLINE, FilterManager, ClippingPlaneManager, ExportManager } from '../../services/threejs';
import type { ClippingPlaneConfig, ExportResult } from '../../services/threejs';
import { ModelLoader } from '../../services/threejs/ModelLoader';
import type { FilterCriteria, FilterResult, BIMMetadata } from '../../types/threejs';
import { getStoredModelGltfUrl, getStoredModel, getStoredModelElementProperties, type IfcElementProperties, type SpatialNode } from '../../services/api/ifcIntelligenceApi';
import { getRevisionGltfUrl, getRevision, getRevisionSpatialTree, getRevisionElements, getRevisionElementProperties, type RevisionDetail } from '../../services/api/projectsApi';
import * as THREE from 'three';

/**
 * Tree Node Component for Spatial Hierarchy
 */
interface TreeNodeProps {
  node: SpatialNode;
  level: number;
  onSelectNode?: (node: SpatialNode) => void;
  darkMode: boolean;
}

function SpatialTreeNode({ node, level, onSelectNode, darkMode }: TreeNodeProps) {
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
            <SpatialTreeNode
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

interface ThreeJsViewerProps {
  /** Dark mode state */
  darkMode: boolean;
  /** Optional project ID to load active revision from */
  projectId?: number | null;
  /** Optional revision ID to load specific revision */
  revisionId?: number | null;
}

export function ThreeJsViewer({ darkMode, projectId, revisionId }: ThreeJsViewerProps) {
  const canvasId = 'threejs-canvas';
  const containerRef = useRef<HTMLDivElement>(null);
  const modelLoaderRef = useRef<ModelLoader>(new ModelLoader());
  const filterManagerRef = useRef<FilterManager>(new FilterManager());
  const clippingManagerRef = useRef<ClippingPlaneManager>(new ClippingPlaneManager());
  const exportManagerRef = useRef<ExportManager>(new ExportManager());
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [activePlanes, setActivePlanes] = useState<Array<{ id: string; position: THREE.Vector3; normal: THREE.Vector3; enabled: boolean }>>([]);
  const [planeIdCounter, setPlaneIdCounter] = useState(0);
  const [lastExportInfo, setLastExportInfo] = useState<{ width: number; height: number; size: number; timestamp: Date } | undefined>();
  const [currentModelUrl, setCurrentModelUrl] = useState<string>('');
  const [modelLoadError, setModelLoadError] = useState<string | undefined>();
  const [initialCameraState, setInitialCameraState] = useState<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);
  const [lastRenderTime, setLastRenderTime] = useState<number | null>(null);
  const [currentModelName, setCurrentModelName] = useState<string>('');
  const [currentModelId, setCurrentModelId] = useState<number | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [currentRevisionId, setCurrentRevisionId] = useState<number | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<BIMMetadata>(mockMetadata);
  const [elementProperties, setElementProperties] = useState<IfcElementProperties | null>(null);
  const [propertiesLoading, setPropertiesLoading] = useState<boolean>(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [propertiesSidebarOpen, setPropertiesSidebarOpen] = useState<boolean>(true);

  const backgroundColor = darkMode ? '#1a1a1a' : '#f0f0f0';

  const { scene, camera, renderer, controls, isLoading: sceneLoading, error: sceneError } = useThreeScene({
    canvasId,
    antialias: true,
    transparent: false,
    backgroundColor,
    showGrid: true,
    gridSize: 50,
    autoResize: true
  });

  const { loadModel, status: loadStatus, progress, statusMessage, modelResult } = useModelLoader();

  const { selectedElement, selectedObject, clearSelection, hasSelection } = useSelection({
    scene,
    camera,
    canvasId
  });

  // Set scene and renderer in managers when ready
  useEffect(() => {
    if (scene) {
      filterManagerRef.current.setScene(scene);
      clippingManagerRef.current.setScene(scene);
      exportManagerRef.current.setScene(scene);
    }
    if (renderer) {
      clippingManagerRef.current.setRenderer(renderer);
      exportManagerRef.current.setRenderer(renderer);
    }
    if (camera) {
      exportManagerRef.current.setCamera(camera);
    }
  }, [scene, renderer, camera]);

  const handleFilterApply = (criteria: FilterCriteria) => {
    const result = filterManagerRef.current.applyFilter(criteria);
    setFilterResult(result);
    console.log('Filter applied:', result);
  };

  const handleFilterReset = () => {
    const result = filterManagerRef.current.resetFilter();
    setFilterResult(null);
    console.log('Filter reset');
  };

  // Load revision when projectId/revisionId change
  useEffect(() => {
    const loadRevisionModel = async () => {
      if (!projectId || !revisionId) return;

      try {
        console.log(`Loading revision ${revisionId} from project ${projectId}`);

        // Fetch revision details
        const revision: RevisionDetail = await getRevision(projectId, revisionId);

        if (!revision.gltfFilePath) {
          console.error('Revision does not have a glTF file');
          setModelLoadError('This revision does not have a 3D model available. Processing may still be in progress.');
          return;
        }

        if (revision.processingStatus !== 'Completed') {
          console.warn(`Revision processing status: ${revision.processingStatus}`);
          setModelLoadError(`Model processing ${revision.processingStatus.toLowerCase()}. Please wait for processing to complete.`);
          return;
        }

        // Construct the glTF URL
        const gltfUrl = getRevisionGltfUrl(projectId, revisionId);

        console.log(`Loading revision: ${revision.versionIdentifier} (${revision.ifcFileName})`);
        console.log(`glTF URL: ${gltfUrl}`);
        console.log(`Has spatial tree: ${revision.hasSpatialTree}`);

        // Create metadata for this revision
        const revisionMetadata: BIMMetadata = {
          projectName: `Revision ${revision.versionIdentifier}`,
          schema: 'IFC',
          elements: [], // Will be populated below
          types: [],
          spatialHierarchy: null, // Will fetch separately if available
          propertySets: [],
          modelId: `revision-${revisionId}`
        };

        // Fetch elements from database
        try {
          const elements = await getRevisionElements(projectId, revisionId);
          revisionMetadata.elements = elements.map(e => ({
            id: e.id,
            type: e.type,
            name: e.name || undefined,
            ifcGuid: e.ifcGuid,
            properties: []
          }));

          // Extract unique types
          revisionMetadata.types = Array.from(new Set(elements.map(e => e.type)));

          console.log(`✅ Loaded ${revisionMetadata.elements.length} elements for revision ${revision.versionIdentifier}`);
        } catch (err) {
          console.error('❌ Failed to load elements:', err);
        }

        // Fetch spatial tree if available
        if (revision.hasSpatialTree) {
          try {
            const spatialTree = await getRevisionSpatialTree(projectId, revisionId);
            revisionMetadata.spatialHierarchy = spatialTree;
            console.log('Loaded spatial tree for revision');
          } catch (err) {
            console.warn('Failed to load spatial tree:', err);
          }
        }

        setCurrentMetadata(revisionMetadata);

        // Set model name and URL to trigger loading
        setCurrentModelName(`${revision.versionIdentifier} - ${revision.ifcFileName}`);
        setCurrentModelId(null); // Not using old model ID system
        setCurrentProjectId(projectId);
        setCurrentRevisionId(revisionId);
        setCurrentModelUrl(gltfUrl);

      } catch (err) {
        console.error('Error loading revision:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load revision';
        setModelLoadError(errorMsg);
      }
    };

    loadRevisionModel();
  }, [projectId, revisionId]);

  // Load model when scene is ready or URL changes
  useEffect(() => {
    if (!scene || !camera || !controls) return;
    // Don't load if no URL is set (e.g., initial state before selecting a model)
    if (!currentModelUrl || currentModelUrl === '') return;

    const loadGltfModel = async () => {
      try {
        setModelLoadError(undefined);
        setLastLoadTime(null);
        setLastRenderTime(null);

        // Start timing
        const startTime = performance.now();
        setLoadStartTime(startTime);

        // Remove old model if exists
        if (loadedModel) {
          scene.remove(loadedModel);
          modelLoaderRef.current.disposeModel(loadedModel);
          setLoadedModel(null);
        }

        // Determine metadata to use
        // Use currentMetadata if already loaded (from revision), otherwise use mock
        let metadata = currentMetadata.elements.length > 0 ? currentMetadata : mockMetadata;

        // If loading from database, fetch actual model metadata
        if (currentModelId !== null) {
          try {
            const modelDetails = await getStoredModel(currentModelId);

            // Create BIM metadata from database model
            const elementCount = modelDetails.entityCounts
              ? Object.values(modelDetails.entityCounts).reduce((a, b) => a + b, 0)
              : 0;

            metadata = {
              projectName: modelDetails.projectName || 'Unknown Project',
              schema: modelDetails.schema || 'Unknown Schema',
              elements: Array.from({ length: elementCount }, (_, i) => ({
                id: `element-${i}`,
                type: 'IfcElement',
                name: undefined,
                ifcGuid: undefined,
                properties: {}
              })),
              types: modelDetails.entityCounts
                ? Object.keys(modelDetails.entityCounts)
                : [],
              spatialHierarchy: modelDetails.spatialTree,
              propertySets: [],
              modelId: `db-${currentModelId}`
            };

            setCurrentMetadata(metadata);
            console.log(`Loaded metadata for DB model: ${elementCount} elements`);
            console.log(`Spatial tree available:`, !!modelDetails.spatialTree, modelDetails.spatialTree);
          } catch (err) {
            console.warn('Failed to fetch model metadata, using mock data:', err);
            setCurrentMetadata(mockMetadata);
          }
        }
        // Note: If currentModelId is null but we have currentMetadata with elements,
        // we use that (from revision loading) - no need to reset to mockMetadata

        // Load model (download + parse glTF)
        const result = await loadModel(currentModelUrl, metadata);

        if (result && result.model) {
          // Calculate load time (download + parse)
          const loadEndTime = performance.now();
          const loadTimeMs = loadEndTime - startTime;
          setLastLoadTime(loadTimeMs);

          // Start render timing
          const renderStartTime = performance.now();

          // Add model to scene
          scene.add(result.model);
          setLoadedModel(result.model);

          // Performance optimization for large models
          const isLargeModel = metadata.elements.length > 1000;
          let meshCount = 0;

          result.model.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              meshCount++;
            }
          });

          if (isLargeModel) {
            console.log(`Large model detected (${meshCount} meshes) - disabling shadows for better performance`);
            renderer.shadowMap.enabled = false;
          } else {
            renderer.shadowMap.enabled = true;
          }

          // Center and fit camera (do this synchronously for correct initial view)
          const loader = modelLoaderRef.current;
          loader.centerModel(result.model);

          const cameraPos = loader.getOptimalCameraPosition(result.boundingBox, camera);
          const center = result.boundingBox.getCenter(new THREE.Vector3());

          camera.position.copy(cameraPos);
          camera.lookAt(center);
          controls.target.copy(center);
          controls.update();

          // Save initial camera state for reset view
          setInitialCameraState({
            position: cameraPos.clone(),
            target: center.clone()
          });

          // Wait for next frame to ensure GPU buffers are uploaded and rendered
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const renderEndTime = performance.now();
              const renderTimeMs = renderEndTime - renderStartTime;
              setLastRenderTime(renderTimeMs);
              setLoadStartTime(null);

              const totalTimeMs = loadTimeMs + renderTimeMs;

              console.log(`Model loaded from: ${currentModelUrl}`);
              console.log(`Load time: ${(loadTimeMs / 1000).toFixed(3)}s | Render time: ${(renderTimeMs / 1000).toFixed(3)}s | Total: ${(totalTimeMs / 1000).toFixed(3)}s`);
              console.log(`Attached ${metadata.elements.length} BIM elements metadata`);
              console.log('✅ Viewer ready - controls responsive');
            });
          });
        }
      } catch (err) {
        console.error('Error loading model:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load model';
        setModelLoadError(errorMsg);
        setLoadStartTime(null);
      }
    };

    loadGltfModel();

    // Cleanup
    return () => {
      if (loadedModel && scene) {
        scene.remove(loadedModel);
        modelLoaderRef.current.disposeModel(loadedModel);
        setLoadedModel(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, camera, controls, currentModelUrl]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (canvas) {
          canvas.width = containerRef.current.offsetWidth;
          canvas.height = containerRef.current.offsetHeight;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResetView = () => {
    if (camera && controls && initialCameraState) {
      camera.position.copy(initialCameraState.position);
      camera.lookAt(initialCameraState.target);
      controls.target.copy(initialCameraState.target);
      controls.update();
    }
  };

  const handleFitToView = () => {
    if (camera && controls && scene) {
      // Calculate bounding box of all objects
      const box = new THREE.Box3();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          box.expandByObject(object);
        }
      });

      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const distance = maxDim / (2 * Math.tan(fov / 2));

        controls.target.copy(center);
        camera.position.copy(center);
        camera.position.y += distance * 0.5;
        camera.position.z += distance * 1.5;
        camera.lookAt(center);
        controls.update();
      }
    }
  };

  const handleToggleGrid = () => {
    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.GridHelper) {
          object.visible = !object.visible;
        }
      });
    }
  };

  // Clipping plane handlers
  const handleAddPreset = (preset: 'x' | 'y' | 'z' | '-x' | '-y' | '-z', offset: number) => {
    const id = `plane-${planeIdCounter}`;
    setPlaneIdCounter(planeIdCounter + 1);

    const result = clippingManagerRef.current.createPresetPlane(id, preset, offset);

    setActivePlanes(prev => [...prev, {
      id: result.config.id,
      position: result.config.position.clone(),
      normal: result.config.normal.clone(),
      enabled: result.config.enabled
    }]);

    console.log(`Added clipping plane: ${id} (${preset}, offset: ${offset})`);
  };

  const handleAddCustom = (config: ClippingPlaneConfig) => {
    const result = clippingManagerRef.current.addPlane(config);

    setActivePlanes(prev => [...prev, {
      id: result.config.id,
      position: result.config.position.clone(),
      normal: result.config.normal.clone(),
      enabled: result.config.enabled
    }]);

    console.log(`Added custom clipping plane: ${config.id}`);
  };

  const handleRemovePlane = (id: string) => {
    const success = clippingManagerRef.current.removePlane(id);
    if (success) {
      setActivePlanes(prev => prev.filter(p => p.id !== id));
      console.log(`Removed clipping plane: ${id}`);
    }
  };

  const handleTogglePlaneEnabled = (id: string, enabled: boolean) => {
    const success = clippingManagerRef.current.setPlaneEnabled(id, enabled);
    if (success) {
      setActivePlanes(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
      console.log(`Toggled clipping plane ${id}: ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const handleUpdatePlanePosition = (id: string, position: THREE.Vector3) => {
    const success = clippingManagerRef.current.updatePlanePosition(id, position);
    if (success) {
      setActivePlanes(prev => prev.map(p => p.id === id ? { ...p, position: position.clone() } : p));
    }
  };

  const handleUpdatePlaneNormal = (id: string, normal: THREE.Vector3) => {
    const success = clippingManagerRef.current.updatePlaneNormal(id, normal);
    if (success) {
      setActivePlanes(prev => prev.map(p => p.id === id ? { ...p, normal: normal.clone() } : p));
    }
  };

  // Model URL handler
  const handleLoadModelUrl = (url: string) => {
    console.log(`Loading model from URL: ${url}`);
    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1] || 'model';
    setCurrentModelName(`URL: ${filename}`);
    setCurrentModelId(null); // Clear model ID for URL-based loads
    setCurrentModelUrl(url);
  };

  // Database model handler
  const handleLoadDatabaseModel = (id: number, fileName: string) => {
    const gltfUrl = getStoredModelGltfUrl(id);
    console.log(`Loading model from database: ${fileName} (ID: ${id})`);
    setCurrentModelName(`DB: ${fileName}`);
    setCurrentModelId(id); // Set model ID for database loads
    setCurrentModelUrl(gltfUrl);
  };

  // Spatial tree node selection handler
  const handleSpatialNodeSelect = async (node: SpatialNode) => {
    console.log('Selected spatial node:', node);

    // Only fetch properties if we have a model or revision loaded
    if (currentModelId === null && (currentProjectId === null || currentRevisionId === null)) {
      console.warn('Cannot fetch properties: No model or revision loaded');
      setPropertiesError('Properties only available for loaded models');
      return;
    }

    // Only fetch properties for non-spatial elements (building elements like walls, doors, etc.)
    const spatialTypes = ['IfcProject', 'IfcSite', 'IfcBuilding', 'IfcBuildingStorey', 'IfcSpace', 'IfcZone'];
    if (spatialTypes.includes(node.ifc_type)) {
      console.log(`Skipping property fetch for spatial element: ${node.ifc_type}`);
      setElementProperties(null);
      setPropertiesError(`${node.ifc_type} elements don't have detailed properties`);
      return;
    }

    // Fetch properties from API
    try {
      setPropertiesLoading(true);
      setPropertiesError(null);
      console.log(`Fetching properties for element: ${node.global_id} (${node.ifc_type})`);

      let properties;
      if (currentProjectId !== null && currentRevisionId !== null) {
        // Use revision API for models loaded from revisions
        properties = await getRevisionElementProperties(currentProjectId, currentRevisionId, node.global_id);
        console.log('Properties loaded from revision API:', properties);
      } else if (currentModelId !== null) {
        // Use old model API for backward compatibility
        properties = await getStoredModelElementProperties(currentModelId, node.global_id);
        console.log('Properties loaded from model API:', properties);
      } else {
        throw new Error('No model or revision context available');
      }

      setElementProperties(properties);
    } catch (err) {
      console.error('Error fetching element properties:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load properties';
      setPropertiesError(errorMsg);
      setElementProperties(null);
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Export handlers
  const handleExport = async (options: ExportOptionsUI) => {
    try {
      const result = await exportManagerRef.current.exportAndDownload({
        ...options,
        backgroundColor: darkMode ? '#1a1a1a' : '#f0f0f0'
      });

      setLastExportInfo({
        width: result.width,
        height: result.height,
        size: result.size,
        timestamp: result.timestamp
      });

      console.log(`Exported image: ${result.width}×${result.height}, ${(result.size / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleExportOrthographic = async (axis: 'x' | 'y' | 'z', options: ExportOptionsUI) => {
    try {
      const result = await exportManagerRef.current.exportOrthographic(axis, {
        ...options,
        backgroundColor: darkMode ? '#1a1a1a' : '#f0f0f0'
      });

      // Download the image
      const link = document.createElement('a');
      link.href = result.dataUrl;
      link.download = options.filename || `export-${axis}-${Date.now()}.${options.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setLastExportInfo({
        width: result.width,
        height: result.height,
        size: result.size,
        timestamp: result.timestamp
      });

      console.log(`Exported ${axis} orthographic view: ${result.width}×${result.height}, ${(result.size / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 m-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg overflow-hidden flex flex-col shadow-xl`}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex items-center justify-between`}>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Three.js BIM Viewer (PoC)</h2>
          <p className={`text-sm mt-1 ${
            sceneLoading || loadStatus === 'loading'
              ? 'text-blue-500 animate-pulse'
              : sceneError
              ? 'text-red-500'
              : hasSelection
              ? 'text-green-500'
              : 'text-gray-500'
          }`}>
            {sceneError
              ? `Error: ${sceneError}`
              : sceneLoading
              ? 'Initializing viewer...'
              : loadStatus === 'loading'
              ? `${statusMessage}${currentModelName ? ` (${currentModelName})` : ''}`
              : hasSelection && selectedElement
              ? `Selected: ${selectedElement.type}${selectedElement.name ? ' - ' + selectedElement.name : ''}`
              : loadStatus === 'loaded' && lastLoadTime !== null && lastRenderTime !== null
              ? `Loaded: ${(lastLoadTime / 1000).toFixed(2)}s + Render: ${(lastRenderTime / 1000).toFixed(2)}s = ${((lastLoadTime + lastRenderTime) / 1000).toFixed(2)}s | ${currentMetadata.elements.length} elements${currentModelName ? ` - ${currentModelName}` : ''}`
              : loadStatus === 'loaded'
              ? `Model loaded - ${currentMetadata.elements.length} BIM elements (click to select)`
              : 'Ready'}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 ml-4 relative">
          <div className="relative z-50">
            <ExportPanel
              onExport={handleExport}
              onExportOrthographic={handleExportOrthographic}
              lastExportInfo={lastExportInfo}
              darkMode={darkMode}
            />
          </div>

          <div className="relative z-50">
            <FilterPanel
              availableTypes={currentMetadata.types}
              onFilterApply={handleFilterApply}
              onFilterReset={handleFilterReset}
              matchCount={filterResult?.matchCount}
              totalCount={filterResult?.totalCount || currentMetadata.elements.length}
              darkMode={darkMode}
            />
          </div>

          <div className="relative z-50">
            <ClippingPanel
              onAddPreset={handleAddPreset}
              onAddCustom={handleAddCustom}
              onRemove={handleRemovePlane}
              onToggleEnabled={handleTogglePlaneEnabled}
              onUpdatePosition={handleUpdatePlanePosition}
              onUpdateNormal={handleUpdatePlaneNormal}
              activePlanes={activePlanes}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <canvas
          id={canvasId}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* Collapsible Sidebar with Spatial Tree */}
        <div className={`absolute left-0 top-0 h-full transition-all duration-300 z-10 ${
          sidebarOpen ? 'w-80' : 'w-0'
        }`}>
          <div className={`h-full ${
            darkMode ? 'bg-gray-800 bg-opacity-95' : 'bg-white bg-opacity-95'
          } ${sidebarOpen ? 'border-r' : ''} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ visibility: sidebarOpen ? 'visible' : 'hidden' }}>
            {/* Sidebar Header */}
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2`}>
              <Building2 size={20} />
              <h3 className="font-semibold text-sm">Spatial Hierarchy</h3>
            </div>

            {/* Spatial Tree Content */}
            <div className="flex-1 overflow-y-auto h-[calc(100%-60px)]">
              {currentMetadata.spatialHierarchy ? (
                <SpatialTreeNode
                  node={currentMetadata.spatialHierarchy}
                  level={0}
                  onSelectNode={handleSpatialNodeSelect}
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
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute ${
            sidebarOpen ? 'left-80' : 'left-0'
          } top-4 z-20 transition-all duration-300 ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
              : 'bg-white hover:bg-gray-50 border-gray-200'
          } border rounded-r-lg shadow-lg p-2`}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Navigation Gizmo */}
        <NavigationGizmo
          camera={camera}
          target={controls?.target}
          onCameraChange={() => controls?.update()}
          darkMode={darkMode}
        />

        {/* Collapsible Properties Sidebar (Right side) */}
        <div className={`absolute right-0 top-0 h-full transition-all duration-300 z-10 ${
          propertiesSidebarOpen ? 'w-96' : 'w-0'
        }`}>
          <div className={`h-full ${
            darkMode ? 'bg-gray-800 bg-opacity-95' : 'bg-white bg-opacity-95'
          } ${propertiesSidebarOpen ? 'border-l' : ''} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ visibility: propertiesSidebarOpen ? 'visible' : 'hidden' }}>
            {/* Render PropertyPanel without its own close functionality */}
            <PropertyPanel
              properties={elementProperties}
              isLoading={propertiesLoading}
              error={propertiesError}
              onClose={() => {
                setElementProperties(null);
                setPropertiesError(null);
              }}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Properties Sidebar Toggle Button */}
        <button
          onClick={() => setPropertiesSidebarOpen(!propertiesSidebarOpen)}
          className={`absolute ${
            propertiesSidebarOpen ? 'right-96' : 'right-0'
          } top-4 z-20 transition-all duration-300 ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
              : 'bg-white hover:bg-gray-50 border-gray-200'
          } border rounded-l-lg shadow-lg p-2`}
        >
          {propertiesSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Control Bar */}
      <div
        className={`px-6 py-3 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        } flex gap-2 flex-wrap`}
      >
        <button
          onClick={handleResetView}
          disabled={sceneLoading || loadStatus === 'loading' || !!sceneError}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            sceneLoading || loadStatus === 'loading' || sceneError
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Reset View
        </button>
        <button
          onClick={handleFitToView}
          disabled={sceneLoading || loadStatus === 'loading' || !!sceneError}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            sceneLoading || loadStatus === 'loading' || sceneError
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Fit to View
        </button>
        <button
          onClick={handleToggleGrid}
          disabled={sceneLoading || loadStatus === 'loading' || !!sceneError}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            sceneLoading || loadStatus === 'loading' || sceneError
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Toggle Grid
        </button>
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          {controls && (
            <span>
              Use mouse to orbit (left), pan (right), zoom (wheel)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
