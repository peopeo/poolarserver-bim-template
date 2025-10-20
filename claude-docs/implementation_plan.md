# Implementierungsplan: Three.js Parallel-Viewer

## Übersicht

Dieser Plan beschreibt die schrittweise Integration des Three.js-Viewers PARALLEL zum bestehenden xeokit-Viewer als einzeln testbare Tasks.

**Kernprinzipien:**
- ✅ Additive Entwicklung (nichts kaputt machen)
- ✅ Jeder Task ist isoliert testbar
- ✅ Git-Branch pro Task
- ✅ Claude Code entwickelt basierend auf vorhandenem Projekt-Kontext

---

## Git-Workflow

### Branch-Strategie

```
main (oder master)
  ↓
  feature/threejs-viewer (Haupt-Feature-Branch)
    ├── task/01-project-structure
    ├── task/02-dependencies
    ├── task/03-types-and-mocks
    ├── task/04-basic-viewer
    ├── task/05-viewer-selector
    ├── task/06-model-loading
    ├── task/07-selection
    ├── task/08-property-panel
    ├── task/09-filtering
    ├── task/10-clipping-planes
    └── task/11-2d-export
```

### Workflow pro Task

```bash
# 1. Feature-Branch erstellen (einmalig)
git checkout -b feature/threejs-viewer

# 2. Task-Branch erstellen
git checkout -b task/01-project-structure

# 3. Claude Code entwickelt Task
# ... Code-Änderungen ...

# 4. Testen
npm test
npm run dev  # Manuell testen

# 5. Commit
git add .
git commit -m "Task 01: Projektstruktur für Three.js-Viewer angelegt"

# 6. Merge in Feature-Branch
git checkout feature/threejs-viewer
git merge task/01-project-structure

# 7. Nächster Task
git checkout -b task/02-dependencies
# ... repeat
```

---

## Task-Liste

### ✅ Task 0: Bestandsaufnahme

**Branch:** `task/00-analysis`

**Ziel:** Verstehen des bestehenden Projekts

**Anweisungen für Claude Code:**
1. Analysiere die vorhandene Projektstruktur
2. Identifiziere alle xeokit-bezogenen Dateien
3. Dokumentiere die vorhandenen API-Endpunkte
4. Liste alle Dependencies auf
5. Erstelle eine Markdown-Datei: `docs/EXISTING_STRUCTURE.md`

**Akzeptanzkriterien:**
- [ ] Dokumentation der kompletten Projektstruktur erstellt
- [ ] Alle xeokit-Komponenten identifiziert und aufgelistet
- [ ] API-Endpunkte dokumentiert
- [ ] Dependencies-Liste vorhanden

**Testbar durch:** Code-Review der Dokumentation

**Zeitschätzung:** 1-2 Stunden

---

### ✅ Task 1: Projektstruktur

**Branch:** `task/01-project-structure`

**Ziel:** Neue Ordnerstruktur für Three.js-Viewer anlegen

**Anweisungen für Claude Code:**
1. Erstelle folgende Ordnerstruktur OHNE bestehende Files zu ändern:
   ```
   src/
   ├── viewers/
   │   ├── xeokit-viewer/     # BESTEHEND - nicht anfassen
   │   └── threejs-viewer/    # NEU - erstellen
   ├── components/
   │   ├── shared/            # NEU - erstellen
   │   ├── xeokit/            # BESTEHEND (falls vorhanden)
   │   └── threejs/           # NEU - erstellen
   ├── services/
   │   ├── api/               # BESTEHEND (falls vorhanden)
   │   └── threejs/           # NEU - erstellen
   ├── hooks/
   │   └── threejs/           # NEU - erstellen
   └── types/
       └── threejs/           # NEU - erstellen
   ```

2. Erstelle `.gitkeep` Files in leeren Ordnern

3. Erstelle `README.md` in `src/viewers/threejs-viewer/` mit Beschreibung

