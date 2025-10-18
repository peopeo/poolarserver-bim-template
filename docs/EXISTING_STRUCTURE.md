# Existing Project Structure Analysis

**Date:** 2025-10-18
**Purpose:** Documentation of existing structure before Three.js parallel implementation

---

## Project Overview

This is a BIM (Building Information Modeling) viewer project with:
- **Backend:** .NET 9 IFC Server (ASP.NET Core REST API)
- **Frontend:** React + TypeScript with Vite
- **Current 3D Viewer:** xeokit-sdk v2.5.48
- **Styling:** Tailwind CSS v4
- **Sample Model:** West Riverside Hospital

---

## Directory Structure

```
/workspaces/poolarserver-bim-template/
├── .claude/                    # Claude Code configuration
├── .devcontainer/             # DevContainer configuration
├── .vscode/                   # VS Code settings
├── claude-docs/               # Implementation documentation
├── docs/                      # Project documentation (NEW)
├── src/
│   ├── ifcserver/            # .NET 9 Backend API
│   │   ├── Controllers/      # API Controllers
│   │   ├── Data/            # Database context
│   │   ├── Models/          # Data models
│   │   ├── Services/        # Business logic
│   │   └── appsettings.json
│   │
│   └── webui/               # React Frontend
│       ├── public/          # Static assets
│       │   ├── WestRiverSideHospital/  # Sample model data
│       │   └── xeokit-sdk/             # xeokit static files
│       ├── src/
│       │   ├── assets/      # Images, SVGs
│       │   ├── components/  # React components
│       │   │   ├── layout/  # Header, Sidebar, ProfileMenu
│       │   │   └── viewer/  # XeokitViewer, TreeView
│       │   ├── hooks/       # Custom React hooks
│       │   │   ├── useDarkMode.ts
│       │   │   └── useXeokit.ts
│       │   ├── types/       # TypeScript type definitions
│       │   │   └── index.ts
│       │   ├── App.tsx      # Main application component
│       │   ├── main.tsx     # Entry point
│       │   └── index.css    # Global styles
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
└── xeokit-sdk/              # xeokit SDK source (reference only - AGPL-3.0)
```

---

## Existing Frontend Components

### 1. **App.tsx** (`src/webui/src/App.tsx`)
- Main application container
- Manages dark mode state
- Renders Header and XeokitViewer
- **Key Change Point:** This will need MINIMAL modification to add viewer toggle

```typescript
export default function Dashboard(): JSX.Element {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="flex h-screen">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <XeokitViewer darkMode={darkMode} />
    </div>
  );
}
```

### 2. **XeokitViewer Component** (`src/webui/src/components/viewer/XeokitViewer.tsx`)
- Displays xeokit 3D viewer
- Features:
  - Canvas rendering
  - TreeView panel (collapsible, 320px width)
  - NavCube navigation
  - Control buttons (Reset View, Toggle Edges, Fit to View, Reload)
- Uses `useXeokit` hook for viewer initialization
- **Status:** ✅ WORKING - DO NOT MODIFY

### 3. **useXeokit Hook** (`src/webui/src/hooks/useXeokit.ts`)
- Initializes xeokit Viewer
- Loads 7 models from API:
  - mechanical, plumbing, electrical, fireAlarms, sprinklers, structure, architectural
- API endpoints:
  - XKT: `/api/IfcTestData/ifctestxkt/{modelName}`
  - JSON: `/api/IfcTestData/ifctestjson/{modelName}`
- Plugins: XKTLoaderPlugin, FastNavPlugin, TreeViewPlugin, NavCubePlugin
- **Status:** ✅ WORKING - DO NOT MODIFY

### 4. **Layout Components**
- `Header.tsx`: Top navigation bar
- `Sidebar.tsx`: Left sidebar (currently not used in App.tsx)
- `ProfileMenu.tsx`: User profile dropdown
- **Status:** ✅ WORKING - DO NOT MODIFY

---

## Current Dependencies

### Core Dependencies (`package.json`)
```json
{
  "dependencies": {
    "@xeokit/xeokit-sdk": "^2.5.48",  // ⚠️ AGPL-3.0 licensed
    "lucide-react": "^0.546.0",        // Icons
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.14",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.11.1",
    "prettier": "^3.3.3",
    "tailwindcss": "^4.1.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.8"
  }
}
```

**Missing for Three.js Implementation:**
- ❌ `three` - Three.js core library
- ❌ `@types/three` - TypeScript types for Three.js
- ❌ `zustand` - State management (optional but recommended)

---

## Backend API Endpoints (Currently Used)

### IFC Test Data Endpoints

**Base URL:** `/api/IfcTestData`

1. **Get XKT Geometry**
   - `GET /api/IfcTestData/ifctestxkt/{modelName}`
   - Returns: XKT binary format (xeokit proprietary)
   - Used by: xeokit viewer

2. **Get Model Metadata**
   - `GET /api/IfcTestData/ifctestjson/{modelName}`
   - Returns: JSON with IFC metadata
   - Used by: xeokit viewer for property data

**Models Available:**
- `mechanical`
- `plumbing`
- `electrical`
- `fireAlarms`
- `sprinklers`
- `structure`
- `architectural`

### Future Endpoints Needed for Three.js

Based on `backend_gltf_spec.md`, we'll need:

