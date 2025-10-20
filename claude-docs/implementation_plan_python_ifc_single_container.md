# Implementierungsplan: Python IFC Intelligence Service (Single Container)

## Übersicht

Dieser Plan beschreibt die schrittweise Integration eines **Python-basierten IFC Intelligence Service** in das bestehende Single-Container DevContainer-Setup als einzeln testbare Tasks.

**Kernprinzipien:**
- ✅ Additive Entwicklung (nichts kaputt machen)
- ✅ Jeder Task ist isoliert testbar
- ✅ Git-Branch pro Task
- ✅ Python + IfcOpenShell bereits im Container installiert
- ✅ .NET ruft Python-Scripts via ProcessRunner auf
- ✅ Keine neuen Container (nutzt bestehende Infrastruktur)
- ✅ Bonsai-inspiriert (KEINE Code-Kopien!)

---

## Aktuelle Architektur

```
┌─────────────────────────────────────────────────────┐
│  devcontainer (Dockerfile.ifcserver)                │
│  - .NET 9 SDK                                       │
│  - Node.js 20                                       │
│  - Python 3 + IfcOpenShell ✅ (BEREITS INSTALLIERT) │
│  - IfcConvert binary ✅ (BEREITS INSTALLIERT)       │
│  - ProcessRunner.cs ✅ (BEREITS IMPLEMENTIERT)      │
│                                                     │
│  Port 5000: ASP.NET API                            │
│  Port 5173: Vite Dev Server                        │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  db (PostgreSQL 16)                                 │
│  - Port 5432                                        │
│  - Database: ifcdb                                  │
└─────────────────────────────────────────────────────┘
```

### Kommunikations-Flow:
```
Three.js Frontend
        ↓
    REST API (Port 5000)
        ↓
ASP.NET Controllers
        ↓
    PythonIfcService.cs
        ↓
    ProcessRunner.RunProcessAsync("python3", "scripts/parse_ifc.py input.ifc")
        ↓
Python Script (stdout: JSON)
        ↓
    .NET parses JSON
        ↓
PostgreSQL Storage
        ↓
    Response to Frontend
```

---

## Git-Workflow

### Branch-Strategie

```
main
  ↓
  feature/python-ifc-intelligence (Haupt-Feature-Branch)
    ├── task/00-bonsai-analysis
    ├── task/01-python-setup
    ├── task/02-ifc-parser
    ├── task/03-dotnet-parser-integration
    ├── task/04-gltf-export
    ├── task/05-dotnet-gltf-integration
    ├── task/06-property-extraction
    ├── task/07-dotnet-properties-integration
    ├── task/08-spatial-tree
    ├── task/09-dotnet-spatial-integration
    ├── task/10-cache-manager
    └── task/11-frontend-integration
```

### Workflow pro Task

```bash
# 1. Feature-Branch erstellen (einmalig)
git checkout main
git checkout -b feature/python-ifc-intelligence

# 2. Task-Branch erstellen
git checkout feature/python-ifc-intelligence
git checkout -b task/00-bonsai-analysis

# 3. Entwicklung & Testing
# ... Code-Änderungen ...

# 4. Commit mit strukturierter Nachricht
git add .
git commit -m "Task 00: Bonsai Konzeptanalyse dokumentiert

- Analysiert Bonsai spatial, geometry, pset Module
- Dokumentiert Konzepte in docs/bonsai-concepts.md
- Keine Code-Kopien, nur Architekturverständnis
- Identifiziert Implementierungsstrategien für IfcOpenShell

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. Merge in Feature-Branch
git checkout feature/python-ifc-intelligence
git merge task/00-bonsai-analysis --no-ff

# 6. Nächster Task
git checkout -b task/01-python-setup
```

---

## Task-Liste

### Task 0: Bonsai Konzeptanalyse

**Branch:** `task/00-bonsai-analysis`

**Ziel:** Bonsai/BlenderBIM Konzepte verstehen (KEINE Code-Kopien!)

**Wichtig:** Bonsai ist AGPL-3.0 lizenziert. Wir analysieren Konzepte, implementieren aber eigenständig mit IfcOpenShell API.

**Anweisungen:**

1. **Clone Bonsai außerhalb des Projekts:**
   ```bash
   cd /tmp
   git clone https://github.com/IfcOpenShell/IfcOpenShell.git
   cd IfcOpenShell/src/bonsai
   ```

2. **Analysiere folgende Module (nur lesen, verstehen, dokumentieren):**
   - `bonsai/bim/module/geometry/` - Wie wird Geometrie tesseliert?
   - `bonsai/bim/module/spatial/` - Wie wird Hierarchie traversiert?
   - `bonsai/bim/module/pset/` - Wie werden PropertySets extrahiert?
   - `bonsai/tool/` - Welche Utility-Funktionen gibt es?

3. **Erstelle `docs/bonsai-concepts.md` mit:**
   - Konzepte in **eigenen Worten**
   - Pseudocode-Algorithmen (NICHT Bonsai-Code!)
   - IfcOpenShell API-Strategien
   - Architektur-Diagramme
   - **KEINE direkten Code-Kopien oder 1:1 Übersetzungen!**

4. **Dokumentiere für jedes Modul:**
   - Was macht es? (High-Level)
   - Welche IFC-Konzepte werden genutzt?
   - Wie kann man das mit IfcOpenShell API umsetzen?
   - Welche Performance-Tricks werden angewendet?

**Akzeptanzkriterien:**
- [ ] `docs/bonsai-concepts.md` existiert
- [ ] Konzepte dokumentiert (Spatial, Geometry, PropertySets)
- [ ] Pseudocode-Algorithmen vorhanden
- [ ] IfcOpenShell API-Strategien identifiziert
- [ ] **KEINE Code-Kopien** (wird geprüft!)
- [ ] Bonsai-Repository außerhalb des Projekts (in /tmp)

**Testbar durch:**
```bash
# Dokumentation prüfen
cat docs/bonsai-concepts.md

# Sicherstellen, dass Bonsai NICHT im Projekt ist
ls -la src/ | grep -i bonsai  # Sollte leer sein
ls -la /tmp/IfcOpenShell      # Sollte existieren

# Git-Status prüfen (nur neue Markdown-Datei)
git status
```

**Zeitschätzung:** 3-4 Stunden

---

### Task 1: Python Package Setup

**Branch:** `task/01-python-setup`

**Ziel:** Python-Package-Struktur erstellen und verifizieren

**Anweisungen:**

1. **Erstelle Ordnerstruktur:**
   ```bash
   mkdir -p src/python-service/ifc_intelligence
   mkdir -p src/python-service/scripts
   mkdir -p src/python-service/tests/fixtures
   ```

2. **Erstelle `src/python-service/requirements.txt`:**
   ```txt
   ifcopenshell>=0.7.0
   pydantic>=2.5.0
   ```

3. **Erstelle `src/python-service/setup.py`:**
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
       python_requires=">=3.10",
       description="IFC Intelligence Service - Bonsai-inspired, clean-room implementation",
       author="Your Team",
   )
   ```

4. **Erstelle `src/python-service/ifc_intelligence/__init__.py`:**
   ```python
   """
   IFC Intelligence Service

   Bonsai-inspired clean-room implementation using IfcOpenShell.
   Provides IFC parsing, spatial tree extraction, property extraction, and glTF export.

   License: MIT (compatible with IfcOpenShell LGPL)
   """
   __version__ = "0.1.0"
   ```

5. **Erstelle `src/python-service/README.md`:**
   - Package-Beschreibung
   - Installation: `pip install -e .`
   - Nutzung durch .NET
   - CLI-Script Beispiele
   - Lizenz-Hinweise

6. **Installation testen:**
   ```bash
   cd src/python-service
   pip install -e .
   ```

**Akzeptanzkriterien:**
- [ ] Package-Struktur vorhanden
- [ ] `setup.py` konfiguriert
- [ ] `requirements.txt` vorhanden
- [ ] Installation erfolgreich: `pip install -e .`
- [ ] Import funktioniert: `import ifc_intelligence`
- [ ] README dokumentiert Nutzung

**Testbar durch:**
```bash
# Installation
cd src/python-service
pip install -e .

