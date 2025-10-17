import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    viewer?: any;
  }
}

export function useXeokit(canvasId: string, treeViewContainerId?: string, navCubeCanvasId?: string) {
  const viewerRef = useRef<any>(null);
  const treeViewRef = useRef<any>(null);
  const navCubeRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing viewer...');
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (isInitialized.current) return;

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
        const xktLoader = new XKTLoaderPlugin(viewerRef.current);

        // Load models sequentially
        const t0 = performance.now();

        const models = [
          { id: 'mechanical', name: 'mechanical' },
          { id: 'plumbing', name: 'plumbing' },
          { id: 'electrical', name: 'electrical' },
          { id: 'fireAlarms', name: 'fireAlarms' },
          { id: 'sprinklers', name: 'sprinklers' },
          { id: 'structure', name: 'structure' },
          { id: 'architectural', name: 'architectural' }
        ];

        const loadModel = async (index: number): Promise<void> => {
          if (index >= models.length) {
            const t1 = performance.now();
            let numEntities = 0;
            for (const id in viewerRef.current.scene.models) {
              const sceneModel = viewerRef.current.scene.models[id];
              numEntities += sceneModel.numEntities;
            }
            setLoadingStatus(`Loaded ${models.length} models in ${Math.floor((t1 - t0)) / 1000}s - Objects: ${numEntities}`);
            setIsLoading(false);
            return;
          }

          const model = models[index];
          setLoadingStatus(`Loading model ${index + 1} of ${models.length}: ${model.name}`);

          return new Promise((resolve) => {
            const sceneModel = xktLoader.load({
              id: model.id,
              src: `/WestRiverSideHospital/${model.name}.xkt`,
              metaModelSrc: `/WestRiverSideHospital/${model.name}.json`,
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

        window.viewer = viewerRef.current;
        isInitialized.current = true;

        console.log('Xeokit viewer initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Xeokit viewer:', error);
        setLoadingStatus('Error: Failed to load viewer');
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
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
        isInitialized.current = false;
        delete window.viewer;
      }
    };
  }, [canvasId, treeViewContainerId, navCubeCanvasId]);

  return { viewerRef, treeViewRef, navCubeRef, isLoading, loadingStatus };
}
