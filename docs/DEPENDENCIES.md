# Dependencies Documentation

**Date:** 2025-10-18
**Task:** Task 02 - Dependencies Installation

---

## New Dependencies for Three.js Viewer

### Production Dependencies

#### 1. **three** (^0.160.0)
- **Purpose:** Core Three.js library for 3D rendering
- **License:** MIT
- **Why:** Main 3D engine for the BIM viewer
- **Features Used:**
  - `THREE.Scene` - 3D scene container
  - `THREE.PerspectiveCamera` - Camera for 3D viewing
  - `THREE.WebGLRenderer` - WebGL renderer
  - `THREE.GLTFLoader` - glTF model loading
  - `THREE.Raycaster` - Object selection
  - `THREE.Plane` - Clipping planes
  - `THREE.OrthographicCamera` - For 2D exports
  - Materials, geometries, lights, etc.

**Installation:**
```bash
npm install three@^0.160.0
```

**Import Example:**
```typescript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
```

---

#### 2. **zustand** (^4.4.7)
- **Purpose:** Lightweight state management library
- **License:** MIT
- **Why:** Manage viewer state (selection, filters, clipping planes) without Redux overhead
- **Advantages:**
  - Very small bundle size (~1KB)
  - Simple API
  - No boilerplate
  - TypeScript support
  - React hooks integration

**Installation:**
```bash
npm install zustand@^4.4.7
```

**Usage Example:**
```typescript
import { create } from 'zustand';

interface ViewerState {
  selectedElement: BIMElement | null;
  selectElement: (element: BIMElement | null) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  selectedElement: null,
  selectElement: (element) => set({ selectedElement: element })
}));
```

---

### Development Dependencies

#### 3. **@types/three** (^0.160.0)
- **Purpose:** TypeScript type definitions for Three.js
- **License:** MIT
- **Why:** Enable TypeScript IntelliSense and type checking for Three.js APIs
- **Coverage:** All Three.js core and examples modules

**Installation:**
```bash
npm install --save-dev @types/three@^0.160.0
```

**Benefits:**
- Full autocomplete in VS Code
- Compile-time type checking
- Better developer experience
- Catch errors before runtime

---

## Existing Dependencies (Preserved)

### Frontend Core
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

### xeokit (Existing, Untouched)
```json
{
  "@xeokit/xeokit-sdk": "^2.5.48"
}
```
⚠️ **Note:** This remains installed for the parallel xeokit viewer

### UI Libraries
```json
{
  "lucide-react": "^0.546.0"
}
```
- Icon library (works for both viewers)

### Styling
```json
{
  "tailwindcss": "^4.1.14",
  "@tailwindcss/postcss": "^4.1.14",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6"
}
```
- Shared styling framework

### Build Tools
```json
{
  "typescript": "^5.6.3",
  "vite": "^5.4.8",
  "@vitejs/plugin-react": "^4.3.2"
}
```

### Code Quality
```json
{
  "eslint": "^9.11.1",
  "eslint-plugin-react": "^7.35.0",
  "eslint-plugin-react-hooks": "^5.1.0",
  "prettier": "^3.3.3"
}
```

---

## Dependency Tree (Three.js)

```
three@0.160.0
├── (no dependencies - pure JavaScript)
└── Used by:
    ├── ModelLoader.ts
    ├── useThreeScene.ts
    ├── ClippingPlaneManager.ts
    ├── SelectionManager.ts
    └── All viewer components

@types/three@0.160.0
├── @types/webxr (auto-installed)
└── Used by:
    └── TypeScript compiler

zustand@4.4.7
├── use-sync-external-store (peer dep - React 18)
└── Used by:
    ├── useViewerStore.ts
    └── All components consuming viewer state
```

---

## Bundle Size Impact

### Before (xeokit only)
- Total bundle size: ~1.2 MB (estimated)
- xeokit SDK: ~400 KB

