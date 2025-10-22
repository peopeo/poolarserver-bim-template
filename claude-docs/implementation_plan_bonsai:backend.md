# Claude Code: Python IFC Intelligence Service Implementation
**Projekt: Poolarserver BIM PoC - Python Worker Service**

---

## 🎯 Mission Statement

Du implementierst einen **Python-basierten IFC Intelligence Worker Service**, inspiriert vom Bonsai/BlenderBIM Source Code. Dieser Service wird von der bestehenden ASP.NET API (Port 5000) aufgerufen und liefert IFC-Verarbeitungsergebnisse zurück.

**KRITISCH:**
- ✅ **Python = Worker/Library** - KEIN eigener HTTP-Server!
- ✅ **ASP.NET API (Port 5000)** - Einziger öffentlicher Endpunkt
- ✅ **Kommunikation:** .NET ruft Python-Funktionen auf (direkt oder via Message Queue)
- ✅ **Additiv arbeiten** - Nichts bestehendes kaputt machen!
- ✅ **Bonsai als Inspiration** - NICHT Code kopieren
- ✅ **Neue Branches** pro Task

---

## 📁 Architektur-Übersicht

### Kommunikations-Flow:
```
Frontend (React/Three.js)
        ↓
    REST API (Port 5000)
        ↓
ASP.NET Core Backend
        ↓
    Ruft Python auf (direkt oder Queue)
        ↓
Python IFC Service (Worker)
        ↓
    Return JSON/Bytes
        ↓
ASP.NET speichert in PostgreSQL
        ↓
    Response an Frontend
```

**Wichtig:**
- Frontend kennt nur ASP.NET API (Port 5000)
- Python ist INTERN - kein HTTP-Server!
- ASP.NET orchestriert alles

---

## 🔌 Integration: .NET ↔ Python

### Option A: Direkte Python-Aufrufe (empfohlen für PoC)

**ASP.NET nutzt Python.NET oder Prozess-Calls:**
```csharp
// In .NET Controller
public async Task<IActionResult> ParseIfc(IFormFile file)
{
    // Python-Script aufrufen
    var result = await _pythonRunner.Execute(
        "python_service/parse_ifc.py",
        new { filePath = savedPath }
    );
    
    // JSON zurück zu .NET
    var data = JsonSerializer.Deserialize<IfcMetadata>(result);
    
    // In DB speichern
    await _context.Models.AddAsync(data);
    
    return Ok(data);
}
```

### Option B: Message Queue (später, für Async)

**Flow:**
1. .NET pusht Job in Redis Queue
2. Python Worker pollt Queue
3. Python verarbeitet, schreibt Result in Redis
4. .NET liest Result

**Für jetzt: Option A (direkter Call)!**

---

## 📁 Projekt-Struktur

### Bestehend (NICHT anfassen):
```
project-root/
├─ frontend/              # React + Three.js
├─ backend/
│  └─ dotnet-api/        # ASP.NET Core (Port 5000)
│     ├─ Controllers/
│     ├─ Services/
│     └─ ... (bestehend)
├─ docs/
└─ docker-compose.yml
```

### NEU - Deine Arbeit:
```
backend/python-service/
├─ ifc_intelligence/           # Python Package
│  ├─ __init__.py
│  ├─ parser.py               # IFC Parsing
│  ├─ spatial_tree.py         # Spatial Hierarchy
│  ├─ property_extractor.py   # Properties
│  ├─ gltf_exporter.py        # glTF Export
│  ├─ cache_manager.py        # RAM Cache
│  └─ models.py               # Dataclasses
├─ scripts/                    # CLI Entry Points
│  ├─ parse_ifc.py            # .NET ruft auf
│  ├─ extract_spatial.py
│  ├─ extract_properties.py
│  └─ export_gltf.py
├─ tests/
│  ├─ test_parser.py
│  └─ fixtures/
│     └─ sample.ifc
├─ requirements.txt
├─ setup.py                    # Package installierbar
└─ README.md
```

### .NET Integration (wird erweitert):
```
backend/dotnet-api/
├─ Services/
│  └─ PythonIfcService.cs     # NEU - Ruft Python auf
├─ Controllers/
│  └─ IfcController.cs        # NEU - Öffentliche API
└─ ... (bestehend)
```

---

## 🗺️ Git-Workflow
```bash
# Basis-Branch
git checkout -b feature/python-ifc-service

# Pro Task:
git checkout feature/python-ifc-service
git checkout -b task/01-python-package-setup
# ... Arbeit ...
git commit -m "Task 01: Python Package Setup"
git checkout feature/python-ifc-service
git merge task/01-python-package-setup --no-ff
```

---

## 📋 Task-Liste

### Task 0: Bonsai Analyse

**Branch:** `task/00-bonsai-analysis`

