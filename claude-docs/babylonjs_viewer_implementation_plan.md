# Babylon.js Viewer Implementation Plan

**Date**: 2025-10-22
**Status**: 📋 Planning Phase
**Goal**: Add Babylon.js as a third 3D viewer option alongside Three.js and Xeokit

---

## Executive Summary

Implement a full-featured Babylon.js viewer that matches Three.js functionality while leveraging Babylon.js's "batteries included" philosophy. Babylon.js offers mature WebGPU support and built-in features that we currently implement manually in Three.js.

---

## 🎯 Objectives

### Primary Goals
1. ✅ Add Babylon.js viewer with feature parity to Three.js viewer
2. ✅ Leverage Babylon.js built-in features (navigation gizmo, etc.)
3. ✅ Enable WebGPU rendering where supported
4. ✅ Update UI to show 3 viewer buttons: Three.js, Babylon.js, Xeokit

### Success Criteria
- [ ] Users can select any of 3 viewers from UI
- [ ] Babylon.js viewer has all Three.js features
- [ ] Uses Babylon.js native features where available
- [ ] WebGPU rendering works when supported
- [ ] No regression in existing viewers
- [ ] Consistent UI/UX across all viewers

---

## 📊 Current State Analysis

### Existing Viewers

#### 1. Xeokit Viewer
**Location**: `src/webui/src/viewers/xeokit-viewer/XeokitViewer.tsx`
**Features**:
- glTF model loading
- Element selection
- Property display (right sidebar)
- Spatial tree navigation (left sidebar)
- Camera controls
- Full IFC element support

**Strengths**:
- Purpose-built for BIM/IFC
- Mature, stable
- Excellent IFC support

#### 2. Three.js Viewer
**Location**: `src/webui/src/viewers/threejs-viewer/ThreeJsViewer.tsx`
**Features** (from code inspection):
- glTF/GLB loading
- Element selection and highlighting
- Property panel (right sidebar)
- Spatial tree panel (left sidebar)
- Custom 3D navigation gizmo (implemented manually)
- Camera controls (OrbitControls)
- WebGL renderer
- Basic WebGPU attempt (falls back to WebGL)

**Custom Implementations** (to be replaced with Babylon.js built-ins):
- ❌ Navigation gizmo (custom implementation)
- ❌ Camera controls (OrbitControls)
- ⚠️ WebGPU support (experimental, not production-ready)

---

## 🏗️ Babylon.js Viewer Architecture

### High-Level Structure

```
src/webui/src/viewers/babylon-viewer/
├── BabylonViewer.tsx                 # Main viewer component
├── hooks/
│   ├── useBabylonEngine.ts           # Engine + scene initialization (WebGPU/WebGL)
│   ├── useBabylonGltfLoader.ts       # glTF loading with Babylon's loader
│   ├── useBabylonCamera.ts           # ArcRotateCamera setup
│   ├── useBabylonSelection.ts        # Mesh selection + highlighting
│   └── useBabylonSpatialTree.ts      # Spatial tree integration
├── components/
│   ├── BabylonCanvas.tsx             # Canvas + rendering loop
│   ├── BabylonNavigationGizmo.tsx    # Wrapper for built-in gizmo
│   └── BabylonInspector.tsx          # Optional debug inspector
└── utils/
    ├── babylonHelpers.ts             # Utilities
    └── materialHelpers.ts            # Material creation/caching
```

---

## 🎨 Babylon.js Feature Implementation Plan

### Phase 1: Core Rendering Engine ✨

#### 1.1 Engine Initialization (WebGPU First)
**File**: `hooks/useBabylonEngine.ts`

**Strategy**: Try WebGPU first, fallback to WebGL