**Akzeptanzkriterien:**
- [ ] Alle neuen Ordner existieren
- [ ] Keine bestehenden Files geändert
- [ ] Git erkennt neue Struktur
- [ ] README vorhanden

**Testbar durch:**
```bash
# Strukturprüfung
ls -R src/viewers/threejs-viewer
ls -R src/components/threejs
ls -R src/services/threejs

# Git-Status prüfen (keine modified, nur new files)
git status
```

**Zeitschätzung:** 30 Minuten

---

### ✅ Task 2: Dependencies

**Branch:** `task/02-dependencies`

**Ziel:** Three.js Dependencies hinzufügen

**Anweisungen für Claude Code:**
1. Installiere folgende Dependencies:
   - `three@^0.160.0`
   - `@types/three@^0.160.0`
   - `zustand@^4.4.7` (optional, für State Management)

2. Aktualisiere `package.json` und `package-lock.json`

3. Verifiziere Installation

4. Erstelle `docs/DEPENDENCIES.md` mit Auflistung neuer Dependencies und Begründung

**Akzeptanzkriterien:**
- [ ] Dependencies in package.json
- [ ] Installation erfolgreich (`node_modules` aktualisiert)
- [ ] Keine bestehenden Dependencies entfernt
- [ ] Dokumentation erstellt

**Testbar durch:**
```bash
# Installation testen
npm install

# Imports testen
node -e "require('three')"

# TypeScript-Typen testen
npm run type-check  # falls vorhanden
```

**Zeitschätzung:** 30 Minuten

---

### ✅ Task 3: TypeScript-Typen & Mock-Daten

**Branch:** `task/03-types-and-mocks`

**Ziel:** Basis-Typen und Mock-Daten für Entwicklung

**Anweisungen für Claude Code:**
1. Erstelle TypeScript-Interfaces in `src/types/threejs/`:
   - `bim.types.ts` - BIMElement, BIMProperty, BIMMetadata
   - `viewer.types.ts` - Viewer-spezifische Typen
   - `filter.types.ts` - FilterCriteria, etc.

2. Erstelle Mock-Daten in `src/services/threejs/`:
   - `mock-metadata.ts` - Beispiel-IFC-Metadaten (ca. 10-20 Elemente)
   - `mock-gltf-url.ts` - URL zu einem Test-glTF-Modell

3. Mock-Daten sollen realistisch sein (IFC-Typen, Properties)

4. Exportiere alle Typen über `index.ts` Files

**Akzeptanzkriterien:**
- [ ] Alle TypeScript-Interfaces kompilieren
- [ ] Mock-Daten haben korrekte Struktur
- [ ] Keine TypeScript-Fehler
- [ ] Exports funktionieren

**Testbar durch:**
```bash
# TypeScript-Kompilierung
npm run type-check

# Imports testen
node -e "const { mockMetadata } = require('./src/services/threejs/mock-metadata.ts'); console.log(mockMetadata.elements.length);"
```

**Zeitschätzung:** 1-2 Stunden

---

### ✅ Task 4: Basis Three.js-Viewer

**Branch:** `task/04-basic-viewer`

**Ziel:** Minimaler funktionierender Three.js-Viewer

**Anweisungen für Claude Code:**
1. Erstelle `src/hooks/threejs/useThreeScene.ts`:
   - Setup: Scene, Camera, Renderer, Controls
   - Lighting (Ambient + Directional)
   - Grid Helper
   - Animation Loop
   - Resize Handling
   - Cleanup (dispose)

2. Erstelle `src/viewers/threejs-viewer/ThreeJsViewer.tsx`:
   - Nutzt useThreeScene Hook
   - Rendert Canvas-Container
   - Zeigt "Three.js Viewer (PoC)" Label
   - Loading-State
   - Error-Handling

3. Viewer soll NICHT in App.tsx integriert werden (kommt in Task 5)

