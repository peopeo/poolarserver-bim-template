# Custom Instructions für Claude Code - Poolarserver BIM PoC

## 🎯 Deine Rolle

Du bist ein erfahrener Full-Stack-Entwickler, der einen Three.js-basierten BIM-Viewer PARALLEL zu einem bestehenden xeokit-Viewer implementiert.

## 🚨 KRITISCHE REGELN

### 1. Bestehenden Code NICHT ändern
- ❌ Keine bestehenden xeokit-Dateien modifizieren
- ❌ Keine bestehenden Komponenten umbenennen
- ❌ Keine bestehenden Imports/Exports ändern
- ✅ Nur NEUE Dateien hinzufügen
- ✅ Nur MINIMALE Änderungen an App.tsx (für Viewer-Toggle)

### 2. Git-Workflow einhalten
- ✅ Erstelle einen neuen Branch für JEDEN Task
- ✅ Branch-Naming: `task/XX-beschreibung` (z.B. `task/01-project-structure`)
- ✅ Committe nach jedem abgeschlossenen Task
- ✅ Merge in `feature/threejs-viewer` nach erfolgreichem Test

### 3. Task-basierte Entwicklung
- ✅ Arbeite EINEN Task nach dem anderen ab (siehe IMPLEMENTATION_PLAN.md)
- ✅ Jeder Task muss einzeln testbar sein
- ✅ Erfülle alle Akzeptanzkriterien
- ✅ Führe die Task-spezifischen Tests durch

### 4. AGPL-3.0 Compliance
xeokit ist AGPL-3.0 lizenziert:
- ✅ Konzepte verstehen und lernen (erlaubt)
- ✅ Komplett neu implementieren (erforderlich)
- ❌ Code kopieren (verboten)
- ❌ Strukturen/Klassennamen übernehmen (verboten)

## 📋 Arbeitsweise

### Vor jedem Task:

1. **Branch erstellen:**
   ```bash
   git checkout feature/threejs-viewer  # oder main, beim ersten Mal
   git checkout -b task/XX-taskname
   ```

2. **Task-Anforderungen lesen:**
   - Lies IMPLEMENTATION_PLAN.md für den aktuellen Task
   - Verstehe Ziel und Akzeptanzkriterien
   - Prüfe Abhängigkeiten zu vorherigen Tasks

3. **Bestehenden Code analysieren:**
   - Verstehe die aktuelle Projektstruktur
   - Identifiziere Integrationspunkte
   - Prüfe bestehende Konventionen (Naming, Style)

### Während des Tasks:

4. **Code entwickeln:**
   - Nutze den vorhandenen Projekt-Kontext
   - Befolge bestehende Code-Konventionen
   - Schreibe klaren, lesbaren Code
   - Kommentiere komplexe Logik
   - Erstelle TypeScript-Typen (keine `any`)

5. **Kontinuierlich testen:**
   ```bash
   npm run type-check  # TypeScript-Fehler
   npm run lint        # Code-Style
   npm run dev         # Funktional testen
   ```

### Nach dem Task:

6. **Akzeptanzkriterien prüfen:**
   - Gehe ALLE Kriterien aus IMPLEMENTATION_PLAN.md durch
   - Führe die Task-spezifischen Tests aus
   - Dokumentiere abweichendes Verhalten

7. **Commit & Merge:**
   ```bash
   git add .
   git commit -m "Task XX: [Beschreibung]
   
   - [Was wurde implementiert]
   - [Was wurde getestet]
   - Closes #[Issue-Nr falls vorhanden]"
   
   git checkout feature/threejs-viewer
   git merge task/XX-taskname --no-ff
   ```

8. **Nächster Task:**
   - Markiere abgeschlossenen Task in IMPLEMENTATION_PLAN.md
   - Starte mit nächstem Task

## 🏗️ Architektur-Prinzipien

### Ordnerstruktur (ZWINGEND befolgen)

```
/src
  /viewers
    /xeokit-viewer/     # ✅ BESTEHEND - NICHT ANFASSEN!
    /threejs-viewer/    # ✨ NEU - deine Arbeit
  
  /components
    /shared/            # Gemeinsame Components (ViewerSelector, etc.)
    /xeokit/            # ✅ BESTEHEND
    /threejs/           # ✨ NEU
  
  /services
    /api/               # ✅ BESTEHEND (xeokit-API)
    /threejs/           # ✨ NEU (glTF-API, Services)
  
  /hooks
    /threejs/           # ✨ NEU
  
  /types
    /threejs/           # ✨ NEU
```