**Ziel:** Bonsai Konzepte verstehen

**Schritte:**

1. Bonsai klonen (außerhalb Projekt):
```bash
   cd /tmp
   git clone https://github.com/IfcOpenShell/IfcOpenShell.git
   cd IfcOpenShell/src/bonsai
```

2. Module analysieren:
   - bonsai/bim/module/geometry/
   - bonsai/bim/module/spatial/
   - bonsai/bim/module/pset/
   - bonsai/tool/

3. Erstelle docs/bonsai-concepts.md:
   - Konzepte in eigenen Worten
   - Algorithmen-Ideen
   - KEIN Code kopieren!

**Akzeptanz:**
- [ ] Analyse dokumentiert
- [ ] Konzepte verstanden
- [ ] Keine Code-Kopien

**Aufwand:** 2-3 Stunden

---

### Task 1: Python Package Setup

**Branch:** `task/01-python-package-setup`

**Ziel:** Python-Package als installierbares Modul

**Schritte:**

1. Ordnerstruktur erstellen:
```bash
   mkdir -p backend/python-service/ifc_intelligence
   mkdir -p backend/python-service/scripts
   mkdir -p backend/python-service/tests/fixtures
```

2. requirements.txt:
```
   ifcopenshell==0.7.0
   pydantic==2.5.0
```

3. setup.py (macht Package installierbar):
```python
   from setuptools import setup, find_packages
   
   setup(
       name="ifc-intelligence",
       version="0.1.0",
       packages=find_packages(),
       install_requires=[
           "ifcopenshell>=0.7.0",
           "pydantic>=2.5.0",
       ],
   )
```

4. ifc_intelligence/__init__.py:
```python
   """IFC Intelligence Service - Bonsai-inspired"""
   __version__ = "0.1.0"
```

5. README.md:
   - Package-Beschreibung
   - Installation: pip install -e .
   - Nutzung durch .NET

**Akzeptanz:**
- [ ] Package-Struktur vorhanden
- [ ] Installierbar: pip install -e .
- [ ] Import funktioniert: import ifc_intelligence

**Test:**
```bash
cd backend/python-service
pip install -e .
python -c "import ifc_intelligence; print(ifc_intelligence.__version__)"
# Output: 0.1.0
```

**Aufwand:** 1-2 Stunden

---

### Task 2: IFC Parser Module

**Branch:** `task/02-ifc-parser`

**Ziel:** IFC-Parsing mit IfcOpenshell

**Schritte:**

1. Bonsai analysieren:
   - Wie lädt Bonsai IFC?
   - Settings?
   - Konzepte dokumentieren!

2. ifc_intelligence/parser.py:
```python
   from dataclasses import dataclass
   import ifcopenshell
   
   @dataclass
   class IfcMetadata:
       model_id: str
       schema: str
       entity_counts: dict
       # ... weitere Felder
   
   class IfcParser:
       def parse_file(self, file_path: str) -> IfcMetadata:
           """Parse IFC file and extract metadata"""
           # Implementierung (Bonsai-inspiriert)
           pass
```

3. CLI-Script scripts/parse_ifc.py:
```python
   #!/usr/bin/env python3
   import sys
   import json
   from ifc_intelligence.parser import IfcParser
   
   if __name__ == "__main__":
       file_path = sys.argv[1]
       parser = IfcParser()
       result = parser.parse_file(file_path)
       print(json.dumps(result.__dict__))
```

4. Test tests/test_parser.py:
   - Teste mit sample.ifc

**Akzeptanz:**
- [ ] Parser funktioniert
- [ ] CLI-Script läuft
- [ ] Gibt JSON aus
- [ ] Test erfolgreich

**Test:**
```bash
# Python direkt
python scripts/parse_ifc.py tests/fixtures/sample.ifc
# Output: {"model_id": "...", "schema": "IFC4", ...}
```

**Aufwand:** 4-5 Stunden

---

### Task 3: .NET Integration - Parser

**Branch:** `task/03-dotnet-integration-parser`

**Ziel:** .NET kann Python-Parser aufrufen

**Schritte:**

1. .NET Service erstellen: Services/PythonIfcService.cs:
```csharp
   public class PythonIfcService
   {
       public async Task<IfcMetadata> ParseIfc(string filePath)
       {
           // Python-Prozess starten
           var process = new Process
           {
               StartInfo = new ProcessStartInfo
               {
                   FileName = "python",
                   Arguments = $"scripts/parse_ifc.py {filePath}",
                   WorkingDirectory = "/path/to/python-service",
                   RedirectStandardOutput = true,
                   UseShellExecute = false
               }
           };
           
           process.Start();
           string output = await process.StandardOutput.ReadToEndAsync();
           await process.WaitForExitAsync();
           
           // JSON deserialisieren
           return JsonSerializer.Deserialize<IfcMetadata>(output);
       }
   }
```