# Import-Test
python3 -c "import ifc_intelligence; print(ifc_intelligence.__version__)"
# Erwartete Ausgabe: 0.1.0

# Package-Struktur prüfen
pip list | grep ifc-intelligence
# Sollte: ifc-intelligence 0.1.0

# IfcOpenShell verfügbar?
python3 -c "import ifcopenshell; print(ifcopenshell.version)"
# Sollte Version ausgeben (z.B. 0.7.0)
```

**Zeitschätzung:** 1-2 Stunden

---

### Task 2: IFC Parser Module

**Branch:** `task/02-ifc-parser`

**Ziel:** IFC-Dateien parsen und Metadaten extrahieren

**Anweisungen:**

1. **Erstelle `src/python-service/ifc_intelligence/models.py`:**
   ```python
   from dataclasses import dataclass
   from typing import Dict, Optional

   @dataclass
   class IfcMetadata:
       """Metadata extracted from IFC file"""
       model_id: str              # IfcProject GlobalId
       project_name: str          # IfcProject.Name
       schema: str                # IFC2X3, IFC4, etc.
       entity_counts: Dict[str, int]  # {"IfcWall": 150, "IfcDoor": 45, ...}
       author: Optional[str] = None
       organization: Optional[str] = None
       application: Optional[str] = None
   ```

2. **Erstelle `src/python-service/ifc_intelligence/parser.py`:**
   ```python
   import ifcopenshell
   from .models import IfcMetadata
   from typing import Dict

   class IfcParser:
       """
       IFC file parser using IfcOpenShell.

       Inspired by Bonsai concepts but clean-room implementation.
       """

       def parse_file(self, file_path: str) -> IfcMetadata:
           """
           Parse IFC file and extract metadata.

           Args:
               file_path: Path to .ifc file

           Returns:
               IfcMetadata with project info and entity counts
           """
           ifc_file = ifcopenshell.open(file_path)

           # Extract project info
           project = ifc_file.by_type("IfcProject")[0]

           # Count entities
           entity_counts = self._count_entities(ifc_file)

           # Extract authoring info
           author, org, app = self._extract_authoring_info(ifc_file)

           return IfcMetadata(
               model_id=project.GlobalId,
               project_name=project.Name or "Unnamed Project",
               schema=ifc_file.schema,
               entity_counts=entity_counts,
               author=author,
               organization=org,
               application=app
           )

       def _count_entities(self, ifc_file) -> Dict[str, int]:
           """Count common IFC entity types"""
           types_to_count = [
               "IfcWall", "IfcDoor", "IfcWindow", "IfcSlab", "IfcBeam",
               "IfcColumn", "IfcStair", "IfcRoof", "IfcSpace", "IfcBuildingStorey"
           ]

           counts = {}
           for entity_type in types_to_count:
               entities = ifc_file.by_type(entity_type)
               if entities:
                   counts[entity_type] = len(entities)

           return counts

       def _extract_authoring_info(self, ifc_file):
           """Extract author, organization, application from IfcOwnerHistory"""
           try:
               owner_history = ifc_file.by_type("IfcOwnerHistory")[0]
               person = owner_history.OwningUser.ThePerson if owner_history.OwningUser else None
               org = owner_history.OwningUser.TheOrganization if owner_history.OwningUser else None
               app = owner_history.OwningApplication.ApplicationFullName if owner_history.OwningApplication else None

               author_name = f"{person.GivenName} {person.FamilyName}" if person and person.GivenName else None
               org_name = org.Name if org else None

               return author_name, org_name, app
           except (IndexError, AttributeError):
               return None, None, None
   ```

3. **Erstelle `src/python-service/scripts/parse_ifc.py`:**
   ```python
   #!/usr/bin/env python3
   """
   CLI script to parse IFC file and output metadata as JSON.

   Usage:
       python scripts/parse_ifc.py <input.ifc>

   Output:
       JSON to stdout
   """
   import sys
   import json
   from dataclasses import asdict
   from ifc_intelligence.parser import IfcParser

   def main():
       if len(sys.argv) < 2:
           print(json.dumps({"error": "Usage: parse_ifc.py <input.ifc>"}))
           sys.exit(1)

       file_path = sys.argv[1]

       try:
           parser = IfcParser()
           metadata = parser.parse_file(file_path)

           # Convert dataclass to dict and output as JSON
           result = asdict(metadata)
           print(json.dumps(result, indent=2))
           sys.exit(0)

       except Exception as e:
           print(json.dumps({"error": str(e)}))
           sys.exit(1)

   if __name__ == "__main__":
       main()
   ```

4. **Erstelle `src/python-service/tests/test_parser.py`:**
   ```python
   import pytest
   from ifc_intelligence.parser import IfcParser
   # Tests hier (wenn echte IFC-Datei vorhanden)
   ```

5. **Testdaten:**
   - Lade eine kleine IFC-Datei herunter (z.B. von buildingSMART)
   - Speichere in `src/python-service/tests/fixtures/sample.ifc`

**Akzeptanzkriterien:**
- [ ] `IfcParser` Klasse implementiert
- [ ] `parse_file()` Methode funktioniert
- [ ] Entity-Counts werden korrekt gezählt
- [ ] CLI-Script `parse_ifc.py` funktioniert
- [ ] Gibt valides JSON aus
- [ ] Fehlerbehandlung vorhanden

**Testbar durch:**
```bash
# Python direkt (Standalone-Test)
cd src/python-service
python3 scripts/parse_ifc.py tests/fixtures/sample.ifc

# Erwartete Ausgabe:
# {
#   "model_id": "3vB2YO$MX4xv5uCqZZG0Xq",
#   "project_name": "Sample Project",
#   "schema": "IFC4",
#   "entity_counts": {
#     "IfcWall": 20,
#     "IfcDoor": 8,
#     "IfcWindow": 12
#   },
#   "author": "John Doe",
#   "organization": "Example Corp",
#   "application": "Revit 2024"
# }

