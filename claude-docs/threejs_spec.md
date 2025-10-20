# Three.js BIM Viewer - Technische Implementierungs-Spezifikation

## Zielsetzung
Entwicklung eines BIM-Viewers mit Three.js als lizenzfreie Alternative zu xeokit, der alle PoC-Anforderungen erfüllt.

## Feature-Mapping: xeokit → Three.js

### 1. 3D-Geometrie-Rendering

**xeokit Ansatz:**
- Proprietäres XKT-Format
- Optimiert für BIM-Daten

**Three.js Implementierung:**
```
- glTF/GLB-Format (ISO Standard)
- THREE.GLTFLoader (nativ)
- Optimierung durch Draco-Kompression (optional)
```

**Implementierungs-Details:**
```typescript
class ModelLoader {
  private loader: GLTFLoader;
  
  async loadModel(url: string): Promise<THREE.Group> {
    // Lade glTF von Backend-API
    // Füge zu Scene hinzu
    // Returne Referenz für weitere Manipulation
  }
}
```

**Aufwand:** ✅ Einfach (1 Tag)

---

### 2. Clipping Planes & 2D-Schnitte

**xeokit Ansatz:**
- SectionPlanesPlugin
- UI mit interaktiven Gizmos
- Export-Funktionalität

**Three.js Implementierung:**
```
Core Konzepte:
- THREE.Plane für Clipping-Definition
- Material.clippingPlanes für Rendering
- OrthographicCamera für 2D-Ansicht
- WebGLRenderer.render() für Export
```

**Implementierungs-Details:**
```typescript
class ClippingPlaneManager {
  private planes: THREE.Plane[] = [];
  
  // Erstelle Clipping Plane
  createPlane(position: Vector3, normal: Vector3): THREE.Plane {
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(normal.normalize(), position);
    this.planes.push(plane);
    this.updateMaterials();
    return plane;
  }
  
  // Wende Planes auf alle Materialien an
  private updateMaterials() {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material.clippingPlanes = this.planes;
      }
    });
  }
  
  // Generiere 2D-Ansicht entlang Plane
  generate2DView(plane: THREE.Plane): HTMLCanvasElement {
    // 1. Erstelle OrthographicCamera entlang plane.normal
    // 2. Positioniere Camera an plane.constant * plane.normal
    // 3. Rendere Scene in Off-Screen-Canvas
    // 4. Exportiere als PNG/JPEG
  }
}
```

**UI-Komponente:**
```typescript
// React Component für Clipping Controls
interface ClippingControlsProps {
  onPlaneCreated: (plane: THREE.Plane) => void;
  onExport2D: () => void;
}

// Features:
// - Slider für Position (X, Y, Z)
// - Normal-Vector-Controls
// - "Schnitt erstellen" Button
// - "Als PNG exportieren" Button
```

**Aufwand:** 🟡 Mittel (3-5 Tage)

---

### 3. Property-Anzeige

**xeokit Ansatz:**
- Integriertes Property-Panel
- Automatische IFC-Property-Extraktion

**Three.js Implementierung:**
```
Ansatz:
- Properties in glTF-Extras oder separates JSON
- Raycasting für Objekt-Selektion
- React-Component für Property-Display
```

**Datenmodell:**
```typescript
interface BIMProperty {
  name: string;
  value: string | number | boolean;
  type: string;
  propertySet?: string;
}

interface BIMElement {
  id: string;
  ifcGuid?: string;
  type: string; // IfcWall, IfcWindow, etc.
  properties: BIMProperty[];
}
```

**Implementierungs-Details:**
```typescript
class PropertyService {
  // Lade Properties für ein Element
  async loadProperties(elementId: string): Promise<BIMElement> {
    // GET /api/models/{modelId}/elements/{elementId}/properties
    const response = await fetch(apiUrl);
    return response.json();
  }
}

class SelectionManager {
  private raycaster = new THREE.Raycaster();
  
  // Selektiere Objekt per Mausklick
  selectObject(event: MouseEvent, camera: Camera): THREE.Object3D | null {
    const mouse = this.normalizeMouseCoords(event);
    this.raycaster.setFromCamera(mouse, camera);
    
    const intersects = this.raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      return intersects[0].object;
    }
    return null;
  }
}
```

**React-Component:**
```typescript
interface PropertyPanelProps {
  selectedElement: BIMElement | null;
}

// Features:
// - Gruppierung nach PropertySets
// - Suchfunktion
// - Copy-to-Clipboard
// - Collapsible Sections
```

**Aufwand:** 🟡 Einfach (2-3 Tage)

---

### 4. Filterung

**xeokit Ansatz:**
- Query-basierte Filterung
- Visibility-Management

