# Bonsai Konzeptanalyse - Clean-Room Documentation

**Erstellt:** 2025-01-20
**Zweck:** Konzepte aus Bonsai/BlenderBIM verstehen für eigenständige Implementierung
**Methode:** Clean-Room Approach (Konzepte lernen, NICHT Code kopieren)
**Lizenz-Status:** Bonsai ist GPL-3.0 → Wir dürfen NUR Konzepte lernen, NICHT Code kopieren!

---

## ⚠️ WICHTIG: Lizenz-Compliance

### Was wir gemacht haben:
1. ✅ Bonsai **außerhalb** des Projekts gecloned (`/tmp/IfcOpenShell/`)
2. ✅ Code **gelesen** und **verstanden**
3. ✅ Konzepte in **eigenen Worten** dokumentiert
4. ❌ **KEIN** Bonsai-Code im Projekt
5. ❌ **KEINE** Zeile-für-Zeile Übersetzung

### Bonsai Lizenz:
- **Lizenz:** GPL-3.0-or-later
- **Copyright:** © Dion Moult <dion@thinkmoult.com>
- **Repository:** https://github.com/IfcOpenShell/IfcOpenShell/tree/v0.8.0/src/bonsai

**Diese Dokumentation ist UNSERE eigenständige Arbeit** basierend auf öffentlichen IFC-Konzepten und IfcOpenShell API.

---

## 📋 Analysierte Module

Folgende Bonsai-Module wurden analysiert:

| Modul | Dateipfad | Zeilen | Zweck |
|-------|-----------|--------|-------|
| **Spatial Tool** | `bonsai/tool/spatial.py` | 1,446 | Spatial Hierarchy Management |
| **PropertySet Tool** | `bonsai/tool/pset.py` | 465 | PropertySet Extraction |
| **Geometry Module** | `bonsai/bim/module/geometry/` | Multiple | Geometry Processing |
| **Core Spatial** | `bonsai/core/spatial.py` | - | Business Logic for Spatial |
| **Core Pset** | `bonsai/core/pset.py` | - | Business Logic for PropertySets |

---

## 🏗️ Architektur-Konzepte

### Bonsai Design-Pattern: "Core + Tool" Separation

**Beobachtung:**
Bonsai nutzt eine klare Trennung:
```
core/
├── spatial.py      # Business Logic (Algorithmen)
└── pset.py         # Business Logic

tool/
├── spatial.py      # BlenderBIM-spezifische Implementation
└── pset.py         # BlenderBIM-spezifische Implementation
```

**Konzept-Übertragung für unser Projekt:**
```
ifc_intelligence/
├── spatial_tree.py    # Unsere Business Logic
├── property_extractor.py
└── parser.py

# KEINE BlenderBIM/bpy-Dependencies!
# Nur IfcOpenShell nutzen
```

**Learnings:**
- ✅ Trennung von Business Logic und Framework-Integration
- ✅ Core-Module sollten framework-unabhängig sein
- ✅ Tool-Module sind spezifisch (bei uns: Web-Service statt Blender)

---

## 📐 Konzept 1: Spatial Tree Extraction

### IFC Spatial Hierarchy Konzept

**IFC-Standard definiert:**
```
IfcProject
  ↓ (IfcRelAggregates)
IfcSite
  ↓
IfcBuilding
  ↓
IfcBuildingStorey
  ↓
IfcSpace (optional)
```

### Bonsai's Approach (Konzept, kein Code!)

**Algorithmus-Konzept:**
1. **Start bei IfcProject** (Root-Element)
2. **Rekursive Traversierung** via `IfcRelAggregates`
3. **Filtern** nur räumliche Elemente
4. **Baum-Struktur** aufbauen

**Pseudocode:**
```
FUNCTION extract_spatial_tree(ifc_file):
    project = ifc_file.by_type("IfcProject")[0]

    FUNCTION build_node(element):
        node = {
            id: element.GlobalId,
            name: element.Name,
            type: element.is_a(),
            children: []
        }

        # Rekursion via IfcRelAggregates
        FOR child IN get_spatial_children(element):
            child_node = build_node(child)  # Rekursiv
            node.children.append(child_node)

        RETURN node

    tree = build_node(project)
    RETURN tree

FUNCTION get_spatial_children(element):
    # Finde IfcRelAggregates wo element = RelatingObject
    relationships = [rel for rel in ifc_file.by_type("IfcRelAggregates")
                    if rel.RelatingObject == element]

    children = []
    FOR rel IN relationships:
        FOR obj IN rel.RelatedObjects:
            IF obj.is_a() IN SPATIAL_TYPES:  # IfcSite, IfcBuilding, etc.
                children.append(obj)

    RETURN children
```

**IfcOpenShell API Strategien:**

