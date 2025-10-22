#!/usr/bin/env python3
"""
IFC to glTF Export CLI Script

Convert an IFC file to glTF/GLB format and output result as JSON.

Usage:
    python scripts/export_gltf.py <input.ifc> <output.glb> [--format glb|gltf] [--use-names]

Output:
    JSON to stdout with export result

This script is designed to be called by the .NET backend via ProcessRunner.
"""

import sys
import json
import argparse
from dataclasses import asdict
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ifc_intelligence.gltf_exporter import GltfExporter, GltfExportOptions


def main():
    """Main entry point for CLI script."""

    parser = argparse.ArgumentParser(
        description="Convert IFC file to glTF/GLB format",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "input_file",
        help="Path to input IFC file"
    )

    parser.add_argument(
        "output_file",
        help="Path to output glTF/GLB file"
    )

    parser.add_argument(
        "--format",
        choices=["glb", "gltf"],
        default="glb",
        help="Output format (default: glb)"
    )

    parser.add_argument(
        "--use-names",
        action="store_true",
        help="Use element names instead of GUIDs"
    )

    parser.add_argument(
        "--no-guids",
        action="store_true",
        help="Don't use element GUIDs (use internal IDs)"
    )

    parser.add_argument(
        "--no-material-names",
        action="store_true",
        help="Don't use material names"
    )

    parser.add_argument(
        "--center",
        action="store_true",
        help="Center the model at origin"
    )

    parser.add_argument(
        "--y-up",
        action="store_true",
        help="Use Y-up coordinate system (default is Z-up)"
    )

    args = parser.parse_args()

    try:
        import time
        from datetime import datetime

        # Initialize metrics
        start_time = time.time()
        metrics = {
            "start_time": datetime.utcnow().isoformat(),
            "timings": {}
        }

        # Create exporter instance
        exporter = GltfExporter()

        # Configure export options
        options = GltfExportOptions(
            use_element_guids=not args.no_guids,
            use_element_names=args.use_names,
            use_material_names=not args.no_material_names,
            center_model=args.center,
            y_up=args.y_up
        )

        # Export IFC to glTF
        export_start = time.time()
        result = exporter.export(
            ifc_file_path=args.input_file,
            output_path=args.output_file,
            format=args.format,
            options=options
        )
        export_time_ms = int((time.time() - export_start) * 1000)

        # Calculate metrics
        metrics["timings"]["gltf_export_ms"] = export_time_ms
        metrics["timings"]["total_ms"] = export_time_ms
        metrics["end_time"] = datetime.utcnow().isoformat()
        metrics["statistics"] = {
            "gltf_file_size_bytes": result.file_size if result.success else None
        }

        # Convert result to dict for JSON serialization
        result_dict = {
            "success": result.success,
            "output_path": result.output_path,
            "file_size": result.file_size,
            "error_message": result.error_message,
            "metrics": metrics
            # Omit stdout/stderr in JSON output (can be large)
        }

        # Output as JSON to stdout
        print(json.dumps(result_dict, indent=2))

        # Exit with appropriate code
        sys.exit(0 if result.success else 1)

    except FileNotFoundError as e:
        error_result = {"success": False, "error_message": f"File not found: {str(e)}"}
        print(json.dumps(error_result))
        sys.exit(1)

    except Exception as e:
        error_result = {"success": False, "error_message": f"Unexpected error: {str(e)}"}
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