# Error-Handling testen
python3 scripts/parse_ifc.py non_existent.ifc
# Sollte: {"error": "..."}
```

**Zeitschätzung:** 4-5 Stunden

---

### Task 3: .NET Integration - Parser

**Branch:** `task/03-dotnet-parser-integration`

**Ziel:** .NET kann Python-Parser aufrufen und Ergebnisse verarbeiten

**Anweisungen:**

1. **Erstelle `src/ifcserver/Services/PythonIfcService.cs`:**
   ```csharp
   using System.Diagnostics;
   using System.Text.Json;
   using ifcserver.Models;

   namespace ifcserver.Services
   {
       public class PythonIfcService
       {
           private readonly ILogger<PythonIfcService> _logger;
           private readonly string _pythonScriptsPath;

           public PythonIfcService(ILogger<PythonIfcService> logger, IConfiguration configuration)
           {
               _logger = logger;

               // Path to python-service scripts
               _pythonScriptsPath = Path.GetFullPath(
                   Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "python-service", "scripts")
               );

               _logger.LogInformation($"Python scripts path: {_pythonScriptsPath}");
           }

           public async Task<IfcMetadata> ParseIfcAsync(string ifcFilePath)
           {
               var scriptPath = Path.Combine(_pythonScriptsPath, "parse_ifc.py");

               if (!File.Exists(scriptPath))
               {
                   throw new FileNotFoundException($"Python script not found: {scriptPath}");
               }

               _logger.LogInformation($"Calling Python script: {scriptPath} {ifcFilePath}");

               var startInfo = new ProcessStartInfo
               {
                   FileName = "python3",
                   Arguments = $"\"{scriptPath}\" \"{ifcFilePath}\"",
                   RedirectStandardOutput = true,
                   RedirectStandardError = true,
                   UseShellExecute = false,
                   CreateNoWindow = true
               };

               using var process = new Process { StartInfo = startInfo };
               process.Start();

               string output = await process.StandardOutput.ReadToEndAsync();
               string error = await process.StandardError.ReadToEndAsync();

               await process.WaitForExitAsync();

               if (process.ExitCode != 0)
               {
                   _logger.LogError($"Python script failed: {error}");
                   throw new Exception($"Python script failed: {error}");
               }

               _logger.LogInformation($"Python output: {output}");

               // Deserialize JSON output
               var metadata = JsonSerializer.Deserialize<IfcMetadata>(output, new JsonSerializerOptions
               {
                   PropertyNameCaseInsensitive = true
               });

               if (metadata == null)
               {
                   throw new Exception("Failed to deserialize Python output");
               }

               return metadata;
           }
       }
   }
   ```

2. **Erstelle `src/ifcserver/Models/IfcMetadata.cs`:**
   ```csharp
   namespace ifcserver.Models
   {
       public class IfcMetadata
       {
           public string ModelId { get; set; } = string.Empty;
           public string ProjectName { get; set; } = string.Empty;
           public string Schema { get; set; } = string.Empty;
           public Dictionary<string, int> EntityCounts { get; set; } = new();
           public string? Author { get; set; }
           public string? Organization { get; set; }
           public string? Application { get; set; }
       }
   }
   ```

3. **Erstelle `src/ifcserver/Controllers/IfcIntelligenceController.cs`:**
   ```csharp
   using Microsoft.AspNetCore.Mvc;
   using ifcserver.Services;
   using ifcserver.Models;

   namespace ifcserver.Controllers
   {
       [ApiController]
       [Route("api/ifc-intelligence")]
       public class IfcIntelligenceController : ControllerBase
       {
           private readonly PythonIfcService _pythonService;
           private readonly ILogger<IfcIntelligenceController> _logger;

           public IfcIntelligenceController(
               PythonIfcService pythonService,
               ILogger<IfcIntelligenceController> logger)
           {
               _pythonService = pythonService;
               _logger = logger;
           }

           /// <summary>
           /// Parse IFC file and extract metadata
           /// </summary>
           [HttpPost("parse")]
           public async Task<IActionResult> ParseIfc(IFormFile file)
           {
               if (file == null || file.Length == 0)
               {
                   return BadRequest(new { error = "No file uploaded" });
               }

               // Save uploaded file to temp location
               var tempPath = Path.Combine(Path.GetTempPath(), file.FileName);

               try
               {
                   using (var stream = System.IO.File.Create(tempPath))
                   {
                       await file.CopyToAsync(stream);
                   }

                   _logger.LogInformation($"File saved to: {tempPath}");

                   // Call Python parser
                   var metadata = await _pythonService.ParseIfcAsync(tempPath);

                   // TODO: Optionally save metadata to database

                   return Ok(metadata);
               }
               catch (Exception ex)
               {
                   _logger.LogError(ex, "Error parsing IFC file");
                   return StatusCode(500, new { error = ex.Message });
               }
               finally
               {
                   // Cleanup temp file
                   if (System.IO.File.Exists(tempPath))
                   {
                       System.IO.File.Delete(tempPath);
                   }
               }
           }
       }
   }
   ```

4. **Registriere Service in `src/ifcserver/Program.cs`:**
   ```csharp
   // Nach Zeile 18 (nach AddScoped<IIfcService, IfcService>())
   builder.Services.AddScoped<PythonIfcService>();
   ```

**Akzeptanzkriterien:**
- [ ] `PythonIfcService` implementiert
- [ ] `IfcIntelligenceController` implementiert
- [ ] Service in DI registriert
- [ ] API-Endpoint funktioniert: `POST /api/ifc-intelligence/parse`
- [ ] File-Upload funktioniert
- [ ] Python wird aufgerufen und JSON zurückgegeben

**Testbar durch:**
```bash
# 1. Backend starten
cd src/ifcserver
dotnet run

# 2. In anderem Terminal: API testen
curl -X POST http://localhost:5000/api/ifc-intelligence/parse \
  -F "file=@/path/to/sample.ifc"

# Erwartete Response:
# {
#   "modelId": "3vB2YO$MX4xv5uCqZZG0Xq",
#   "projectName": "Sample Project",
#   "schema": "IFC4",
#   "entityCounts": {
#     "IfcWall": 20,
#     "IfcDoor": 8
#   },
#   "author": "John Doe",
#   "organization": "Example Corp",
#   "application": "Revit 2024"
# }

# 3. Swagger UI testen (Development Mode)
# http://localhost:5000/swagger
# -> Teste POST /api/ifc-intelligence/parse mit File-Upload

# 4. Logs prüfen
# Sollte zeigen:
# - "Calling Python script: ..."
# - "Python output: ..."
```

**Zeitschätzung:** 3-4 Stunden

---

### Task 4: glTF Export Module

**Branch:** `task/04-gltf-export`

**Ziel:** IFC zu glTF/GLB konvertieren mit Metadaten-Attachment

**Anweisungen:**

1. **Erstelle `src/python-service/ifc_intelligence/gltf_exporter.py`:**
   ```python
   import subprocess
   import os
   import json
   from typing import Optional

   class GltfExporter:
       """
       IFC to glTF/GLB exporter using IfcConvert binary.

       Uses pre-installed IfcConvert for geometry conversion.
       Post-processes glTF to attach BIM metadata to nodes.
       """

       def __init__(self, ifcconvert_path: str = "/usr/local/bin/IfcConvert"):
           self.ifcconvert_path = ifcconvert_path

           if not os.path.exists(ifcconvert_path):
               raise FileNotFoundError(f"IfcConvert not found at {ifcconvert_path}")

       def export_gltf(
           self,
           ifc_file_path: str,
           output_path: str,
           binary: bool = True
       ) -> dict:
           """
           Convert IFC to glTF/GLB.

           Args:
               ifc_file_path: Path to input .ifc file
               output_path: Path to output .gltf or .glb file
               binary: If True, export as GLB (binary), else glTF (JSON)

           Returns:
               dict with conversion info (success, output_path, file_size)
           """

           # Determine output format
           ext = ".glb" if binary else ".gltf"
           if not output_path.endswith(ext):
               output_path = output_path.replace(".ifc", ext)

           # Build IfcConvert command
           # IfcConvert <input.ifc> <output.glb>
           cmd = [
               self.ifcconvert_path,
               ifc_file_path,
               output_path
           ]

           try:
               result = subprocess.run(
                   cmd,
                   capture_output=True,
                   text=True,
                   check=True,
                   timeout=300  # 5 minutes timeout
               )

               if not os.path.exists(output_path):
                   raise Exception("IfcConvert did not produce output file")

               file_size = os.path.getsize(output_path)

               return {
                   "success": True,
                   "output_path": output_path,
                   "file_size_bytes": file_size,
                   "file_size_mb": round(file_size / 1024 / 1024, 2),
                   "format": "GLB" if binary else "glTF",
                   "stdout": result.stdout,
                   "stderr": result.stderr
               }

           except subprocess.CalledProcessError as e:
               return {
                   "success": False,
                   "error": f"IfcConvert failed: {e.stderr}",
                   "exit_code": e.returncode
               }
           except subprocess.TimeoutExpired:
               return {
                   "success": False,
                   "error": "Conversion timeout (> 5 minutes)"
               }
           except Exception as e:
               return {
                   "success": False,
                   "error": str(e)
               }
   ```

2. **Erstelle `src/python-service/scripts/export_gltf.py`:**
   ```python
   #!/usr/bin/env python3
   """
   CLI script to convert IFC to glTF/GLB.

   Usage:
       python scripts/export_gltf.py <input.ifc> <output.glb> [--format gltf|glb]

   Output:
       JSON to stdout with conversion info
   """
   import sys
   import json
   import argparse
   from ifc_intelligence.gltf_exporter import GltfExporter

   def main():
       parser = argparse.ArgumentParser(description="Convert IFC to glTF/GLB")
       parser.add_argument("input", help="Input IFC file path")
       parser.add_argument("output", help="Output glTF/GLB file path")
       parser.add_argument(
           "--format",
           choices=["gltf", "glb"],
           default="glb",
           help="Output format (default: glb)"
       )

       args = parser.parse_args()

       try:
           exporter = GltfExporter()
           result = exporter.export_gltf(
               args.input,
               args.output,
               binary=(args.format == "glb")
           )

           print(json.dumps(result, indent=2))

           # Exit with appropriate code
           sys.exit(0 if result.get("success") else 1)

       except Exception as e:
           print(json.dumps({"success": False, "error": str(e)}))
           sys.exit(1)

   if __name__ == "__main__":
       main()
   ```

**Akzeptanzkriterien:**
- [ ] `GltfExporter` Klasse implementiert
- [ ] Nutzt IfcConvert binary
- [ ] CLI-Script `export_gltf.py` funktioniert
- [ ] GLB/glTF Output wird erzeugt
- [ ] Fehlerbehandlung und Timeout vorhanden
- [ ] JSON-Output mit Conversion-Info

**Testbar durch:**
```bash
# Standalone Python-Test
cd src/python-service
python3 scripts/export_gltf.py tests/fixtures/sample.ifc output.glb