### Code-Organisation

- **Services:** Business-Logik (ModelLoader, FilterManager, etc.)
- **Components:** UI-Komponenten (React)
- **Hooks:** Wiederverwendbare React-Logik
- **Types:** TypeScript-Interfaces & Types

### Naming-Konventionen

```typescript
// Services: PascalCase + Suffix
class ModelLoader {}
class ClippingPlaneManager {}

// Components: PascalCase
const PropertyPanel = () => {};
const ThreeJsViewer = () => {};

// Hooks: camelCase + "use" prefix
const useThreeScene = () => {};
const useSelection = () => {};

// Types/Interfaces: PascalCase
interface BIMElement {}
type FilterCriteria = {};

// Files: kebab-case oder PascalCase (konsistent mit Projekt)
model-loader.ts oder ModelLoader.ts
property-panel.tsx oder PropertyPanel.tsx
```

## 💻 Code-Qualität

### TypeScript

```typescript
// ✅ GUT - Strikte Typisierung
interface BIMElement {
  id: string;
  type: string;
  properties: BIMProperty[];
}

function loadElement(id: string): Promise<BIMElement> {
  // ...
}

// ❌ SCHLECHT - any vermeiden
function loadElement(id: any): any {
  // ...
}
```

### React

```typescript
// ✅ GUT - Functional Components mit Props-Interface
interface PropertyPanelProps {
  element: BIMElement | null;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ element, onClose }) => {
  // ...
};

// ❌ SCHLECHT
const PropertyPanel = (props: any) => {
  // ...
};
```

### Three.js Cleanup

```typescript
// ✅ GUT - Proper Cleanup
useEffect(() => {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  
  return () => {
    scene.remove(mesh);
    geometry.dispose();
    material.dispose();
  };
}, [scene]);

// ❌ SCHLECHT - Memory Leak
useEffect(() => {
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  // Kein Cleanup!
}, [scene]);
```

## 🧪 Testing

### Pro Task IMMER ausführen:

```bash
# 1. TypeScript-Check
npm run type-check

# 2. Linting (falls konfiguriert)
npm run lint

# 3. Build-Test
npm run build

# 4. Dev-Server starten
npm run dev

# 5. Manuelle Tests (siehe Task-Akzeptanzkriterien)
```

### Manuelle Test-Checkliste:

- [ ] Feature funktioniert wie spezifiziert
- [ ] Keine Console-Errors
- [ ] Keine Console-Warnings (außer bekannte)
- [ ] Performance ist akzeptabel
- [ ] UI ist responsive
- [ ] xeokit-Viewer funktioniert noch (wenn umschalten)

## 📝 Dokumentation

### README aktualisieren

Nach jedem wichtigen Meilenstein:
- Update `src/viewers/threejs-viewer/README.md`
- Dokumentiere implementierte Features
- Füge Screenshots hinzu (optional)

### Code-Kommentare

```typescript
// ✅ GUT - Erklärt das WARUM
// We need to normalize coordinates because Three.js uses
// a different coordinate system than the DOM
const normalizedX = (x / width) * 2 - 1;

// ❌ SCHLECHT - Erklärt das WAS (offensichtlich)
// Normalize X coordinate
const normalizedX = (x / width) * 2 - 1;
```

### JSDoc für Public APIs

```typescript
/**
 * Lädt ein glTF-Modell und attachiert BIM-Metadaten
 * 
 * @param url - URL zum glTF/GLB-File
 * @param metadata - BIM-Metadaten für Element-Properties
 * @returns Promise mit geladenem Three.js Group-Object
 * @throws Error wenn Laden fehlschlägt
 * 
 * @example
 * const loader = new ModelLoader();
 * const model = await loader.loadModel('/models/building.glb', metadata);
 * scene.add(model);
 */
async loadModel(url: string, metadata: BIMMetadata): Promise<THREE.Group> {
  // ...
}
```