```typescript
import { Engine, WebGPUEngine, Scene } from '@babylonjs/core';

export function useBabylonEngine(canvas: HTMLCanvasElement | null) {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [renderingAPI, setRenderingAPI] = useState<'webgpu' | 'webgl'>('webgl');

  useEffect(() => {
    if (!canvas) return;

    // Try WebGPU first (Babylon.js has excellent support)
    const initializeEngine = async () => {
      let newEngine: Engine;

      if (await WebGPUEngine.IsSupportedAsync) {
        console.log('✅ WebGPU supported - using WebGPUEngine');
        newEngine = new WebGPUEngine(canvas, {
          adaptToDeviceRatio: true,
          antialias: true
        });
        await newEngine.initAsync();
        setRenderingAPI('webgpu');
      } else {
        console.log('⚠️ WebGPU not supported - falling back to WebGL');
        newEngine = new Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
          antialias: true
        });
        setRenderingAPI('webgl');
      }

      const newScene = new Scene(newEngine);
      setEngine(newEngine);
      setScene(newScene);

      // Start render loop
      newEngine.runRenderLoop(() => {
        newScene.render();
      });

      // Handle resize
      window.addEventListener('resize', () => {
        newEngine.resize();
      });
    };

    initializeEngine();

    return () => {
      engine?.dispose();
      scene?.dispose();
    };
  }, [canvas]);

  return { engine, scene, renderingAPI };
}
```

**Babylon.js Advantage**:
- ✅ WebGPUEngine is production-ready (unlike Three.js)
- ✅ Automatic fallback handling
- ✅ Better performance with WebGPU

---

#### 1.2 Scene Setup
**File**: `hooks/useBabylonEngine.ts` (extended)

```typescript
// Scene configuration
scene.clearColor = new Color4(0.95, 0.95, 0.95, 1.0); // Light gray background
scene.ambientColor = new Color3(0.3, 0.3, 0.3);

// Lighting (Babylon.js has excellent built-in lighting)
const hemisphericLight = new HemisphericLight(
  'hemisphericLight',
  new Vector3(0, 1, 0),
  scene
);
hemisphericLight.intensity = 0.7;

const directionalLight = new DirectionalLight(
  'directionalLight',
  new Vector3(-1, -2, -1),
  scene
);
directionalLight.intensity = 0.5;
```

**Babylon.js Advantage**:
- ✅ Built-in lighting system (no manual setup needed)
- ✅ Shadow support out of the box

---

### Phase 2: Camera & Navigation 🎥

#### 2.1 Camera Setup (ArcRotateCamera)
**File**: `hooks/useBabylonCamera.ts`

```typescript
import { ArcRotateCamera, Vector3 } from '@babylonjs/core';

export function useBabylonCamera(
  scene: Scene | null,
  canvas: HTMLCanvasElement | null
) {
  const [camera, setCamera] = useState<ArcRotateCamera | null>(null);

  useEffect(() => {
    if (!scene || !canvas) return;

    // ArcRotateCamera = Babylon's equivalent to OrbitControls
    const newCamera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,  // Alpha (horizontal rotation)
      Math.PI / 3,   // Beta (vertical rotation)
      50,            // Radius (distance from target)
      Vector3.Zero(), // Target
      scene
    );

    // Attach controls to canvas
    newCamera.attachControl(canvas, true);

    // Camera settings
    newCamera.wheelPrecision = 50;
    newCamera.minZ = 0.1;
    newCamera.maxZ = 10000;
    newCamera.lowerRadiusLimit = 1;
    newCamera.upperRadiusLimit = 500;

    // Smooth camera movements
    newCamera.inertia = 0.9;
    newCamera.angularSensibilityX = 1000;
    newCamera.angularSensibilityY = 1000;

    setCamera(newCamera);

    return () => {
      newCamera.dispose();
    };
  }, [scene, canvas]);

  return camera;
}
```

**Babylon.js Advantage**:
- ✅ ArcRotateCamera is built-in and feature-rich
- ✅ Better than OrbitControls (more options)
- ✅ No external library needed

---