**Akzeptanzkriterien:**
- [ ] Viewer kann isoliert gerendert werden
- [ ] Canvas zeigt Grid + Beleuchtung
- [ ] OrbitControls funktionieren
- [ ] Keine Memory Leaks (Cleanup funktioniert)
- [ ] Keine Fehler in Console

**Testbar durch:**
```typescript
// In einer separaten Test-Datei oder Storybook
import { ThreeJsViewer } from '@/viewers/threejs-viewer/ThreeJsViewer';

<ThreeJsViewer />  // Sollte leeren Viewer mit Grid zeigen
```

**Zeitschätzung:** 3-4 Stunden

---

### ✅ Task 5: Viewer-Umschaltung

**Branch:** `task/05-viewer-selector`

**Ziel:** Toggle zwischen xeokit und Three.js

**Anweisungen für Claude Code:**
1. Erstelle `src/components/shared/ViewerSelector.tsx`:
   - Button-Group zum Umschalten
   - Props: activeViewer, onSelect
   - Visuelles Feedback für aktiven Viewer
   - Responsive Design

2. Passe `src/App.tsx` MINIMAL an:
   - Importiere beide Viewer
   - State für activeViewer
   - Conditional Rendering
   - Default: 'xeokit' (bestehende Funktionalität zuerst)

3. WICHTIG: Kein bestehender xeokit-Code darf geändert werden

**Akzeptanzkriterien:**
- [ ] Umschaltung funktioniert
- [ ] xeokit-Viewer läuft wie vorher
- [ ] Three.js-Viewer läuft parallel
- [ ] Keine Interferenzen zwischen Viewern
- [ ] State wird korrekt gehalten

**Testbar durch:**
```bash
# Starte App
npm run dev

# Manuelle Tests:
1. App startet mit xeokit (default)
2. Klick auf "Three.js" → Wechsel funktioniert
3. Klick auf "xeokit" → Zurück funktioniert
4. xeokit-Features funktionieren wie vorher
5. Keine Console-Errors
```

**Zeitschätzung:** 2-3 Stunden

---

### ✅ Task 6: Model-Loading

**Branch:** `task/06-model-loading`

**Ziel:** glTF-Modelle laden und anzeigen

**Anweisungen für Claude Code:**
1. Erstelle `src/services/threejs/ModelLoader.ts`:
   - GLTFLoader-Wrapper
   - Load-Methode mit Progress-Callback
   - Metadata-Attachment an Objects
   - Error-Handling

2. Erweitere ThreeJsViewer:
   - Lade Mock-glTF-Modell
   - Zeige Loading-Indicator
   - Zentrierung und Auto-Fit der Kamera
   - Error-Display

3. Nutze Mock-Daten aus Task 3

**Akzeptanzkriterien:**
- [ ] glTF-Modell lädt erfolgreich
- [ ] Model wird angezeigt
- [ ] Kamera ist korrekt positioniert
- [ ] Loading-State funktioniert
- [ ] Fehler werden angezeigt

**Testbar durch:**
```bash
# Starte App
npm run dev

# Wechsel zu Three.js-Viewer
# Erwartung:
1. Loading-Indicator erscheint
2. Modell lädt
3. Modell wird angezeigt
4. Kamera zeigt ganzes Modell
5. OrbitControls funktionieren
```

**Zeitschätzung:** 3-4 Stunden

---

### ✅ Task 7: Selektion

**Branch:** `task/07-selection`

**Ziel:** Objekte per Klick selektieren

**Anweisungen für Claude Code:**
1. Erstelle `src/services/threejs/SelectionManager.ts`:
   - Raycasting bei Mouse-Click
   - Object-Highlighting
   - Clear-Selection
   - Return BIMElement-Data

2. Integriere in ThreeJsViewer:
   - Click-Handler
   - State für selectedElement
   - Visuelle Highlighting (z.B. grün)

3. Console-Log des selektierten Elements (für Testing)

