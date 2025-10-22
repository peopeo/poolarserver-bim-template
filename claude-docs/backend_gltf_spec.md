# Backend glTF-Export - Implementierungs-Spezifikation

## Überblick

Das bestehende Backend muss erweitert werden, um zusätzlich zum xeokit-Format (XKT) auch glTF und ein Three.js-kompatibles Metadata-Format zu unterstützen.

**Ziel:** Parallele Unterstützung beider Formate für sanfte Migration.

---

## Architektur-Änderungen

### Bestehende Pipeline (xeokit)
```
IFC-Datei 
  → IfcOpenshell (Python) 
  → XKT-Format + xeokit-JSON
  → PostgreSQL
  → .NET API
  → Frontend (xeokit)
```

### Neue Pipeline (Three.js)
```
IFC-Datei 
  → IfcOpenshell (Python) 
  → glTF/GLB + Three.js-JSON
  → PostgreSQL
  → .NET API
  → Frontend (Three.js)
```

### Parallele Unterstützung
```
IFC-Datei 
  → IfcOpenshell (Python)
     ├→ XKT + xeokit-JSON (bestehend)
     └→ glTF + Three.js-JSON (neu)
  → PostgreSQL (beide Formate)
  → .NET API (beide Endpunkte)
  → Frontend (Umschalter)
```

---

## Teil 1: Python IFC-Verarbeitung

### 1.1 glTF-Export mit IfcOpenshell

**Implementierungs-Optionen:**

#### Option A: Direkter Export mit IfcOpenshell (empfohlen)