**Three.js Implementierung:**
```
Ansatz:
- Metadata in Object3D.userData
- Traverse für Filterung
- Visibility-Toggle
```

**Implementierungs-Details:**
```typescript
interface FilterCriteria {
  type?: string; // IfcWall, IfcWindow, etc.
  properties?: Record<string, any>; // z.B. { "Brandschutz": "F90" }
}

class FilterManager {
  // Filtere Objekte nach Kriterien
  applyFilter(criteria: FilterCriteria) {
    scene.traverse((obj) => {
      if (obj.userData.bimData) {
        const matches = this.matches(obj.userData.bimData, criteria);
        obj.visible = matches;
      }
    });
  }
  
  private matches(element: BIMElement, criteria: FilterCriteria): boolean {
    // Typ-Check
    if (criteria.type && element.type !== criteria.type) {
      return false;
    }
    
    // Property-Check
    if (criteria.properties) {
      for (const [key, value] of Object.entries(criteria.properties)) {
        const prop = element.properties.find(p => p.name === key);
        if (!prop || prop.value !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Reset Filter
  resetFilter() {
    scene.traverse((obj) => {
      obj.visible = true;
    });
  }
}
```

**React-Component:**
```typescript
interface FilterControlsProps {
  availableTypes: string[];
  availableProperties: Record<string, string[]>;
  onFilterApplied: (criteria: FilterCriteria) => void;
}

// Features:
// - Type-Dropdown
// - Property-Filter (Key-Value-Pairs)
// - "Filter anwenden" Button
// - "Filter zurücksetzen" Button
// - Anzahl sichtbarer/versteckter Objekte
```

**Aufwand:** 🟡 Einfach (2-3 Tage)

---

## Architektur-Übersicht

```typescript
// Frontend-Architektur

/src
  /services
    ModelLoader.ts          // glTF-Loading
    PropertyService.ts      // Property-API-Calls
    ClippingPlaneManager.ts // Clipping-Logik
    FilterManager.ts        // Filter-Logik
    SelectionManager.ts     // Raycasting & Selection
  
  /components
    /viewer
      ThreeJsViewer.tsx     // Haupt-Viewer-Component
      ViewerControls.tsx    // Orbit Controls Wrapper
    
    /panels
      PropertyPanel.tsx     // Property-Anzeige
      FilterPanel.tsx       // Filter-Controls
      ClippingPanel.tsx     // Clipping-Controls
    
    /ui
      Toolbar.tsx           // Haupt-Toolbar
      Sidebar.tsx           // Sidebar-Container
  
  /hooks
    useThreeScene.ts        // Three.js Scene Setup
    useModelLoader.ts       // Model Loading Logic
    useSelection.ts         // Selection State
  
  /types
    bim.types.ts            // BIM-Data-Interfaces
    three.types.ts          // Three.js-Extensions
```

---

## API-Integration

### Erwartete Backend-Endpunkte

```typescript
// Model-Geometrie
GET /api/models/{modelId}/geometry
Response: glTF/GLB Binary oder URL zum Download

// Model-Metadaten
GET /api/models/{modelId}/metadata
Response: {
  id: string;
  name: string;
  elements: BIMElement[];
}

// Element-Properties
GET /api/models/{modelId}/elements/{elementId}/properties
Response: BIMElement

// Verfügbare Typen (für Filter)
GET /api/models/{modelId}/types
Response: string[]

// Verfügbare Properties (für Filter)
GET /api/models/{modelId}/properties
Response: Record<string, string[]>
```

---

## State Management

**Empfohlener Ansatz: Zustand (leichtgewichtig)**

```typescript
import { create } from 'zustand';

interface ViewerState {
  // Model
  currentModel: THREE.Group | null;
  loadModel: (url: string) => Promise<void>;
  
  // Selection
  selectedElement: BIMElement | null;
  selectElement: (element: BIMElement | null) => void;
  
  // Filter
  filterCriteria: FilterCriteria | null;
  applyFilter: (criteria: FilterCriteria) => void;
  resetFilter: () => void;
  
  // Clipping
  clippingPlanes: THREE.Plane[];
  addClippingPlane: (plane: THREE.Plane) => void;
  removeClippingPlane: (index: number) => void;
  
  // UI State
  sidebarOpen: boolean;
  activePanel: 'properties' | 'filter' | 'clipping' | null;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  // ... Implementierung
}));
```

---

## Dependencies

### Core
```json
{
  "three": "^0.160.0",
  "@types/three": "^0.160.0",
  "@react-three/fiber": "^8.15.0", // Optional: React-Integration
  "@react-three/drei": "^9.92.0"   // Optional: Helper-Components
}
```