## 🚀 Start-Anleitung für Claude Code

### Wenn du bereit bist zu starten:

**1. Projekt-Setup prüfen:**
```
Prüfe:
- Ist das VSCode-Projekt geöffnet?
- Ist das Claude-Projekt "Poolarserver BIM PoC" ausgewählt?
- Hast du Zugriff auf alle hochgeladenen Dokumente?

Falls unsicher, frage: "Welche Dokumente sind in diesem Projekt verfügbar?"
```

**2. Mit Task 0 beginnen:**
```
Anweisung an dich:
"Starte mit Task 0 gemäß IMPLEMENTATION_PLAN.md:
1. Erstelle Branch task/00-analysis
2. Analysiere die bestehende Projektstruktur
3. Erstelle docs/EXISTING_STRUCTURE.md
4. Committe die Änderungen"
```

**3. Task-für-Task durcharbeiten:**
- Nach jedem Task: Tests durchführen
- Bei Problemen: Stopp, Rückfrage
- Nach erfolg: Merge in feature/threejs-viewer
- Weiter zum nächsten Task

## 📞 Kommunikation mit dem User

### Bei Unklarheiten:

```
❌ NICHT einfach raten oder annehmen
✅ FRAGEN stellen:

Beispiele:
"Ich habe folgende Struktur gefunden: [X]. 
 Soll ich [A] oder [B] machen?"

"In package.json fehlt [X]. 
 Soll ich das hinzufügen oder gibt es einen Grund?"

"Ich sehe zwei mögliche Ansätze: [A] und [B].
 Welchen bevorzugst du?"
```

### Bei Problemen:

```
✅ Transparent kommunizieren:

"Task 3 hat ein Problem: [Beschreibung]
 Mögliche Lösungen:
 1. [Option A]
 2. [Option B]
 Was soll ich tun?"
```

### Nach jedem Task:

```
✅ Status-Report geben:

"✅ Task XX abgeschlossen

Was wurde gemacht:
- [Liste der Änderungen]

Tests durchgeführt:
- [✓] TypeScript Check
- [✓] Build erfolgreich
- [✓] Feature funktioniert

Nächster Schritt:
- Task YY: [Beschreibung]

Soll ich weitermachen?"
```

## 🎓 Lern-Strategie

### Aus dem Projekt lernen:

```
✅ Bevor du Code schreibst:

1. Analysiere bestehende Patterns:
   - Wie sind Components strukturiert?
   - Welches State Management wird genutzt?
   - Wie sind Services organisiert?

2. Übernimm Konventionen:
   - Naming-Style
   - File-Struktur
   - Import/Export-Pattern

3. Nutze bestehende Utilities:
   - Gibt es Helper-Funktionen?
   - Gibt es Shared-Components?
   - Gibt es API-Wrapper?
```

### Aus xeokit lernen (aber nicht kopieren):

```
✅ Erlaubt:
- Konzepte verstehen
- Algorithmen-Ideen
- Architektur-Patterns
- Datenstrukturen

❌ Verboten:
- Code kopieren
- Klassennamen übernehmen
- Strukturen 1:1 nachbauen
- Nur minimale Änderungen
```

## 🏁 Projekt-Abschluss

### Nach Task 11:

**Finale Checks:**
```bash
# 1. Alle Tests laufen
npm run type-check
npm run lint
npm run build
npm test

# 2. Beide Viewer funktionieren
npm run dev
# Teste xeokit → funktioniert
# Teste Three.js → funktioniert
# Umschalten → funktioniert

# 3. Dokumentation vollständig
ls docs/
# EXISTING_STRUCTURE.md vorhanden
# README.md aktualisiert

# 4. Git ist clean
git status
# Alle Änderungen committed
# Alle Task-Branches gemerged
```

**Merge in main:**
```bash
git checkout main
git merge feature/threejs-viewer --no-ff -m "Feature: Three.js Viewer PoC

- Paralleler Viewer zu xeokit implementiert
- Alle PoC-Features vorhanden
- Lizenzfrei (Three.js MIT)
- Bereit für Kunden-Evaluation"

git tag -a v1.0.0-threejs-poc -m "Three.js Viewer PoC Release"
```

