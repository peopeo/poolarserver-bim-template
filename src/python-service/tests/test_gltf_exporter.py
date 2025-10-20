"""
Unit Tests for glTF Exporter

Tests the GltfExporter class with real IFC files.
"""

import pytest
import os
from pathlib import Path
from ifc_intelligence.gltf_exporter import GltfExporter, GltfExportOptions, GltfExportResult


# Test fixtures path
FIXTURES_DIR = Path(__file__).parent / "fixtures"
SAMPLE_IFC = FIXTURES_DIR / "sample.ifc"

# Real IFC file with geometry (from xeokit-sdk)
XEOKIT_IFC_DIR = Path(__file__).parent.parent.parent.parent / "xeokit-sdk" / "assets" / "models" / "ifc"
DUPLEX_IFC = XEOKIT_IFC_DIR / "Duplex.ifc"


def test_exporter_initialization():
    """Test that GltfExporter can be instantiated."""
    exporter = GltfExporter()
    assert exporter is not None
    assert exporter.ifcconvert_path == "IfcConvert"


def test_exporter_custom_path():
    """Test GltfExporter with custom IfcConvert path."""
    exporter = GltfExporter(ifcconvert_path="/usr/local/bin/IfcConvert")
    assert exporter.ifcconvert_path == "/usr/local/bin/IfcConvert"


def test_export_options_defaults():
    """Test default export options."""
    options = GltfExportOptions()
    assert options.use_element_guids is True
    assert options.use_element_names is False
    assert options.use_material_names is True
    assert options.center_model is False
    assert options.no_normals is False
    assert options.y_up is False


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_export_glb_success(tmp_path):
    """Test successful glTF export with real IFC file."""
    exporter = GltfExporter()
    output_path = tmp_path / "output.glb"

    result = exporter.export(
        ifc_file_path=str(DUPLEX_IFC),
        output_path=str(output_path),
        format="glb"
    )

    # Check result
    assert result.success is True
    assert result.output_path == str(output_path)
    assert result.file_size is not None
    assert result.file_size > 0
    assert result.error_message is None

    # Check file exists
    assert output_path.exists()
    assert output_path.stat().st_size > 0


@pytest.mark.skipif(not DUPLEX_IFC.exists(), reason="Duplex.ifc not available")
def test_export_with_options(tmp_path):
    """Test export with custom options."""
    exporter = GltfExporter()
    output_path = tmp_path / "output_names.glb"

    options = GltfExportOptions(
        use_element_guids=False,
        use_element_names=True,
        center_model=True
    )

    result = exporter.export(
        ifc_file_path=str(DUPLEX_IFC),
        output_path=str(output_path),
        format="glb",
        options=options
    )

    assert result.success is True
    assert output_path.exists()


def test_export_nonexistent_file(tmp_path):
    """Test error handling for non-existent file."""
    exporter = GltfExporter()
    output_path = tmp_path / "output.glb"

    with pytest.raises(FileNotFoundError):
        exporter.export(
            ifc_file_path="/nonexistent/file.ifc",
            output_path=str(output_path),
            format="glb"
        )


def test_ensure_extension():
    """Test file extension correction."""
    exporter = GltfExporter()

    # Test GLB extension
    assert exporter._ensure_extension("output.txt", "glb") == "output.glb"
    assert exporter._ensure_extension("output.glb", "glb") == "output.glb"
    assert exporter._ensure_extension("output", "glb") == "output.glb"

    # Test glTF extension
    assert exporter._ensure_extension("output.glb", "gltf") == "output.gltf"
    assert exporter._ensure_extension("output.gltf", "gltf") == "output.gltf"


def test_build_command():
    """Test IfcConvert command building."""
    exporter = GltfExporter()

    options = GltfExportOptions(
        use_element_guids=True,
        use_element_names=False,
        use_material_names=True,
        center_model=True,
        y_up=False
    )

    command = exporter._build_command("input.ifc", "output.glb", options)

    assert command[0] == "IfcConvert"
    assert "--use-element-guids" in command
    assert "--use-material-names" in command
    assert "--center-model" in command
    assert "--use-element-names" not in command
    assert "--y-up" not in command
    assert "input.ifc" in command
    assert "output.glb" in command


@pytest.mark.skipif(not SAMPLE_IFC.exists(), reason="sample.ifc not available")
def test_export_ifc_without_geometry(tmp_path):
    """Test export with IFC file that has no geometry (should fail gracefully)."""
    exporter = GltfExporter()
    output_path = tmp_path / "sample_output.glb"

    result = exporter.export(
        ifc_file_path=str(SAMPLE_IFC),
        output_path=str(output_path),
        format="glb"
    )

    # IfcConvert succeeds but doesn't create output file (no geometry)
    assert result.success is False
    assert result.error_message is not None