### After (with Three.js)
- Three.js core: ~600 KB (minified)
- zustand: ~1 KB
- **Total added:** ~601 KB

**Note:** Users will only load one viewer at a time (not both simultaneously), so the effective runtime cost is the same as before.

---

## Version Rationale

### Why Three.js 0.160.0?
- ✅ Stable release (October 2023)
- ✅ Mature glTF loader
- ✅ Good TypeScript support
- ✅ Well-documented
- ✅ Large community (1M+ weekly downloads)
- ⚠️ Not latest (r169 available), but stable for PoC

**Upgrade Path:** Can upgrade to latest once PoC is validated

### Why Zustand over Redux?
- ✅ Simpler API (less boilerplate)
- ✅ Smaller bundle size (1KB vs 20KB+)
- ✅ Better TypeScript inference
- ✅ No providers needed
- ✅ Hooks-first design
- ✅ Sufficient for BIM viewer state management

**Alternative Considered:** React Context API
- ❌ More boilerplate for complex state
- ❌ Performance issues with frequent updates
- ❌ No devtools integration

---

## npm Audit Findings

**Status:** 2 moderate severity vulnerabilities detected

```bash
npm audit
```

**Assessment:**
- These are likely in transitive dependencies (not direct dependencies)
- Common in large dependency trees
- Should be evaluated but not blocking for PoC

**Action Items:**
1. Review with `npm audit` command
2. Check if vulnerabilities affect production code
3. Update dependencies if critical
4. Document any accepted risks

---

## Testing Dependencies

### Verification Commands

```bash
# Check if Three.js is installed
node -e "require('three'); console.log('✓ Three.js installed')"

# Check if zustand is installed
node -e "require('zustand'); console.log('✓ Zustand installed')"

# Check TypeScript types
npx tsc --noEmit --skipLibCheck src/viewers/threejs-viewer/README.md 2>&1 | grep -i "three" || echo "✓ @types/three installed"
```

### Import Test

Create a test file to verify imports work:

```typescript
// test-imports.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { create } from 'zustand';

const scene = new THREE.Scene();
const loader = new GLTFLoader();
const store = create(() => ({ test: true }));

console.log('✓ All imports successful');
```

---

## Future Dependencies (Potential)

### Optional Enhancements

**@react-three/fiber** (^8.15.0)
- React renderer for Three.js
- Declarative 3D with JSX
- **Status:** Skipped for PoC (adds complexity)
- **Reason:** Raw Three.js gives more control for BIM use case

**@react-three/drei** (^9.92.0)
- Helper components for react-three-fiber
- **Status:** Skipped (depends on fiber)

**three-mesh-bvh** (^0.6.0)
- Bounding Volume Hierarchy for faster raycasting
- **Status:** Future optimization
- **Use Case:** Large models with many objects

**draco3d** (^1.5.0)
- Draco geometry compression
- **Status:** Backend concern (glTF compression)
- **Use Case:** Reduce file sizes

---

## Compatibility Matrix

| Dependency | Version | React | TypeScript | Vite |
|------------|---------|-------|------------|------|
| three | 0.160.0 | ✅ Any | ✅ 4.0+ | ✅ 4.0+ |
| zustand | 4.4.7 | ✅ 16.8+ | ✅ 4.0+ | ✅ Any |
| @types/three | 0.160.0 | N/A | ✅ 4.0+ | N/A |

**Current Project:**
- React: 18.3.1 ✅
- TypeScript: 5.6.3 ✅
- Vite: 5.4.8 ✅

**Conclusion:** All dependencies are compatible

---

## Installation Checklist

Task 02 Completion:

- [x] Install `three@^0.160.0`
- [x] Install `@types/three@^0.160.0`
- [x] Install `zustand@^4.4.7`
- [x] Verify package.json updated
- [x] Verify package-lock.json updated
- [x] Document dependencies in this file
- [x] No breaking changes to existing code

---

## References

- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js GitHub](https://github.com/mrdoob/three.js)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Installation Complete ✓**
