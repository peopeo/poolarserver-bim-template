import React, { useState, useCallback, useEffect } from 'react';
import { BabylonCanvas } from './components/BabylonCanvas';
import { LoadingProgress } from './components/LoadingProgress';
import { useBabylonEngine } from './hooks/useBabylonEngine';
import { useBabylonCamera, resetCamera } from './hooks/useBabylonCamera';
import { useBabylonModelLoader } from './hooks/useBabylonModelLoader';
import { useBabylonSelection } from './hooks/useBabylonSelection';
import { useBabylonGizmos, setCameraView } from './hooks/useBabylonGizmos';
import { useBabylonMeasurement } from './hooks/useBabylonMeasurement';
import { PropertyPanel } from '../../components/threejs/PropertyPanel';
import { SpatialTreePanel } from '../../components/threejs/SpatialTreePanel';
import { MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import { getRevisionElementProperties, getRevisionSpatialTree } from '../../services/api/projectsApi';
import { ChevronLeft, ChevronRight, Building2, RotateCcw, Maximize2, Eye, Ruler, Scissors } from 'lucide-react';
import type { BIMMetadata } from '../../types/threejs';
import type { IfcElementProperties, SpatialNode } from '../../services/api/ifcIntelligenceApi';

interface BabylonViewerProps {
  projectId?: number;
  revisionId?: number;
  darkMode?: boolean;
}

/**
 * Main Babylon.js Viewer Component
 *
 * This viewer provides BIM model visualization using Babylon.js with WebGL rendering.
 * Features:
 * - WebGL rendering
 * - ArcRotateCamera for orbit controls
 * - Element selection and highlighting with HighlightLayer
 * - Property panel integration
 * - Spatial tree navigation
 */
export function BabylonViewer({ projectId, revisionId, darkMode = false }: BabylonViewerProps): JSX.Element {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [showTestCube, setShowTestCube] = useState(true);
  const [spatialTree, setSpatialTree] = useState<SpatialNode | null>(null);
  const [isLoadingSpatialTree, setIsLoadingSpatialTree] = useState(false);
  const [spatialTreeError, setSpatialTreeError] = useState<string | null>(null);
  const [elementProperties, setElementProperties] = useState<IfcElementProperties | null>(null);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [propertiesSidebarOpen, setPropertiesSidebarOpen] = useState<boolean>(true);

  // Initialize engine and scene
  const { engine, scene, renderingAPI, isReady } = useBabylonEngine(canvas);

  // Initialize camera
  const { camera } = useBabylonCamera(scene, canvas);

  // Initialize model loader
  const { loadModel, status: loadStatus, progress, statusMessage, error: loadError } = useBabylonModelLoader(scene);

  // Initialize measurement tools (before selection, so we can pass measurementMode)
  const { measurementMode, setMeasurementMode, clearMeasurements, measurements } = useBabylonMeasurement(scene, canvas, camera);

  // Initialize selection (with measurement mode to disable selection during measurement)
  const { selectedElement, selectedMesh, clearSelection, selectByGuid, hasSelection } = useBabylonSelection({
    scene,
    canvas,
    measurementMode
  });

  // Initialize gizmos and advanced features
  const { axesViewer, toggleAxes, axesVisible } = useBabylonGizmos(scene, camera);

  // Handle canvas ready
  const handleCanvasReady = useCallback((canvasElement: HTMLCanvasElement) => {
    setCanvas(canvasElement);
  }, []);


  // TEMPORARY: Debug measurement mode state
  useEffect(() => {
    console.log(`🔍 Measurement mode changed: "${measurementMode}"`);
  }, [measurementMode]);

  // Load spatial tree when model is loaded
  useEffect(() => {
    if (!projectId || !revisionId) {
      setSpatialTree(null);
      setSpatialTreeError(null);
      return;
    }

    const loadSpatialTree = async () => {
      setIsLoadingSpatialTree(true);
      setSpatialTreeError(null);

      try {
        console.log(`📂 Loading spatial tree for project ${projectId}, revision ${revisionId}`);
        const tree = await getRevisionSpatialTree(projectId, revisionId);

        if (!tree) {
          throw new Error('Spatial tree is empty');
        }

        setSpatialTree(tree);
        console.log('✅ Spatial tree loaded successfully:', tree);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load spatial tree';
        console.error('❌ Failed to load spatial tree:', error);
        setSpatialTreeError(errorMessage);
        setSpatialTree(null);
      } finally {
        setIsLoadingSpatialTree(false);
      }
    };

    loadSpatialTree();
  }, [projectId, revisionId]);

  // Load element properties when selection changes
  useEffect(() => {
    if (!selectedElement || !projectId || !revisionId || !selectedElement.ifcGuid) {
      setElementProperties(null);
      return;
    }

    const loadProperties = async () => {
      setIsLoadingProperties(true);
      setPropertyError(null);

      try {
        const properties = await getRevisionElementProperties(projectId, revisionId, selectedElement.ifcGuid!);
        setElementProperties(properties);
        console.log('✅ Properties loaded for:', selectedElement.type);
      } catch (error) {
        console.error('❌ Failed to load properties:', error);
        setPropertyError(error instanceof Error ? error.message : 'Failed to load properties');
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
  }, [selectedElement, projectId, revisionId]);

  // Handle spatial tree node selection
  const handleSpatialNodeSelect = useCallback(async (node: SpatialNode) => {
    if (!node.global_id || !projectId || !revisionId) {
      console.warn('Cannot load properties: missing global_id, projectId, or revisionId');
      return;
    }

    console.log('📍 Selected from spatial tree:', node.ifc_type, node.name || node.long_name);

    // Skip spatial containers (they don't have geometry properties)
    const spatialTypes = ['IfcProject', 'IfcSite', 'IfcBuilding', 'IfcBuildingStorey', 'IfcSpace', 'IfcZone'];
    if (spatialTypes.includes(node.ifc_type)) {
      console.log(`⚠️ Skipping property fetch for spatial element: ${node.ifc_type}`);
      setElementProperties(null);
      setPropertyError(`${node.ifc_type} elements don't have detailed properties`);
      return;
    }

    // Try to highlight the mesh in 3D (if it exists)
    selectByGuid(node.global_id);

    // Fetch properties from API (works whether or not mesh is found)
    try {
      setIsLoadingProperties(true);
      setPropertyError(null);
      console.log(`🔍 Fetching properties for: ${node.global_id} (${node.ifc_type})`);

      const properties = await getRevisionElementProperties(projectId, revisionId, node.global_id);
      setElementProperties(properties);
      console.log('✅ Properties loaded for:', node.ifc_type);
    } catch (error) {
      console.error('❌ Failed to load properties:', error);
      setPropertyError(error instanceof Error ? error.message : 'Failed to load properties');
      setElementProperties(null);
    } finally {
      setIsLoadingProperties(false);
    }
  }, [selectByGuid, projectId, revisionId]);

  // Load model from API when projectId and revisionId are provided
  useEffect(() => {
    if (!scene || !camera || !projectId || !revisionId) {
      return;
    }

    console.log(`📦 Loading model for project ${projectId}, revision ${revisionId}`);
    setShowTestCube(false);

    const loadBimModel = async () => {
      try {
        // Construct glTF URL
        const gltfUrl = `http://localhost:5000/api/projects/${projectId}/revisions/${revisionId}/gltf`;

        // Fetch elements metadata
        const elementsResponse = await fetch(`http://localhost:5000/api/projects/${projectId}/revisions/${revisionId}/elements`);
        const elements = await elementsResponse.json();

        // Extract unique types and property sets
        const typesSet = new Set<string>();
        const propertySetsSet = new Set<string>();

        elements.forEach((element: any) => {
          if (element.type) typesSet.add(element.type);
          if (element.properties) {
            element.properties.forEach((prop: any) => {
              if (prop.propertySet) propertySetsSet.add(prop.propertySet);
            });
          }
        });

        const metadata: BIMMetadata = {
          modelId: `${projectId}-${revisionId}`,
          elements,
          types: Array.from(typesSet),
          propertySets: Array.from(propertySetsSet)
        };

        // Load model
        const result = await loadModel(gltfUrl, metadata);

        if (result && camera && scene) {
          // Focus camera on model
          const center = Vector3.Center(result.boundingMin, result.boundingMax);
          const size = result.boundingMax.subtract(result.boundingMin);
          const maxDim = Math.max(size.x, size.y, size.z);
          const radius = maxDim * 1.5;

          camera.setTarget(center);
          camera.radius = radius;

          console.log(`✅ Model loaded: ${result.meshes.length} meshes`);

          // PERFORMANCE: Freeze all meshes and materials after loading
          console.log('🚀 Applying performance optimizations...');

          // Freeze all materials (they won't change)
          scene.materials.forEach(material => {
            if (material && !material.isFrozen) {
              material.freeze();
            }
          });

          // Freeze world matrices for static meshes
          result.meshes.forEach(mesh => {
            if (mesh) {
              mesh.freezeWorldMatrix(); // Don't recompute matrix
              mesh.doNotSyncBoundingInfo = true; // Don't update bounding info
              mesh.isPickable = true; // But keep pickable for selection
            }
          });

          // Apply scene optimizer for additional performance gains
          scene.freezeActiveMeshes(); // Don't re-evaluate active meshes

          console.log('✅ Performance optimizations applied');
        }
      } catch (error) {
        console.error('❌ Failed to load BIM model:', error);
      }
    };

    loadBimModel();
  }, [scene, camera, projectId, revisionId, loadModel]);

  // Test cube: Show only when no model is being loaded
  useEffect(() => {
    if (!scene || !camera || !showTestCube) return;

    console.log(`✅ Babylon.js viewer ready - using ${renderingAPI.toUpperCase()}`);

    // Create a test cube to verify rendering
    const cube = MeshBuilder.CreateBox('testCube', { size: 10 }, scene);
    cube.position.y = 5;

    // Create material
    const material = new StandardMaterial('cubeMaterial', scene);
    material.diffuseColor = new Color3(0.3, 0.6, 1.0); // Blue
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    cube.material = material;

    // Create ground plane
    const ground = MeshBuilder.CreateGround('ground', { width: 50, height: 50 }, scene);
    const groundMaterial = new StandardMaterial('groundMaterial', scene);
    groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5); // Gray
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = groundMaterial;

    console.log('✅ Test cube and ground created');

    return () => {
      cube.dispose();
      ground.dispose();
    };
  }, [scene, camera, renderingAPI, showTestCube]);

  return (
    <div className="relative w-full h-screen">
      {/* Canvas */}
      <BabylonCanvas onCanvasReady={handleCanvasReady} darkMode={darkMode} />

      {/* Loading Progress */}
      <LoadingProgress
        status={loadStatus}
        progress={progress}
        message={statusMessage}
        error={loadError}
        darkMode={darkMode}
      />

      {/* Collapsible Left Sidebar - Spatial Tree */}
      {(projectId && revisionId) && (
        <div className={`absolute left-0 top-0 h-full transition-all duration-300 z-10 ${
          sidebarOpen ? 'w-80' : 'w-0'
        }`}>
          <div className={`h-full overflow-y-auto ${
            darkMode ? 'bg-gray-800 bg-opacity-95' : 'bg-white bg-opacity-95'
          } ${sidebarOpen ? 'border-r' : ''} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ visibility: sidebarOpen ? 'visible' : 'hidden' }}>
            {/* Sidebar Header */}
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2`}>
              <Building2 size={20} />
              <h3 className="font-semibold text-sm">Spatial Hierarchy</h3>
            </div>

            {/* Loading State */}
            {isLoadingSpatialTree && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading spatial tree...</p>
              </div>
            )}

            {/* Error State */}
            {spatialTreeError && !isLoadingSpatialTree && (
              <div className="p-4">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                  <p className="font-bold text-sm">Error loading spatial tree</p>
                  <p className="text-xs mt-1">{spatialTreeError}</p>
                </div>
              </div>
            )}

            {/* Spatial Tree */}
            {spatialTree && !isLoadingSpatialTree && (
              <SpatialTreePanel
                spatialTree={spatialTree}
                onSelectNode={handleSpatialNodeSelect}
                darkMode={darkMode}
                embedded={true}
              />
            )}
          </div>
        </div>
      )}

      {/* Left Sidebar Toggle Button */}
      {(projectId && revisionId) && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute ${
            sidebarOpen ? 'left-80' : 'left-0'
          } top-4 z-20 transition-all duration-300 ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
              : 'bg-white hover:bg-gray-100 border-gray-300'
          } border rounded-r-lg shadow-lg p-2`}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      )}

      {/* Collapsible Right Sidebar - Properties Panel */}
      {(hasSelection || elementProperties || isLoadingProperties || propertyError) && (
        <div className={`absolute right-0 top-0 h-full transition-all duration-300 z-10 ${
          propertiesSidebarOpen ? 'w-96' : 'w-0'
        }`}>
          <div className={`h-full overflow-y-auto ${
            darkMode ? 'bg-gray-800 bg-opacity-95' : 'bg-white bg-opacity-95'
          } ${propertiesSidebarOpen ? 'border-l' : ''} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ visibility: propertiesSidebarOpen ? 'visible' : 'hidden' }}>
            <PropertyPanel
              properties={elementProperties}
              isLoading={isLoadingProperties}
              error={propertyError}
              onClose={() => {
                clearSelection();
                setElementProperties(null);
                setPropertyError(null);
              }}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Right Sidebar Toggle Button */}
      {(hasSelection || elementProperties || isLoadingProperties || propertyError) && (
        <button
          onClick={() => setPropertiesSidebarOpen(!propertiesSidebarOpen)}
          className={`absolute ${
            propertiesSidebarOpen ? 'right-96' : 'right-0'
          } top-4 z-20 transition-all duration-300 ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
              : 'bg-white hover:bg-gray-100 border-gray-300'
          } border rounded-l-lg shadow-lg p-2`}
        >
          {propertiesSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      )}

      {/* Status indicator */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg z-10">
        <div className="flex items-center gap-2">
          {isReady ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm">
                Babylon.js - {renderingAPI.toUpperCase()}
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-sm">Initializing...</span>
            </>
          )}
        </div>
      </div>

      {/* View Controls and Tools Toolbar */}
      {isReady && (
        <div className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
          {/* Compact Toolbar */}
          <div className={`${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-300'
          } border rounded-lg shadow-lg p-2 w-32`}>

            {/* View Presets - Horizontal Grid */}
            <div className="mb-2">
              <div className="text-xs font-semibold px-2 py-1 text-gray-500 mb-1">Views</div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setCameraView(camera, 'top')}
                  className={`${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } px-2 py-1 rounded text-xs font-medium`}
                  title="Top View"
                >
                  Top
                </button>
                <button
                  onClick={() => setCameraView(camera, 'front')}
                  className={`${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } px-2 py-1 rounded text-xs font-medium`}
                  title="Front View"
                >
                  Front
                </button>
                <button
                  onClick={() => setCameraView(camera, 'side')}
                  className={`${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } px-2 py-1 rounded text-xs font-medium`}
                  title="Side View"
                >
                  Side
                </button>
                <button
                  onClick={() => setCameraView(camera, 'isometric')}
                  className={`${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } px-2 py-1 rounded text-xs font-medium`}
                  title="Isometric View"
                >
                  ISO
                </button>
              </div>
            </div>

            {/* Tools */}
            <div className="border-t pt-2 mb-2" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
              <div className="text-xs font-semibold px-2 py-1 text-gray-500 mb-1">Tools</div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => toggleAxes()}
                  className={`${
                    axesVisible
                      ? darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                      : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } px-2 py-1 rounded text-xs flex items-center gap-2 justify-center`}
                  title="Toggle Axes"
                >
                  <Maximize2 size={14} />
                  <span>Axes</span>
                </button>
                <button
                  onClick={() => setMeasurementMode(measurementMode === 'distance' ? 'none' : 'distance')}
                  className={`${
                    measurementMode === 'distance'
                      ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                      : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } px-2 py-1 rounded text-xs flex items-center gap-2 justify-center`}
                  title="Measure Distance"
                >
                  <Ruler size={14} />
                  <span>Measure</span>
                </button>
                {measurements.length > 0 && (
                  <button
                    onClick={clearMeasurements}
                    className={`${
                      darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                    } px-2 py-1 rounded text-xs`}
                    title="Clear Measurements"
                  >
                    Clear ({measurements.length})
                  </button>
                )}
              </div>
            </div>

            {/* Camera Reset */}
            <div className="border-t pt-2" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
              <button
                onClick={() => resetCamera(camera)}
                className={`${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } w-full px-2 py-1 rounded text-xs flex items-center gap-2 justify-center`}
                title="Reset Camera"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info panel */}
      {isReady && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm z-10">
          <div>Controls:</div>
          <div className="mt-1 text-xs text-gray-300">
            <div>• Left click: Select element</div>
            <div>• Left drag: Rotate</div>
            <div>• Right drag: Pan</div>
            <div>• Scroll: Zoom</div>
          </div>
        </div>
      )}
    </div>
  );
}
