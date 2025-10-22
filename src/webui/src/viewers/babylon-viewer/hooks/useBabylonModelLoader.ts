/**
 * useBabylonModelLoader Hook
 *
 * Hook for loading glTF models with progress tracking in Babylon.js
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Scene } from '@babylonjs/core';
import { BabylonModelLoader } from '../services/BabylonModelLoader';
import type { BIMMetadata, LoadingStatus } from '../../../types/threejs';
import type { ModelLoadResult, ModelLoadProgress } from '../services/BabylonModelLoader';

export interface UseBabylonModelLoaderResult {
  /** Load a model */
  loadModel: (url: string, metadata: BIMMetadata) => Promise<ModelLoadResult | null>;

  /** Current loading status */
  status: LoadingStatus;

  /** Loading progress (0-100) */
  progress: number;

  /** Error message if any */
  error: string | null;

  /** Status message */
  statusMessage: string;

  /** Loaded model result */
  modelResult: ModelLoadResult | null;
}

/**
 * Hook to load glTF models in Babylon.js
 */
export function useBabylonModelLoader(scene: Scene | null): UseBabylonModelLoaderResult {
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [modelResult, setModelResult] = useState<ModelLoadResult | null>(null);

  const loaderRef = useRef<BabylonModelLoader | null>(null);

  // Initialize loader when scene is available
  useEffect(() => {
    if (scene && !loaderRef.current) {
      loaderRef.current = new BabylonModelLoader(scene);
    }
  }, [scene]);

  const loadModel = useCallback(async (url: string, metadata: BIMMetadata): Promise<ModelLoadResult | null> => {
    if (!loaderRef.current || !scene) {
      setError('Scene not initialized');
      return null;
    }

    try {
      setStatus('loading');
      setProgress(0);
      setError(null);
      setStatusMessage('Starting model load...');

      const result = await loaderRef.current.loadModel(
        url,
        metadata,
        (loadProgress: ModelLoadProgress) => {
          setProgress(loadProgress.percentage);
          setStatusMessage(`Loading model... ${Math.round(loadProgress.percentage)}%`);
        }
      );

      setStatus('loaded');
      setProgress(100);
      setStatusMessage('Model loaded successfully');
      setModelResult(result);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading model';
      setStatus('error');
      setError(errorMessage);
      setStatusMessage(`Error: ${errorMessage}`);
      setModelResult(null);
      return null;
    }
  }, [scene]);

  return {
    loadModel,
    status,
    progress,
    error,
    statusMessage,
    modelResult
  };
}
