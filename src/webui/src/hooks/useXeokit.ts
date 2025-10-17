import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    viewer?: any;
  }
}

const MODELS = [
  { id: 'mechanical', name: 'mechanical' },
  { id: 'plumbing', name: 'plumbing' },
  { id: 'electrical', name: 'electrical' },
  { id: 'fireAlarms', name: 'fireAlarms' },
  { id: 'sprinklers', name: 'sprinklers' },
  { id: 'structure', name: 'structure' },
  { id: 'architectural', name: 'architectural' }
];

export function useXeokit(canvasId: string, treeViewContainerId?: string, navCubeCanvasId?: string) {
  const viewerRef = useRef<any>(null);
  const treeViewRef = useRef<any>(null);
  const navCubeRef = useRef<any>(null);
  const xktLoaderRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing viewer...');
  const isInitialized = useRef<boolean>(false);

  // Extract loading logic into a reusable function
  const loadAllModelsRef = useRef<(() => Promise<void>) | null>(null);

  loadAllModelsRef.current = async () => {
    if (!viewerRef.current || !xktLoaderRef.current) {
      console.warn('Viewer or loader not initialized');
      return;
    }

    setIsLoading(true);
    const t0 = performance.now();

    const loadModel = async (index: number): Promise<void> => {
      if (index >= MODELS.length) {
        const t1 = performance.now();
        let numEntities = 0;
        for (const id in viewerRef.current.scene.models) {
          const sceneModel = viewerRef.current.scene.models[id];
          numEntities += sceneModel.numEntities;
        }
        setLoadingStatus(`Loaded ${MODELS.length} models in ${Math.floor((t1 - t0)) / 1000}s - Objects: ${numEntities}`);
        setIsLoading(false);
        return;
      }

      const model = MODELS[index];
      setLoadingStatus(`Loading model ${index + 1} of ${MODELS.length}: ${model.name}`);

      return new Promise((resolve) => {
        const sceneModel = xktLoaderRef.current.load({
          id: model.id,
          src: `/api/IfcTestData/ifctestxkt/${model.name}`,
          metaModelSrc: `/api/IfcTestData/ifctestjson/${model.name}`,
          edges: true,
          excludeUnclassifiedObjects: model.name === 'structure' || model.name === 'architectural'
        });

        sceneModel.on('loaded', () => {
          loadModel(index + 1).then(resolve);
        });

        sceneModel.on('error', (error: any) => {
          console.error(`Error loading ${model.name}:`, error);
          loadModel(index + 1).then(resolve);
        });
      });
    };

    await loadModel(0);
  };

  // Reload function
  const reloadModels = () => {
    if (!viewerRef.current) {
      console.warn('Viewer not initialized');
      return;
    }

    console.log('Reloading models...');

    // Clear all existing models
    const scene = viewerRef.current.scene;
    const modelIds = Object.keys(scene.models);

    modelIds.forEach((modelId) => {
      const model = scene.models[modelId];
      if (model && model.destroy) {
        model.destroy();
      }
    });

    // Clear the tree view if it exists
    if (treeViewContainerId) {
      const container = document.getElementById(treeViewContainerId);
      if (container) {
        container.innerHTML = '';
      }
    }

    // Reload all models
    if (loadAllModelsRef.current) {
      loadAllModelsRef.current();
    }
  };

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitialized.current) {
      console.log('Already initialized, skipping...');
      return;
    }

    console.log('Initializing xeokit viewer...');

    const initViewer = async () => {
      try {
        setLoadingStatus('Loading xeokit modules...');

        // Dynamically import xeokit from node_modules
        const module = await import('@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js');
        const { Viewer, XKTLoaderPlugin, FastNavPlugin, TreeViewPlugin, NavCubePlugin } = module;

        setLoadingStatus('Creating viewer...');

        // Create viewer with same settings as example
        viewerRef.current = new Viewer({
          canvasId: canvasId,
          transparent: true,
          saoEnabled: true,
          dtxEnabled: true
        });

        // Set camera position for hospital model
        viewerRef.current.camera.eye = [110.27, 172.88, -6.49];
        viewerRef.current.camera.look = [33.88, 177.99, -101.79];
        viewerRef.current.camera.up = [0.02, 0.99, 0.03];

        // Add fast navigation plugin
        new FastNavPlugin(viewerRef.current, {
          hideEdges: true,
          hideSAO: true,
          hideColorTexture: true,
          hidePBR: true,
          hideTransparentObjects: false,
          scaleCanvasResolution: false,
          scaleCanvasResolutionFactor: 0.5,
          delayBeforeRestore: true,
          delayBeforeRestoreSeconds: 0.4
        });

        // Add TreeViewPlugin if container is provided
        if (treeViewContainerId) {
          const treeViewContainer = document.getElementById(treeViewContainerId);
          if (treeViewContainer) {
            treeViewRef.current = new TreeViewPlugin(viewerRef.current, {
              containerElement: treeViewContainer,
              autoExpandDepth: 0,
              hierarchy: 'containment'
            });
          }
        }

        // Add NavCubePlugin if canvas is provided
        if (navCubeCanvasId) {
          navCubeRef.current = new NavCubePlugin(viewerRef.current, {
            canvasId: navCubeCanvasId,
            visible: true,
            size: 200,
            alignment: 'bottomRight',
            bottomMargin: 100,
            rightMargin: 10
          });
        }

        // Create XKT loader
        xktLoaderRef.current = new XKTLoaderPlugin(viewerRef.current);

        // Mark as initialized BEFORE loading models to prevent double load
        isInitialized.current = true;

        // Load models
        if (loadAllModelsRef.current) {
          await loadAllModelsRef.current();
        }

        window.viewer = viewerRef.current;

        console.log('Xeokit viewer initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Xeokit viewer:', error);
        setLoadingStatus('Error: Failed to load viewer');
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      console.log('Cleanup called');
      // Only cleanup if we're actually unmounting, not in StrictMode double-render
      if (isInitialized.current) {
        if (treeViewRef.current && treeViewRef.current.destroy) {
          treeViewRef.current.destroy();
          treeViewRef.current = null;
        }
        if (navCubeRef.current && navCubeRef.current.destroy) {
          navCubeRef.current.destroy();
          navCubeRef.current = null;
        }
        if (viewerRef.current && viewerRef.current.destroy) {
          viewerRef.current.destroy();
          viewerRef.current = null;
          delete window.viewer;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return { viewerRef, treeViewRef, navCubeRef, isLoading, loadingStatus, reloadModels };
}
