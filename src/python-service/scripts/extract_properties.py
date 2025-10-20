#!/usr/bin/env python3
"""
IFC Property Extraction CLI Script

Extract properties from an IFC element and output as JSON.

Usage:
    python scripts/extract_properties.py <input.ifc> <element-guid>

Output:
    JSON to stdout with element properties

This script is designed to be called by the .NET backend via ProcessRunner.
"""

import sys
import json
import argparse
from dataclasses import asdict
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ifc_intelligence.property_extractor import PropertyExtractor


def main():
    """Main entry point for CLI script."""

    parser = argparse.ArgumentParser(
        description="Extract properties from an IFC element",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "input_file",
        help="Path to input IFC file"
    )

    parser.add_argument(
        "element_guid",
        help="GlobalId (GUID) of the element to extract properties from"
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="Extract properties for all elements (ignores element_guid)"
    )

    args = parser.parse_args()

    try:
        # Create extractor instance
        extractor = PropertyExtractor(args.input_file)

        if args.all:
            # Extract properties for all elements
            global_ids = extractor.get_all_elements_with_properties()

            # Batch extract (but limit to avoid huge output)
            max_elements = 100
            if len(global_ids) > max_elements:
                print(json.dumps({
                    "error": f"Too many elements ({len(global_ids)}). Use single element extraction instead."
                }), file=sys.stderr)
                sys.exit(1)

            results = extractor.extract_properties_batch(global_ids)

            # Convert to dict format
            output = {
                guid: asdict(props)
                for guid, props in results.items()
            }
        else:
            # Extract properties for single element
            properties = extractor.extract_properties(args.element_guid)

            # Convert dataclass to dict
            output = asdict(properties)

        # Output as JSON to stdout
        print(json.dumps(output, indent=2))

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
