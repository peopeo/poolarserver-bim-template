"""
IFC to glTF Exporter

Converts IFC files to glTF/GLB format using IfcConvert binary.

This is an independent implementation inspired by Bonsai concepts but
implemented from scratch using IfcConvert CLI.

License: MIT (our code) + LGPL (IfcOpenShell/IfcConvert binary)
"""

import subprocess
import os
from pathlib import Path
from typing import Optional, Literal
from dataclasses import dataclass


@dataclass
class GltfExportOptions:
    """
    Configuration options for glTF export.

    Attributes:
        use_element_guids: Use IFC GlobalId for mesh names (recommended for BIM)
        use_element_names: Use IFC Name for mesh names
        use_material_names: Use material names instead of IDs
        center_model: Center the model at origin
        no_normals: Disable normal computation (faster but no lighting)
        y_up: Use Y-up coordinate system (default is Z-up)
    """
    use_element_guids: bool = True
    use_element_names: bool = False
    use_material_names: bool = True
    center_model: bool = False
    no_normals: bool = False
    y_up: bool = False


@dataclass
class GltfExportResult:
    """
    Result of glTF export operation.

    Attributes:
        success: Whether export succeeded
        output_path: Path to generated glTF/GLB file
        file_size: Size of output file in bytes
        error_message: Error message if export failed
        stdout: Standard output from IfcConvert
        stderr: Standard error from IfcConvert
    """
    success: bool
    output_path: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None


class GltfExporter:
    """
    Export IFC files to glTF/GLB format using IfcConvert.

    Uses IfcConvert binary (LGPL) from IfcOpenShell.
    Strategy inspired by Bonsai's geometry export approach.
    """

    def __init__(self, ifcconvert_path: str = "IfcConvert"):
        """
        Initialize the glTF exporter.

        Args:
            ifcconvert_path: Path to IfcConvert binary (default: searches PATH)
        """
        self.ifcconvert_path = ifcconvert_path

    def export(
        self,
        ifc_file_path: str,
        output_path: str,
        format: Literal["glb", "gltf"] = "glb",
        options: Optional[GltfExportOptions] = None
    ) -> GltfExportResult:
        """
        Export IFC file to glTF/GLB format.

        Args:
            ifc_file_path: Path to input IFC file
            output_path: Path to output glTF/GLB file
            format: Output format ('glb' for binary, 'gltf' for JSON)
            options: Export options (uses defaults if None)

        Returns:
            GltfExportResult with success status and details

        Raises:
            FileNotFoundError: If IFC file doesn't exist
        """
        # Validate input file
        if not os.path.exists(ifc_file_path):
            raise FileNotFoundError(f"IFC file not found: {ifc_file_path}")

        # Use default options if not provided
        if options is None:
            options = GltfExportOptions()

        # Ensure output has correct extension
        output_path = self._ensure_extension(output_path, format)

        # Build IfcConvert command
        command = self._build_command(ifc_file_path, output_path, options)

        # Execute IfcConvert
        try:
            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False  # Don't raise exception, we'll handle errors manually
            )

            # Check if export succeeded
            if result.returncode == 0 and os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                return GltfExportResult(
                    success=True,
                    output_path=output_path,
                    file_size=file_size,
                    stdout=result.stdout,
                    stderr=result.stderr
                )
            else:
                error_msg = result.stderr or result.stdout or f"IfcConvert exited with code {result.returncode}"
                return GltfExportResult(
                    success=False,
                    error_message=error_msg,
                    stdout=result.stdout,
                    stderr=result.stderr
                )

        except FileNotFoundError:
            return GltfExportResult(
                success=False,
                error_message=f"IfcConvert binary not found at: {self.ifcconvert_path}"
            )
        except Exception as e:
            return GltfExportResult(
                success=False,
                error_message=f"Unexpected error during export: {str(e)}"
            )

    def _build_command(
        self,
        ifc_file_path: str,
        output_path: str,
        options: GltfExportOptions
    ) -> list[str]:
        """
        Build IfcConvert command with options.

        Args:
            ifc_file_path: Path to input IFC file
            output_path: Path to output file
            options: Export options

        Returns:
            Command as list of strings
        """
        command = [self.ifcconvert_path]

        # Add options
        if options.use_element_guids:
            command.append("--use-element-guids")

        if options.use_element_names:
            command.append("--use-element-names")

        if options.use_material_names:
            command.append("--use-material-names")

        if options.center_model:
            command.append("--center-model")

        if options.no_normals:
            command.append("--no-normals")

        if options.y_up:
            command.append("--y-up")

        # Add input and output files
        command.append(ifc_file_path)
        command.append(output_path)

        return command

    def _ensure_extension(self, output_path: str, format: str) -> str:
        """
        Ensure output path has correct file extension.

        Args:
            output_path: Original output path
            format: Desired format ('glb' or 'gltf')

        Returns:
            Output path with correct extension
        """
        path = Path(output_path)
        expected_ext = f".{format}"

        if path.suffix.lower() != expected_ext:
            return str(path.with_suffix(expected_ext))

        return output_path
