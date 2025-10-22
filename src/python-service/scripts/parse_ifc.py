#!/usr/bin/env python3
"""
IFC Parser CLI Script

Parse an IFC file and output metadata as JSON.

Usage:
    python scripts/parse_ifc.py <input.ifc>

Output:
    JSON to stdout with IFC metadata

This script is designed to be called by the .NET backend via ProcessRunner.
"""

import sys
import json
from dataclasses import asdict
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ifc_intelligence.parser import IfcParser


def main():
    """Main entry point for CLI script."""

    # Check arguments
    if len(sys.argv) < 2:
        error_result = {"error": "Usage: parse_ifc.py <input.ifc>"}
        print(json.dumps(error_result))
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        # Create parser instance
        parser = IfcParser()

        # Parse IFC file
        metadata = parser.parse_file(file_path)

        # Convert dataclass to dict
        result = asdict(metadata)

        # Output as JSON to stdout
        print(json.dumps(result, indent=2))

        # Exit with success code
        sys.exit(0)

    except FileNotFoundError as e:
        error_result = {"error": f"File not found: {str(e)}"}
        print(json.dumps(error_result))
        sys.exit(1)

    except RuntimeError as e:
        error_result = {"error": f"Runtime error: {str(e)}"}
        print(json.dumps(error_result))
        sys.exit(1)

    except Exception as e:
        error_result = {"error": f"Unexpected error: {str(e)}"}
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
