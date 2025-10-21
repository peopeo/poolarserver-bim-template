#!/usr/bin/env python3
"""
Extract all element properties from an IFC file in bulk.

This script is called by the .NET backend during IFC upload to extract
all element properties for database storage.

Usage:
    python extract_all_elements.py <ifc_file_path>

Output:
    JSON array of all elements with their properties (stdout)
    Structured logs (stderr)
"""

import sys
import json
from pathlib import Path

# Add parent directory to path to import ifc_intelligence module
sys.path.insert(0, str(Path(__file__).parent.parent))

from ifc_intelligence.bulk_element_extractor import BulkElementExtractor
from ifc_intelligence.logger import get_logger

logger = get_logger(__name__)


def main():
    if len(sys.argv) != 2:
        logger.error("invalid_usage", expected="<ifc_file_path>", provided=sys.argv[1:])
        print(json.dumps({
            "error": "Usage: python extract_all_elements.py <ifc_file_path>"
        }))
        sys.exit(1)

    ifc_file_path = sys.argv[1]
    logger.info("extraction_started", ifc_file_path=ifc_file_path)

    try:
        # Create extractor and extract all elements
        extractor = BulkElementExtractor()
        logger.debug("extractor_created")

        elements = extractor.extract_all_elements(ifc_file_path)
        logger.info("extraction_completed", element_count=len(elements))

        # Output as JSON to stdout ONLY
        result = {
            "element_count": len(elements),
            "elements": elements
        }

        print(json.dumps(result, indent=2, default=str))

    except FileNotFoundError as e:
        logger.error("file_not_found", ifc_file_path=ifc_file_path, error=str(e))
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    except Exception as e:
        logger.exception("extraction_failed", ifc_file_path=ifc_file_path, error=str(e))
        print(json.dumps({"error": f"Failed to extract elements: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