2. .NET Controller: Controllers/IfcController.cs:
```csharp
   [ApiController]
   [Route("api/ifc")]
   public class IfcController : ControllerBase
   {
       private readonly PythonIfcService _pythonService;
       
       [HttpPost("parse")]
       public async Task<IActionResult> ParseIfc(IFormFile file)
       {
           // File speichern
           var tempPath = Path.GetTempFileName();
           using (var stream = System.IO.File.Create(tempPath))
           {
               await file.CopyToAsync(stream);
           }
           
           // Python aufrufen
           var metadata = await _pythonService.ParseIfc(tempPath);
           
           // In DB speichern
           // ...
           
           return Ok(metadata);
       }
   }
```

3. Dependency Injection in Program.cs:
```csharp
   builder.Services.AddSingleton<PythonIfcService>();
```

**Akzeptanz:**
- [ ] .NET Service vorhanden
- [ ] Controller funktioniert
- [ ] API testbar: POST http://localhost:5000/api/ifc/parse

**Test:**
```bash
# Via .NET API (öffentlich!)
curl -X POST http://localhost:5000/api/ifc/parse \
  -F "file=@path/to/test.ifc"
  
# Response:
{
  "model_id": "...",
  "schema": "IFC4",
  "entityCounts": {...}
}
```

**Aufwand:** 3-4 Stunden

---

### Task 4: Spatial Tree Extraction

**Branch:** `task/04-spatial-tree`

**Ziel:** Spatial Hierarchy extrahieren

**Schritte:**

1. Bonsai Spatial-Modul analysieren:
   - Hierarchie-Traversierung
   - IfcProject > Site > Building > Storey
   - Konzepte!

2. ifc_intelligence/spatial_tree.py:
```python
   @dataclass
   class SpatialNode:
       id: str
       type: str
       name: str
       children: list['SpatialNode']
   
   class SpatialTreeExtractor:
       def extract_tree(self, ifc_file) -> SpatialNode:
           """Extract spatial hierarchy"""
           # Rekursive Traversierung
           pass
```

3. CLI-Script scripts/extract_spatial.py:
```python
   #!/usr/bin/env python3
   import sys
   import json
   from ifc_intelligence.spatial_tree import SpatialTreeExtractor
   import ifcopenshell
   
   if __name__ == "__main__":
       file_path = sys.argv[1]
       ifc_file = ifcopenshell.open(file_path)
       extractor = SpatialTreeExtractor()
       tree = extractor.extract_tree(ifc_file)
       print(json.dumps(tree, default=lambda o: o.__dict__))
```

4. .NET Integration:
   - PythonIfcService.ExtractSpatialTree()
   - IfcController: POST /api/ifc/spatial-tree

5. Test tests/test_spatial_tree.py

**Akzeptanz:**
- [ ] Spatial Tree Extraktion
- [ ] CLI-Script funktioniert
- [ ] .NET Integration
- [ ] API: POST http://localhost:5000/api/ifc/spatial-tree

**Test:**
```bash
# Python direkt
python scripts/extract_spatial.py tests/fixtures/sample.ifc

# Via .NET API
curl -X POST http://localhost:5000/api/ifc/spatial-tree \
  -F "file=@test.ifc"
```

**Aufwand:** 5-6 Stunden

---

### Task 5: Property Extraction

**Branch:** `task/05-properties`

**Ziel:** PropertySets extrahieren

**Schritte:**

1. Bonsai Pset-Modul analysieren

2. ifc_intelligence/property_extractor.py:
```python
   @dataclass
   class PropertyValue:
       name: str
       value: any
       type: str
       property_set: str
   
   class PropertyExtractor:
       def extract_properties(
           self, 
           ifc_file, 
           element_guid: str
       ) -> list[PropertyValue]:
           """Extract all properties for element"""
           pass
```

3. CLI-Script scripts/extract_properties.py:
   - Args: file_path, element_guid

4. .NET Integration:
   - PythonIfcService.ExtractProperties()
   - IfcController: POST /api/ifc/properties

**Akzeptanz:**
- [ ] Property Extraction
- [ ] .NET Integration
- [ ] API: POST http://localhost:5000/api/ifc/properties

**Aufwand:** 4-5 Stunden

---

### Task 6: glTF Export

**Branch:** `task/06-gltf-export`

**Ziel:** IFC zu glTF konvertieren

**Schritte:**

1. Bonsai Geometry-Modul analysieren

2. ifc_intelligence/gltf_exporter.py:
```python
   class GltfExporter:
       def export_gltf(self, ifc_file, output_path: str):
           """Convert IFC to glTF/GLB"""
           # IfcOpenshell Tessellation
           # glTF-Generierung
           pass
```

