import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BlenderGizmo = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Main scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Add cube
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshPhongMaterial({ color: 0xe67e22 })
    );
    scene.add(cube);

    // Grid
    scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x333333));

    // Simple orbit controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const target = new THREE.Vector3(0, 0, 0);

    renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      const rotationSpeed = 0.005;
      
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

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const offset = camera.position.clone().sub(target);
      const distance = offset.length();
      
      if (e.deltaY > 0) {
        offset.multiplyScalar(1 + zoomSpeed);
      } else {
        offset.multiplyScalar(1 - zoomSpeed);
      }
      
      camera.position.copy(target).add(offset);
    });

    // Gizmo scene with configurable size
    let gizmoSize = 120;
    const minGizmoSize = 80;
    const maxGizmoSize = 250;

    const gizmoScene = new THREE.Scene();
    const gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    gizmoCamera.position.set(0, 0, 2.5);
    gizmoCamera.lookAt(0, 0, 0);

    const gizmoCanvas = document.createElement('canvas');
    gizmoCanvas.width = gizmoSize;
    gizmoCanvas.height = gizmoSize;
    gizmoCanvas.style.position = 'absolute';
    gizmoCanvas.style.top = '20px';
    gizmoCanvas.style.right = '20px';
    gizmoCanvas.style.width = gizmoSize + 'px';
    gizmoCanvas.style.height = gizmoSize + 'px';
    gizmoCanvas.style.borderRadius = '50%';
    gizmoCanvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    gizmoCanvas.style.border = '2px solid #555';
    gizmoCanvas.style.background = 'radial-gradient(circle, rgba(60,60,60,0.95) 0%, rgba(40,40,40,0.98) 100%)';
    containerRef.current.appendChild(gizmoCanvas);

    const gizmoRenderer = new THREE.WebGLRenderer({ 
      canvas: gizmoCanvas, 
      alpha: true,
      antialias: true
    });
    gizmoRenderer.setSize(gizmoSize, gizmoSize);
    gizmoRenderer.setPixelRatio(window.devicePixelRatio);

    // Resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.top = '20px';
    resizeHandle.style.right = '20px';
    resizeHandle.style.width = gizmoSize + 'px';
    resizeHandle.style.height = gizmoSize + 'px';
    resizeHandle.style.borderRadius = '50%';
    resizeHandle.style.cursor = 'nwse-resize';
    resizeHandle.style.pointerEvents = 'none';
    containerRef.current.appendChild(resizeHandle);

    // Add resize corner indicator
    const resizeCorner = document.createElement('div');
    resizeCorner.style.position = 'absolute';
    resizeCorner.style.bottom = '5px';
    resizeCorner.style.right = '5px';
    resizeCorner.style.width = '20px';
    resizeCorner.style.height = '20px';
    resizeCorner.style.cursor = 'nwse-resize';
    resizeCorner.style.pointerEvents = 'auto';
    resizeCorner.style.background = 'rgba(255,255,255,0.2)';
    resizeCorner.style.borderRadius = '0 0 50% 0';
    resizeHandle.appendChild(resizeCorner);

    let isResizing = false;
    let resizeStartSize = gizmoSize;
    let resizeStartPos = { x: 0, y: 0 };

    const updateGizmoSize = (newSize) => {
      gizmoSize = Math.max(minGizmoSize, Math.min(maxGizmoSize, newSize));
      gizmoCanvas.style.width = gizmoSize + 'px';
      gizmoCanvas.style.height = gizmoSize + 'px';
      resizeHandle.style.width = gizmoSize + 'px';
      resizeHandle.style.height = gizmoSize + 'px';
      gizmoRenderer.setSize(gizmoSize, gizmoSize);
    };

    resizeCorner.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      resizeStartSize = gizmoSize;
      resizeStartPos = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - resizeStartPos.x;
      const deltaY = e.clientY - resizeStartPos.y;
      const delta = (deltaX + deltaY) / 2;
      
      updateGizmoSize(resizeStartSize + delta);
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
    });

    // Create axis arrows
    const createArrow = (color) => {
      const group = new THREE.Group();
      
      // Shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.7, 16),
        new THREE.MeshBasicMaterial({ 
          color: color,
          emissive: new THREE.Color(0x000000)
        })
      );
      shaft.position.y = 0.35;
      group.add(shaft);
      
      // Tip
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.15, 16),
        new THREE.MeshBasicMaterial({ 
          color: color,
          emissive: new THREE.Color(0x000000)
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

    // Negative axes (small dots)
    [-1, 0, 0].forEach((x, i) => {
      if (i === 0) {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x660000 })
        );
        sphere.position.set(-0.5, 0, 0);
        gizmoScene.add(sphere);
      }
    });

    [0, -1, 0].forEach((y, i) => {
      if (i === 1) {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x006600 })
        );
        sphere.position.set(0, -0.5, 0);
        gizmoScene.add(sphere);
      }
    });

    [0, 0, -1].forEach((z, i) => {
      if (i === 2) {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x000066 })
        );
        sphere.position.set(0, 0, -0.5);
        gizmoScene.add(sphere);
      }
    });

    // Center sphere
    const centerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    gizmoScene.add(centerSphere);

    const allAxes = [xAxis, yAxis, zAxis];

    // Gizmo interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredAxis = null;
    let isGizmoDragging = false;
    let gizmoPreviousMousePosition = { x: 0, y: 0 };

    gizmoCanvas.addEventListener('mousedown', (e) => {
      if (isResizing) return;
      
      const rect = gizmoCanvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, gizmoCamera);
      const intersects = raycaster.intersectObjects(allAxes, true);

      if (intersects.length > 0) {
        // If clicking on an axis, don't start dragging
        isGizmoDragging = false;
      } else {
        // If clicking on empty space, start dragging
        isGizmoDragging = true;
        gizmoPreviousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    gizmoCanvas.addEventListener('mousemove', (e) => {
      if (isResizing) return;
      
      const rect = gizmoCanvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle dragging to rotate main camera
      if (isGizmoDragging) {
        const deltaX = e.clientX - gizmoPreviousMousePosition.x;
        const deltaY = e.clientY - gizmoPreviousMousePosition.y;

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

        gizmoPreviousMousePosition = { x: e.clientX, y: e.clientY };
        gizmoCanvas.style.cursor = 'move';
        return;
      }

      // Handle hover highlighting
      raycaster.setFromCamera(mouse, gizmoCamera);
      
      // Only raycast against axis groups
      const intersects = raycaster.intersectObjects(allAxes, true);

      // Reset all axis highlights
      allAxes.forEach(axis => {
        axis.children.forEach(child => {
          if (child.material && child.material.emissive) {
            child.material.emissive.setHex(0x000000);
          }
        });
      });

      hoveredAxis = null;
      gizmoCanvas.style.cursor = 'default';

      if (intersects.length > 0) {
        // Find the parent axis group
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.axis) {
          obj = obj.parent;
        }
        
        if (obj.userData && obj.userData.axis) {
          hoveredAxis = obj;
          // Highlight the hovered axis
          obj.children.forEach(child => {
            if (child.material && child.material.emissive) {
              child.material.emissive.setHex(0x555555);
            }
          });
          gizmoCanvas.style.cursor = 'pointer';
        }
      }
    });

    gizmoCanvas.addEventListener('mouseup', (e) => {
      if (isResizing) return;
      
      if (isGizmoDragging) {
        isGizmoDragging = false;
        gizmoCanvas.style.cursor = 'default';
        return;
      }
      
      // Handle click on axis
      if (!hoveredAxis) return;
      
      const dir = hoveredAxis.userData.dir.clone();
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
      
      // Animate
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

        if (t < 1) {
          requestAnimationFrame(animateCamera);
        }
      };
      animateCamera();
    });

    gizmoCanvas.addEventListener('mouseleave', () => {
      // Reset all axis highlights when mouse leaves
      allAxes.forEach(axis => {
        axis.children.forEach(child => {
          if (child.material && child.material.emissive) {
            child.material.emissive.setHex(0x000000);
          }
        });
      });
      hoveredAxis = null;
      gizmoCanvas.style.cursor = 'default';
    });

    // Sync gizmo with main camera
    const syncGizmo = () => {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.multiplyScalar(-2.5);
      gizmoCamera.position.copy(direction);
      gizmoCamera.lookAt(0, 0, 0);
      gizmoCamera.up.copy(camera.up);
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      cube.rotation.x += 0.003;
      cube.rotation.y += 0.005;
      
      syncGizmo();
      
      renderer.render(scene, camera);
      gizmoRenderer.render(gizmoScene, gizmoCamera);
    };
    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      containerRef.current?.removeChild(gizmoCanvas);
      containerRef.current?.removeChild(resizeHandle);
      renderer.dispose();
      gizmoRenderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100vh', 
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }} 
    />
  );
};

export default BlenderGizmo;