**Akzeptanzkriterien:**
- [ ] Klick auf Objekt selektiert es
- [ ] Objekt wird visuell hervorgehoben
- [ ] Console zeigt BIMElement-Daten
- [ ] Klick auf leeren Bereich deselektiert
- [ ] Mehrfache Selektion funktioniert

**Testbar durch:**
```bash
# Im Viewer:
1. Klick auf Objekt → Console zeigt BIMElement
2. Objekt wird grün hervorgehoben
3. Klick auf anderes Objekt → Wechsel funktioniert
4. Klick auf Hintergrund → Deselektierung
```

**Zeitschätzung:** 2-3 Stunden

---

### ✅ Task 8: Property-Panel

**Branch:** `task/08-property-panel`

**Ziel:** Anzeige von Element-Properties

**Anweisungen für Claude Code:**
1. Erstelle `src/components/threejs/PropertyPanel.tsx`:
   - Props: element, onClose
   - Gruppierung nach PropertySets
   - Scrollable Content
   - Close-Button

2. Integriere in ThreeJsViewer:
   - Zeige Panel bei Selektion
   - Hide bei Deselektierung
   - Positionierung (rechts oben)

**Akzeptanzkriterien:**
- [ ] Panel öffnet bei Selektion
- [ ] Properties werden angezeigt
- [ ] PropertySets sind gruppiert
- [ ] Schließen funktioniert
- [ ] Responsive Verhalten

**Testbar durch:**
```bash
# Im Viewer:
1. Selektiere Objekt → Panel öffnet
2. Properties sind sichtbar und korrekt
3. Scrollen funktioniert bei vielen Properties
4. Close-Button schließt Panel
5. Andere Selektion aktualisiert Panel
```

**Zeitschätzung:** 3-4 Stunden

---

### ✅ Task 9: Filterung

**Branch:** `task/09-filtering`

**Ziel:** Objekte nach Typ und Properties filtern

**Anweisungen für Claude Code:**
1. Erstelle `src/services/threejs/FilterManager.ts`:
   - applyFilter(criteria)
   - resetFilter()
   - Visibility-Toggle basierend auf Kriterien

2. Erstelle `src/components/threejs/FilterPanel.tsx`:
   - Type-Dropdown
   - Property-Filter (Key-Value)
   - Apply/Reset Buttons
   - Anzahl sichtbarer/versteckter Objekte

3. Integriere in ThreeJsViewer

**Akzeptanzkriterien:**
- [ ] Filter nach Typ funktioniert
- [ ] Filter nach Properties funktioniert
- [ ] Reset-Funktion funktioniert
- [ ] Objekt-Zähler aktualisiert sich
- [ ] Gefilterte Objekte sind unsichtbar

**Testbar durch:**
```bash
# Im Viewer:
1. Wähle Typ "IfcWall" → nur Wände sichtbar
2. Filter Property "FireRating=F90" → nur F90 Wände
3. Reset → alle wieder sichtbar
4. Zähler zeigt korrekte Anzahl
```

**Zeitschätzung:** 4-5 Stunden

---

### ✅ Task 10: Clipping Planes

**Branch:** `task/10-clipping-planes`

**Ziel:** Schnittebenen erstellen und manipulieren

**Anweisungen für Claude Code:**
1. Erstelle `src/services/threejs/ClippingPlaneManager.ts`:
   - createPlane(position, normal)
   - updatePlane(index, position, normal)
   - removePlane(index)
   - Anwendung auf alle Materialien

2. Erstelle `src/components/threejs/ClippingPanel.tsx`:
   - Controls für Position (X, Y, Z)
   - Controls für Normal-Vector
   - Add/Remove Plane Buttons
   - Liste aktiver Planes

3. Integriere in ThreeJsViewer