#### 2.2 Navigation Gizmo (Built-in!) 🎯
**File**: `components/BabylonNavigationGizmo.tsx`

```typescript
import { Gizmo, AxisDragGizmo, RotationGizmo, ScaleGizmo } from '@babylonjs/core';
import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';

export function BabylonNavigationGizmo({ scene, camera }: Props) {
  useEffect(() => {
    if (!scene || !camera) return;

    // Babylon.js has a BUILT-IN navigation gizmo! 🎉
    // This replaces our custom Three.js implementation

    // Create GUI overlay
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

    // Navigation cube (like ViewCube in Autodesk viewers)
    // This is a Babylon.js Pro feature, but we can create a similar widget

    // Alternative: Use compass/orientation widget
    const orientationWidget = new OrientationWidget(scene, camera);
    orientationWidget.show();

    return () => {
      advancedTexture.dispose();
      orientationWidget.dispose();
    };
  }, [scene, camera]);

  return null; // GUI is rendered in Babylon scene
}
```

**Babylon.js Advantage**:
- ✅ **Built-in Gizmo system** (no custom implementation needed!)
- ✅ Professional-grade navigation widgets
- ✅ ViewCube-like functionality available

**Note**: Babylon.js has `@babylonjs/gui` for 2D/3D UI elements. The navigation gizmo can use this.

---

### Phase 3: glTF Loading 📦

#### 3.1 glTF Loader
**File**: `hooks/useBabylonGltfLoader.ts`

```typescript
import { SceneLoader } from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // glTF loader plugin

export function useBabylonGltfLoader(
  scene: Scene | null,
  gltfUrl: string | null
) {
  const [model, setModel] = useState<AbstractMesh | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scene || !gltfUrl) return;

    setLoading(true);
    setError(null);

    // Babylon.js has excellent glTF support built-in
    SceneLoader.ImportMeshAsync(
      '', // Import all meshes
      '',
      gltfUrl,
      scene,
      (event) => {
        // Progress callback
        const progress = event.loaded / event.total * 100;
        console.log(`Loading: ${progress.toFixed(1)}%`);
      }
    )
      .then((result) => {
        const rootMesh = result.meshes[0];
        setModel(rootMesh);
        setLoading(false);

        // Center camera on model
        scene.createDefaultCamera(true, true, true);

        console.log(`✅ Loaded ${result.meshes.length} meshes`);
      })
      .catch((error) => {
        console.error('❌ glTF loading failed:', error);
        setError(error.message);
        setLoading(false);
      });

    return () => {
      model?.dispose();
    };
  }, [scene, gltfUrl]);

  return { model, loading, error };
}
```

**Babylon.js Advantage**:
- ✅ Excellent glTF 2.0 support (Khronos certified)
- ✅ Built-in progress callbacks
- ✅ Better error handling than Three.js

---

### Phase 4: Element Selection & Highlighting 🎯

#### 4.1 Selection System
**File**: `hooks/useBabylonSelection.ts`

```typescript
import { HighlightLayer, Color3, Mesh } from '@babylonjs/core';

export function useBabylonSelection(scene: Scene | null) {
  const [selectedMesh, setSelectedMesh] = useState<Mesh | null>(null);
  const [highlightLayer, setHighlightLayer] = useState<HighlightLayer | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Babylon.js has BUILT-IN highlight layer! 🎉
    // No need for custom outline pass like Three.js
    const highlight = new HighlightLayer('highlight', scene);
    highlight.blurHorizontalSize = 1.0;
    highlight.blurVerticalSize = 1.0;
    setHighlightLayer(highlight);

    // Click to select
    scene.onPointerDown = (evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedMesh) {
        const mesh = pickResult.pickedMesh as Mesh;
        setSelectedMesh(mesh);

        // Highlight selected mesh (built-in!)
        highlight.removeAllMeshes();
        highlight.addMesh(mesh, Color3.Blue());

        // Get IFC properties from mesh metadata
        const ifcGuid = mesh.metadata?.ifcGuid;
        if (ifcGuid) {
          onElementSelected(ifcGuid);
        }
      }
    };

    return () => {
      highlight.dispose();
    };
  }, [scene]);

  return { selectedMesh, highlightLayer };
}
```