# Erwartete Ausgabe:
# {
#   "success": true,
#   "output_path": "output.glb",
#   "file_size_bytes": 245678,
#   "file_size_mb": 0.23,
#   "format": "GLB",
#   "stdout": "...",
#   "stderr": ""
# }

# Verifiziere Output
ls -lh output.glb
# Sollte GLB-Datei zeigen

# Optional: glTF validieren
npx gltf-validator output.glb
```

**Zeitschätzung:** 4-5 Stunden

---

### Task 5: .NET Integration - glTF Export

**Branch:** `task/05-dotnet-gltf-integration`

**Ziel:** .NET-Endpoint für IFC → glTF Konvertierung

**Anweisungen:**

1. **Erweitere `src/ifcserver/Services/PythonIfcService.cs`:**
   ```csharp
   public async Task<GltfExportResult> ExportGltfAsync(
       string ifcFilePath,
       string outputPath,
       bool binary = true)
   {
       var scriptPath = Path.Combine(_pythonScriptsPath, "export_gltf.py");

       if (!File.Exists(scriptPath))
       {
           throw new FileNotFoundException($"Python script not found: {scriptPath}");
       }

       string format = binary ? "glb" : "gltf";
       string args = $"\"{scriptPath}\" \"{ifcFilePath}\" \"{outputPath}\" --format {format}";

       _logger.LogInformation($"Calling Python: python3 {args}");

       var startInfo = new ProcessStartInfo
       {
           FileName = "python3",
           Arguments = args,
           RedirectStandardOutput = true,
           RedirectStandardError = true,
           UseShellExecute = false,
           CreateNoWindow = true
       };

       using var process = new Process { StartInfo = startInfo };
       process.Start();

       string output = await process.StandardOutput.ReadToEndAsync();
       string error = await process.StandardError.ReadToEndAsync();

       await process.WaitForExitAsync();

       _logger.LogInformation($"Python output: {output}");

       // Deserialize result
       var result = JsonSerializer.Deserialize<GltfExportResult>(output, new JsonSerializerOptions
       {
           PropertyNameCaseInsensitive = true
       });

       if (result == null || !result.Success)
       {
           throw new Exception($"glTF export failed: {result?.Error ?? error}");
       }

       return result;
   }
   ```

2. **Erstelle `src/ifcserver/Models/GltfExportResult.cs`:**
   ```csharp
   namespace ifcserver.Models
   {
       public class GltfExportResult
       {
           public bool Success { get; set; }
           public string OutputPath { get; set; } = string.Empty;
           public long FileSizeBytes { get; set; }
           public double FileSizeMb { get; set; }
           public string Format { get; set; } = string.Empty;
           public string? Error { get; set; }
           public string? Stdout { get; set; }
           public string? Stderr { get; set; }
       }
   }
   ```

3. **Erweitere `src/ifcserver/Controllers/IfcIntelligenceController.cs`:**
   ```csharp
   /// <summary>
   /// Convert IFC to glTF/GLB
   /// </summary>
   [HttpPost("export-gltf")]
   public async Task<IActionResult> ExportGltf(IFormFile file, [FromQuery] bool binary = true)
   {
       if (file == null || file.Length == 0)
       {
           return BadRequest(new { error = "No file uploaded" });
       }

       var tempInputPath = Path.Combine(Path.GetTempPath(), file.FileName);
       var outputExt = binary ? ".glb" : ".gltf";
       var tempOutputPath = Path.Combine(Path.GetTempPath(), Path.GetFileNameWithoutExtension(file.FileName) + outputExt);

       try
       {
           // Save uploaded IFC
           using (var stream = System.IO.File.Create(tempInputPath))
           {
               await file.CopyToAsync(stream);
           }

           _logger.LogInformation($"IFC file saved to: {tempInputPath}");

           // Convert to glTF
           var result = await _pythonService.ExportGltfAsync(tempInputPath, tempOutputPath, binary);

           // Return file download
           var fileBytes = await System.IO.File.ReadAllBytesAsync(result.OutputPath);
           var contentType = binary ? "model/gltf-binary" : "model/gltf+json";
           var fileName = Path.GetFileName(result.OutputPath);

           return File(fileBytes, contentType, fileName);
       }
       catch (Exception ex)
       {
           _logger.LogError(ex, "Error exporting glTF");
           return StatusCode(500, new { error = ex.Message });
       }
       finally
       {
           // Cleanup temp files
           if (System.IO.File.Exists(tempInputPath))
               System.IO.File.Delete(tempInputPath);
           if (System.IO.File.Exists(tempOutputPath))
               System.IO.File.Delete(tempOutputPath);
       }
   }
   ```

**Akzeptanzkriterien:**
- [ ] `ExportGltfAsync()` in PythonIfcService implementiert
- [ ] API-Endpoint `POST /api/ifc-intelligence/export-gltf` funktioniert
- [ ] File-Download funktioniert
- [ ] GLB/glTF wird korrekt generiert
- [ ] Cleanup von temp-Files funktioniert

**Testbar durch:**
```bash
# 1. Backend starten
cd src/ifcserver
dotnet run

# 2. API testen
curl -X POST "http://localhost:5000/api/ifc-intelligence/export-gltf?binary=true" \
  -F "file=@/path/to/sample.ifc" \
  --output model.glb

# Verifiziere Download
ls -lh model.glb
file model.glb  # Sollte "glTF binary" zeigen

# 3. In Three.js Viewer laden
# -> URL Input: http://localhost:5000/... (wenn glTF gespeichert wird)