**Akzeptanzkriterien:**
- [ ] Clipping Plane kann erstellt werden
- [ ] Modell wird korrekt geschnitten
- [ ] Position und Normal-Vector anpassbar
- [ ] Mehrere Planes möglich
- [ ] Planes können entfernt werden

**Testbar durch:**
```bash
# Im Viewer:
1. Erstelle horizontale Ebene (Y-Achse)
2. Modell wird geschnitten
3. Passe Position an → Schnitt bewegt sich
4. Erstelle zweite Ebene → beide aktiv
5. Entferne Ebene → funktioniert
```

**Zeitschätzung:** 5-6 Stunden

---

### ✅ Task 11: 2D-Export

**Branch:** `task/11-2d-export`

**Ziel:** 2D-Schnittansicht als PNG exportieren

**Anweisungen für Claude Code:**
1. Erweitere ClippingPlaneManager:
   - generate2DView(plane): HTMLCanvasElement
   - Orthographische Kamera entlang Plane
   - Rendering in Off-Screen Canvas
   - PNG-Export

2. Erweitere ClippingPanel:
   - "Als PNG exportieren" Button pro Plane
   - Download-Funktionalität
   - Vorschau (optional)

**Akzeptanzkriterien:**
- [ ] 2D-View wird generiert
- [ ] PNG-Download funktioniert
- [ ] Ansicht ist korrekt orientiert
- [ ] Qualität ist ausreichend
- [ ] Dateiname ist sinnvoll

**Testbar durch:**
```bash
# Im Viewer:
1. Erstelle Clipping Plane
2. Klick "Als PNG exportieren"
3. PNG wird heruntergeladen
4. Öffne PNG → zeigt 2D-Schnitt
5. Orientierung ist korrekt
```

**Zeitschätzung:** 4-5 Stunden

---

## Gesamt-Zeitschätzung

| Task | Stunden |
|------|---------|
| 0. Analyse | 1-2 |
| 1. Struktur | 0.5 |
| 2. Dependencies | 0.5 |
| 3. Typen & Mocks | 1-2 |
| 4. Basis-Viewer | 3-4 |
| 5. Viewer-Selector | 2-3 |
| 6. Model-Loading | 3-4 |
| 7. Selektion | 2-3 |
| 8. Property-Panel | 3-4 |
| 9. Filterung | 4-5 |
| 10. Clipping Planes | 5-6 |
| 11. 2D-Export | 4-5 |
| **GESAMT** | **29-41 Stunden** |

**Realistische Planung:** 1-2 Wochen (mit Buffer für Testing/Bugfixing)

---

## Testing-Checkliste pro Task

Jeder Task sollte diese Checks bestehen:

```bash
# 1. TypeScript Compilation
npm run type-check

# 2. Linting (falls konfiguriert)
npm run lint

# 3. Unit Tests (falls vorhanden)
npm test

# 4. Build
npm run build

# 5. Development Server
npm run dev

# 6. Git-Status (nur gewollte Änderungen)
git status
git diff

# 7. Manuelle funktionale Tests (siehe Task-spezifisch)
```

---

## Merge-Strategie

Nach jedem erfolgreichen Task:

```bash
# 1. Alle Tests durchlaufen
npm run type-check && npm run build

# 2. Commit im Task-Branch
git add .
git commit -m "Task XX: [Beschreibung]"

# 3. Merge in Feature-Branch
git checkout feature/threejs-viewer
git merge task/XX-name --no-ff

# 4. Push (optional)
git push origin feature/threejs-viewer

# 5. Lösche Task-Branch lokal (optional)
git branch -d task/XX-name
```

---

## Finale Integration

Nach Abschluss aller Tasks:

```bash
# Review des kompletten Feature-Branches
git checkout feature/threejs-viewer
git log --oneline

# Merge in main/master
git checkout main
git merge feature/threejs-viewer --no-ff

# Tag erstellen
git tag -a v1.0.0-threejs-poc -m "Three.js Viewer PoC completed"

# Push
git push origin main --tags
```