**Babylon.js Advantage**:
- ✅ **Built-in HighlightLayer** (no custom shaders needed!)
- ✅ Better performance than Three.js outline pass
- ✅ Glow effects out of the box

---

### Phase 5: Property Panel & Spatial Tree 🌳

#### 5.1 Property Panel Integration
**File**: `components/PropertyPanel.tsx` (reuse existing from Three.js)

The property panel can be **reused as-is** from Three.js viewer. Just pass the selected element GUID to the existing PropertyPanel component.

```typescript
// In BabylonViewer.tsx
<PropertyPanel
  selectedElementGuid={selectedIfcGuid}
  projectId={projectId}
  revisionId={revisionId}
  darkMode={darkMode}
/>
```

**No changes needed** - property fetching is viewer-agnostic.

---

#### 5.2 Spatial Tree Integration
**File**: `components/SpatialTreePanel.tsx` (reuse existing from Three.js)

The spatial tree can also be **reused as-is**. When a node is clicked:

```typescript
// In hooks/useBabylonSpatialTree.ts
export function useBabylonSpatialTree(scene: Scene | null, model: AbstractMesh | null) {
  const handleTreeNodeClick = (ifcGuid: string) => {
    if (!scene || !model) return;

    // Find mesh by IFC GUID in metadata
    const mesh = scene.meshes.find(m => m.metadata?.ifcGuid === ifcGuid);

    if (mesh) {
      // Focus camera on mesh
      scene.activeCamera?.focusOn([mesh], true);

      // Highlight mesh
      highlightLayer?.removeAllMeshes();
      highlightLayer?.addMesh(mesh, Color3.Green());
    }
  };

  return { handleTreeNodeClick };
}
```

**No changes needed** - tree data fetching is viewer-agnostic.

---

### Phase 6: UI Integration 🖥️

#### 6.1 Update Revision Detail UI
**File**: `src/webui/src/pages/RevisionDetailPage.tsx` (or similar)

**Current State** (hypothetical):
```typescript
// Single "Show 3D" button
<button onClick={() => navigate(`/viewer/${revisionId}`)}>
  Show 3D
</button>
```

**New State** - Three Separate Buttons:
```typescript
<div className="viewer-selection">
  <button
    onClick={() => navigate(`/viewer/threejs/${projectId}/${revisionId}`)}
    className="btn-viewer"
  >
    <ThreeJsIcon />
    Show Three.js
    <span className="badge">WebGL</span>
  </button>

  <button
    onClick={() => navigate(`/viewer/babylon/${projectId}/${revisionId}`)}
    className="btn-viewer"
  >
    <BabylonIcon />
    Show Babylon.js
    <span className="badge">WebGPU</span>
  </button>

  <button
    onClick={() => navigate(`/viewer/xeokit/${projectId}/${revisionId}`)}
    className="btn-viewer"
  >
    <XeokitIcon />
    Show Xeokit
    <span className="badge">BIM</span>
  </button>
</div>
```

**Styling** (Tailwind):
```typescript
className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
```

---

#### 6.2 Update Routing
**File**: `src/webui/src/App.tsx` or routing config

```typescript
// Add Babylon.js route
<Route
  path="/viewer/babylon/:projectId/:revisionId"
  element={<BabylonViewerPage />}
/>

// Existing routes
<Route path="/viewer/threejs/:projectId/:revisionId" element={<ThreeJsViewerPage />} />
<Route path="/viewer/xeokit/:projectId/:revisionId" element={<XeokitViewerPage />} />
```

---

## 📋 Implementation Checklist

