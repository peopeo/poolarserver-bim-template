#!/usr/bin/env python3
"""
Extract all element properties from an IFC file in bulk with performance metrics.

This script is called by the .NET backend during IFC upload to extract
all element properties for database storage.

Usage:
    python extract_all_elements.py <ifc_file_path>

Output:
    JSON with elements and metrics (stdout)
    Structured logs (stderr)
"""

import sys
import json
import time
from pathlib import Path
from datetime import datetime
from collections import Counter

# Add parent directory to path to import ifc_intelligence module
sys.path.insert(0, str(Path(__file__).parent.parent))

from ifc_intelligence.bulk_element_extractor import BulkElementExtractor
from ifc_intelligence.logger import get_logger

logger = get_logger(__name__)


def count_element_types(elements):
    """Count elements by IFC type"""
    type_counts = Counter(elem["element_type"] for elem in elements)
    return dict(type_counts)


def count_properties(elements):
    """Count total property sets, properties, and quantities"""
    total_psets = 0
    total_props = 0
    total_quantities = 0

    for elem in elements:
        props = elem.get("properties", {})

        # Count property sets
        psets = props.get("property_sets", {})
        total_psets += len(psets)

        # Count individual properties
        for pset_data in psets.values():
            if isinstance(pset_data, dict):
                total_props += len(pset_data)

        # Count quantities
        quantities = props.get("quantities", {})
        for qset_data in quantities.values():
            if isinstance(qset_data, dict):
                total_quantities += len(qset_data)

    return total_psets, total_props, total_quantities


def main():
    if len(sys.argv) != 2:
        logger.error("invalid_usage", expected="<ifc_file_path>", provided=sys.argv[1:])
        print(json.dumps({
            "error": "Usage: python extract_all_elements.py <ifc_file_path>"
        }))
        sys.exit(1)

    ifc_file_path = sys.argv[1]

    # Initialize metrics
    metrics = {
        "start_time": datetime.utcnow().isoformat(),
        "timings": {},
        "statistics": {},
        "warnings": []
    }

    logger.info("extraction_started", ifc_file_path=ifc_file_path)

    try:
        # Timing: File parsing/opening
        parse_start = time.time()
        extractor = BulkElementExtractor()
        logger.debug("extractor_created")

        # Open file (triggers ifcopenshell parsing)
        extractor.open_file(ifc_file_path)
        parse_time_ms = int((time.time() - parse_start) * 1000)
        metrics["timings"]["parse_ms"] = parse_time_ms
        logger.info("parse_completed", time_ms=parse_time_ms)

        # Timing: Element extraction
        extract_start = time.time()
        elements = []
        element_count = 0

        # Extract elements by type
        for element_type in extractor.ELEMENT_TYPES:
            try:
                instances = extractor.ifc_file.by_type(element_type)

                for instance in instances:
                    try:
                        element_data = extractor._extract_element_data(instance)
                        if element_data:
                            elements.append(element_data)
                            element_count += 1
                    except Exception as e:
                        # Track warning for failed element
                        element_id = instance.GlobalId if hasattr(instance, 'GlobalId') else 'unknown'
                        warning_msg = f"Failed to extract element {element_id}: {str(e)}"
                        metrics["warnings"].append(warning_msg)
                        logger.warning("element_extraction_failed", element_id=element_id, error=str(e))
                        continue

            except Exception as e:
                # Skip element types that don't exist in this IFC schema
                continue

        extract_time_ms = int((time.time() - extract_start) * 1000)
        metrics["timings"]["element_extraction_ms"] = extract_time_ms
        logger.info("extraction_completed", element_count=len(elements), time_ms=extract_time_ms)

        # Calculate statistics
        element_type_counts = count_element_types(elements)
        total_psets, total_props, total_quantities = count_properties(elements)

        metrics["statistics"] = {
            "total_elements": len(elements),
            "element_type_counts": element_type_counts,
            "total_property_sets": total_psets,
            "total_properties": total_props,
            "total_quantities": total_quantities
        }

        # Total time
        total_time_ms = parse_time_ms + extract_time_ms
        metrics["timings"]["total_ms"] = total_time_ms
        metrics["end_time"] = datetime.utcnow().isoformat()

        logger.info("metrics_calculated",
                   total_elements=len(elements),
                   total_psets=total_psets,
                   total_props=total_props,
                   warnings=len(metrics["warnings"]))

        # Output combined result with elements AND metrics
        result = {
            "elements": elements,
            "metrics": metrics
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
