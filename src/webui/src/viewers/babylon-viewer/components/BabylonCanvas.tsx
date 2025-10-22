import React, { useRef, useEffect } from 'react';

interface BabylonCanvasProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  darkMode?: boolean;
}

/**
 * Canvas component for Babylon.js rendering
 *
 * This component provides a full-screen canvas element for Babylon.js
 * and notifies parent when the canvas is ready for engine initialization.
 */
export function BabylonCanvas({ onCanvasReady, darkMode = false }: BabylonCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      style={{
        display: 'block',
        outline: 'none',
        touchAction: 'none', // Prevent default touch gestures
      }}
    />
  );
}
