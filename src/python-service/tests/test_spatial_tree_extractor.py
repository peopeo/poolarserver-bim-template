"""
Unit tests for spatial_tree_extractor module.

Tests the SpatialTreeExtractor class for extracting IFC spatial hierarchies.
"""

import pytest
from pathlib import Path
import ifcopenshell

from ifc_intelligence.spatial_tree_extractor import (
    SpatialTreeExtractor,
    SpatialNode,
    SPATIAL_ELEMENT_TYPES
)

# Test file path
TEST_IFC_FILE = Path(__file__).parent / "fixtures" / "Duplex.ifc"


def test_extractor_initialization():
    """Test that extractor can be initialized."""
    extractor = SpatialTreeExtractor()
    assert extractor.ifc_file is None


def test_open_file():
    """Test opening an IFC file."""
    extractor = SpatialTreeExtractor()
    extractor.open_file(str(TEST_IFC_FILE))

    assert extractor.ifc_file is not None
    assert extractor.ifc_file.schema in ["IFC2X3", "IFC4", "IFC4X3"]


def test_open_nonexistent_file():
    """Test opening a non-existent file raises RuntimeError."""
    extractor = SpatialTreeExtractor()

    with pytest.raises(RuntimeError, match="Failed to open IFC file"):
        extractor.open_file("/nonexistent/file.ifc")


def test_extract_tree():
    """Test extracting full spatial tree from Duplex.ifc."""
    extractor = SpatialTreeExtractor()
    tree = extractor.extract_tree(str(TEST_IFC_FILE))

    # Root should be IfcProject
    assert tree.ifc_type == "IfcProject"
    assert tree.global_id is not None
    assert tree.name is not None

    # Should have children (IfcSite)
    assert len(tree.children) > 0


def test_tree_structure():
    """Test that spatial tree has correct hierarchy."""
    extractor = SpatialTreeExtractor()
    tree = extractor.extract_tree(str(TEST_IFC_FILE))

    # Verify hierarchy: Project → Site → Building → Storey
    assert tree.ifc_type == "IfcProject"

    # Find IfcSite in children
    sites = [child for child in tree.children if child.ifc_type == "IfcSite"]
    assert len(sites) > 0

    site = sites[0]
    assert site.global_id is not None

    # Find IfcBuilding in site children
    buildings = [child for child in site.children if child.ifc_type == "IfcBuilding"]
    assert len(buildings) > 0

    building = buildings[0]
    assert building.global_id is not None

    # Find IfcBuildingStorey in building children
    storeys = [child for child in building.children if child.ifc_type == "IfcBuildingStorey"]
    assert len(storeys) > 0

    storey = storeys[0]
    assert storey.global_id is not None


def test_spatial_node_to_dict():
    """Test converting SpatialNode to dictionary."""
    node = SpatialNode(
        global_id="test-guid",
        name="Test Node",
        ifc_type="IfcBuilding",
        description="Test description",
        long_name="Test Long Name",
        children=[]
    )

    result = node.to_dict()

    assert result["global_id"] == "test-guid"
    assert result["name"] == "Test Node"
    assert result["ifc_type"] == "IfcBuilding"
    assert result["description"] == "Test description"
    assert result["long_name"] == "Test Long Name"
    assert result["children"] == []


def test_spatial_node_with_children():
    """Test SpatialNode with nested children."""
    child_node = SpatialNode(
        global_id="child-guid",
        name="Child",
        ifc_type="IfcBuildingStorey",
        children=[]
    )

    parent_node = SpatialNode(
        global_id="parent-guid",
        name="Parent",
        ifc_type="IfcBuilding",
        children=[child_node]
    )

    result = parent_node.to_dict()

    assert len(result["children"]) == 1
    assert result["children"][0]["global_id"] == "child-guid"
    assert result["children"][0]["ifc_type"] == "IfcBuildingStorey"


