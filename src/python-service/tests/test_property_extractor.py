"""
Unit Tests for Property Extractor

Tests the PropertyExtractor class with real IFC files.
"""

import pytest
from pathlib import Path
from ifc_intelligence.property_extractor import PropertyExtractor, IfcElementProperties


# Test fixtures path
XEOKIT_IFC_DIR = Path(__file__).parent.parent.parent.parent / "xeokit-sdk" / "assets" / "models" / "ifc"
DUPLEX_IFC = XEOKIT_IFC_DIR / "Duplex.ifc"

# Known GUIDs from Duplex.ifc (first wall element)
WALL_GUID = "2O2Fr$t4X7Zf8NOew3FKau"


def test_extractor_initialization():
    """Test that PropertyExtractor can be instantiated."""
    extractor = PropertyExtractor()
    assert extractor is not None
    assert extractor.ifc_file is None


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_extractor_with_file_path():
    """Test initialization with file path."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))
    assert extractor.ifc_file is not None


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_open_file():
    """Test opening an IFC file."""
    extractor = PropertyExtractor()
    extractor.open_file(str(DUPLEX_IFC))
    assert extractor.ifc_file is not None


def test_open_nonexistent_file():
    """Test error handling for non-existent file."""
    extractor = PropertyExtractor()

    with pytest.raises(FileNotFoundError):
        extractor.open_file("/nonexistent/file.ifc")


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_get_element_by_guid():
    """Test retrieving an element by GlobalId."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))

    element = extractor.get_element_by_guid(WALL_GUID)
    assert element is not None
    assert element.is_a() == "IfcWall"


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_get_element_by_invalid_guid():
    """Test handling of invalid GUID."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))

    element = extractor.get_element_by_guid("InvalidGUID123")
    assert element is None


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_extract_properties():
    """Test extracting properties from an element."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))

    properties = extractor.extract_properties(WALL_GUID)

    # Check return type
    assert isinstance(properties, IfcElementProperties)

    # Check basic attributes
    assert properties.global_id == WALL_GUID
    assert properties.element_type == "IfcWall"
    assert properties.name is not None

    # Check that property_sets is a dictionary
    assert isinstance(properties.property_sets, dict)

    # Should have some PropertySets (Duplex has Pset_WallCommon)
    assert len(properties.property_sets) > 0

    # Check for expected PropertySet
    assert "Pset_WallCommon" in properties.property_sets


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_extract_properties_invalid_guid():
    """Test error handling for invalid GUID during extraction."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))

    with pytest.raises(RuntimeError, match="Element not found"):
        extractor.extract_properties("InvalidGUID123")


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_extract_properties_batch():
    """Test batch property extraction."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))

    # Get some wall GUIDs
    walls = extractor.ifc_file.by_type("IfcWall")
    wall_guids = [wall.GlobalId for wall in walls[:5]]  # Get first 5 walls

    results = extractor.extract_properties_batch(wall_guids)

    # Check results
    assert isinstance(results, dict)
    assert len(results) == 5

    for guid, properties in results.items():
        assert isinstance(properties, IfcElementProperties)
        assert properties.global_id == guid
        # Wall can be IfcWall or IfcWallStandardCase
        assert properties.element_type in ["IfcWall", "IfcWallStandardCase"]


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_get_all_elements_with_properties():
    """Test getting all elements with properties."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))

    global_ids = extractor.get_all_elements_with_properties()

    # Check results
    assert isinstance(global_ids, list)
    assert len(global_ids) > 0

    # All should be strings (GUIDs)
    for guid in global_ids:
        assert isinstance(guid, str)
        assert len(guid) == 22  # IFC GUID length


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_property_set_structure():
    """Test the structure of extracted PropertySets."""
    extractor = PropertyExtractor(str(DUPLEX_IFC))
    properties = extractor.extract_properties(WALL_GUID)

    # Check Pset_WallCommon structure
    if "Pset_WallCommon" in properties.property_sets:
        pset = properties.property_sets["Pset_WallCommon"]

        # Should be a dictionary
        assert isinstance(pset, dict)

        # Should have property keys
        assert len(pset) > 0

        # All values should be serializable types
        for key, value in pset.items():
            assert isinstance(key, str)
            assert value is None or isinstance(value, (str, int, float, bool, list))


def test_extract_without_file_loaded():
    """Test error when extracting without loading a file."""
    extractor = PropertyExtractor()

    with pytest.raises(RuntimeError, match="No IFC file loaded"):
        extractor.extract_properties(WALL_GUID)


def test_clean_property_dict():
    """Test property dictionary cleaning."""
    extractor = PropertyExtractor()

    # Test data with various types
    test_data = {
        "id": 123,  # Should be removed
        "type": "test",  # Should be removed
        "string_prop": "value",
        "int_prop": 42,
        "float_prop": 3.14,
        "bool_prop": True,
        "none_prop": None,
        "list_prop": [1, 2, 3]
    }

    cleaned = extractor._clean_property_dict(test_data)

    # Internal keys should be removed
    assert "id" not in cleaned
    assert "type" not in cleaned

    # Other properties should be preserved
    assert cleaned["string_prop"] == "value"
    assert cleaned["int_prop"] == 42
    assert cleaned["float_prop"] == 3.14
    assert cleaned["bool_prop"] is True
    assert cleaned["none_prop"] is None
    assert cleaned["list_prop"] == [1, 2, 3]
