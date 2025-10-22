"""
Spatial Tree Extraction Module

Extracts IFC spatial hierarchy (Project → Site → Building → Storey → Elements)
using recursive traversal with IfcOpenShell API.

This module is inspired by Bonsai's spatial tree concepts but independently implemented
using the IfcOpenShell API (LGPL).

Algorithm Concept:
1. Start at IfcProject (root element)
2. Recursively traverse via IfcRelAggregates (using get_decomposition helper)
3. Build tree structure with parent-child relationships
4. Include element metadata (GUID, name, type)

References:
- IfcOpenShell: https://ifcopenshell.org/
- Bonsai concepts (inspiration only): https://bonsaibim.org/
- IFC Standard: https://technical.buildingsmart.org/standards/ifc/
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import ifcopenshell
import ifcopenshell.util.element
from .cache_manager import IfcCacheManager, get_global_cache


# IFC spatial element types (from IFC standard)
SPATIAL_ELEMENT_TYPES = {
    "IfcProject",
    "IfcSite",
    "IfcBuilding",
    "IfcBuildingStorey",
    "IfcSpace",
    "IfcZone",
}


@dataclass
class SpatialNode:
    """
    Represents a node in the spatial hierarchy tree.

    Attributes:
        global_id: IFC GlobalId (GUID) of the element
        name: Element name
        ifc_type: IFC entity type (e.g., IfcSite, IfcBuilding)
        description: Optional element description
        long_name: Optional long name (for storeys, sites, etc.)
        children: List of child nodes in the hierarchy
    """
    global_id: str
    name: Optional[str]
    ifc_type: str
    description: Optional[str] = None
    long_name: Optional[str] = None
    children: List["SpatialNode"] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "global_id": self.global_id,
            "name": self.name,
            "ifc_type": self.ifc_type,
            "description": self.description,
            "long_name": self.long_name,
            "children": [child.to_dict() for child in self.children]
        }


class SpatialTreeExtractor:
    """
    Extract spatial hierarchy tree from IFC files.

    Uses IfcOpenShell's get_decomposition() utility to recursively traverse
    the spatial structure. This is a clean-room implementation inspired by
    Bonsai's approach but using only the IfcOpenShell API (LGPL).

    Supports caching for performance optimization.

    Usage:
        extractor = SpatialTreeExtractor()
        tree = extractor.extract_tree("model.ifc")
        print(tree.to_dict())
    """

    def __init__(self, cache_manager: Optional[IfcCacheManager] = None):
        """
        Initialize the spatial tree extractor.

        Args:
            cache_manager: Optional cache manager instance (uses global cache if None)
        """
        self.ifc_file: Optional[ifcopenshell.file] = None
        self.cache = cache_manager or get_global_cache()

    def open_file(self, file_path: str) -> None:
        """
        Open an IFC file for processing using cache.

        Args:
            file_path: Path to the IFC file

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If file cannot be opened
        """
        try:
            self.ifc_file = self.cache.get_or_load(file_path)
        except FileNotFoundError:
            raise FileNotFoundError(f"IFC file not found: {file_path}")
        except RuntimeError as e:
            raise RuntimeError(f"Failed to open IFC file: {e}")

    def extract_tree(self, file_path: str) -> SpatialNode:
        """
        Extract complete spatial hierarchy tree from IFC file.

        Args:
            file_path: Path to the IFC file

        Returns:
            SpatialNode representing the root (IfcProject) with full tree

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If IFC file has no IfcProject or extraction fails
        """
        self.open_file(file_path)

        # Get the IfcProject (root of spatial hierarchy)
        projects = self.ifc_file.by_type("IfcProject")

        if not projects:
            raise RuntimeError("No IfcProject found in IFC file")

        project = projects[0]

        # Build tree recursively starting from project
        tree = self._build_node(project)

        return tree

    def _build_node(self, element: ifcopenshell.entity_instance, include_spaces: bool = False) -> SpatialNode:
        """
        Recursively build a spatial node and its children.

        This method properly traverses the IFC spatial hierarchy:
        - Project → Site → Building → Storey (via IfcRelAggregates)
        - Storey contains Spaces (via IfcRelContainedInSpatialStructure)

        Args:
            element: IFC element to build node for
            include_spaces: If True, include IfcSpace children (for Storeys)

        Returns:
            SpatialNode with children populated recursively
        """
        # Create node for current element
        node = SpatialNode(
            global_id=element.GlobalId if hasattr(element, "GlobalId") else "",
            name=element.Name if hasattr(element, "Name") else None,
            ifc_type=element.is_a(),
            description=element.Description if hasattr(element, "Description") else None,
            long_name=element.LongName if hasattr(element, "LongName") else None,
        )

        element_type = element.is_a()

        # Define which children types are valid for each parent type
        # This enforces the correct hierarchy: Project → Site → Building → Storey → Space
        valid_child_types = {
            "IfcProject": {"IfcSite"},
            "IfcSite": {"IfcBuilding"},
            "IfcBuilding": {"IfcBuildingStorey"},
            "IfcBuildingStorey": {"IfcSpace"},  # Spaces are leaf nodes
            "IfcSpace": set(),  # Spaces have no spatial children
        }

        # Get the allowed child types for this element
        allowed_children = valid_child_types.get(element_type, set())

        if not allowed_children:
            # No children allowed for this type
            return node

        # Get spatial decomposition (children) using IfcOpenShell utility
        try:
            decomposition = ifcopenshell.util.element.get_decomposition(element)
        except Exception:
            # If get_decomposition fails, return node without children
            return node

        # Recursively build child nodes (only for correct spatial hierarchy)
        for child in decomposition:
            child_type = child.is_a()

            # Only include children that belong in this level of the hierarchy
            if child_type in allowed_children:
                # For storeys, this will include spaces; for others, only structural children
                child_node = self._build_node(child, include_spaces=(child_type == "IfcBuildingStorey"))
                node.children.append(child_node)

        # Add physical building elements contained in this spatial element
        # (walls, doors, windows, slabs, etc.)
        if element_type in {"IfcBuildingStorey", "IfcSpace"}:
            try:
                # Get elements contained in this spatial structure
                # Using IfcRelContainedInSpatialStructure relationship
                for rel in getattr(element, 'ContainsElements', []):
                    for contained_element in rel.RelatedElements:
                        # Skip spatial elements (we only want physical building elements)
                        if contained_element.is_a() not in SPATIAL_ELEMENT_TYPES:
                            element_node = SpatialNode(
                                global_id=contained_element.GlobalId if hasattr(contained_element, "GlobalId") else "",
                                name=contained_element.Name if hasattr(contained_element, "Name") else None,
                                ifc_type=contained_element.is_a(),
                                description=contained_element.Description if hasattr(contained_element, "Description") else None,
                                long_name=None,
                                children=[]  # Building elements don't have children in this tree
                            )
                            node.children.append(element_node)
            except Exception:
                # If getting contained elements fails, continue without them
                pass

        return node

    def get_spatial_elements_flat(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Get all spatial elements as a flat list (no tree structure).

        Useful for quick listing or filtering spatial elements without
        building the full tree.

        Args:
            file_path: Path to the IFC file

        Returns:
            List of dictionaries with spatial element info
        """
        self.open_file(file_path)

        elements = []

        for spatial_type in SPATIAL_ELEMENT_TYPES:
            for element in self.ifc_file.by_type(spatial_type):
                elements.append({
                    "global_id": element.GlobalId if hasattr(element, "GlobalId") else "",
                    "name": element.Name if hasattr(element, "Name") else None,
                    "ifc_type": element.is_a(),
                    "description": element.Description if hasattr(element, "Description") else None,
                    "long_name": element.LongName if hasattr(element, "LongName") else None,
                })

        return elements

    def get_elements_in_storey(self, file_path: str, storey_guid: str) -> List[Dict[str, Any]]:
        """
        Get all elements contained in a specific building storey.

        Args:
            file_path: Path to the IFC file
            storey_guid: GlobalId of the IfcBuildingStorey

        Returns:
            List of dictionaries with element info (walls, doors, windows, etc.)

        Raises:
            ValueError: If storey not found
        """
        self.open_file(file_path)

        try:
            storey = self.ifc_file.by_guid(storey_guid)
        except Exception:
            raise ValueError(f"Building storey with GUID {storey_guid} not found")

        if storey.is_a() != "IfcBuildingStorey":
            raise ValueError(f"Element {storey_guid} is not an IfcBuildingStorey")

        # Get all elements contained in this storey using IfcOpenShell utility
        contained_elements = ifcopenshell.util.element.get_decomposition(storey)

        elements = []
        for element in contained_elements:
            elements.append({
                "global_id": element.GlobalId if hasattr(element, "GlobalId") else "",
                "name": element.Name if hasattr(element, "Name") else None,
                "ifc_type": element.is_a(),
            })

        return elements