# 4. Swagger UI testen
# http://localhost:5000/swagger
# -> POST /api/ifc-intelligence/export-gltf
# -> Upload IFC, download GLB
```

**Zeitschätzung:** 3-4 Stunden

---

### Task 6: Property Extraction Module

**Branch:** `task/06-property-extraction`

**Ziel:** PropertySets für spezifische IFC-Elemente extrahieren

**Anweisungen:**

1. **Erstelle `src/python-service/ifc_intelligence/property_extractor.py`:**
   ```python
   import ifcopenshell
   import ifcopenshell.util.element
   from dataclasses import dataclass
   from typing import List, Any, Optional

   @dataclass
   class PropertyValue:
       """Single property value from a PropertySet"""
       name: str
       value: Any
       value_type: str  # "IfcLabel", "IfcBoolean", "IfcReal", etc.
       property_set: str  # e.g., "Pset_WallCommon"

   class PropertyExtractor:
       """
       Extract PropertySets from IFC elements.

       Inspired by Bonsai pset module but clean-room implementation.
       """

       def extract_properties(
           self,
           ifc_file_path: str,
           element_guid: str
       ) -> List[PropertyValue]:
           """
           Extract all properties for a specific element.

           Args:
               ifc_file_path: Path to IFC file
               element_guid: GlobalId of element

           Returns:
               List of PropertyValue objects
           """
           ifc_file = ifcopenshell.open(ifc_file_path)

           # Find element by GlobalId
           element = ifc_file.by_guid(element_guid)
           if not element:
               raise ValueError(f"Element with GUID {element_guid} not found")

           properties = []

           # Get property sets using ifcopenshell.util.element
           psets = ifcopenshell.util.element.get_psets(element)

           for pset_name, pset_props in psets.items():
               for prop_name, prop_value in pset_props.items():
                   if prop_name == "id":  # Skip internal ID
                       continue

                   properties.append(PropertyValue(
                       name=prop_name,
                       value=prop_value,
                       value_type=type(prop_value).__name__,
                       property_set=pset_name
                   ))

           return properties

       def extract_properties_dict(
           self,
           ifc_file_path: str,
           element_guid: str
       ) -> dict:
           """
           Extract properties as nested dictionary.

           Returns:
               {
                   "Pset_WallCommon": {
                       "FireRating": "F90",
                       "LoadBearing": true,
                       ...
                   },
                   ...
               }
           """
           properties = self.extract_properties(ifc_file_path, element_guid)

           result = {}
           for prop in properties:
               if prop.property_set not in result:
                   result[prop.property_set] = {}
               result[prop.property_set][prop.name] = prop.value

           return result
   ```

2. **Erstelle `src/python-service/scripts/extract_properties.py`:**
   ```python
   #!/usr/bin/env python3
   """
   CLI script to extract properties for a specific IFC element.

   Usage:
       python scripts/extract_properties.py <input.ifc> <element_guid>

   Output:
       JSON to stdout with properties grouped by PropertySet
   """
   import sys
   import json
   from ifc_intelligence.property_extractor import PropertyExtractor

   def main():
       if len(sys.argv) < 3:
           print(json.dumps({"error": "Usage: extract_properties.py <input.ifc> <element_guid>"}))
           sys.exit(1)

       file_path = sys.argv[1]
       element_guid = sys.argv[2]

       try:
           extractor = PropertyExtractor()
           properties = extractor.extract_properties_dict(file_path, element_guid)

           print(json.dumps(properties, indent=2, default=str))
           sys.exit(0)

       except Exception as e:
           print(json.dumps({"error": str(e)}))
           sys.exit(1)

   if __name__ == "__main__":
       main()
   ```

**Akzeptanzkriterien:**
- [ ] `PropertyExtractor` implementiert
- [ ] Nutzt `ifcopenshell.util.element.get_psets()`
- [ ] CLI-Script funktioniert
- [ ] Properties werden nach PropertySet gruppiert
- [ ] Fehlerbehandlung für ungültige GUIDs

**Testbar durch:**
```bash
# Standalone Test
cd src/python-service

# 1. Finde Element GUID in IFC-Datei
python3 -c "
import ifcopenshell
ifc = ifcopenshell.open('tests/fixtures/sample.ifc')
wall = ifc.by_type('IfcWall')[0]
print(f'Wall GUID: {wall.GlobalId}')
print(f'Wall Name: {wall.Name}')
"

# 2. Extrahiere Properties
python3 scripts/extract_properties.py \
  tests/fixtures/sample.ifc \
  <GUID_FROM_STEP_1>

# Erwartete Ausgabe:
# {
#   "Pset_WallCommon": {
#     "Reference": "W-001",
#     "FireRating": "F90",
#     "LoadBearing": true,
#     "IsExternal": false
#   },
#   "Dimensions": {
#     "Length": 5000.0,
#     "Width": 200.0,
#     "Height": 3000.0
#   }
# }
```

**Zeitschätzung:** 4-5 Stunden

---

### Task 7: .NET Integration - Properties

**Branch:** `task/07-dotnet-properties-integration`

**Ziel:** .NET-Endpoint für Property-Extraction

**Anweisungen:**

1. **Erweitere `src/ifcserver/Services/PythonIfcService.cs`:**
   ```csharp
   public async Task<Dictionary<string, Dictionary<string, object>>> ExtractPropertiesAsync(
       string ifcFilePath,
       string elementGuid)
   {
       var scriptPath = Path.Combine(_pythonScriptsPath, "extract_properties.py");

       if (!File.Exists(scriptPath))
       {
           throw new FileNotFoundException($"Python script not found: {scriptPath}");
       }

       string args = $"\"{scriptPath}\" \"{ifcFilePath}\" \"{elementGuid}\"";

       _logger.LogInformation($"Extracting properties for GUID: {elementGuid}");

       var startInfo = new ProcessStartInfo
       {
           FileName = "python3",
           Arguments = args,
           RedirectStandardOutput = true,
           RedirectStandardError = true,
           UseShellExecute = false,
           CreateNoWindow = true
       };

       using var process = new Process { StartInfo = startInfo };
       process.Start();

       string output = await process.StandardOutput.ReadToEndAsync();
       string error = await process.StandardError.ReadToEndAsync();

       await process.WaitForExitAsync();

       if (process.ExitCode != 0)
       {
           _logger.LogError($"Property extraction failed: {error}");
           throw new Exception($"Property extraction failed: {error}");
       }

       // Deserialize nested dictionary
       var properties = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, object>>>(
           output,
           new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
       );

       if (properties == null)
       {
           throw new Exception("Failed to deserialize properties");
       }

       return properties;
   }
   ```

2. **Erweitere `src/ifcserver/Controllers/IfcIntelligenceController.cs`:**
   ```csharp
   /// <summary>
   /// Extract properties for a specific IFC element
   /// </summary>
   [HttpPost("properties")]
   public async Task<IActionResult> ExtractProperties(
       IFormFile file,
       [FromQuery] string elementGuid)
   {
       if (file == null || file.Length == 0)
       {
           return BadRequest(new { error = "No file uploaded" });
       }

       if (string.IsNullOrWhiteSpace(elementGuid))
       {
           return BadRequest(new { error = "elementGuid query parameter required" });
       }

       var tempPath = Path.Combine(Path.GetTempPath(), file.FileName);

       try
       {
           using (var stream = System.IO.File.Create(tempPath))
           {
               await file.CopyToAsync(stream);
           }

           var properties = await _pythonService.ExtractPropertiesAsync(tempPath, elementGuid);

           return Ok(properties);
       }
       catch (Exception ex)
       {
           _logger.LogError(ex, "Error extracting properties");
           return StatusCode(500, new { error = ex.Message });
       }
       finally
       {
           if (System.IO.File.Exists(tempPath))
           {
               System.IO.File.Delete(tempPath);
           }
       }
   }
   ```

**Akzeptanzkriterien:**
- [ ] `ExtractPropertiesAsync()` implementiert
- [ ] API-Endpoint `POST /api/ifc-intelligence/properties?elementGuid=<GUID>` funktioniert
- [ ] Properties werden als JSON zurückgegeben
- [ ] Fehlerbehandlung für ungültige GUIDs

**Testbar durch:**
```bash
# 1. Backend starten
dotnet run

# 2. API testen
curl -X POST "http://localhost:5000/api/ifc-intelligence/properties?elementGuid=3vB2YO\$MX4xv5uCqZZG0Xq" \
  -F "file=@sample.ifc"

