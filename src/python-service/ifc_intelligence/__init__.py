"""
IFC Intelligence Service

Provides IFC parsing, spatial tree extraction, property extraction, and glTF export
capabilities for BIM applications.

This package is inspired by Bonsai/BlenderBIM concepts but independently implemented
using the IfcOpenShell API (LGPL).

Architecture Concepts:
- Clean separation of concerns (inspired by Bonsai's Core/Tool pattern)
- IfcOpenShell API as the foundation (LGPL - legally safe to use)
- No GPL code dependencies (our implementation is MIT-licensable)

Key Modules:
- parser: IFC file metadata extraction
- spatial_tree: Spatial hierarchy extraction (Project → Site → Building → Storey)
- property_extractor: PropertySet extraction from IFC elements
- gltf_exporter: IFC to glTF/GLB conversion
- cache_manager: RAM caching for performance

Usage:
    from ifc_intelligence.parser import IfcParser
    from ifc_intelligence.spatial_tree import SpatialTreeExtractor

    parser = IfcParser()
    metadata = parser.parse_file("model.ifc")

License:
    - This package: MIT License
    - IfcOpenShell (dependency): LGPL-3.0-or-later
    - Bonsai (inspiration only): GPL-3.0-or-later (NOT included)

References:
    - IfcOpenShell: https://ifcopenshell.org/
    - Bonsai (concept reference): https://bonsaibim.org/
    - IFC Standard: https://technical.buildingsmart.org/standards/ifc/
"""

__version__ = "0.1.0"
__author__ = "Your Team"
__license__ = "MIT"

# Module imports
from .parser import IfcParser
from .models import IfcMetadata
from .gltf_exporter import GltfExporter, GltfExportOptions, GltfExportResult
from .property_extractor import PropertyExtractor, IfcElementProperties
from .spatial_tree_extractor import SpatialTreeExtractor, SpatialNode

# Future imports
# from .cache_manager import IfcCacheManager

__all__ = [
    "IfcParser",
    "IfcMetadata",
    "GltfExporter",
    "GltfExportOptions",
    "GltfExportResult",
    "PropertyExtractor",
    "IfcElementProperties",
    "SpatialTreeExtractor",
    "SpatialNode",
]