```python
import ifcopenshell
import ifcopenshell.geom
import json
import struct
from typing import Dict, List, Tuple

class IfcToGltfConverter:
    """
    Konvertiert IFC-Dateien zu glTF 2.0 Binary (GLB) Format
    """
    
    def __init__(self, ifc_file_path: str):
        self.ifc_file = ifcopenshell.open(ifc_file_path)
        self.settings = ifcopenshell.geom.settings()
        self.settings.set(self.settings.USE_WORLD_COORDS, True)
        
    def convert(self) -> Tuple[bytes, Dict]:
        """
        Konvertiert IFC zu GLB
        Returns: (glb_binary, metadata_dict)
        """
        # 1. Geometrie extrahieren
        meshes = []
        elements = []
        
        for product in self.ifc_file.by_type('IfcProduct'):
            if product.Representation:
                shape = ifcopenshell.geom.create_shape(self.settings, product)
                
                # Geometry Data
                verts = shape.geometry.verts  # Vertices als Flat-Array
                faces = shape.geometry.faces  # Faces/Indices
                
                mesh_data = {
                    'vertices': verts,
                    'indices': faces,
                    'guid': product.GlobalId,
                    'type': product.is_a(),
                }
                meshes.append(mesh_data)
                
                # Metadata sammeln
                element_metadata = self._extract_metadata(product)
                elements.append(element_metadata)
        
        # 2. glTF-Struktur aufbauen
        gltf_data = self._build_gltf_structure(meshes)
        
        # 3. Als GLB (binary) packen
        glb_binary = self._create_glb(gltf_data, meshes)
        
        # 4. Metadata-Dictionary
        metadata = {
            'modelId': str(uuid.uuid4()),
            'elements': elements,
            'types': list(set(e['type'] for e in elements)),
            'propertySets': self._collect_property_sets()
        }
        
        return glb_binary, metadata
    
    def _extract_metadata(self, product) -> Dict:
        """Extrahiert Properties aus IFC-Element"""
        properties = []
        
        # Standard IFC Properties
        if hasattr(product, 'Name') and product.Name:
            properties.append({
                'name': 'Name',
                'value': product.Name,
                'type': 'string',
                'propertySet': 'IFC'
            })
        
        # Property Sets durchlaufen
        for definition in product.IsDefinedBy:
            if definition.is_a('IfcRelDefinesByProperties'):
                property_set = definition.RelatingPropertyDefinition
                if property_set.is_a('IfcPropertySet'):
                    pset_name = property_set.Name
                    
                    for prop in property_set.HasProperties:
                        if prop.is_a('IfcPropertySingleValue'):
                            properties.append({
                                'name': prop.Name,
                                'value': self._get_property_value(prop),
                                'type': self._get_property_type(prop),
                                'propertySet': pset_name
                            })
        
        return {
            'id': str(uuid.uuid4()),
            'ifcGuid': product.GlobalId,
            'type': product.is_a(),
            'properties': properties
        }
    
    def _get_property_value(self, prop):
        """Extrahiert Wert aus IFC-Property"""
        if prop.NominalValue:
            return prop.NominalValue.wrappedValue
        return None
    
    def _get_property_type(self, prop) -> str:
        """Bestimmt Typ des Property-Wertes"""
        if prop.NominalValue:
            value = prop.NominalValue.wrappedValue
            if isinstance(value, bool):
                return 'boolean'
            elif isinstance(value, (int, float)):
                return 'number'
            else:
                return 'string'
        return 'string'
    
    def _build_gltf_structure(self, meshes: List[Dict]) -> Dict:
        """
        Baut glTF JSON-Struktur auf
        glTF 2.0 Spec: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
        """
        gltf = {
            'asset': {
                'version': '2.0',
                'generator': 'Poolarserver IFC Converter'
            },
            'scene': 0,
            'scenes': [{'nodes': list(range(len(meshes)))}],
            'nodes': [],
            'meshes': [],
            'buffers': [],
            'bufferViews': [],
            'accessors': [],
            'materials': []
        }
        
        # Pro Mesh einen Node + Mesh erstellen
        buffer_data = []
        buffer_offset = 0
        
        for i, mesh_data in enumerate(meshes):
            # Vertices
            verts = mesh_data['vertices']
            verts_bytes = struct.pack(f'{len(verts)}f', *verts)
            
            # Indices
            indices = mesh_data['indices']
            indices_bytes = struct.pack(f'{len(indices)}H', *indices)
            
            # BufferViews und Accessors
            # ... (detaillierte glTF-Struktur)
            
            # Node
            gltf['nodes'].append({
                'mesh': i,
                'name': mesh_data['guid']
            })
            
            # Mesh
            gltf['meshes'].append({
                'primitives': [{
                    'attributes': {
                        'POSITION': i * 2,  # Accessor index
                    },
                    'indices': i * 2 + 1,  # Accessor index
                    'material': 0
                }]
            })
        
        return gltf
    
    def _create_glb(self, gltf_json: Dict, meshes: List) -> bytes:
        """
        Erstellt GLB Binary (glTF 2.0 Binary Container Format)
        
        GLB Structure:
        - Header (12 bytes)
        - JSON Chunk (header + data)
        - Binary Chunk (header + data)
        """
        # JSON Chunk
        json_data = json.dumps(gltf_json).encode('utf-8')
        json_padding = (4 - len(json_data) % 4) % 4
        json_data += b' ' * json_padding
        
        # Binary Chunk (Geometry Data)
        binary_data = b''  # Zusammengefasste Buffer-Daten
        # ... (alle Vertex/Index-Daten packen)
        
        binary_padding = (4 - len(binary_data) % 4) % 4
        binary_data += b'\x00' * binary_padding
        
        # GLB Header
        magic = b'glTF'
        version = struct.pack('<I', 2)  # Version 2
        total_length = struct.pack('<I', 12 + 8 + len(json_data) + 8 + len(binary_data))
        
        # JSON Chunk Header
        json_length = struct.pack('<I', len(json_data))
        json_type = b'JSON'
        
        # Binary Chunk Header
        binary_length = struct.pack('<I', len(binary_data))
        binary_type = b'BIN\x00'
        
        # Alles zusammenfügen
        glb = (
            magic + version + total_length +
            json_length + json_type + json_data +
            binary_length + binary_type + binary_data
        )
        
        return glb
    
    def _collect_property_sets(self) -> List[str]:
        """Sammelt alle verfügbaren PropertySet-Namen"""
        psets = set()
        for pset in self.ifc_file.by_type('IfcPropertySet'):
            psets.add(pset.Name)
        return sorted(list(psets))
```