Bonsai nutzt:
```python
# ✅ Wir können auch nutzen (LGPL-Library):
import ifcopenshell.util.element

# Hilfsfunktion für Decomposition
decomposition = ifcopenshell.util.element.get_decomposition(element)
```

**Unsere Implementierungs-Strategie:**
1. ✅ Nutze `ifcopenshell.util.element.get_decomposition()` (LGPL OK)
2. ✅ Filtere auf `IfcSpatialElement` Subtypen
3. ✅ Baue rekursiv Baum auf
4. ✅ Eigene Dataclasses für Nodes

**NICHT übernehmen:**
- ❌ BlenderBIM-spezifische `bpy` Dependencies
- ❌ Blender-spezifische Object-Hierarchie
- ❌ Bonsai-spezifische Caching-Mechanismen

---

## 🏷️ Konzept 2: PropertySet Extraction

### IFC PropertySet Konzept

**IFC-Standard definiert:**
```
IfcWall (Element)
  ↓ (IfcRelDefinesByProperties)
IfcPropertySet (z.B. "Pset_WallCommon")
  ↓
IfcProperty (z.B. "FireRating", "LoadBearing")
  ↓
IfcValue (Werte: "F90", true, 200.0, etc.)
```

### Bonsai's Approach (Konzept)

**Algorithmus-Konzept:**
1. **Element finden** via GlobalId oder Type
2. **PropertySets** via `IfcRelDefinesByProperties` traversieren
3. **Properties** extrahieren (Key-Value)
4. **Gruppieren** nach PropertySet-Name

**Pseudocode:**
```
FUNCTION extract_properties(ifc_file, element_guid):
    element = ifc_file.by_guid(element_guid)

    properties_by_set = {}

    # Finde alle IfcRelDefinesByProperties für dieses Element
    FOR rel IN ifc_file.by_type("IfcRelDefinesByProperties"):
        IF element IN rel.RelatedObjects:
            pset = rel.RelatingPropertyDefinition

            IF pset.is_a("IfcPropertySet"):
                pset_name = pset.Name
                properties_by_set[pset_name] = {}

                FOR prop IN pset.HasProperties:
                    prop_name = prop.Name
                    prop_value = extract_value(prop)

                    properties_by_set[pset_name][prop_name] = prop_value

    RETURN properties_by_set

FUNCTION extract_value(property):
    # Verschiedene Property-Typen
    IF property.is_a("IfcPropertySingleValue"):
        RETURN property.NominalValue.wrappedValue

    IF property.is_a("IfcPropertyEnumeratedValue"):
        RETURN property.EnumerationValues[0].wrappedValue

    # ... weitere Typen
```

**IfcOpenShell API Strategien:**

Bonsai nutzt:
```python
# ✅ Wir können auch nutzen (LGPL):
import ifcopenshell.util.element

# Hilfsfunktion für PropertySets
psets = ifcopenshell.util.element.get_psets(element)
# Returns: {"Pset_WallCommon": {"FireRating": "F90", ...}, ...}
```

**Unsere Implementierungs-Strategie:**
1. ✅ Nutze `ifcopenshell.util.element.get_psets()` (High-Level Helper)
2. ✅ Oder manuell via `by_type("IfcRelDefinesByProperties")` traversieren
3. ✅ Eigene Dataclasses für Properties
4. ✅ Gruppierung nach PropertySet

**Performance-Trick (aus Bonsai gelernt):**
- PropertySets können gecacht werden (Element-GUID → Properties)
- Bei wiederholten Zugriffen auf selbes Element: Caching nutzen

---

## 🎨 Konzept 3: Geometry Processing

### IfcOpenShell Geometry Strategien

**Bonsai nutzt zwei Ansätze:**

#### Ansatz 1: IfcConvert Binary (empfohlen für uns)
```
IfcConvert input.ifc output.gltf
```
- ✅ Einfach, schnell, robust
- ✅ Bereits im Container installiert
- ❌ Weniger Kontrolle über Details

#### Ansatz 2: IfcOpenShell.geom Python API
```python
import ifcopenshell.geom

settings = ifcopenshell.geom.settings()
settings.set(settings.USE_WORLD_COORDS, True)

iterator = ifcopenshell.geom.iterator(settings, ifc_file)
iterator.initialize()

while True:
    shape = iterator.get()
    # shape.geometry.verts → Vertices
    # shape.geometry.faces → Faces

    if not iterator.next():
        break
```
- ✅ Volle Kontrolle
- ✅ Metadaten-Attachment möglich
- ❌ Komplexer

**Unsere Strategie:**
1. **Phase 1:** Nutze IfcConvert Binary (schnell, einfach)
2. **Phase 2 (optional):** Erweitere mit `ifcopenshell.geom` für Metadaten

---

## 🔄 Konzept 4: Caching & Performance

### Bonsai's Caching-Strategie