3. CLI-Script scripts/export_gltf.py:
   - Args: ifc_file_path, output_path
   - Schreibt .glb File

4. .NET Integration:
   - PythonIfcService.ExportGltf()
   - IfcController: POST /api/ifc/export-gltf
   - Return: File Download

**Akzeptanz:**
- [ ] glTF Export funktioniert
- [ ] .NET kann File zurückgeben
- [ ] API: POST http://localhost:5000/api/ifc/export-gltf

**Test:**
```bash
# Python direkt
python scripts/export_gltf.py input.ifc output.glb

# Via .NET API
curl -X POST http://localhost:5000/api/ifc/export-gltf \
  -F "file=@test.ifc" \
  --output model.glb
```

**Aufwand:** 6-8 Stunden

---

### Task 7: RAM Cache Manager

**Branch:** `task/07-cache-manager`

**Ziel:** LRU-Cache für geladene IFC-Files

**Schritte:**

1. ifc_intelligence/cache_manager.py:
```python
   from functools import lru_cache
   import time
   
   class IfcCacheManager:
       def __init__(self, max_size=10, ttl_hours=24):
           self._cache = {}
           self._access_times = {}
       
       def get_or_load(self, file_path: str):
           """Get from cache or load IFC file"""
           # LRU-Logik
           pass
```

2. Integration in alle Extractor-Klassen:
   - Statt ifcopenshell.open() direkt
   - Nutze cache_manager.get_or_load()

3. CLI-Scripts updaten:
   - Nutzen Cache-Manager

**Akzeptanz:**
- [ ] Cache funktioniert
- [ ] Wiederholte Calls schneller
- [ ] LRU-Eviction bei max_size

**Test:**
```bash
# Zweimal aufrufen, zweiter sollte schneller sein
time python scripts/parse_ifc.py test.ifc
time python scripts/parse_ifc.py test.ifc
```

**Aufwand:** 3-4 Stunden

---

## 📊 Gesamt-Übersicht

| Task | Aufwand | Status |
|------|---------|--------|
| 0. Bonsai Analyse | 2-3h | ⬜ |
| 1. Package Setup | 1-2h | ⬜ |
| 2. IFC Parser | 4-5h | ⬜ |
| 3. .NET Integration Parser | 3-4h | ⬜ |
| 4. Spatial Tree | 5-6h | ⬜ |
| 5. Properties | 4-5h | ⬜ |
| 6. glTF Export | 6-8h | ⬜ |
| 7. Cache Manager | 3-4h | ⬜ |
| **GESAMT** | **28-37h** | |

**Mit Claude Code:** ~20-25 Stunden (30% schneller)

---

## 🧪 Testing-Strategie

### Ebene 1: Python Unit Tests
```bash
cd backend/python-service
pytest tests/
```

### Ebene 2: CLI-Scripts (Python direkt)
```bash
python scripts/parse_ifc.py test.ifc
python scripts/extract_spatial.py test.ifc
```

### Ebene 3: .NET API (öffentlich!)
```bash
# Das ist was Frontend nutzt!
curl -X POST http://localhost:5000/api/ifc/parse -F "file=@test.ifc"
curl -X POST http://localhost:5000/api/ifc/spatial-tree -F "file=@test.ifc"
curl -X POST http://localhost:5000/api/ifc/properties -F "file=@test.ifc"
```

---

## 🔧 Entwicklungs-Setup

### Python-Service Setup:
```bash
cd backend/python-service
pip install -e .
pip install -r requirements.txt
pytest tests/
```

### .NET API Setup:
```bash
cd backend/dotnet-api
dotnet restore
dotnet run  # Läuft auf Port 5000
```

### Integration testen:
```bash
# .NET läuft auf 5000
# Python-Scripts werden von .NET aufgerufen
# Teste via: http://localhost:5000/api/ifc/*
```

---

## ⚠️ Kritische Regeln

1. **Python = Library/Worker**
   - KEIN HTTP-Server!
   - Nur CLI-Scripts für .NET

2. **ASP.NET = Einzige API**
   - Port 5000
   - Alle REST-Endpoints
   - Orchestriert Python-Aufrufe

3. **Bonsai-Compliance**
   - Konzepte lernen ✅
   - Code kopieren ❌
   - Eigene Implementierung ✅

4. **Additiv arbeiten**
   - Bestehendes nicht ändern!
   - Neue Branches pro Task
   - Merge nur nach Test

---

## 📝 Nächste Schritte

1. **Starte mit Task 0:** Bonsai analysieren
2. **Dann Task 1:** Python Package Setup
3. **Task für Task** durcharbeiten
4. **Testen:** Immer über .NET API (Port 5000)!

---

**Ende des Dokuments - Viel Erfolg mit der Implementierung! 🚀**
