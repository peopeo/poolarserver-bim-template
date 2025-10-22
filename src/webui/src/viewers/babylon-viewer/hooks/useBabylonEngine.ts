import { useEffect, useState } from 'react';
import { Engine, WebGPUEngine, Scene, Color4, Color3, HemisphericLight, DirectionalLight, Vector3 } from '@babylonjs/core';

export type RenderingAPI = 'webgpu' | 'webgl';

interface UseBabylonEngineReturn {
  engine: Engine | WebGPUEngine | null;
  scene: Scene | null;
  renderingAPI: RenderingAPI;
  isReady: boolean;
}

/**
 * Initialize Babylon.js engine with WebGPU support (fallback to WebGL)
 *
 * This hook attempts to use WebGPU first for better performance,
 * automatically falling back to WebGL if WebGPU is not supported.
 */
export function useBabylonEngine(canvas: HTMLCanvasElement | null): UseBabylonEngineReturn {
  const [engine, setEngine] = useState<Engine | WebGPUEngine | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [renderingAPI, setRenderingAPI] = useState<RenderingAPI>('webgl');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    let isMounted = true;
    let engineInstance: Engine | WebGPUEngine | null = null;

    const initializeEngine = async () => {
      try {
        let newEngine: Engine | WebGPUEngine;

        // Try WebGPU first (Babylon.js has production-ready support!)
        const webGPUSupported = await WebGPUEngine.IsSupportedAsync;

        if (webGPUSupported) {
          console.log('✅ WebGPU supported - initializing WebGPUEngine');
          const webGPUEngine = new WebGPUEngine(canvas, {
            adaptToDeviceRatio: false, // Manual control for better performance
            antialias: false, // Disable for performance (can enable FXAA later if needed)
            stencil: true, // REQUIRED for HighlightLayer
            powerPreference: 'high-performance'
          });

          await webGPUEngine.initAsync();
          newEngine = webGPUEngine;

          // Performance optimizations
          newEngine.enableOfflineSupport = false;
          newEngine.doNotHandleContextLost = true; // Faster, we handle it ourselves

          if (isMounted) {
            setRenderingAPI('webgpu');
            console.log('✅ WebGPU engine initialized successfully');
          }
        } else {
          console.log('⚠️ WebGPU not supported - falling back to WebGL');
          newEngine = new Engine(canvas, false, { // antialias: false for performance
            preserveDrawingBuffer: false, // Not needed, saves memory
            stencil: true, // REQUIRED for HighlightLayer
            antialias: false, // Disable for performance
            powerPreference: 'high-performance',
            depth: true,
            premultipliedAlpha: false
          });

          // Performance optimizations for WebGL
          newEngine.enableOfflineSupport = false;
          newEngine.doNotHandleContextLost = true;

          if (isMounted) {
            setRenderingAPI('webgl');
            console.log('✅ WebGL engine initialized successfully');
          }
        }

        // Hardware scaling for better performance (render at lower resolution)
        newEngine.setHardwareScalingLevel(1 / window.devicePixelRatio);

        engineInstance = newEngine;

        // Create scene
        const newScene = new Scene(newEngine);
        setupScene(newScene);

        if (isMounted) {
          setEngine(newEngine);
          setScene(newScene);
          setIsReady(true);
        }

        // Start render loop
        newEngine.runRenderLoop(() => {
          // Only render if mounted and camera is ready
          if (isMounted && newScene.activeCamera) {
            newScene.render();
          }
        });

        // Handle window resize
        const handleResize = () => {
          newEngine.resize();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
          isMounted = false;
          window.removeEventListener('resize', handleResize);
          newScene.dispose();
          newEngine.dispose();
        };
      } catch (error) {
        console.error('❌ Failed to initialize Babylon.js engine:', error);
        setIsReady(false);
      }
    };

    initializeEngine();

    return () => {
      isMounted = false;
      if (engineInstance) {
        engineInstance.dispose();
      }
    };
  }, [canvas]);

  return { engine, scene, renderingAPI, isReady };
}

/**
 * Setup default scene configuration with performance optimizations
 */
function setupScene(scene: Scene): void {
  // Background color - light gray (matching Three.js viewer)
  scene.clearColor = new Color4(0.95, 0.95, 0.95, 1.0);

  // Ambient color for overall scene lighting
  scene.ambientColor = new Color3(0.3, 0.3, 0.3);

  // Performance optimizations
  scene.autoClear = false; // Don't clear color/depth between render groups
  scene.autoClearDepthAndStencil = false; // Manual control
  scene.blockMaterialDirtyMechanism = true; // Reduce material update checks

  // Reduce rendering overhead
  scene.constantlyUpdateMeshUnderPointer = false; // Only update on click
  scene.skipPointerMovePicking = true; // Don't pick on every mouse move
  scene.skipFrustumClipping = false; // Keep frustum culling enabled

  // Disable unnecessary features
  scene.postProcessesEnabled = false; // No post-processing for performance
  scene.lensFlaresEnabled = false; // Disable lens flares
  scene.particlesEnabled = false; // Disable particles
  scene.spritesEnabled = false; // Disable sprites
  scene.proceduralTexturesEnabled = false; // Disable procedural textures

  // Optimize picking
  scene.constantlyUpdateMeshUnderPointer = false;

  // Use incremental rendering mode for static scenes
  scene.renderTargetsEnabled = false;

  // Add hemispheric light (soft ambient lighting from above)
  const hemisphericLight = new HemisphericLight(
    'hemisphericLight',
    new Vector3(0, 1, 0),
    scene
  );
  hemisphericLight.intensity = 0.7;
  hemisphericLight.specular = new Color3(0.2, 0.2, 0.2);

  // Add directional light (sun-like lighting)
  const directionalLight = new DirectionalLight(
    'directionalLight',
    new Vector3(-1, -2, -1),
    scene
  );
  directionalLight.intensity = 0.5;
  directionalLight.specular = new Color3(0.3, 0.3, 0.3);

  console.log('✅ Scene configured with default lighting and performance optimizations');
}