**Beobachtungen:**
1. **IfcStore Pattern:** Globaler Cache für geöffnete IFC-Files
2. **LRU-ähnlich:** Alte Files werden bei Memory-Limits entfernt
3. **Per-Request Caching:** PropertySets werden pro Element gecacht

**Pseudocode:**
```
CLASS IfcCacheManager:
    cache = {}  # file_path → ifc_file object

    FUNCTION get_or_load(file_path):
        IF file_path IN cache:
            RETURN cache[file_path]

        ELSE:
            ifc_file = ifcopenshell.open(file_path)
            cache[file_path] = ifc_file

            # Optional: LRU-Eviction
            IF len(cache) > MAX_SIZE:
                remove_oldest()

            RETURN ifc_file
```

**Unsere Implementierung:**
- ✅ Einfacher Dict-basierter Cache
- ✅ TTL (Time-to-Live) für Auto-Cleanup
- ✅ Max-Size Limit
- ❌ KEINE komplexen Blender-spezifischen Mechanismen

---

## 📊 Konzept 5: Data Models

### Bonsai's Datenstrukturen (Konzept-Level)

**Spatial Node:**
```python
# Konzept (nicht Bonsai-Code!):
@dataclass
class SpatialNode:
    guid: str
    name: str
    ifc_type: str  # "IfcSite", "IfcBuilding", etc.
    children: List[SpatialNode]
```

**Property:**
```python
@dataclass
class Property:
    name: str
    value: Any
    value_type: str  # "IfcLabel", "IfcReal", "IfcBoolean"
    property_set: str  # "Pset_WallCommon"
```

**Metadata:**
```python
@dataclass
class IfcMetadata:
    project_id: str
    project_name: str
    schema: str  # "IFC4", "IFC2X3"
    entity_counts: Dict[str, int]
```

---

## 🛠️ Implementierungs-Checkliste

### ✅ Was wir von Bonsai lernen dürfen:
- [x] Architektur-Patterns (Core/Tool Separation)
- [x] Algorithmus-Konzepte (Rekursion, Traversierung)
- [x] IFC-Standard Nutzung (IfcRelAggregates, IfcPropertySet)
- [x] IfcOpenShell API Best Practices
- [x] Performance-Strategien (Caching)

### ❌ Was wir NICHT übernehmen:
- [ ] Bonsai-Code (GPL-3.0 viral!)
- [ ] BlenderBIM-spezifische `bpy` Dependencies
- [ ] Blender-spezifische Object-Hierarchien
- [ ] Bonsai-spezifische Class-Namen
- [ ] Direkte Code-Übersetzungen

### ✅ Was wir nutzen:
- [x] **IfcOpenShell Library** (LGPL - OK!)
  - `ifcopenshell.open()`
  - `ifcopenshell.util.element.get_decomposition()`
  - `ifcopenshell.util.element.get_psets()`
  - `ifcopenshell.geom` (optional)

- [x] **IFC-Standard** (öffentlich)
  - IfcProject → IfcSite → IfcBuilding → IfcStorey
  - IfcRelAggregates
  - IfcRelDefinesByProperties
  - IfcPropertySet

- [x] **Eigene Implementierung**
  - Eigene Klassen
  - Eigene Algorithmen
  - Eigene API-Designs

---

## 📚 IfcOpenShell API - Quick Reference

Basierend auf Bonsai-Analyse, aber aus **offizieller IfcOpenShell Dokumentation**:

### File Operations
```python
import ifcopenshell

# Open file
ifc_file = ifcopenshell.open("model.ifc")

# Get schema
schema = ifc_file.schema  # "IFC4", "IFC2X3"

# Get all entities of type
walls = ifc_file.by_type("IfcWall")

# Get entity by GUID
element = ifc_file.by_guid("3vB2YO$MX4xv5uCqZZG0Xq")
```

### Spatial Utilities
```python
import ifcopenshell.util.element

# Get spatial decomposition (children)
children = ifcopenshell.util.element.get_decomposition(element)

# Get spatial container (parent)
container = ifcopenshell.util.element.get_container(element)
```

### PropertySet Utilities
```python
import ifcopenshell.util.element

# Get all PropertySets for element
psets = ifcopenshell.util.element.get_psets(element)
# Returns: {"Pset_WallCommon": {"FireRating": "F90", ...}, ...}

# Get specific PropertySet
pset_wall = ifcopenshell.util.element.get_pset(element, "Pset_WallCommon")
# Returns: {"FireRating": "F90", "LoadBearing": True, ...}
```