#### Option B: IfcConvert CLI Tool nutzen (schneller, weniger Kontrolle)

```python
import subprocess
import json

class IfcToGltfConverter:
    def convert_with_ifcconvert(self, ifc_path: str, output_path: str):
        """
        Nutzt IfcConvert Command-Line Tool
        """
        cmd = [
            'IfcConvert',
            ifc_path,
            output_path,
            '--use-element-guids',
            '--generate-uvs'
        ]
        
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode != 0:
            raise Exception(f"IfcConvert failed: {result.stderr}")
        
        # Lies generiertes glTF
        with open(output_path, 'rb') as f:
            gltf_data = f.read()
        
        return gltf_data
```

### 1.2 Metadaten-Extraktion (Neues Schema)

```python
class MetadataExtractor:
    """
    Extrahiert IFC-Metadaten in Three.js-kompatibles JSON-Format
    """
    
    def extract(self, ifc_file) -> Dict:
        """
        Extrahiert vollständige Metadaten
        """
        elements = []
        types = set()
        property_sets = set()
        
        for product in ifc_file.by_type('IfcProduct'):
            element = {
                'id': str(uuid.uuid4()),
                'ifcGuid': product.GlobalId,
                'type': product.is_a(),
                'name': product.Name if hasattr(product, 'Name') else None,
                'properties': []
            }
            
            # Properties sammeln
            for definition in product.IsDefinedBy:
                if definition.is_a('IfcRelDefinesByProperties'):
                    pset = definition.RelatingPropertyDefinition
                    if pset.is_a('IfcPropertySet'):
                        property_sets.add(pset.Name)
                        
                        for prop in pset.HasProperties:
                            if prop.is_a('IfcPropertySingleValue'):
                                element['properties'].append({
                                    'name': prop.Name,
                                    'value': self._extract_value(prop),
                                    'type': self._get_value_type(prop),
                                    'propertySet': pset.Name
                                })
            
            elements.append(element)
            types.add(product.is_a())
        
        return {
            'modelId': str(uuid.uuid4()),
            'elements': elements,
            'types': sorted(list(types)),
            'propertySets': sorted(list(property_sets)),
            'statistics': {
                'totalElements': len(elements),
                'elementsByType': self._count_by_type(elements)
            }
        }
    
    def _extract_value(self, prop):
        """Sicherer Property-Value-Extract"""
        try:
            if prop.NominalValue:
                return prop.NominalValue.wrappedValue
        except:
            pass
        return None
    
    def _get_value_type(self, prop) -> str:
        """Bestimmt JavaScript-kompatiblen Typ"""
        value = self._extract_value(prop)
        if value is None:
            return 'null'
        elif isinstance(value, bool):
            return 'boolean'
        elif isinstance(value, int):
            return 'integer'
        elif isinstance(value, float):
            return 'number'
        else:
            return 'string'
    
    def _count_by_type(self, elements: List[Dict]) -> Dict[str, int]:
        """Zählt Elemente nach Typ"""
        counts = {}
        for elem in elements:
            elem_type = elem['type']
            counts[elem_type] = counts.get(elem_type, 0) + 1
        return counts
```

---

## Teil 2: .NET 9 API-Erweiterungen

### 2.1 Neue Controller-Endpunkte

