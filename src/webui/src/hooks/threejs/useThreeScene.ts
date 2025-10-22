/**
 * useThreeScene Hook
 *
 * Sets up and manages a Three.js scene with camera, renderer, lights, and controls
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export type RendererType = 'webgl' | 'webgpu';

// WebGPU support check
const checkWebGPUAvailability = async (): Promise<boolean> => {
  if (!('gpu' in navigator)) {
    return false;
  }

  try {
    const adapter = await (navigator as any).gpu?.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
};

export interface UseThreeSceneOptions {
  /** Canvas element ID */
  canvasId: string;

  /** Renderer type (webgl or webgpu) */
  rendererType?: RendererType;

  /** Enable antialiasing */
  antialias?: boolean;

  /** Enable transparent background */
  transparent?: boolean;

  /** Background color (if not transparent) */
  backgroundColor?: string;

  /** Show grid helper */
  showGrid?: boolean;

  /** Grid size */
  gridSize?: number;

  /** Enable auto-resize */
  autoResize?: boolean;
}

export interface UseThreeSceneResult {
  /** Three.js scene */
  scene: THREE.Scene | null;

  /** Camera */
  camera: THREE.PerspectiveCamera | null;

  /** Renderer (WebGL only for now, WebGPU coming soon) */
  renderer: THREE.WebGLRenderer | null;

  /** Orbit controls */
  controls: OrbitControls | null;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: string | null;

  /** Actual renderer type being used */
  actualRendererType: RendererType;

  /** Whether WebGPU is available */
  webGpuAvailable: boolean;
}

/**
 * Custom hook to set up Three.js scene
 */
export function useThreeScene(options: UseThreeSceneOptions): UseThreeSceneResult {
  const {
    canvasId,
    rendererType = 'webgl',
    antialias = true,
    transparent = false,
    backgroundColor = '#f0f0f0',
    showGrid = true,
    gridSize = 50,
    autoResize = true
  } = options;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualRendererType, setActualRendererType] = useState<RendererType>('webgl');
  const [webGpuAvailable, setWebGpuAvailable] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitialized.current) {
      return;
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      setError(`Canvas element with id "${canvasId}" not found`);
      setIsLoading(false);
      return;
    }

    const initializeScene = async () => {
      try {
        // Check WebGPU availability (for future use)
        const gpuAvailable = await checkWebGPUAvailability();
        setWebGpuAvailable(gpuAvailable);

        // For now, always use WebGL (WebGPU support coming in future Three.js versions)
        if (rendererType === 'webgpu') {
          console.warn('WebGPU renderer requested but not yet supported in this version. Using WebGL.');
          if (gpuAvailable) {
            console.info('WebGPU is available in your browser - support coming soon!');
          }
        }

        setActualRendererType('webgl');

        // Create scene
        const scene = new THREE.Scene();
        if (!transparent) {
          scene.background = new THREE.Color(backgroundColor);
        }
        sceneRef.current = scene;

        // Create camera
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Create WebGL renderer
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias,
          alpha: transparent
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;

        console.log(`✅ Using WebGL renderer (WebGPU available: ${gpuAvailable})`);

      // Create orbit controls
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 500;
      controls.maxPolarAngle = Math.PI / 2; // Prevent camera going below ground
      controlsRef.current = controls;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 10);
      directionalLight.castShadow = true;
      directionalLight.shadow.camera.left = -50;
      directionalLight.shadow.camera.right = 50;
      directionalLight.shadow.camera.top = 50;
      directionalLight.shadow.camera.bottom = -50;
      directionalLight.shadow.camera.near = 0.1;
      directionalLight.shadow.camera.far = 100;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Add grid helper
      if (showGrid) {
        const gridHelper = new THREE.GridHelper(gridSize, gridSize);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);
        gridHelperRef.current = gridHelper;
      }

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      resizeHandlerRef.current = handleResize;

      if (autoResize) {
        window.addEventListener('resize', handleResize);
        // Initial resize
        setTimeout(handleResize, 100);
      }

        isInitialized.current = true;
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Three.js scene:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    initializeScene();

    // Cleanup function
    return () => {
      if (autoResize && resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (gridHelperRef.current && sceneRef.current) {
        sceneRef.current.remove(gridHelperRef.current);
        gridHelperRef.current.geometry.dispose();
        if (Array.isArray(gridHelperRef.current.material)) {
          gridHelperRef.current.material.forEach(m => m.dispose());
        } else {
          gridHelperRef.current.material.dispose();
        }
      }

      if (sceneRef.current) {
        // Dispose of all scene objects
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      gridHelperRef.current = null;
    };
  }, [canvasId, rendererType, antialias, transparent, showGrid, gridSize, autoResize]);

  // Update scene background when backgroundColor changes
  useEffect(() => {
    if (!sceneRef.current || transparent) return;

    sceneRef.current.background = new THREE.Color(backgroundColor);
  }, [backgroundColor, transparent]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current,
    isLoading,
    error,
    actualRendererType,
    webGpuAvailable
  };
}