# Erwartete Response:
# {
#   "Pset_WallCommon": {
#     "Reference": "W-001",
#     "FireRating": "F90",
#     "LoadBearing": true
#   },
#   "Dimensions": {
#     "Length": 5000.0,
#     "Width": 200.0
#   }
# }

# 3. Swagger UI testen
# http://localhost:5000/swagger
```

**Zeitschätzung:** 2-3 Stunden

---

### Task 8: Spatial Tree Extraction

**Branch:** `task/08-spatial-tree`

**Ziel:** Räumliche Hierarchie (Project → Site → Building → Storey → Elements) extrahieren

**Anweisungen:**

1. **Erstelle `src/python-service/ifc_intelligence/spatial_tree.py`:**
   ```python
   import ifcopenshell
   import ifcopenshell.util.element
   from dataclasses import dataclass, asdict
   from typing import List, Optional

   @dataclass
   class SpatialNode:
       """Node in spatial hierarchy tree"""
       guid: str
       name: str
       ifc_type: str  # "IfcProject", "IfcSite", "IfcBuilding", etc.
       children: List['SpatialNode']

       def to_dict(self):
           """Convert to dict for JSON serialization"""
           return {
               "guid": self.guid,
               "name": self.name,
               "ifcType": self.ifc_type,
               "children": [child.to_dict() for child in self.children]
           }

   class SpatialTreeExtractor:
       """
       Extract spatial hierarchy from IFC file.

       Traverses: IfcProject → IfcSite → IfcBuilding → IfcBuildingStorey → Elements

       Inspired by Bonsai spatial module but clean-room implementation.
       """

       def extract_tree(self, ifc_file_path: str) -> SpatialNode:
           """
           Extract complete spatial hierarchy.

           Args:
               ifc_file_path: Path to IFC file

           Returns:
               Root SpatialNode (IfcProject)
           """
           ifc_file = ifcopenshell.open(ifc_file_path)

           # Start with IfcProject
           projects = ifc_file.by_type("IfcProject")
           if not projects:
               raise ValueError("No IfcProject found in file")

           project = projects[0]

           # Build tree recursively
           root = self._build_node(project, ifc_file)

           return root

       def _build_node(self, element, ifc_file) -> SpatialNode:
           """
           Recursively build spatial node and its children.

           Uses ifcopenshell.util.element.get_decomposition()
           """
           node = SpatialNode(
               guid=element.GlobalId,
               name=element.Name or element.is_a(),
               ifc_type=element.is_a(),
               children=[]
           )

           # Get spatial decomposition (contained elements)
           decomposition = ifcopenshell.util.element.get_decomposition(element)

           for child in decomposition:
               # Only include spatial structure elements
               if self._is_spatial_element(child):
                   child_node = self._build_node(child, ifc_file)
                   node.children.append(child_node)

           return node

       def _is_spatial_element(self, element) -> bool:
           """Check if element is part of spatial structure"""
           spatial_types = [
               "IfcSite",
               "IfcBuilding",
               "IfcBuildingStorey",
               "IfcSpace",
               "IfcZone"
           ]
           return element.is_a() in spatial_types
   ```

2. **Erstelle `src/python-service/scripts/extract_spatial.py`:**
   ```python
   #!/usr/bin/env python3
   """
   CLI script to extract spatial hierarchy tree from IFC file.

   Usage:
       python scripts/extract_spatial.py <input.ifc>

   Output:
       JSON tree structure to stdout
   """
   import sys
   import json
   from ifc_intelligence.spatial_tree import SpatialTreeExtractor

   def main():
       if len(sys.argv) < 2:
           print(json.dumps({"error": "Usage: extract_spatial.py <input.ifc>"}))
           sys.exit(1)

       file_path = sys.argv[1]

       try:
           extractor = SpatialTreeExtractor()
           tree = extractor.extract_tree(file_path)

           # Convert to dict for JSON serialization
           tree_dict = tree.to_dict()

           print(json.dumps(tree_dict, indent=2))
           sys.exit(0)

       except Exception as e:
           print(json.dumps({"error": str(e)}))
           sys.exit(1)

   if __name__ == "__main__":
       main()
   ```

**Akzeptanzkriterien:**
- [ ] `SpatialTreeExtractor` implementiert
- [ ] Rekursive Traversierung funktioniert
- [ ] CLI-Script gibt Baum-Struktur aus
- [ ] Nur räumliche Elemente inkludiert (Site, Building, Storey)
- [ ] JSON-Serialisierung funktioniert

**Testbar durch:**
```bash
# Standalone Test
cd src/python-service
python3 scripts/extract_spatial.py tests/fixtures/sample.ifc

# Erwartete Ausgabe (Beispiel):
# {
#   "guid": "0YBSfH8rv5RBVyGWZjj7YP",
#   "name": "My Project",
#   "ifcType": "IfcProject",
#   "children": [
#     {
#       "guid": "1vB3fH9sv6SBVyGXZkk8ZQ",
#       "name": "Default Site",
#       "ifcType": "IfcSite",
#       "children": [
#         {
#           "guid": "2wC4gI0tw7TCWzHYAll9AR",
#           "name": "Main Building",
#           "ifcType": "IfcBuilding",
#           "children": [
#             {
#               "guid": "3xD5hJ1ux8UDXzIZBmm0BS",
#               "name": "Ground Floor",
#               "ifcType": "IfcBuildingStorey",
#               "children": []
#             },
#             {
#               "guid": "4yE6iK2vy9VEYzJACnn1CT",
#               "name": "First Floor",
#               "ifcType": "IfcBuildingStorey",
#               "children": []
#             }
#           ]
#         }
#       ]
#     }
#   ]
# }
```

**Zeitschätzung:** 5-6 Stunden

---

### Task 9: .NET Integration - Spatial Tree

**Branch:** `task/09-dotnet-spatial-integration`

**Ziel:** .NET-Endpoint für Spatial Hierarchy

**Anweisungen:**

1. **Erstelle `src/ifcserver/Models/SpatialNode.cs`:**
   ```csharp
   namespace ifcserver.Models
   {
       public class SpatialNode
       {
           public string Guid { get; set; } = string.Empty;
           public string Name { get; set; } = string.Empty;
           public string IfcType { get; set; } = string.Empty;
           public List<SpatialNode> Children { get; set; } = new();
       }
   }
   ```

2. **Erweitere `src/ifcserver/Services/PythonIfcService.cs`:**
   ```csharp
   public async Task<SpatialNode> ExtractSpatialTreeAsync(string ifcFilePath)
   {
       var scriptPath = Path.Combine(_pythonScriptsPath, "extract_spatial.py");

       if (!File.Exists(scriptPath))
       {
           throw new FileNotFoundException($"Python script not found: {scriptPath}");
       }

       string args = $"\"{scriptPath}\" \"{ifcFilePath}\"";

       _logger.LogInformation($"Extracting spatial tree from: {ifcFilePath}");

       var startInfo = new ProcessStartInfo
       {
           FileName = "python3",
           Arguments = args,
           RedirectStandardOutput = true,
           RedirectStandardError = true,
           UseShellExecute = false,
           CreateNoWindow = true
       };

       using var process = new Process { StartInfo = startInfo };
       process.Start();

       string output = await process.StandardOutput.ReadToEndAsync();
       string error = await process.StandardError.ReadToEndAsync();

       await process.WaitForExitAsync();

       if (process.ExitCode != 0)
       {
           _logger.LogError($"Spatial tree extraction failed: {error}");
           throw new Exception($"Spatial tree extraction failed: {error}");
       }

       var tree = JsonSerializer.Deserialize<SpatialNode>(
           output,
           new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
       );

       if (tree == null)
       {
           throw new Exception("Failed to deserialize spatial tree");
       }

       return tree;
   }
   ```

3. **Erweitere `src/ifcserver/Controllers/IfcIntelligenceController.cs`:**
   ```csharp
   /// <summary>
   /// Extract spatial hierarchy tree from IFC file
   /// </summary>
   [HttpPost("spatial-tree")]
   public async Task<IActionResult> ExtractSpatialTree(IFormFile file)
   {
       if (file == null || file.Length == 0)
       {
           return BadRequest(new { error = "No file uploaded" });
       }

       var tempPath = Path.Combine(Path.GetTempPath(), file.FileName);

       try
       {
           using (var stream = System.IO.File.Create(tempPath))
           {
               await file.CopyToAsync(stream);
           }

           var tree = await _pythonService.ExtractSpatialTreeAsync(tempPath);

           return Ok(tree);
       }
       catch (Exception ex)
       {
           _logger.LogError(ex, "Error extracting spatial tree");
           return StatusCode(500, new { error = ex.Message });
       }
       finally
       {
           if (System.IO.File.Exists(tempPath))
           {
               System.IO.File.Delete(tempPath);
           }
       }
   }
   ```

**Akzeptanzkriterien:**
- [ ] `ExtractSpatialTreeAsync()` implementiert
- [ ] API-Endpoint `POST /api/ifc-intelligence/spatial-tree` funktioniert
- [ ] Hierarchische JSON-Struktur wird zurückgegeben
- [ ] Verschachtelte Children korrekt deserialisiert

**Testbar durch:**
```bash
# Backend starten
dotnet run