```csharp
using Microsoft.AspNetCore.Mvc;
using System.IO;

[ApiController]
[Route("api/models/{modelId}")]
public class ModelGeometryController : ControllerBase
{
    private readonly IModelRepository _repository;
    
    public ModelGeometryController(IModelRepository repository)
    {
        _repository = repository;
    }
    
    /// <summary>
    /// Liefert Geometrie im glTF/GLB-Format
    /// </summary>
    [HttpGet("geometry/gltf")]
    [ProducesResponseType(typeof(FileContentResult), 200)]
    public async Task<IActionResult> GetGltfGeometry(
        string modelId,
        [FromQuery] string format = "glb")
    {
        var model = await _repository.GetModelAsync(modelId);
        if (model == null)
            return NotFound();
        
        if (format.ToLower() == "glb")
        {
            // Binary GLB
            return File(
                model.GltfData, 
                "application/octet-stream",
                $"{modelId}.glb"
            );
        }
        else
        {
            // Separate glTF + Bins (für Debugging)
            var gltfJson = model.GltfJson;
            return Ok(gltfJson);
        }
    }
    
    /// <summary>
    /// Liefert Metadaten im Three.js-Format
    /// </summary>
    [HttpGet("metadata/threejs")]
    [ProducesResponseType(typeof(ThreeJsMetadata), 200)]
    public async Task<IActionResult> GetThreeJsMetadata(string modelId)
    {
        var metadata = await _repository.GetMetadataAsync(modelId);
        if (metadata == null)
            return NotFound();
        
        return Ok(metadata);
    }
    
    /// <summary>
    /// Legacy: xeokit XKT-Format (bestehend)
    /// </summary>
    [HttpGet("geometry/xkt")]
    public async Task<IActionResult> GetXktGeometry(string modelId)
    {
        // Bestehende Implementierung bleibt unverändert
        var model = await _repository.GetModelAsync(modelId);
        return File(model.XktData, "application/octet-stream");
    }
}
```

### 2.2 Datenmodelle

```csharp
public class ThreeJsMetadata
{
    public string ModelId { get; set; }
    public List<BimElement> Elements { get; set; }
    public List<string> Types { get; set; }
    public List<string> PropertySets { get; set; }
    public MetadataStatistics Statistics { get; set; }
}

public class BimElement
{
    public string Id { get; set; }
    public string IfcGuid { get; set; }
    public string Type { get; set; }
    public string Name { get; set; }
    public List<BimProperty> Properties { get; set; }
}

public class BimProperty
{
    public string Name { get; set; }
    public object Value { get; set; }
    public string Type { get; set; }  // "boolean", "number", "string", etc.
    public string PropertySet { get; set; }
}

public class MetadataStatistics
{
    public int TotalElements { get; set; }
    public Dictionary<string, int> ElementsByType { get; set; }
}
```

### 2.3 Repository-Erweiterung

```csharp
public interface IModelRepository
{
    Task<Model> GetModelAsync(string modelId);
    Task<ThreeJsMetadata> GetMetadataAsync(string modelId);
    Task SaveModelAsync(string modelId, byte[] gltfData, ThreeJsMetadata metadata);
}

public class ModelRepository : IModelRepository
{
    private readonly DbContext _context;
    
    public async Task SaveModelAsync(
        string modelId, 
        byte[] gltfData, 
        ThreeJsMetadata metadata)
    {
        var model = new Model
        {
            Id = modelId,
            GltfData = gltfData,
            GltfMetadata = JsonSerializer.Serialize(metadata),
            GltfGeneratedAt = DateTime.UtcNow
        };
        
        _context.Models.Add(model);
        await _context.SaveChangesAsync();
    }
}
```

---

## Teil 3: Datenbank-Schema

### 3.1 Schema-Erweiterungen

```sql
-- Erweitere bestehende models-Tabelle
ALTER TABLE models 
ADD COLUMN gltf_data BYTEA,
ADD COLUMN gltf_metadata JSONB,
ADD COLUMN gltf_generated_at TIMESTAMP WITH TIME ZONE;

-- Index für JSONB-Queries
CREATE INDEX idx_models_gltf_metadata 
ON models USING GIN (gltf_metadata);

-- Index für schnelle Type-Queries
CREATE INDEX idx_models_gltf_metadata_types 
ON models USING GIN ((gltf_metadata->'types'));

-- Kommentar
COMMENT ON COLUMN models.gltf_data IS 'GLB binary data for Three.js viewer';
COMMENT ON COLUMN models.gltf_metadata IS 'Three.js-compatible metadata JSON';
```