### Phase 1: Setup & Core (Week 1)
- [ ] Install Babylon.js dependencies
  ```bash
  npm install @babylonjs/core @babylonjs/loaders @babylonjs/gui
  ```
- [ ] Create folder structure: `src/webui/src/viewers/babylon-viewer/`
- [ ] Implement `useBabylonEngine` hook (WebGPU/WebGL)
- [ ] Implement `useBabylonCamera` hook (ArcRotateCamera)
- [ ] Create `BabylonCanvas` component
- [ ] Test basic rendering with a cube

### Phase 2: glTF Loading (Week 1-2)
- [ ] Implement `useBabylonGltfLoader` hook
- [ ] Test loading Duplex.ifc glTF file
- [ ] Verify all meshes load correctly
- [ ] Add loading progress indicator
- [ ] Handle errors gracefully

### Phase 3: Navigation & Controls (Week 2)
- [ ] Implement built-in navigation gizmo
- [ ] Configure camera limits and sensitivity
- [ ] Add "fit to view" functionality
- [ ] Test navigation smoothness
- [ ] Compare with Three.js navigation

### Phase 4: Selection & Highlighting (Week 2)
- [ ] Implement `useBabylonSelection` hook
- [ ] Use built-in HighlightLayer
- [ ] Add click-to-select functionality
- [ ] Store IFC GUID in mesh metadata
- [ ] Test selection with various elements

### Phase 5: UI Integration (Week 3)
- [ ] Integrate PropertyPanel (reuse from Three.js)
- [ ] Integrate SpatialTreePanel (reuse from Three.js)
- [ ] Add collapsible sidebars
- [ ] Test property loading
- [ ] Test spatial tree navigation

### Phase 6: Multi-Viewer UI (Week 3)
- [ ] Update revision detail page with 3 buttons
- [ ] Add routing for Babylon.js viewer
- [ ] Style viewer selection buttons
- [ ] Add icons/badges for each viewer
- [ ] Test navigation between viewers

### Phase 7: Testing & Polish (Week 4)
- [ ] Test with multiple IFC files (Duplex.ifc, Architecture.ifc)
- [ ] Compare performance vs Three.js
- [ ] Verify WebGPU vs WebGL performance
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing
- [ ] Fix any bugs found

### Phase 8: Documentation (Week 4)
- [ ] Document Babylon.js viewer features
- [ ] Create comparison table: Three.js vs Babylon.js vs Xeokit
- [ ] Add usage guide for developers
- [ ] Update user documentation
- [ ] Create GIFs/videos of features

---

## 🎯 Feature Parity Matrix

| Feature | Three.js | Xeokit | Babylon.js (Planned) | Implementation |
|---------|----------|--------|----------------------|----------------|
| **Rendering** |
| WebGL | ✅ | ✅ | ✅ | Built-in Engine |
| WebGPU | ⚠️ Experimental | ❌ | ✅ Production | WebGPUEngine |
| glTF Loading | ✅ | ✅ | ✅ | SceneLoader |
| **Camera** |
| Orbit Controls | ✅ OrbitControls | ✅ | ✅ ArcRotateCamera | Built-in |
| Pan/Zoom | ✅ | ✅ | ✅ | Built-in |
| Fit to View | ✅ | ✅ | ✅ | camera.focusOn() |
| **Navigation** |
| 3D Gizmo | ✅ Custom | ✅ | ✅ Built-in | @babylonjs/gui |
| Keyboard Nav | ✅ | ✅ | ✅ | Built-in |
| **Selection** |
| Click to Select | ✅ | ✅ | ✅ | onPointerDown |
| Highlighting | ✅ Custom | ✅ | ✅ Built-in | HighlightLayer |
| Multi-select | ❌ | ✅ | ✅ Planned | Ctrl+Click |
| **UI Panels** |
| Property Panel | ✅ | ✅ | ✅ Reuse | Same component |
| Spatial Tree | ✅ | ✅ | ✅ Reuse | Same component |
| Collapsible Sidebars | ✅ | ✅ | ✅ | Same layout |
| **Performance** |
| Large Models | ✅ | ✅ | ✅ Better | LOD support |
| GPU Instancing | ⚠️ | ❌ | ✅ | Built-in |
| **Advanced** |
| Shadows | ⚠️ | ❌ | ✅ | ShadowGenerator |
| Post-processing | ⚠️ | ❌ | ✅ | Built-in |
| Inspector/Debug | ❌ | ❌ | ✅ | Built-in inspector |