### State Management
```json
{
  "zustand": "^4.4.7"
}
```

### UI (Optional)
```json
{
  "tailwindcss": "^3.4.0",
  "@headlessui/react": "^1.7.17"
}
```

---

## Performance-Überlegungen

### Optimierungen
1. **Level of Detail (LOD)**
   - THREE.LOD für große Modelle
   - Vereinfachte Geometrien für Distanz

2. **Frustum Culling**
   - Automatisch in Three.js
   - Reduziert Draw Calls

3. **Instancing**
   - THREE.InstancedMesh für wiederkehrende Elemente
   - z.B. Fenster, Türen

4. **Lazy Loading**
   - Modelle in Chunks laden
   - Progressive Rendering

### Benchmarking
```typescript
class PerformanceMonitor {
  measureTimeToView(startTime: number) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`Time-to-view: ${duration}ms`);
    // An Analytics senden
  }
}
```

---

## Testing-Strategie

### Unit Tests
```typescript
// Jest + @testing-library/react
describe('ClippingPlaneManager', () => {
  it('should create a valid plane', () => {
    const manager = new ClippingPlaneManager();
    const plane = manager.createPlane(
      new Vector3(0, 5, 0),
      new Vector3(0, 1, 0)
    );
    expect(plane.constant).toBe(-5);
  });
});
```

### Integration Tests
- E2E mit Playwright/Cypress
- Test mit echten IFC-Daten
- Performance-Benchmarks

---

## Migrations-Pfad (vom bestehenden xeokit-Viewer)

### Option A: Parallel (Empfohlen)
```typescript
// App.tsx
const [viewerType, setViewerType] = useState<'xeokit' | 'threejs'>('xeokit');

return (
  <div>
    <ViewerSelector onSelect={setViewerType} />
    {viewerType === 'xeokit' ? <XeokitViewer /> : <ThreeJsViewer />}
  </div>
);
```

### Option B: Feature-Flag
```typescript
const ENABLE_THREEJS_VIEWER = import.meta.env.VITE_ENABLE_THREEJS === 'true';
```

---

## Entwicklungs-Roadmap

### Sprint 1 (Woche 1-2): Foundation
- [ ] Three.js Setup & Basis-Viewer
- [ ] glTF-Loading von Backend-API
- [ ] Basis-Controls (Orbit, Pan, Zoom)

### Sprint 2 (Woche 3): Properties & Selection
- [ ] Raycasting & Selection
- [ ] Property-Service-Integration
- [ ] Property-Panel UI

### Sprint 3 (Woche 4): Filtering
- [ ] Filter-Manager
- [ ] Filter-UI
- [ ] Type & Property-Based Filtering

### Sprint 4 (Woche 5): Clipping & Export
- [ ] Clipping-Plane-Manager
- [ ] 2D-View-Generation
- [ ] PNG-Export

### Sprint 5 (Woche 6): Polish & Testing
- [ ] Performance-Optimierung
- [ ] Real-World-IFC-Tests
- [ ] UX-Improvements
- [ ] Dokumentation

---

## Code-Konventionen

### Naming
```typescript
// Services: PascalCase + "Service" oder "Manager"
class PropertyService {}
class ClippingPlaneManager {}

// Components: PascalCase
const PropertyPanel = () => {};

// Hooks: camelCase + "use" prefix
const useThreeScene = () => {};

// Types/Interfaces: PascalCase
interface BIMElement {}
type FilterCriteria = {};
```

### File Structure
```
// One component/service per file
// Index files for clean imports
```

### Comments
```typescript
// Deutsch für Fachbegriffe ok
// Englisch für Code-Logik bevorzugt
// JSDoc für öffentliche APIs

/**
 * Erstellt eine neue Schnittebene (Clipping Plane)
 * @param position - Position der Ebene im 3D-Raum
 * @param normal - Normalenvektor der Ebene
 * @returns Die erstellte THREE.Plane
 */
```

---

## Sicherheits-Checkliste: xeokit Clean Room

**Vor jeder Implementierung prüfen:**
- [ ] Habe ich xeokit-Code als Referenz **gelesen** (ok)
- [ ] Habe ich die Konzepte in **eigenen Worten** dokumentiert (ok)
- [ ] Implementiere ich komplett **neu** mit Three.js (erforderlich)
- [ ] Nutze ich **eigene** Klassennamen und Struktur (erforderlich)
- [ ] Ist mein Code **deutlich anders** als xeokit (erforderlich)

**NIEMALS:**
- Copy-Paste von xeokit-Code
- Minimale Änderungen an xeokit-Code
- Exakte Nachbildung von xeokit-Strukturen