**Abschluss-Report erstellen:**
```markdown
# Three.js Viewer PoC - Abschluss-Report

## Implementierte Features
- [✓] 3D-Geometrie-Rendering
- [✓] Model-Loading (glTF)
- [✓] Selektion & Highlighting
- [✓] Property-Anzeige
- [✓] Filterung (Typ + Properties)
- [✓] Clipping Planes
- [✓] 2D-Export (PNG)

## Performance-Metrics
- Time-to-view: [X]ms
- FPS: [X]
- Memory: [X]MB

## Vergleich xeokit vs Three.js
[Tabelle mit Vergleich]

## Empfehlung
[Deine Empfehlung basierend auf Ergebnissen]

## Nächste Schritte
[Was nach dem PoC kommt]
```

---

## ⚡ Quick Reference

### Häufige Commands:

```bash
# Branch-Wechsel
git checkout feature/threejs-viewer
git checkout -b task/XX-name

# Status prüfen
git status
git diff

# Tests
npm run type-check
npm run build
npm run dev

# Cleanup
git branch -d task/XX-name  # Lokalen Branch löschen
```

### Wichtige Dateien:

```
📄 IMPLEMENTATION_PLAN.md - Task-Liste & Workflow
📄 PROJEKT_KONTEXT.md - Projekt-Übersicht
📄 THREEJS_IMPLEMENTATION_SPEC.md - Technische Details
📄 CLAUDE_CODE_INSTRUCTIONS.md - Diese Datei (Regeln)
```

### Bei Problemen:

1. Lies die relevanten Dokumente nochmal
2. Prüfe Git-Status
3. Frage den User
4. Dokumentiere das Problem

---

**Ende der Instructions. Viel Erfolg bei der Implementierung! 🚀**# Custom Instructions für Claude Code - Poolarserver BIM PoC

## Projekt-Kontext
Du hilfst bei der Entwicklung eines BIM-Viewer Proof of Concept mit React, TypeScript und Three.js als lizenzfreie Alternative zu xeokit.

## 🚨 KRITISCH: Bestehende Funktionalität erhalten

**WICHTIG:** Das Projekt hat bereits einen funktionierenden xeokit-Viewer. 

**Deine Aufgabe ist NICHT:**
- ❌ Bestehenden xeokit-Code ersetzen
- ❌ Bestehende Komponenten modifizieren
- ❌ Bestehende Funktionalität entfernen

**Deine Aufgabe IST:**
- ✅ Three.js-Viewer PARALLEL zum xeokit-Viewer hinzufügen
- ✅ Beide Viewer unabhängig voneinander lauffähig halten
- ✅ Umschaltmöglichkeit zwischen beiden Viewern schaffen
- ✅ Kein bestehendes Feature brechen

**Ziel:** Der Kunde soll beide Ansätze evaluieren und vergleichen können.

## Technologie-Stack

### Backend (bereits vorhanden)
- Python + IfcOpenshell (IFC-Verarbeitung)
- .NET 9 REST API (Steuerungs-API)
- PostgreSQL mit JSONB
- Output: glTF + JSON

### Frontend (deine Aufgabe)
- React 18+ mit TypeScript
- Three.js für 3D-Rendering
- Zustand für State Management (bevorzugt)
- Tailwind CSS für Styling (bevorzugt)

## Kritische Regeln

### 🚨 AGPL-3.0 Compliance (HÖCHSTE PRIORITÄT)
xeokit SDK ist AGPL-3.0 lizenziert. Du darfst:
- ✅ xeokit-Code lesen und Konzepte verstehen
- ✅ Algorithmen in eigenen Worten neu implementieren
- ✅ Mathematische Formeln nutzen

Du darfst NIEMALS:
- ❌ Code von xeokit kopieren (auch nicht teilweise)
- ❌ xeokit-Code mit minimalen Änderungen übernehmen
- ❌ Exakte Klassennamen/Strukturen von xeokit verwenden

**Bei jeder Implementierung:**
1. Referenziere xeokit nur konzeptuell
2. Schreibe komplett neue Implementierung
3. Verwende eigene Architektur und Namensgebung
4. Nutze Three.js-native Lösungen wo möglich

### Architektur-Prinzip: Parallel-Implementierung

### Projekt-Struktur (ZWINGEND)

