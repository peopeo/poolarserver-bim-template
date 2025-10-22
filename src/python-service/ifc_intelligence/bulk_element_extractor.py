"""
Bulk Element Properties Extraction Module

Extracts all IFC element properties from a file in a single pass for database storage.
This enables fast property queries from the database instead of parsing IFC files repeatedly.
"""

from typing import List, Dict, Any, Optional
from dataclasses import asdict
import sys
import ifcopenshell
import ifcopenshell.util.element
from .cache_manager import IfcCacheManager, get_global_cache
from .property_extractor import PropertyExtractor
from .logger import get_logger

logger = get_logger(__name__)


class BulkElementExtractor:
    """
    Extract all element properties from an IFC file in a single pass.

    This extractor processes all physical building elements (walls, doors, windows, etc.)
    and extracts their complete property sets, quantities, and type properties.

    Usage:
        extractor = BulkElementExtractor()
        elements = extractor.extract_all_elements("model.ifc")
        print(f"Extracted {len(elements)} elements")
    """

    # IFC element types to extract (physical building elements)
    # Note: by_type() returns all subtypes, so we only need parent types
    # e.g., "IfcWall" returns both IfcWall and IfcWallStandardCase
    ELEMENT_TYPES = {
        # Structural elements (parent types only - subtypes are included automatically)
        "IfcWall",  # includes IfcWallStandardCase
        "IfcSlab", "IfcRoof", "IfcBeam", "IfcColumn",
        "IfcFooting", "IfcPile", "IfcRailing",

        # Opening elements
        "IfcDoor", "IfcWindow",

        # Furnishing and equipment
        "IfcFurnishingElement",  # includes IfcFurniture and IfcSystemFurnitureElement

        # Building equipment
        "IfcBuildingElementProxy",
        "IfcCovering", "IfcCurtainWall",
        "IfcMember", "IfcPlate",
        "IfcStair", "IfcStairFlight", "IfcRamp", "IfcRampFlight",

        # MEP elements
        "IfcFlowTerminal", "IfcFlowSegment", "IfcFlowFitting",
        "IfcFlowController", "IfcEnergyConversionDevice",
        "IfcFlowMovingDevice", "IfcFlowStorageDevice",
        "IfcFlowTreatmentDevice",

        # Distribution elements
        "IfcDistributionElement",  # parent type includes IfcDistributionFlowElement and IfcDistributionControlElement

        # Spatial elements (for context)
        "IfcSpace", "IfcBuildingStorey", "IfcBuilding", "IfcSite",
    }

    def __init__(self, cache_manager: Optional[IfcCacheManager] = None):
        """
        Initialize the bulk element extractor.

        Args:
            cache_manager: Optional cache manager instance (uses global cache if None)
        """
        self.ifc_file: Optional[ifcopenshell.file] = None
        self.cache = cache_manager or get_global_cache()
        self.property_extractor = PropertyExtractor(cache_manager=self.cache)

    def open_file(self, file_path: str) -> None:
        """
        Open an IFC file for processing using cache.

        Args:
            file_path: Path to the IFC file

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If file cannot be opened
        """
        try:
            self.ifc_file = self.cache.get_or_load(file_path)
            self.property_extractor.ifc_file = self.ifc_file
        except FileNotFoundError:
            raise FileNotFoundError(f"IFC file not found: {file_path}")
        except RuntimeError as e:
            raise RuntimeError(f"Failed to open IFC file: {e}")

    def extract_all_elements(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract all element properties from an IFC file.

        Args:
            file_path: Path to the IFC file

        Returns:
            List of dictionaries containing element data:
            [
                {
                    "global_id": "0BTBFw6f90Nfh9rP1dlXr2",
                    "element_type": "IfcWall",
                    "name": "Basic Wall:Exterior - Brick on Block:184944",
                    "description": null,
                    "properties": {
                        "property_sets": {...},
                        "quantities": {...},
                        "type_properties": {...}
                    }
                },
                ...
            ]
        """
        self.open_file(file_path)

        elements = []
        element_count = 0

        # Extract elements by type
        for element_type in self.ELEMENT_TYPES:
            try:
                instances = self.ifc_file.by_type(element_type)

                for instance in instances:
                    try:
                        element_data = self._extract_element_data(instance)
                        if element_data:
                            elements.append(element_data)
                            element_count += 1

                            # Progress logging every 100 elements
                            if element_count % 100 == 0:
                                logger.debug("extraction_progress", elements_extracted=element_count)
                    except Exception as e:
                        # Skip individual elements that fail to extract
                        element_id = instance.GlobalId if hasattr(instance, 'GlobalId') else 'unknown'
                        logger.warning("element_extraction_failed", element_id=element_id, error=str(e))
                        continue

            except Exception as e:
                # Skip element types that don't exist in this IFC schema
                continue

        logger.info("extraction_summary", total_elements=element_count, file_path=file_path)
        return elements

    def _extract_element_data(self, element: ifcopenshell.entity_instance) -> Optional[Dict[str, Any]]:
        """
        Extract data for a single element.

        Args:
            element: IFC element instance

        Returns:
            Dictionary with element data, or None if extraction fails
        """
        # Skip elements without GlobalId
        if not hasattr(element, "GlobalId"):
            return None

        global_id = element.GlobalId

        # Extract properties using the property extractor
        try:
            props_obj = self.property_extractor.extract_properties(global_id)
            # Convert dataclass to dictionary
            properties = asdict(props_obj)
        except Exception as e:
            # Skip elements that fail to extract
            return None

        # Skip elements with no properties (may not be valid building elements)
        if not properties:
            return None

        return {
            "global_id": global_id,
            "element_type": element.is_a(),
            "name": element.Name if hasattr(element, "Name") else None,
            "description": element.Description if hasattr(element, "Description") else None,
            "properties": properties
        }

    def get_element_count_estimate(self, file_path: str) -> int:
        """
        Get estimated count of elements that will be extracted.

        Args:
            file_path: Path to the IFC file

        Returns:
            Estimated number of elements
        """
        self.open_file(file_path)

        total = 0
        for element_type in self.ELEMENT_TYPES:
            try:
                total += len(self.ifc_file.by_type(element_type))
            except Exception:
                continue

        return total