1. **Get glTF Geometry**
   - `GET /api/models/{modelId}/geometry/gltf?format=glb`
   - Returns: GLB binary or glTF JSON
   - Status: ❌ NOT IMPLEMENTED YET

2. **Get Three.js Metadata**
   - `GET /api/models/{modelId}/metadata/threejs`
   - Returns: BIM metadata in Three.js-compatible format
   - Status: ❌ NOT IMPLEMENTED YET

---

## Current State Management

### Dark Mode
- Hook: `useDarkMode` (localStorage-based)
- Toggles between light/dark themes
- Applied globally via Tailwind classes

### Viewer State
- Managed in `useXeokit` hook
- States: `isLoading`, `loadingStatus`
- Refs: `viewerRef`, `treeViewRef`, `navCubeRef`, `xktLoaderRef`

**No global state management library used (e.g., Redux, Zustand)**

---

## TypeScript Configuration

### `tsconfig.json` Settings
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true
  }
}
```

**Assessment:** ✅ Good - Strict mode enabled, modern ES features

---

## Build Configuration

### Vite (`vite.config.ts`)
- Plugin: `@vitejs/plugin-react`
- Dev server: Hot module replacement enabled
- Build target: ES2020

**Assessment:** ✅ Standard Vite setup, no special configuration needed for Three.js

---

## Styling Approach

### Tailwind CSS v4
- PostCSS integration
- Dark mode: class-based (`dark:` prefix)
- Custom styles: `index.css`

**Patterns Used:**
```tsx
className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}
```

**Assessment:** ✅ Works well, can be reused for Three.js components

---

## Git Status

```
Current branch: main
Untracked files:
  claude-docs/
```

**Clean working directory** (no uncommitted changes to existing code)

---

## Identified xeokit Files (DO NOT MODIFY)

### Components
- ✅ `src/webui/src/components/viewer/XeokitViewer.tsx`
- ✅ `src/webui/src/components/viewer/TreeView.css`

### Hooks
- ✅ `src/webui/src/hooks/useXeokit.ts`

### Dependencies
- ✅ `@xeokit/xeokit-sdk` in package.json

### Public Assets
- ✅ `src/webui/public/xeokit-sdk/`
- ✅ `src/webui/public/WestRiverSideHospital/`

**These files MUST remain unchanged to preserve existing functionality.**

---

## Integration Points for Three.js

### 1. App.tsx (MINIMAL CHANGE)
**Current:**
```tsx
<XeokitViewer darkMode={darkMode} />
```

**Future:**
```tsx
const [activeViewer, setActiveViewer] = useState<'xeokit' | 'threejs'>('xeokit');

<ViewerSelector activeViewer={activeViewer} onSelect={setActiveViewer} />
{activeViewer === 'xeokit' ? (
  <XeokitViewer darkMode={darkMode} />
) : (
  <ThreeJsViewer darkMode={darkMode} />
)}
```

### 2. New Folders to Create
```
src/webui/src/
├── viewers/
│   ├── xeokit-viewer/   # MOVE existing XeokitViewer here
│   └── threejs-viewer/  # NEW Three.js implementation
├── components/
│   ├── shared/          # NEW ViewerSelector, etc.
│   ├── xeokit/          # (if needed for xeokit-specific UI)
│   └── threejs/         # NEW Property panels, filters, etc.
├── services/
│   ├── api/             # NEW API client services
│   └── threejs/         # NEW ModelLoader, managers, etc.
├── hooks/
│   └── threejs/         # NEW useThreeScene, useSelection, etc.
├── types/
│   └── threejs/         # NEW BIM types, filter types, etc.
```

---

## Critical Constraints

### 1. AGPL-3.0 License Compliance
- ✅ Can read xeokit source for concepts
- ✅ Can implement similar features independently
- ❌ Cannot copy xeokit code
- ❌ Cannot use xeokit class names/structure

### 2. Parallel Operation
- Both viewers must work independently
- No breaking changes to xeokit implementation
- User can switch between viewers

### 3. API Compatibility
- Backend needs to support BOTH formats:
  - XKT + xeokit JSON (existing)
  - glTF/GLB + Three.js JSON (new)

---

## Next Steps (Task 1+)

1. **Task 1:** Create new folder structure
   - `src/webui/src/viewers/`
   - `src/webui/src/components/threejs/`
   - `src/webui/src/services/threejs/`
   - `src/webui/src/hooks/threejs/`
   - `src/webui/src/types/threejs/`

2. **Task 2:** Install Three.js dependencies
   - `npm install three@^0.160.0`
   - `npm install @types/three@^0.160.0`
   - `npm install zustand@^4.4.7` (optional)

3. **Task 3:** Create TypeScript types and mock data

4. **Task 4+:** Implement features per `implementation_plan.md`

---

## Summary

### ✅ What Works
- React + TypeScript + Vite setup
- xeokit viewer with 7 loaded models
- Dark mode toggle
- Tailwind CSS styling
- Backend API serving XKT and JSON

### ⚠️ What's Missing for Three.js
- Three.js dependencies
- Folder structure for parallel implementation
- glTF/GLB backend endpoints
- Three.js-compatible metadata format

### 🎯 Implementation Strategy
- **Additive approach:** Only add new files, minimal changes to existing code
- **Parallel viewers:** Both xeokit and Three.js coexist
- **Clean room:** Completely new Three.js implementation (no code copying)

---

**Analysis Complete ✓**
