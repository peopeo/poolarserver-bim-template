/**
 * ThreeJsViewer Component
 *
 * Main Three.js BIM viewer component
 */

import React, { useRef, useEffect } from 'react';
import { useThreeScene } from '../../hooks/threejs/useThreeScene';
import * as THREE from 'three';

interface ThreeJsViewerProps {
  /** Dark mode state */
  darkMode: boolean;
}

export function ThreeJsViewer({ darkMode }: ThreeJsViewerProps) {
  const canvasId = 'threejs-canvas';
  const containerRef = useRef<HTMLDivElement>(null);

  const { scene, camera, renderer, controls, isLoading, error } = useThreeScene({
    canvasId,
    antialias: true,
    transparent: false,
    backgroundColor: darkMode ? '#1a1a1a' : '#f0f0f0',
    showGrid: true,
    gridSize: 50,
    autoResize: true
  });

  // Add a test cube to verify the viewer is working
  useEffect(() => {
    if (!scene) return;

    // Create a test cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      roughness: 0.5,
      metalness: 0.2
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    // Add a ground plane
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: darkMode ? 0x2a2a2a : 0xcccccc,
      roughness: 0.8,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Cleanup
    return () => {
      scene.remove(cube);
      scene.remove(plane);
      geometry.dispose();
      material.dispose();
      planeGeometry.dispose();
      planeMaterial.dispose();
    };
  }, [scene, darkMode]);

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
        <p className={`text-sm mt-1 ${isLoading ? 'text-blue-500 animate-pulse' : error ? 'text-red-500' : 'text-gray-500'}`}>
          {error ? `Error: ${error}` : isLoading ? 'Initializing viewer...' : 'Ready - Test cube displayed'}
        </p>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <canvas
          id={canvasId}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
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
          disabled={isLoading || !!error}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isLoading || error
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
          disabled={isLoading || !!error}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isLoading || error
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
          disabled={isLoading || !!error}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isLoading || error
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