### 3.2 Beispiel-Queries

```sql
-- Finde alle Modelle mit bestimmtem Element-Typ
SELECT id, name 
FROM models 
WHERE gltf_metadata->'types' ? 'IfcWall';

-- Finde Modelle mit Property
SELECT id, name
FROM models
WHERE gltf_metadata @> '{"elements": [{"properties": [{"name": "IsExternal"}]}]}';

-- Statistiken
SELECT 
  gltf_metadata->'statistics'->>'totalElements' as total_elements,
  gltf_metadata->'statistics'->'elementsByType' as types_count
FROM models
WHERE id = 'model-123';
```

---

## Teil 4: Migrations-Strategie

### 4.1 Bestehende Daten konvertieren

```python
# Script: migrate_existing_models.py

async def migrate_all_models():
    """
    Konvertiert alle bestehenden Modelle von XKT zu glTF
    """
    models = await db.get_all_models()
    
    for model in models:
        if model.ifc_file_path and not model.gltf_data:
            print(f"Converting {model.id}...")
            
            converter = IfcToGltfConverter(model.ifc_file_path)
            gltf_data, metadata = converter.convert()
            
            await db.update_model(
                model.id,
                gltf_data=gltf_data,
                gltf_metadata=metadata
            )
            
            print(f"✓ {model.id} converted")
```

### 4.2 Paralleler Betrieb

```
Phase 1 (Woche 1-2): Backend-Entwicklung
  - glTF-Export implementieren
  - Neue API-Endpunkte
  - Testing mit Sample-Daten

Phase 2 (Woche 2-3): Migration
  - Bestehende Modelle konvertieren
  - Beide Formate parallel verfügbar
  
Phase 3 (Woche 3-6): Frontend-Entwicklung
  - Three.js-Viewer entwickelt
  - Beide Viewer parallel nutzbar
  
Phase 4 (Woche 7-8): Validierung
  - Performance-Vergleich
  - Feature-Vergleich
  - Entscheidung: Migration oder Parallel-Betrieb
```

---

## Teil 5: Testing

### 5.1 Unit Tests (Python)

```python
import pytest

def test_ifc_to_gltf_conversion():
    converter = IfcToGltfConverter('tests/fixtures/sample.ifc')
    gltf_data, metadata = converter.convert()
    
    # GLB Magic Number check
    assert gltf_data[:4] == b'glTF'
    
    # Metadata structure
    assert 'elements' in metadata
    assert 'types' in metadata
    assert len(metadata['elements']) > 0

def test_metadata_extraction():
    extractor = MetadataExtractor()
    ifc = ifcopenshell.open('tests/fixtures/sample.ifc')
    metadata = extractor.extract(ifc)
    
    assert metadata['modelId']
    assert len(metadata['types']) > 0
    assert 'IfcWall' in metadata['types']  # Assuming sample has walls
```

### 5.2 Integration Tests (.NET)

```csharp
[Fact]
public async Task GetGltfGeometry_ReturnsGlbFile()
{
    // Arrange
    var modelId = "test-model-123";
    
    // Act
    var response = await _client.GetAsync($"/api/models/{modelId}/geometry/gltf");
    
    // Assert
    response.EnsureSuccessStatusCode();
    Assert.Equal("application/octet-stream", response.Content.Headers.ContentType.MediaType);
    
    var bytes = await response.Content.ReadAsByteArrayAsync();
    Assert.Equal("glTF", Encoding.ASCII.GetString(bytes.Take(4).ToArray()));
}
```

---

## Teil 6: Performance-Überlegungen

### 6.1 Caching

```python
# Redis-Cache für konvertierte Modelle
import redis

cache = redis.Redis(host='localhost', port=6379)

def get_or_convert_gltf(ifc_file_path: str) -> bytes:
    cache_key = f"gltf:{hash(ifc_file_path)}"
    
    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Convert
    converter = IfcToGltfConverter(ifc_file_path)
    gltf_data, _ = converter.convert()
    
    # Cache for