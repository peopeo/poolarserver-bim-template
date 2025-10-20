#!/usr/bin/env python3
"""
Extract all element properties from an IFC file in bulk.

This script is called by the .NET backend during IFC upload to extract
all element properties for database storage.

Usage:
    python extract_all_elements.py <ifc_file_path>

Output:
    JSON array of all elements with their properties
"""

import sys
import json
from pathlib import Path

# Add parent directory to path to import ifc_intelligence module
sys.path.insert(0, str(Path(__file__).parent.parent))

from ifc_intelligence.bulk_element_extractor import BulkElementExtractor


def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Usage: python extract_all_elements.py <ifc_file_path>"
        }))
        sys.exit(1)

    ifc_file_path = sys.argv[1]

    try:
        # Create extractor and extract all elements
        extractor = BulkElementExtractor()
        elements = extractor.extract_all_elements(ifc_file_path)

        # Output as JSON
        result = {
            "element_count": len(elements),
            "elements": elements
        }

        print(json.dumps(result, indent=2, default=str))

    except FileNotFoundError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Failed to extract elements: {str(e)}"}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
