#!/usr/bin/env python3
"""
CLI script for extracting spatial tree from IFC files.

This script extracts the spatial hierarchy (Project → Site → Building → Storey)
from an IFC file and outputs it as JSON.

Usage:
    python extract_spatial_tree.py <input.ifc>
    python extract_spatial_tree.py <input.ifc> --flat
    python extract_spatial_tree.py <input.ifc> --storey <storey-guid>

Examples:
    # Extract full tree
    python extract_spatial_tree.py model.ifc

    # Extract flat list
    python extract_spatial_tree.py model.ifc --flat

    # Extract elements in a specific storey
    python extract_spatial_tree.py model.ifc --storey "2O2Fr$t4X7Zf8NOew3FKau"

Exit codes:
    0: Success
    1: Error (file not found, parsing error, etc.)
"""

import sys
import json
import argparse
from pathlib import Path

# Add parent directory to path to import ifc_intelligence package
sys.path.insert(0, str(Path(__file__).parent.parent))

from ifc_intelligence.spatial_tree_extractor import SpatialTreeExtractor


def main():
    """Main entry point for CLI script."""
    parser = argparse.ArgumentParser(
        description="Extract spatial tree from IFC file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract full tree
  python extract_spatial_tree.py model.ifc

  # Extract flat list of spatial elements
  python extract_spatial_tree.py model.ifc --flat

  # Extract elements in a specific building storey
  python extract_spatial_tree.py model.ifc --storey "2O2Fr$t4X7Zf8NOew3FKau"
        """
    )

    parser.add_argument(
        "input_file",
        type=str,
        help="Path to input IFC file"
    )

    parser.add_argument(
        "--flat",
        action="store_true",
        help="Extract spatial elements as flat list instead of tree"
    )

    parser.add_argument(
        "--storey",
        type=str,
        metavar="GUID",
        help="Extract elements in a specific building storey (by GUID)"
    )

    args = parser.parse_args()

    # Validate input file
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(json.dumps({
            "error": f"File not found: {args.input_file}"
        }), file=sys.stderr)
        sys.exit(1)

    if not input_path.suffix.lower() == ".ifc":
        print(json.dumps({
            "error": f"Not an IFC file: {args.input_file}"
        }), file=sys.stderr)
        sys.exit(1)

    try:
        extractor = SpatialTreeExtractor()

        # Handle different extraction modes
        if args.storey:
            # Extract elements in specific storey
            elements = extractor.get_elements_in_storey(str(input_path), args.storey)
            result = {
                "storey_guid": args.storey,
                "element_count": len(elements),
                "elements": elements
            }

        elif args.flat:
            # Extract flat list of spatial elements
            elements = extractor.get_spatial_elements_flat(str(input_path))
            result = {
                "element_count": len(elements),
                "elements": elements
            }

        else:
            # Extract full tree
            tree = extractor.extract_tree(str(input_path))
            result = tree.to_dict()

        # Output JSON
        print(json.dumps(result, indent=2))

    except FileNotFoundError as e:
        print(json.dumps({
            "error": str(e)
        }), file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(json.dumps({
            "error": f"Failed to extract spatial tree: {str(e)}"
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