### Geometry Operations
```python
import ifcopenshell.geom

# Create settings
settings = ifcopenshell.geom.settings()
settings.set(settings.USE_WORLD_COORDS, True)

# Create iterator
iterator = ifcopenshell.geom.iterator(settings, ifc_file, num_threads=4)
iterator.initialize()

while True:
    shape = iterator.get()
    geometry = shape.geometry

    # Access vertices/faces
    verts = geometry.verts  # [x1, y1, z1, x2, y2, z2, ...]
    faces = geometry.faces  # [i1, i2, i3, i4, i5, i6, ...]

    if not iterator.next():
        break
```

---

## 🎯 Implementierungs-Roadmap für unser Projekt

Basierend auf Bonsai-Konzepten, aber **eigenständig umgesetzt**:

### Task 1: Python Package Setup
```
src/python-service/
├── ifc_intelligence/
│   ├── __init__.py
│   ├── models.py           # Unsere Dataclasses
│   ├── parser.py           # IFC Metadata Extraction
│   ├── spatial_tree.py     # Spatial Hierarchy (Bonsai-inspiriert!)
│   ├── property_extractor.py  # PropertySets (Bonsai-inspiriert!)
│   ├── gltf_exporter.py    # Geometry Export
│   └── cache_manager.py    # RAM Cache (Bonsai-inspiriert!)
├── scripts/                 # CLI entry points
└── tests/
```

### Task 2: Spatial Tree Implementation
```python
# Eigenständige Implementierung, inspiriert von Bonsai-Konzepten

from dataclasses import dataclass
import ifcopenshell
import ifcopenshell.util.element

@dataclass
class SpatialNode:
    guid: str
    name: str
    ifc_type: str
    children: list['SpatialNode']

class SpatialTreeExtractor:
    """
    Extract spatial hierarchy from IFC file.

    Algorithm inspired by Bonsai's approach but independently implemented
    using IfcOpenShell API (LGPL).
    """

    def extract_tree(self, ifc_file_path: str) -> SpatialNode:
        ifc_file = ifcopenshell.open(ifc_file_path)
        project = ifc_file.by_type("IfcProject")[0]

        return self._build_node(project, ifc_file)

    def _build_node(self, element, ifc_file) -> SpatialNode:
        # Rekursive Implementierung mit IfcOpenShell API
        # EIGENE Logik, NICHT Bonsai-Code!
        pass
```

### Task 3: PropertySet Implementation
```python
# Eigenständig, IfcOpenShell-basiert

class PropertyExtractor:
    """
    Extract PropertySets from IFC elements.

    Uses IfcOpenShell utility functions (concept learned from Bonsai).
    """

    def extract_properties(self, ifc_file_path: str, element_guid: str):
        ifc_file = ifcopenshell.open(ifc_file_path)
        element = ifc_file.by_guid(element_guid)

        # Nutze IfcOpenShell Helper
        psets = ifcopenshell.util.element.get_psets(element)

        return psets  # Eigene Verarbeitung
```

---

## 📖 Ressourcen

### IfcOpenShell Dokumentation (UNSERE Basis!)
- **API Docs:** https://blenderbim.org/docs-python/ifcopenshell-python/code_examples.html
- **Academy:** https://academy.ifcopenshell.org/
- **Wiki:** https://wiki.osarch.org/index.php?title=IfcOpenShell_code_examples

### IFC-Standard (öffentlich)
- **buildingSMART:** https://technical.buildingsmart.org/standards/ifc/
- **IFC4 Spec:** https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/

### Bonsai (NUR Referenz, NICHT kopieren!)
- **GitHub:** https://github.com/IfcOpenShell/IfcOpenShell/tree/v0.8.0/src/bonsai
- **⚠️ GPL-3.0:** Code NICHT kopieren!

---

## ✅ Zusammenfassung

### Was wir gelernt haben:
1. **Architektur:** Core/Tool Separation Pattern
2. **Spatial Tree:** Rekursive Traversierung mit `get_decomposition()`
3. **PropertySets:** Einfacher Zugriff via `get_psets()`
4. **Geometrie:** IfcConvert für glTF, alternativ `ifcopenshell.geom`
5. **Caching:** LRU-Cache für IFC-Files

### Wie wir es umsetzen:
1. ✅ **IfcOpenShell API nutzen** (LGPL - legal)
2. ✅ **Konzepte anwenden** (aus Bonsai gelernt)
3. ✅ **Eigenständiger Code** (kein GPL-Risiko)
4. ✅ **Eigene Datenmodelle** (Pydantic/Dataclasses)
5. ✅ **Web-Service Integration** (kein Blender)

### Lizenz-Status:
- ✅ Unsere Implementierung: **MIT oder Apache 2.0** (frei wählbar)
- ✅ IfcOpenShell Library: **LGPL** (darf genutzt werden)
- ❌ Bonsai Code: **GPL-3.0** (NICHT im Projekt!)

---

**Analyse abgeschlossen!** ✅
**Nächster Schritt:** Task 1 - Python Package Setup implementieren
