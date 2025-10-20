# IFC Intelligence Service

Python-based IFC processing service for the BIM viewer backend.

## Overview

This package provides IFC parsing, spatial tree extraction, property extraction, and glTF export capabilities. It is designed to be called by the ASP.NET backend via process execution.

**Architecture:**
- **Python Service:** Worker/Library (NO HTTP server)
- **ASP.NET API:** Public endpoint (Port 5000)
- **Communication:** .NET calls Python scripts via `ProcessRunner`

## Features

- ✅ **IFC Parsing:** Extract metadata from IFC files
- ✅ **Spatial Tree:** Extract hierarchical structure (Project → Site → Building → Storey)
- ✅ **Property Extraction:** Get PropertySets for specific elements
- ✅ **glTF Export:** Convert IFC to glTF/GLB for Three.js viewer
- ✅ **RAM Caching:** LRU cache for loaded IFC files (performance)

## Installation

```bash
cd src/python-service

# Install in development mode
pip install -e .

# Or install dependencies only
pip install -r requirements.txt
```

## Usage

### From Python

```python
from ifc_intelligence.parser import IfcParser

parser = IfcParser()
metadata = parser.parse_file("model.ifc")

print(f"Schema: {metadata.schema}")
print(f"Entities: {metadata.entity_counts}")
```

### From .NET (via ProcessRunner)

```csharp
var result = await ProcessRunner.RunProcessAsync(
    "python3",
    "scripts/parse_ifc.py input.ifc"
);

var metadata = JsonSerializer.Deserialize<IfcMetadata>(result);
```

### CLI Scripts

```bash
# Parse IFC file
python scripts/parse_ifc.py model.ifc

# Extract spatial tree
python scripts/extract_spatial.py model.ifc

# Extract properties
python scripts/extract_properties.py model.ifc <element-guid>

# Export to glTF
python scripts/export_gltf.py input.ifc output.glb
```

## Project Structure

```
src/python-service/
├── ifc_intelligence/           # Python package
│   ├── __init__.py
│   ├── parser.py              # IFC metadata extraction
│   ├── spatial_tree.py        # Spatial hierarchy
│   ├── property_extractor.py  # PropertySet extraction
│   ├── gltf_exporter.py       # glTF/GLB export
│   ├── cache_manager.py       # RAM caching
│   └── models.py              # Data models
├── scripts/                    # CLI entry points
│   ├── parse_ifc.py
│   ├── extract_spatial.py
│   ├── extract_properties.py
│   └── export_gltf.py
├── tests/                      # Unit tests
│   ├── test_parser.py
│   └── fixtures/
│       └── sample.ifc
├── requirements.txt
├── setup.py
└── README.md
```

## Dependencies

- **IfcOpenShell** (LGPL-3.0): IFC parsing library
- **Pydantic** (MIT): Data validation

All dependencies are permissively licensed and safe for commercial use.

## License & Compliance

### Our Code
- **License:** MIT
- **Copyright:** Your Team
- **Usage:** Free for commercial and private use

### Dependencies
- **IfcOpenShell:** LGPL-3.0-or-later (library usage via dynamic linking is OK)
- **Pydantic:** MIT

### Inspiration
This package is **inspired by Bonsai/BlenderBIM concepts** but **independently implemented**:
- ✅ Learned architecture patterns (Core/Tool separation)
- ✅ Studied IFC processing strategies
- ✅ Implemented using IfcOpenShell API (LGPL)
- ❌ **NO Bonsai code copied** (Bonsai is GPL-3.0)
- ❌ **NO GPL dependencies** (our code remains MIT)

**Clean-Room Approach:**
1. Read Bonsai source (outside project)
2. Document concepts in own words
3. Close Bonsai repository
4. Implement independently with IfcOpenShell API

See `claude-docs/bonsai-concepts.md` for details.

## Development

### Run Tests

```bash
pytest tests/
```

### Install Development Dependencies

```bash
pip install -e .[dev]
```

### Verify Installation

```bash
python -c "import ifc_intelligence; print(ifc_intelligence.__version__)"
# Expected output: 0.1.0

python -c "import ifcopenshell; print(ifcopenshell.version)"
# Expected output: 0.7.x or 0.8.x
```

## Integration with .NET Backend

The .NET backend calls Python scripts via `PythonIfcService.cs`:

```csharp
public class PythonIfcService
{
    public async Task<IfcMetadata> ParseIfcAsync(string ifcFilePath)
    {
        var scriptPath = Path.Combine(_pythonScriptsPath, "parse_ifc.py");
        var args = $"{scriptPath} {ifcFilePath}";

        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "python3",
                Arguments = args,
                RedirectStandardOutput = true
            }
        };

        process.Start();
        string output = await process.StandardOutput.ReadToEndAsync();
        await process.WaitForExitAsync();

        return JsonSerializer.Deserialize<IfcMetadata>(output);
    }
}
```

## API Design

### Input/Output Format

All scripts communicate via **JSON on stdout**:

```json
{
  "model_id": "3vB2YO$MX4xv5uCqZZG0Xq",
  "project_name": "Sample Project",
  "schema": "IFC4",
  "entity_counts": {
    "IfcWall": 150,
    "IfcDoor": 45,
    "IfcWindow": 60
  }
}
```

### Error Handling

Errors are returned as JSON with `error` field:

```json
{
  "error": "File not found: model.ifc"
}
```

Exit codes:
- `0`: Success
- `1`: Error

## Resources

- **IfcOpenShell Docs:** https://blenderbim.org/docs-python/ifcopenshell-python/
- **IfcOpenShell Academy:** https://academy.ifcopenshell.org/
- **IFC Standard:** https://technical.buildingsmart.org/standards/ifc/
- **Bonsai (reference only):** https://bonsaibim.org/

## Support

For issues or questions, see the main project documentation in `claude-docs/`.