# API testen
curl -X POST http://localhost:5000/api/ifc-intelligence/spatial-tree \
  -F "file=@sample.ifc"

# Erwartete Response: Hierarchische Struktur (siehe Task 8)

# Swagger UI
# http://localhost:5000/swagger
# -> Test POST /api/ifc-intelligence/spatial-tree
```

**Zeitschätzung:** 2-3 Stunden

---

### Task 10: Cache Manager

**Branch:** `task/10-cache-manager`

**Ziel:** RAM-Cache für geladene IFC-Files (Performance-Optimierung)

**Anweisungen:**

1. **Erstelle `src/python-service/ifc_intelligence/cache_manager.py`:**
   ```python
   import ifcopenshell
   import time
   from typing import Optional, Dict
   from collections import OrderedDict

   class IfcCacheManager:
       """
       LRU cache for loaded IFC files.

       Keeps frequently accessed IFC files in RAM to avoid repeated parsing.
       """

       def __init__(self, max_size: int = 10, ttl_hours: int = 24):
           """
           Args:
               max_size: Maximum number of files to cache
               ttl_hours: Time-to-live in hours
           """
           self.max_size = max_size
           self.ttl_seconds = ttl_hours * 3600

           # OrderedDict for LRU behavior
           self._cache: OrderedDict[str, ifcopenshell.file] = OrderedDict()
           self._access_times: Dict[str, float] = {}

       def get_or_load(self, file_path: str) -> ifcopenshell.file:
           """
           Get IFC file from cache or load if not cached.

           Implements LRU eviction when cache is full.
           """
           current_time = time.time()

           # Check if in cache
           if file_path in self._cache:
               # Check TTL
               if current_time - self._access_times[file_path] < self.ttl_seconds:
                   # Move to end (most recently used)
                   self._cache.move_to_end(file_path)
                   self._access_times[file_path] = current_time
                   print(f"Cache HIT: {file_path}")
                   return self._cache[file_path]
               else:
                   # Expired, remove
                   print(f"Cache EXPIRED: {file_path}")
                   del self._cache[file_path]
                   del self._access_times[file_path]

           # Not in cache or expired - load file
           print(f"Cache MISS: Loading {file_path}")
           ifc_file = ifcopenshell.open(file_path)

           # Evict oldest if cache full
           if len(self._cache) >= self.max_size:
               oldest_key = next(iter(self._cache))
               print(f"Cache FULL: Evicting {oldest_key}")
               del self._cache[oldest_key]
               del self._access_times[oldest_key]

           # Add to cache
           self._cache[file_path] = ifc_file
           self._access_times[file_path] = current_time

           return ifc_file

       def clear(self):
           """Clear entire cache"""
           self._cache.clear()
           self._access_times.clear()
           print("Cache cleared")

       def get_stats(self) -> dict:
           """Get cache statistics"""
           return {
               "size": len(self._cache),
               "max_size": self.max_size,
               "cached_files": list(self._cache.keys())
           }
   ```

2. **Refactoring: Nutze Cache in allen Extractors**

   **parser.py:**
   ```python
   class IfcParser:
       def __init__(self, cache_manager: Optional[IfcCacheManager] = None):
           self.cache = cache_manager or IfcCacheManager()

       def parse_file(self, file_path: str) -> IfcMetadata:
           # Verwende Cache statt direktem ifcopenshell.open()
           ifc_file = self.cache.get_or_load(file_path)
           # ... rest of code
   ```

   **property_extractor.py:**
   ```python
   class PropertyExtractor:
       def __init__(self, cache_manager: Optional[IfcCacheManager] = None):
           self.cache = cache_manager or IfcCacheManager()

       def extract_properties(self, ifc_file_path: str, element_guid: str):
           ifc_file = self.cache.get_or_load(ifc_file_path)
           # ... rest of code
   ```

   **spatial_tree.py:**
   ```python
   class SpatialTreeExtractor:
       def __init__(self, cache_manager: Optional[IfcCacheManager] = None):
           self.cache = cache_manager or IfcCacheManager()

       def extract_tree(self, ifc_file_path: str):
           ifc_file = self.cache.get_or_load(ifc_file_path)
           # ... rest of code
   ```

3. **Update CLI-Scripts um Cache zu nutzen**

**Akzeptanzkriterien:**
- [ ] `IfcCacheManager` implementiert
- [ ] LRU-Eviction funktioniert
- [ ] TTL-Logik funktioniert
- [ ] Alle Extractors nutzen Cache
- [ ] Cache-Stats verfügbar

**Testbar durch:**
```bash
# Mehrfach-Aufrufe testen (sollte schneller werden)
cd src/python-service

# Erste Ausführung (MISS)
time python3 scripts/parse_ifc.py tests/fixtures/sample.ifc
# Output sollte: "Cache MISS: Loading ..."

# Zweite Ausführung (HIT)
time python3 scripts/parse_ifc.py tests/fixtures/sample.ifc
# Output sollte: "Cache HIT: ..."
# Sollte deutlich schneller sein!