def test_get_spatial_elements_flat():
    """Test getting spatial elements as flat list."""
    extractor = SpatialTreeExtractor()
    elements = extractor.get_spatial_elements_flat(str(TEST_IFC_FILE))

    assert len(elements) > 0

    # Check that all elements are spatial types
    for element in elements:
        assert element["ifc_type"] in SPATIAL_ELEMENT_TYPES
        assert "global_id" in element
        assert "name" in element
        assert "ifc_type" in element

    # Should have at least: 1 Project, 1 Site, 1 Building, 1+ Storey
    types = {elem["ifc_type"] for elem in elements}
    assert "IfcProject" in types
    assert "IfcSite" in types
    assert "IfcBuilding" in types
    assert "IfcBuildingStorey" in types


def test_get_elements_in_storey():
    """Test getting elements contained in a specific storey."""
    extractor = SpatialTreeExtractor()

    # First, extract tree to find a storey GUID
    tree = extractor.extract_tree(str(TEST_IFC_FILE))

    # Find first storey in tree (may be at different levels depending on IFC structure)
    def find_storey(node):
        if node.ifc_type == "IfcBuildingStorey":
            return node
        for child in node.children:
            result = find_storey(child)
            if result:
                return result
        return None

    storey = find_storey(tree)
    assert storey is not None, "No IfcBuildingStorey found in tree"
    assert storey.ifc_type == "IfcBuildingStorey"
    storey_guid = storey.global_id

    # Now get elements in this storey
    elements = extractor.get_elements_in_storey(str(TEST_IFC_FILE), storey_guid)

    # Duplex.ifc should have elements in the storey
    # (walls, doors, windows, etc. though they might not all be in decomposition)
    assert isinstance(elements, list)

    # Each element should have required fields
    for element in elements:
        assert "global_id" in element
        assert "ifc_type" in element


def test_get_elements_in_storey_invalid_guid():
    """Test that invalid storey GUID raises ValueError."""
    extractor = SpatialTreeExtractor()

    with pytest.raises(ValueError, match="not found"):
        extractor.get_elements_in_storey(str(TEST_IFC_FILE), "invalid-guid-123")


def test_get_elements_in_storey_wrong_type():
    """Test that non-storey GUID raises ValueError."""
    extractor = SpatialTreeExtractor()

    # Get project GUID (not a storey)
    tree = extractor.extract_tree(str(TEST_IFC_FILE))
    project_guid = tree.global_id

    with pytest.raises(ValueError, match="not an IfcBuildingStorey"):
        extractor.get_elements_in_storey(str(TEST_IFC_FILE), project_guid)


def test_tree_node_attributes():
    """Test that tree nodes have all expected attributes."""
    extractor = SpatialTreeExtractor()
    tree = extractor.extract_tree(str(TEST_IFC_FILE))

    # Check project node
    assert hasattr(tree, "global_id")
    assert hasattr(tree, "name")
    assert hasattr(tree, "ifc_type")
    assert hasattr(tree, "description")
    assert hasattr(tree, "long_name")
    assert hasattr(tree, "children")

    assert tree.global_id is not None
    assert tree.name is not None
    assert tree.ifc_type == "IfcProject"


def test_spatial_element_types_constant():
    """Test that SPATIAL_ELEMENT_TYPES contains expected types."""
    assert "IfcProject" in SPATIAL_ELEMENT_TYPES
    assert "IfcSite" in SPATIAL_ELEMENT_TYPES
    assert "IfcBuilding" in SPATIAL_ELEMENT_TYPES
    assert "IfcBuildingStorey" in SPATIAL_ELEMENT_TYPES
    assert "IfcSpace" in SPATIAL_ELEMENT_TYPES
    assert "IfcZone" in SPATIAL_ELEMENT_TYPES

    # Non-spatial types should NOT be included
    assert "IfcWall" not in SPATIAL_ELEMENT_TYPES
    assert "IfcDoor" not in SPATIAL_ELEMENT_TYPES
