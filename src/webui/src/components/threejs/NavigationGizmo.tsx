import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGizmo } from '../../hooks/threejs/useGizmo';

interface NavigationGizmoProps {
  camera: THREE.Camera | null;
  target?: THREE.Vector3;
  onCameraChange?: () => void;
  darkMode?: boolean;
}

const MIN_GIZMO_SIZE = 80;
const MAX_GIZMO_SIZE = 250;
const DEFAULT_GIZMO_SIZE = 120;

export const NavigationGizmo: React.FC<NavigationGizmoProps> = ({
  camera,
  target = new THREE.Vector3(0, 0, 0),
  onCameraChange,
  darkMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [isGizmoDragging, setIsGizmoDragging] = useState(false);
  const resizeStartRef = useRef({ size: DEFAULT_GIZMO_SIZE, x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  const {
    gizmoSceneRef,
    gizmoCameraRef,
    gizmoRendererRef,
    gizmoCanvasRef,
    gizmoSize,
    setGizmoSize,
    renderGizmo,
    handleAxisClick,
    handleGizmoDrag,
    highlightAxis,
    getHoveredAxis,
  } = useGizmo({ camera, target, onCameraChange });

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current || !camera) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(gizmoSize, gizmoSize);
    renderer.setPixelRatio(window.devicePixelRatio);

    gizmoRendererRef.current = renderer;
    gizmoCanvasRef.current = canvasRef.current;

    return () => {
      renderer.dispose();
    };
  }, [camera, gizmoSize]);

  // Animation loop
  useEffect(() => {
    if (!camera) return;

    const animate = () => {
      renderGizmo();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [camera, renderGizmo]);

  // Update renderer size when gizmoSize changes
  useEffect(() => {
    if (gizmoRendererRef.current) {
      gizmoRendererRef.current.setSize(gizmoSize, gizmoSize);
    }
  }, [gizmoSize]);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      size: gizmoSize,
      x: e.clientX,
      y: e.clientY,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      const delta = (deltaX + deltaY) / 2;

      const newSize = Math.max(
        MIN_GIZMO_SIZE,
        Math.min(MAX_GIZMO_SIZE, resizeStartRef.current.size + delta)
      );
      setGizmoSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setGizmoSize]);

  // Handle gizmo interaction
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;

    const hoveredAxis = getHoveredAxis(e.clientX, e.clientY);

    if (hoveredAxis) {
      // Clicking on axis - prepare for potential click (not drag)
      setIsGizmoDragging(false);
    } else {
      // Clicking on empty space - start dragging
      setIsGizmoDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isResizing) return;

    if (isGizmoDragging) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      handleGizmoDrag(deltaX, deltaY);

      dragStartRef.current = { x: e.clientX, y: e.clientY };

      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'move';
      }
    } else {
      // Handle hover highlighting
      const hoveredAxis = getHoveredAxis(e.clientX, e.clientY);
      highlightAxis(hoveredAxis);

      if (canvasRef.current) {
        canvasRef.current.style.cursor = hoveredAxis ? 'pointer' : 'default';
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isResizing) return;

    if (isGizmoDragging) {
      setIsGizmoDragging(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
      return;
    }

    // Handle axis click
    const hoveredAxis = getHoveredAxis(e.clientX, e.clientY);
    if (hoveredAxis) {
      handleAxisClick(hoveredAxis);
    }
  };

  const handleCanvasMouseLeave = () => {
    highlightAxis(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  if (!camera) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: `${gizmoSize}px`,
        height: `${gizmoSize}px`,
        pointerEvents: 'auto',
        zIndex: 1000,
      }}
    >
      <canvas
        ref={canvasRef}
        width={gizmoSize}
        height={gizmoSize}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          boxShadow: darkMode
            ? '0 4px 12px rgba(0,0,0,0.7)'
            : '0 4px 12px rgba(0,0,0,0.3)',
          border: darkMode ? '2px solid #555' : '2px solid #ccc',
          background: darkMode
            ? 'radial-gradient(circle, rgba(60,60,60,0.95) 0%, rgba(40,40,40,0.98) 100%)'
            : 'radial-gradient(circle, rgba(240,240,240,0.95) 0%, rgba(220,220,220,0.98) 100%)',
          cursor: 'default',
        }}
      />

      {/* Resize handle */}
      <div
        ref={resizeHandleRef}
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          bottom: '5px',
          right: '5px',
          width: '20px',
          height: '20px',
          cursor: 'nwse-resize',
          background: darkMode
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(100,100,100,0.2)',
          borderRadius: '0 0 50% 0',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};
