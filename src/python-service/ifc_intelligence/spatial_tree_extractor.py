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

    Usage:
        extractor = SpatialTreeExtractor()
        tree = extractor.extract_tree("model.ifc")
        print(tree.to_dict())
    """

    def __init__(self):
        """Initialize the spatial tree extractor."""
        self.ifc_file: Optional[ifcopenshell.file] = None

    def open_file(self, file_path: str) -> None:
        """
        Open an IFC file for processing.

        Args:
            file_path: Path to the IFC file

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If file cannot be opened
        """
        try:
            self.ifc_file = ifcopenshell.open(file_path)
        except Exception as e:
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

    def _build_node(self, element: ifcopenshell.entity_instance) -> SpatialNode:
        """
        Recursively build a spatial node and its children.

        This method uses IfcOpenShell's get_decomposition() utility to
        traverse the spatial hierarchy. The algorithm follows the IFC
        standard's spatial structure relationships (IfcRelAggregates).

        Args:
            element: IFC element to build node for

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

        # Get spatial decomposition (children) using IfcOpenShell utility
        # This internally handles IfcRelAggregates relationships
        try:
            decomposition = ifcopenshell.util.element.get_decomposition(element)
        except Exception:
            # If get_decomposition fails, return node without children
            return node

        # Recursively build child nodes (only for spatial elements)
        for child in decomposition:
            child_type = child.is_a()

            # Only include spatial elements in tree
            if child_type in SPATIAL_ELEMENT_TYPES:
                child_node = self._build_node(child)
                node.children.append(child_node)

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
