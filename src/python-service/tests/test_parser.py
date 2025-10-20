"""
Unit Tests for IFC Parser

Tests the IfcParser class with sample IFC files.
"""

import pytest
from pathlib import Path
from ifc_intelligence.parser import IfcParser
from ifc_intelligence.models import IfcMetadata


# Test fixtures path
FIXTURES_DIR = Path(__file__).parent / "fixtures"
SAMPLE_IFC = FIXTURES_DIR / "sample.ifc"


def test_parser_initialization():
    """Test that IfcParser can be instantiated."""
    parser = IfcParser()
    assert parser is not None


def test_parse_sample_file():
    """Test parsing the sample IFC file."""
    parser = IfcParser()
    metadata = parser.parse_file(str(SAMPLE_IFC))

    # Check return type
    assert isinstance(metadata, IfcMetadata)

    # Check basic fields
    assert metadata.model_id == "3vB2YO$MX4xv5uCqZZG0Xq"
    assert metadata.project_name == "Sample Project"
    assert metadata.schema == "IFC4"

    # Check entity counts
    assert "IfcWall" in metadata.entity_counts
    assert metadata.entity_counts["IfcWall"] == 2
    assert metadata.entity_counts["IfcDoor"] == 1
    assert metadata.entity_counts["IfcWindow"] == 1

    # Check authoring info
    assert metadata.author == "John Doe"
    assert metadata.organization == "Sample Organization"
    assert metadata.application == "Sample App"


def test_parse_nonexistent_file():
    """Test error handling for non-existent file."""
    parser = IfcParser()

    with pytest.raises(FileNotFoundError):
        parser.parse_file("nonexistent.ifc")


def test_entity_counts_only_includes_present_types():
    """Test that entity_counts only includes types that exist in the file."""
    parser = IfcParser()
    metadata = parser.parse_file(str(SAMPLE_IFC))

    # Should have these types
    assert "IfcWall" in metadata.entity_counts
    assert "IfcDoor" in metadata.entity_counts

    # Should NOT have types that don't exist in sample.ifc
    assert "IfcBeam" not in metadata.entity_counts
    assert "IfcColumn" not in metadata.entity_counts