**Legend**: ✅ Available | ⚠️ Limited | ❌ Not available

---

## 🚀 Babylon.js Advantages

### 1. **Built-in Features** (No Custom Code Needed)
- ✅ HighlightLayer for element selection
- ✅ Navigation gizmo system
- ✅ ArcRotateCamera (better than OrbitControls)
- ✅ GUI system (@babylonjs/gui)
- ✅ Inspector for debugging
- ✅ Shadow system
- ✅ Post-processing effects

### 2. **WebGPU Support** (Production-Ready)
```typescript
// Babylon.js WebGPU is mature
const engine = new WebGPUEngine(canvas);
await engine.initAsync();
// Just works! 🎉
```

**Three.js WebGPU**: Still experimental, requires custom renderer setup, limited browser support.

### 3. **Better Performance**
- GPU instancing out of the box
- Built-in LOD (Level of Detail) system
- Occlusion culling
- Optimized for large scenes

### 4. **Professional Ecosystem**
- Used by Microsoft (Azure, Windows)
- Active community
- Regular updates
- Excellent documentation

---

## 📦 Dependencies

### Required Packages
```json
{
  "dependencies": {
    "@babylonjs/core": "^7.x",
    "@babylonjs/loaders": "^7.x",
    "@babylonjs/gui": "^7.x"
  },
  "devDependencies": {
    "@babylonjs/inspector": "^7.x"  // Optional: for debugging
  }
}
```

### Bundle Size Comparison
- **Three.js**: ~600KB (minified)
- **Babylon.js**: ~800KB (minified, more features included)
- **Xeokit**: ~400KB (specialized for BIM)

**Note**: Babylon.js is slightly larger but includes features we implement manually in Three.js.

---

## 🎨 UI Mockup

### Revision Detail Page - Viewer Selection