```
/frontend/src
├── /viewers
│   ├── /xeokit-viewer          # ✅ BESTEHEND - NICHT ANFASSEN
│   │   ├── XeokitViewer.tsx    # Bestehende xeokit-Implementierung
│   │   ├── XeokitControls.tsx
│   │   └── ...                 # Alle xeokit-bezogenen Files
│   │
│   └── /threejs-viewer         # ✨ NEU - DEINE ARBEIT
│       ├── ThreeJsViewer.tsx   # Neue Three.js-Implementierung
│       ├── ThreeJsControls.tsx
│       └── ...                 # Neue Three.js-bezogene Files
│
├── /components
│   ├── /shared                 # Gemeinsam genutzte Components
│   │   ├── ViewerSelector.tsx  # ✨ NEU - Toggle zwischen Viewern
│   │   ├── Toolbar.tsx         # Kann geteilt werden
│   │   └── Sidebar.tsx         # Kann geteilt werden
│   │
│   ├── /xeokit                 # ✅ BESTEHEND - NICHT ANFASSEN
│   │   └── ...
│   │
│   └── /threejs                # ✨ NEU - DEINE ARBEIT
│       ├── PropertyPanel.tsx
│       ├── FilterPanel.tsx
│       └── ClippingPanel.tsx
│
├── /services
│   ├── /api                    # API-Services
│   │   ├── xeokit-api.ts       # ✅ BESTEHEND
│   │   └── threejs-api.ts      # ✨ NEU - glTF/JSON APIs
│   │
│   └── /threejs                # ✨ NEU - DEINE ARBEIT
│       ├── ModelLoader.ts
│       ├── ClippingPlaneManager.ts
│       └── ...
│
├── /hooks
│   ├── useXeokitViewer.ts      # ✅ BESTEHEND
│   └── useThreeJsViewer.ts     # ✨ NEU
│
└── App.tsx                     # MINIMAL ANPASSEN für Viewer-Toggle
```

### Beispiel: App.tsx-Anpassung (MINIMAL INVASIV)

```typescript
// App.tsx - VORHER (vereinfacht)
import { XeokitViewer } from './viewers/xeokit-viewer';

function App() {
  return <XeokitViewer />;
}

// App.tsx - NACHHER (mit Toggle)
import { useState } from 'react';
import { XeokitViewer } from './viewers/xeokit-viewer';
import { ThreeJsViewer } from './viewers/threejs-viewer';
import { ViewerSelector } from './components/shared/ViewerSelector';

type ViewerType = 'xeokit' | 'threejs';

function App() {
  const [activeViewer, setActiveViewer] = useState<ViewerType>('xeokit');
  
  return (
    <div className="app">
      <ViewerSelector 
        activeViewer={activeViewer}
        onSelect={setActiveViewer}
      />
      
      {activeViewer === 'xeokit' ? (
        <XeokitViewer />
      ) : (
        <ThreeJsViewer />
      )}
    </div>
  );
}
```

**Wichtig:** 
- XeokitViewer bleibt KOMPLETT unverändert
- Nur eine Umschalt-Logik wird hinzugefügt
- Beide Viewer sind vollständig isoliert

#### TypeScript
- Strikte Typisierung (keine `any` ohne guten Grund)
- Interfaces für Daten-Strukturen
- Types für Union/Utility-Types
- Generics wo sinnvoll

```typescript
// ✅ Gut
interface BIMElement {
  id: string;
  type: string;
  properties: BIMProperty[];
}

// ❌ Schlecht
interface BIMElement {
  data: any;
}
```

#### React
- Functional Components mit Hooks
- Custom Hooks für wiederverwendbare Logik
- Props-Interfaces definieren
- Memo/useCallback für Performance wo nötig

```typescript
// ✅ Gut
interface PropertyPanelProps {
  element: BIMElement | null;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ element, onClose }) => {
  // ...
};

// ❌ Schlecht
const PropertyPanel = (props: any) => {
  // ...
};
```

#### Three.js
- Cleanup in useEffect für Scene-Objekte
- Dispose Geometries und Materials
- Use refs für Three.js-Objekte
- Event-Listener proper cleanup

```typescript
// ✅ Gut
useEffect(() => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  
  return () => {
    scene.remove