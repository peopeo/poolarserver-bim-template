import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface UseGizmoProps {
  camera: THREE.Camera | null;
  target?: THREE.Vector3;
  onCameraChange?: () => void;
}

export const useGizmo = ({ camera, target = new THREE.Vector3(0, 0, 0), onCameraChange }: UseGizmoProps) => {
  const gizmoSceneRef = useRef<THREE.Scene | null>(null);
  const gizmoCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gizmoRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gizmoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const allAxesRef = useRef<THREE.Group[]>([]);
  const hoveredAxisRef = useRef<THREE.Group | null>(null);
  const [gizmoSize, setGizmoSize] = useState(120);

  // Initialize gizmo scene
  useEffect(() => {
    if (!camera) return;

    // Create gizmo scene
    const gizmoScene = new THREE.Scene();
    gizmoSceneRef.current = gizmoScene;

    // Create gizmo camera
    const gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    gizmoCamera.position.set(0, 0, 2.5);
    gizmoCamera.lookAt(0, 0, 0);
    gizmoCameraRef.current = gizmoCamera;

    // Create axis arrows
    const createArrow = (color: number) => {
      const group = new THREE.Group();

      // Shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.7, 16),
        new THREE.MeshBasicMaterial({
          color: color,
        })
      );
      shaft.position.y = 0.35;
      group.add(shaft);

      // Tip
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.15, 16),
        new THREE.MeshBasicMaterial({
          color: color,
        })
      );
      tip.position.y = 0.775;
      group.add(tip);

      return group;
    };

    // X axis (red)
    const xAxis = createArrow(0xff0000);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.userData = { axis: 'X', dir: new THREE.Vector3(1, 0, 0) };
    gizmoScene.add(xAxis);

    // Y axis (green)
    const yAxis = createArrow(0x00ff00);
    yAxis.userData = { axis: 'Y', dir: new THREE.Vector3(0, 1, 0) };
    gizmoScene.add(yAxis);

    // Z axis (blue)
    const zAxis = createArrow(0x0000ff);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.userData = { axis: 'Z', dir: new THREE.Vector3(0, 0, 1) };
    gizmoScene.add(zAxis);

    allAxesRef.current = [xAxis, yAxis, zAxis];

    // Negative axes (small dots)
    const negXSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x660000 })
    );
    negXSphere.position.set(-0.5, 0, 0);
    negXSphere.userData = { axis: '-X', dir: new THREE.Vector3(-1, 0, 0) };
    gizmoScene.add(negXSphere);

    const negYSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x006600 })
    );
    negYSphere.position.set(0, -0.5, 0);
    negYSphere.userData = { axis: '-Y', dir: new THREE.Vector3(0, -1, 0) };
    gizmoScene.add(negYSphere);

    const negZSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x000066 })
    );
    negZSphere.position.set(0, 0, -0.5);
    negZSphere.userData = { axis: '-Z', dir: new THREE.Vector3(0, 0, -1) };
    gizmoScene.add(negZSphere);

    // Add negative spheres to clickable objects
    allAxesRef.current.push(negXSphere as any, negYSphere as any, negZSphere as any);

    // Center sphere
    const centerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    gizmoScene.add(centerSphere);

    // Cleanup
    return () => {
      gizmoScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
    };
  }, [camera]);

  // Sync gizmo camera with main camera
  const syncGizmo = () => {
    if (!camera || !gizmoCameraRef.current) return;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.multiplyScalar(-2.5);
    gizmoCameraRef.current.position.copy(direction);
    gizmoCameraRef.current.lookAt(0, 0, 0);
    gizmoCameraRef.current.up.copy(camera.up);
  };

  // Render gizmo
  const renderGizmo = () => {
    if (!gizmoRendererRef.current || !gizmoSceneRef.current || !gizmoCameraRef.current) return;

    syncGizmo();
    gizmoRendererRef.current.render(gizmoSceneRef.current, gizmoCameraRef.current);
  };

  // Handle axis click
  const handleAxisClick = (axis: THREE.Group) => {
    if (!camera || !(camera instanceof THREE.PerspectiveCamera)) return;

    const dir = axis.userData.dir.clone();
    const distance = camera.position.distanceTo(target);

    const targetPosition = new THREE.Vector3(
      target.x + dir.x * distance,
      target.y + dir.y * distance,
      target.z + dir.z * distance
    );

    let targetUp = new THREE.Vector3(0, 1, 0);
    if (Math.abs(dir.y) > 0.99) {
      targetUp = new THREE.Vector3(0, 0, dir.y > 0 ? -1 : 1);
    }

    // Animate camera
    const startPos = camera.position.clone();
    const startUp = camera.up.clone();
    const duration = 400;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      camera.position.lerpVectors(startPos, targetPosition, eased);
      camera.up.lerpVectors(startUp, targetUp, eased);
      camera.lookAt(target);

      if (onCameraChange) onCameraChange();

      if (t < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    animateCamera();
  };

  // Handle gizmo drag (rotate main camera)
  const handleGizmoDrag = (deltaX: number, deltaY: number) => {
    if (!camera || !(camera instanceof THREE.PerspectiveCamera)) return;

    const rotationSpeed = 0.01;

    const offset = new THREE.Vector3();
    offset.copy(camera.position).sub(target);

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);

    spherical.theta -= deltaX * rotationSpeed;
    spherical.phi -= deltaY * rotationSpeed;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

    offset.setFromSpherical(spherical);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);

    if (onCameraChange) onCameraChange();
  };

  // Highlight axis on hover
  const highlightAxis = (axis: THREE.Group | null) => {
    // Reset all highlights by restoring original colors
    allAxesRef.current.forEach((ax) => {
      ax.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          // Restore original color based on parent's userData
          if (ax.userData.axis === 'X' || ax.userData.axis === '-X') {
            child.material.color.setHex(ax.userData.axis === 'X' ? 0xff0000 : 0x660000);
          } else if (ax.userData.axis === 'Y' || ax.userData.axis === '-Y') {
            child.material.color.setHex(ax.userData.axis === 'Y' ? 0x00ff00 : 0x006600);
          } else if (ax.userData.axis === 'Z' || ax.userData.axis === '-Z') {
            child.material.color.setHex(ax.userData.axis === 'Z' ? 0x0000ff : 0x000066);
          }
          child.material.needsUpdate = true;
        }
      });
    });

    // Highlight hovered axis by brightening it
    if (axis) {
      axis.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          const currentColor = child.material.color.getHex();
          // Brighten the color
          const r = Math.min(1, ((currentColor >> 16) & 255) / 255 + 0.3);
          const g = Math.min(1, ((currentColor >> 8) & 255) / 255 + 0.3);
          const b = Math.min(1, (currentColor & 255) / 255 + 0.3);
          child.material.color.setRGB(r, g, b);
          child.material.needsUpdate = true;
        }
      });
    }

    hoveredAxisRef.current = axis;
  };

  // Raycast to find hovered axis
  const getHoveredAxis = (mouseX: number, mouseY: number): THREE.Group | null => {
    if (!gizmoCanvasRef.current || !gizmoCameraRef.current) return null;

    const rect = gizmoCanvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((mouseX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((mouseY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, gizmoCameraRef.current);
    const intersects = raycaster.intersectObjects(allAxesRef.current, true);

    if (intersects.length > 0) {
      let obj: any = intersects[0].object;
      while (obj.parent && !obj.userData.axis) {
        obj = obj.parent;
      }

      if (obj.userData && obj.userData.axis) {
        return obj;
      }
    }

    return null;
  };

  return {
    gizmoSceneRef,
    gizmoCameraRef,
    gizmoRendererRef,
    gizmoCanvasRef,
    allAxesRef,
    hoveredAxisRef,
    gizmoSize,
    setGizmoSize,
    renderGizmo,
    handleAxisClick,
    handleGizmoDrag,
    highlightAxis,
    getHoveredAxis,
  };
};
