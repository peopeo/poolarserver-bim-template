/**
 * ThreeJsViewer Component
 *
 * Main Three.js BIM viewer component
 */

import React, { useRef, useEffect, useState } from 'react';
import { useThreeScene } from '../../hooks/threejs/useThreeScene';
import { useModelLoader } from '../../hooks/threejs/useModelLoader';
import { useSelection } from '../../hooks/threejs/useSelection';
import { PropertyPanel, FilterPanel, ClippingPanel, ExportPanel, ModelUrlInput, NavigationGizmo } from '../../components/threejs';
import type { ExportOptionsUI } from '../../components/threejs/ExportPanel';
import { mockMetadata, MOCK_GLTF_URL_ONLINE, FilterManager, ClippingPlaneManager, ExportManager } from '../../services/threejs';
import type { ClippingPlaneConfig, ExportResult } from '../../services/threejs';
import { ModelLoader } from '../../services/threejs/ModelLoader';
import type { FilterCriteria, FilterResult } from '../../types/threejs';
import * as THREE from 'three';

interface ThreeJsViewerProps {
  /** Dark mode state */
  darkMode: boolean;
}

export function ThreeJsViewer({ darkMode }: ThreeJsViewerProps) {
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
  const [currentModelUrl, setCurrentModelUrl] = useState<string>(MOCK_GLTF_URL_ONLINE);
  const [modelLoadError, setModelLoadError] = useState<string | undefined>();
  const [initialCameraState, setInitialCameraState] = useState<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

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

  // Load model when scene is ready or URL changes
  useEffect(() => {
    if (!scene || !camera || !controls) return;

    const loadGltfModel = async () => {
      try {
        setModelLoadError(undefined);

        // Remove old model if exists
        if (loadedModel) {
          scene.remove(loadedModel);
          modelLoaderRef.current.disposeModel(loadedModel);
          setLoadedModel(null);
        }

        const result = await loadModel(currentModelUrl, mockMetadata);

        if (result && result.model) {
          // Add model to scene
          scene.add(result.model);
          setLoadedModel(result.model);

          // Center and fit camera
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

          console.log(`Model loaded from: ${currentModelUrl}`);
          console.log(`Attached ${mockMetadata.elements.length} BIM elements metadata`);
        }
      } catch (err) {
        console.error('Error loading model:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load model';
        setModelLoadError(errorMsg);
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
    setCurrentModelUrl(url);
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
              ? `${statusMessage}`
              : hasSelection && selectedElement
              ? `Selected: ${selectedElement.type}${selectedElement.name ? ' - ' + selectedElement.name : ''}`
              : loadStatus === 'loaded'
              ? `Model loaded - ${mockMetadata.elements.length} BIM elements (click to select)`
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
            <ModelUrlInput
              onLoadUrl={handleLoadModelUrl}
              isLoading={loadStatus === 'loading'}
              error={modelLoadError}
              darkMode={darkMode}
            />
          </div>

          <div className="relative z-50">
            <FilterPanel
              availableTypes={mockMetadata.types}
              onFilterApply={handleFilterApply}
              onFilterReset={handleFilterReset}
              matchCount={filterResult?.matchCount}
              totalCount={filterResult?.totalCount || mockMetadata.elements.length}
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

        {/* Navigation Gizmo */}
        <NavigationGizmo
          camera={camera}
          target={controls?.target}
          onCameraChange={() => controls?.update()}
          darkMode={darkMode}
        />

        {/* Property Panel */}
        <PropertyPanel
          element={selectedElement}
          onClose={clearSelection}
          darkMode={darkMode}
        />
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