```
┌─────────────────────────────────────────────────────────┐
│ Revision: v1_2025-10-22_10-10-32                        │
│ Status: Completed | 273 elements | 1.02 MB glTF        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Select 3D Viewer:                                       │
│                                                         │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│ │ Three.js │  │ Babylon  │  │ Xeokit   │             │
│ │   📦     │  │   🎮     │  │   🏗️     │             │
│ │  WebGL   │  │ WebGPU*  │  │   BIM    │             │
│ └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│ *WebGPU with WebGL fallback                            │
│                                                         │
│ [Download glTF] [View Metrics] [Delete]                │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Engine initialization (WebGPU/WebGL fallback)
- [ ] glTF loading
- [ ] Camera controls
- [ ] Selection system
- [ ] Metadata extraction

### Integration Tests
- [ ] Full viewer workflow
- [ ] Property panel integration
- [ ] Spatial tree integration
- [ ] Multi-viewer navigation

### Performance Tests
- [ ] Load time comparison (Three.js vs Babylon.js)
- [ ] FPS with large models
- [ ] Memory usage
- [ ] WebGPU vs WebGL performance

### Browser Compatibility
- [ ] Chrome (WebGPU)
- [ ] Firefox (WebGL)
- [ ] Safari (WebGL)
- [ ] Edge (WebGPU)
- [ ] Mobile browsers

---

## 📈 Success Metrics

### Performance Targets
- ✅ Load Duplex.ifc glTF in < 2 seconds
- ✅ Maintain 60 FPS during navigation
- ✅ WebGPU 20%+ faster than WebGL
- ✅ Memory usage < 500MB for typical models

### User Experience
- ✅ Smooth camera navigation
- ✅ Instant element selection feedback
- ✅ Property panel loads in < 500ms
- ✅ No visual glitches or artifacts

### Code Quality
- ✅ Reuse existing PropertyPanel and SpatialTreePanel
- ✅ Minimal custom implementations (use Babylon.js built-ins)
- ✅ TypeScript strict mode
- ✅ Comprehensive error handling

---

## 🔄 Migration Path

### Phase 1: Parallel Development
Keep all three viewers:
- Three.js (current, stable)
- Xeokit (BIM-focused)
- Babylon.js (new, WebGPU)

**Benefit**: No disruption to existing users

### Phase 2: User Feedback
- Collect usage metrics
- Survey users on viewer preference
- Monitor performance data

### Phase 3: Future Decision (Post-Launch)
Based on data:
- **Option A**: Keep all three viewers
- **Option B**: Sunset Three.js if Babylon.js proves superior
- **Option C**: Make Babylon.js default, keep others as options

---

## 🚧 Risks & Mitigations

### Risk 1: WebGPU Browser Support
**Risk**: WebGPU not available in all browsers
**Mitigation**: Automatic fallback to WebGL (built-in to Babylon.js)

### Risk 2: Learning Curve
**Risk**: Team unfamiliar with Babylon.js
**Mitigation**:
- Excellent documentation
- Similar concepts to Three.js
- Built-in features reduce complexity

### Risk 3: Bundle Size
**Risk**: Adding third viewer increases app size
**Mitigation**:
- Lazy loading (only load viewer when selected)
- Code splitting by route
- Tree shaking unused features

### Risk 4: glTF Compatibility
**Risk**: Babylon.js renders glTF differently than Three.js
**Mitigation**:
- Test with all existing IFC files
- Validate visual consistency
- Babylon.js is Khronos certified (should be compatible)

---

## 📚 Resources

### Babylon.js Documentation
- Official Docs: https://doc.babylonjs.com/
- WebGPU Guide: https://doc.babylonjs.com/setup/support/webGPU
- glTF Loader: https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF
- Examples: https://playground.babylonjs.com/

### Comparison Articles
- Three.js vs Babylon.js: https://forum.babylonjs.com/t/babylonjs-vs-threejs/
- WebGPU Performance: https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus

### Code Examples
- ArcRotateCamera: https://doc.babylonjs.com/typedoc/classes/BABYLON.ArcRotateCamera
- HighlightLayer: https://doc.babylonjs.com/typedoc/classes/BABYLON.HighlightLayer
- SceneLoader: https://doc.babylonjs.com/typedoc/classes/BABYLON.SceneLoader

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Review and approve this plan
2. 📦 Install Babylon.js dependencies
3. 🏗️ Create folder structure
4. 🎨 Implement basic engine + camera

### Short Term (Week 1-2)
1. Load first glTF file
2. Implement selection system
3. Integrate property panel

### Medium Term (Week 3-4)
1. Complete all features
2. Update UI with 3 viewer buttons
3. Testing and polish

### Long Term (Future)
1. Collect user feedback
2. Performance optimization
3. Consider making Babylon.js default

---

## 🎉 Conclusion

Babylon.js is an excellent choice for a third viewer because:

1. **✅ Batteries Included**: Built-in features we manually implement in Three.js
2. **✅ WebGPU Ready**: Production-ready WebGPU support (Three.js is experimental)
3. **✅ Better Performance**: Optimized for large scenes, GPU instancing, LOD
4. **✅ Professional**: Used by Microsoft, active community, excellent docs
5. **✅ Easy Migration**: Similar concepts to Three.js, but with more built-in features

**Recommendation**: Proceed with implementation. Start with Phase 1 (core engine) and iterate from there.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: 📋 **READY FOR IMPLEMENTATION**
