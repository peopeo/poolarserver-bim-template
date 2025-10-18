/**
 * ThreeJsViewer Component
 *
 * Main Three.js BIM viewer component
 */

import React, { useRef, useEffect, useState } from 'react';
import { useThreeScene } from '../../hooks/threejs/useThreeScene';
import { useModelLoader } from '../../hooks/threejs/useModelLoader';
import { useSelection } from '../../hooks/threejs/useSelection';
import { PropertyPanel } from '../../components/threejs';
import { mockMetadata, MOCK_GLTF_URL_ONLINE } from '../../services/threejs';
import { ModelLoader } from '../../services/threejs/ModelLoader';
import * as THREE from 'three';

interface ThreeJsViewerProps {
  /** Dark mode state */
  darkMode: boolean;
}

export function ThreeJsViewer({ darkMode }: ThreeJsViewerProps) {
  const canvasId = 'threejs-canvas';
  const containerRef = useRef<HTMLDivElement>(null);
  const modelLoaderRef = useRef<ModelLoader>(new ModelLoader());
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);

  const { scene, camera, renderer, controls, isLoading: sceneLoading, error: sceneError } = useThreeScene({
    canvasId,
    antialias: true,
    transparent: false,
    backgroundColor: darkMode ? '#1a1a1a' : '#f0f0f0',
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

  // Load model when scene is ready
  useEffect(() => {
    if (!scene || !camera || !controls) return;
    if (loadedModel) return; // Already loaded

    const loadGltfModel = async () => {
      try {
        const result = await loadModel(MOCK_GLTF_URL_ONLINE, mockMetadata);

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

          console.log(`Model loaded with ${mockMetadata.elements.length} BIM elements`);
        }
      } catch (err) {
        console.error('Error loading model:', err);
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
  }, [scene, camera, controls]);

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
    if (camera && controls) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
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

  return (
    <div
      ref={containerRef}
      className={`flex-1 m-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg overflow-hidden flex flex-col shadow-xl`}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
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

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <canvas
          id={canvasId}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
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