# Verschiedene Operationen auf gleicher Datei
time python3 scripts/extract_spatial.py tests/fixtures/sample.ifc
# Sollte: "Cache HIT: ..." (Datei bereits gecacht von parse_ifc)
```

**Zeitschätzung:** 3-4 Stunden

---

### Task 11: Frontend Integration

**Branch:** `task/11-frontend-integration`

**Ziel:** Three.js Viewer nutzt neue IFC Intelligence API

**Anweisungen:**

1. **Erstelle `src/webui/src/services/api/ifcIntelligenceApi.ts`:**
   ```typescript
   const API_BASE = "http://localhost:5000/api/ifc-intelligence";

   export interface IfcMetadata {
     modelId: string;
     projectName: string;
     schema: string;
     entityCounts: Record<string, number>;
     author?: string;
     organization?: string;
     application?: string;
   }

   export interface SpatialNode {
     guid: string;
     name: string;
     ifcType: string;
     children: SpatialNode[];
   }

   export const ifcIntelligenceApi = {
     /**
      * Parse IFC file and get metadata
      */
     async parseIfc(file: File): Promise<IfcMetadata> {
       const formData = new FormData();
       formData.append("file", file);

       const response = await fetch(`${API_BASE}/parse`, {
         method: "POST",
         body: formData,
       });

       if (!response.ok) {
         throw new Error(`Failed to parse IFC: ${response.statusText}`);
       }

       return response.json();
     },

     /**
      * Convert IFC to glTF/GLB
      */
     async exportGltf(file: File, binary: boolean = true): Promise<Blob> {
       const formData = new FormData();
       formData.append("file", file);

       const response = await fetch(`${API_BASE}/export-gltf?binary=${binary}`, {
         method: "POST",
         body: formData,
       });

       if (!response.ok) {
         throw new Error(`Failed to export glTF: ${response.statusText}`);
       }

       return response.blob();
     },

     /**
      * Extract properties for specific element
      */
     async extractProperties(
       file: File,
       elementGuid: string
     ): Promise<Record<string, Record<string, any>>> {
       const formData = new FormData();
       formData.append("file", file);

       const response = await fetch(
         `${API_BASE}/properties?elementGuid=${elementGuid}`,
         {
           method: "POST",
           body: formData,
         }
       );

       if (!response.ok) {
         throw new Error(`Failed to extract properties: ${response.statusText}`);
       }

       return response.json();
     },

     /**
      * Extract spatial hierarchy tree
      */
     async extractSpatialTree(file: File): Promise<SpatialNode> {
       const formData = new FormData();
       formData.append("file", file);

       const response = await fetch(`${API_BASE}/spatial-tree`, {
         method: "POST",
         body: formData,
       });

       if (!response.ok) {
         throw new Error(`Failed to extract spatial tree: ${response.statusText}`);
       }

       return response.json();
     },
   };
   ```

2. **Erweitere `ModelUrlInput` Component um File-Upload:**
   ```typescript
   // Bestehende URL-Input PLUS neuer File-Upload
   const [uploadedFile, setUploadedFile] = useState<File | null>(null);

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     setUploadedFile(file);
     setIsLoading(true);

     try {
       // 1. Convert to glTF
       const glbBlob = await ifcIntelligenceApi.exportGltf(file, true);
       const glbUrl = URL.createObjectURL(glbBlob);

       // 2. Load in viewer
       onLoadModel(glbUrl);

       // 3. Get metadata
       const metadata = await ifcIntelligenceApi.parseIfc(file);
       console.log("IFC Metadata:", metadata);

       // 4. Get spatial tree
       const spatialTree = await ifcIntelligenceApi.extractSpatialTree(file);
       console.log("Spatial Tree:", spatialTree);
     } catch (error) {
       setError(error.message);
     } finally {
       setIsLoading(false);
     }
   };
   ```

3. **Update PropertyPanel um echte IFC-Properties:**
   ```typescript
   // Wenn Element selektiert, hole Properties vom Backend
   useEffect(() => {
     if (selectedElement && uploadedFile) {
       ifcIntelligenceApi
         .extractProperties(uploadedFile, selectedElement.guid)
         .then((props) => {
           setElementProperties(props);
         });
     }
   }, [selectedElement, uploadedFile]);
   ```

**Akzeptanzkriterien:**
- [ ] IFC-File-Upload funktioniert
- [ ] glTF wird generiert und im Viewer geladen
- [ ] Metadata wird angezeigt
- [ ] Spatial Tree wird geladen (optional: Tree-View)
- [ ] PropertyPanel zeigt echte IFC-Properties

**Testbar durch:**
```bash
# 1. Backend starten
cd src/ifcserver
dotnet run

# 2. Frontend starten
cd src/webui
npm run dev

# 3. Manuelle Tests im Browser:
# http://localhost:5173

# Test-Schritte:
1. Wechsel zu Three.js Viewer
2. Klick "Load Model" → "Upload IFC File"
3. Wähle IFC-Datei
4. Erwartung:
   - glTF wird generiert
   - Modell lädt im Viewer
   - Console zeigt Metadata + Spatial Tree
5. Klick auf Objekt
6. PropertyPanel zeigt echte IFC-Properties (nicht Mock!)
```

**Zeitschätzung:** 4-5 Stunden

---

## Gesamt-Übersicht

| Task | Beschreibung | Aufwand | Status |
|------|-------------|---------|--------|
| 0 | Bonsai Konzeptanalyse | 3-4h | ⬜ |
| 1 | Python Package Setup | 1-2h | ⬜ |
| 2 | IFC Parser Module | 4-5h | ⬜ |
| 3 | .NET Integration - Parser | 3-4h | ⬜ |
| 4 | glTF Export Module | 4-5h | ⬜ |
| 5 | .NET Integration - glTF | 3-4h | ⬜ |
| 6 | Property Extraction | 4-5h | ⬜ |
| 7 | .NET Integration - Properties | 2-3h | ⬜ |
| 8 | Spatial Tree Extraction | 5-6h | ⬜ |
| 9 | .NET Integration - Spatial | 2-3h | ⬜ |
| 10 | Cache Manager | 3-4h | ⬜ |
| 11 | Frontend Integration | 4-5h | ⬜ |
| **GESAMT** | | **38-49h** | |

**Realistische Planung:** 1-2 Wochen (mit Testing/Bugfixing)

---

## Testing-Checkliste pro Task

Jeder Task sollte diese Checks bestehen:

```bash
# 1. Python-Seite (wenn applicable)
cd src/python-service
pip install -e .
python3 scripts/<script_name>.py <args>  # Standalone-Test

# 2. .NET-Seite (wenn applicable)
cd src/ifcserver
dotnet build
dotnet run

# 3. API-Test via curl
curl -X POST http://localhost:5000/api/ifc-intelligence/<endpoint> \
  -F "file=@test.ifc"

# 4. Swagger UI
# http://localhost:5000/swagger
# -> Manuell testen

# 5. Git-Status
git status
git diff

# 6. Commit & Merge
git add .
git commit -m "Task XX: ..."
git checkout feature/python-ifc-intelligence
git merge task/XX-... --no-ff
```

---

## Merge-Strategie

Nach jedem erfolgreichen Task:

```bash
# 1. Tests durchlaufen (siehe oben)

# 2. Commit im Task-Branch
git add .
git commit -m "Task XX: [Beschreibung]

- Feature 1 implementiert
- Feature 2 getestet
- API endpoint funktioniert

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. Merge in Feature-Branch
git checkout feature/python-ifc-intelligence
git merge task/XX-name --no-ff

# 4. Push (optional)
git push origin feature/python-ifc-intelligence

# 5. Lösche Task-Branch lokal (optional)
git branch -d task/XX-name
```

---

## Finale Integration

Nach Abschluss aller Tasks:

```bash
# Review des kompletten Feature-Branches
git checkout feature/python-ifc-intelligence
git log --oneline --graph

# Merge in main
git checkout main
git merge feature/python-ifc-intelligence --no-ff

# Tag erstellen
git tag -a v1.0.0-python-ifc-poc -m "Python IFC Intelligence PoC completed"

# Push
git push origin main --tags
```

---

## Dokumentation

Am Ende sollten folgende Docs existieren:

1. **docs/bonsai-concepts.md** - Bonsai-Konzeptanalyse
2. **src/python-service/README.md** - Python Package Nutzung
3. **API-Dokumentation** - Swagger UI (automatisch)
4. **Integration-Guide** - Wie Frontend Python-APIs nutzt

---

## Wichtige Hinweise

### Bonsai-Compliance
- ✅ Konzepte lernen und dokumentieren
- ✅ Eigene Implementierung mit IfcOpenShell API
- ❌ NIEMALS Code kopieren oder 1:1 übersetzen
- ❌ KEIN Bonsai-Code im Projekt-Repository

### Performance
- Python-Parsing kann langsam sein (5-30s für große Dateien)
- Cache-Manager hilft bei wiederholten Zugriffen
- Für Production: Queue-basierte Lösung (siehe Multi-Container Plan)

### Lizenz-Compliance
- IfcOpenShell: LGPL (OK für Nutzung)
- Bonsai: AGPL-3.0 (NICHT kopieren!)
- Eigener Code: MIT oder ähnlich

---

**Ende des Single-Container Implementation Plans**