# Three.js BIM Viewer

## Overview

This is a parallel implementation of a BIM (Building Information Modeling) viewer using Three.js as a license-free alternative to xeokit.

**Status:** 🚧 Under Development (PoC Phase)

**License:** MIT (Three.js)

---

## Features (Planned)

### ✅ Implemented
- (None yet - implementation in progress)

### 🚧 In Development
- [ ] Basic 3D geometry rendering with glTF/GLB models
- [ ] Camera controls (orbit, pan, zoom)
- [ ] Object selection via raycasting
- [ ] Property panel for selected BIM elements
- [ ] Type-based filtering (e.g., show only walls)
- [ ] Property-based filtering
- [ ] Clipping planes for section cuts
- [ ] 2D section export to PNG

### 📋 Planned (Future)
- IFC hierarchy tree view
- Storey views
- Distance measurements
- BCF viewpoints
- Annotations

---

## Architecture

### Component Structure

```
threejs-viewer/
├── ThreeJsViewer.tsx          # Main viewer component
├── ThreeJsControls.tsx        # Camera controls component
└── README.md                  # This file
```

### Related Directories

```
/components/threejs/           # React UI components
├── PropertyPanel.tsx          # BIM property display
├── FilterPanel.tsx            # Filtering controls
└── ClippingPanel.tsx          # Clipping plane controls

/services/threejs/             # Business logic
├── ModelLoader.ts             # glTF model loading
├── SelectionManager.ts        # Object selection via raycasting
├── FilterManager.ts           # Visibility filtering
└── ClippingPlaneManager.ts    # Section plane management

/hooks/threejs/                # React hooks
├── useThreeScene.ts           # Scene setup and lifecycle
├── useModelLoader.ts          # Model loading state
└── useSelection.ts            # Selection state

/types/threejs/                # TypeScript types
├── bim.types.ts               # BIM data structures
├── viewer.types.ts            # Viewer-specific types
└── filter.types.ts            # Filter criteria types
```

---

## Data Flow

### Model Loading

```
Backend API
  ↓ (glTF/GLB + JSON metadata)
ModelLoader Service
  ↓ (THREE.Group with userData)
ThreeJsViewer Component
  ↓ (adds to scene)
Three.js Renderer
```

### Property Display

```
User clicks object
  ↓
SelectionManager (raycasting)
  ↓ (finds object + userData)
PropertyService
  ↓ (fetches full properties from API)
PropertyPanel Component
  ↓ (displays BIM properties)
```

---

## API Integration

### Backend Endpoints (Expected)

**Geometry:**
```
GET /api/models/{modelId}/geometry/gltf?format=glb
Response: Binary GLB file
```

**Metadata:**
```
GET /api/models/{modelId}/metadata/threejs
Response: {
  modelId: string;
  elements: BIMElement[];
  types: string[];
  propertySets: string[];
}
```

**Element Properties:**
```
GET /api/models/{modelId}/elements/{elementId}/properties
Response: BIMElement with full property data
```

---

## Development Guidelines

### Code Style

- **Components:** PascalCase (e.g., `PropertyPanel.tsx`)
- **Services:** PascalCase with suffix (e.g., `ModelLoader.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useThreeScene.ts`)
- **Types:** PascalCase (e.g., `BIMElement`)

### Three.js Best Practices

1. **Always cleanup resources:**
   ```typescript
   useEffect(() => {
     const geometry = new THREE.BoxGeometry();
     const material = new THREE.MeshBasicMaterial();

     return () => {
       geometry.dispose();
       material.dispose();
     };
   }, []);
   ```

2. **Use refs for Three.js objects:**
   ```typescript
   const sceneRef = useRef<THREE.Scene>(null);
   ```

3. **Dispose on unmount:**
   ```typescript
   return () => {
     scene.traverse((obj) => {
       if (obj instanceof THREE.Mesh) {
         obj.geometry.dispose();
         obj.material.dispose();
       }
     });
   };
   ```

### AGPL-3.0 Compliance

**CRITICAL:** This implementation is a clean-room reimplementation.

**Allowed:**
- ✅ Read xeokit source to understand concepts
- ✅ Implement similar features independently
- ✅ Use mathematical formulas and algorithms

**Forbidden:**
- ❌ Copy xeokit code (even partially)
- ❌ Use xeokit class names or structure
- ❌ Minimal modifications of xeokit code

---

## Testing Checklist

Before merging any task:

- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] No console errors in browser
- [ ] Feature works as specified
- [ ] No memory leaks (check DevTools memory profiler)
- [ ] Dark mode works correctly
- [ ] xeokit viewer still works (if switching between viewers)

---

## Performance Considerations

### Optimizations to Implement

1. **Frustum Culling:** Automatically enabled in Three.js
2. **Level of Detail (LOD):** For large models
3. **Instancing:** For repeated elements (windows, doors)
4. **Lazy Loading:** Load models in chunks
5. **Raycasting Optimization:** Use bounding volumes

### Metrics to Track

- Time-to-view (model load time)
- FPS (frames per second)
- Memory usage
- Number of draw calls

---

## Known Limitations (PoC Phase)

1. **No IFC hierarchy tree view** (planned for future)
2. **Simple lighting setup** (no advanced PBR yet)
3. **Limited to 7 models** (same as xeokit current setup)
4. **No offline support**

---

## Comparison with xeokit

| Feature | xeokit | Three.js Viewer |
|---------|--------|-----------------|
| **License** | AGPL-3.0 (commercial license required) | MIT (free) |
| **Model Format** | XKT (proprietary) | glTF (ISO standard) |
| **File Size** | Smaller (optimized) | Larger (standard glTF) |
| **BIM Features** | Native support | Custom implementation |
| **Performance** | Optimized for BIM | General-purpose 3D |
| **Community** | Smaller | Very large |
| **Flexibility** | BIM-focused | Fully customizable |

---

## Future Enhancements

### Phase 2 (Post-PoC)
- [ ] Draco compression for glTF
- [ ] Progressive loading
- [ ] Advanced materials (PBR)
- [ ] Shadows and ambient occlusion
- [ ] Multiple clipping planes

### Phase 3 (Production)
- [ ] IFC hierarchy navigation
- [ ] BCF integration
- [ ] Measurement tools
- [ ] Annotation system
- [ ] Collaboration features

---

## Contributors

- Claude Code (AI Development Assistant)
- Poolarserver Development Team

---

## References

- [Three.js Documentation](https://threejs.org/docs/)
- [glTF Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [IFC.js (for reference, not used)](https://ifcjs.github.io/info/)

---

**Last Updated:** 2025-10-18
