"""
IFC Property Extractor

Extracts PropertySets and properties from IFC elements using IfcOpenShell API.

This is an independent implementation inspired by Bonsai concepts but
implemented from scratch using IfcOpenShell documentation.

License: MIT (our code) + LGPL (IfcOpenShell library)
"""

import ifcopenshell
import ifcopenshell.util.element
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field


@dataclass
class IfcElementProperties:
    """
    Properties of an IFC element.

    Attributes:
        global_id: IFC GlobalId (GUID) of the element
        element_type: IFC entity type (e.g., IfcWall, IfcDoor)
        name: Element name (from Name attribute)
        description: Element description (from Description attribute)
        property_sets: Dictionary of PropertySets, keyed by PropertySet name
        quantities: Dictionary of quantities (from QuantitySets)
        type_properties: Properties inherited from the element's type
    """
    global_id: str
    element_type: str
    name: Optional[str] = None
    description: Optional[str] = None
    property_sets: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    quantities: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    type_properties: Dict[str, Dict[str, Any]] = field(default_factory=dict)


class PropertyExtractor:
    """
    Extract properties and PropertySets from IFC elements.

    Uses IfcOpenShell API (LGPL) for property access.
    Strategy inspired by Bonsai's property extraction approach.
    """

    def __init__(self, ifc_file_path: Optional[str] = None):
        """
        Initialize the property extractor.

        Args:
            ifc_file_path: Optional path to IFC file to open immediately
        """
        self.ifc_file = None
        if ifc_file_path:
            self.open_file(ifc_file_path)

    def open_file(self, ifc_file_path: str) -> None:
        """
        Open an IFC file.

        Args:
            ifc_file_path: Path to IFC file

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If file cannot be opened
        """
        try:
            self.ifc_file = ifcopenshell.open(ifc_file_path)
        except FileNotFoundError:
            raise FileNotFoundError(f"IFC file not found: {ifc_file_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to open IFC file: {str(e)}")

    def get_element_by_guid(self, global_id: str):
        """
        Get an IFC element by its GlobalId.

        Args:
            global_id: IFC GlobalId (GUID) of the element

        Returns:
            IFC element object or None if not found

        Raises:
            RuntimeError: If no IFC file is loaded
        """
        if not self.ifc_file:
            raise RuntimeError("No IFC file loaded. Call open_file() first.")

        try:
            return self.ifc_file.by_guid(global_id)
        except RuntimeError:
            # Element not found
            return None

    def extract_properties(self, global_id: str) -> IfcElementProperties:
        """
        Extract all properties for an IFC element by GlobalId.

        Args:
            global_id: IFC GlobalId (GUID) of the element

        Returns:
            IfcElementProperties object with all property data

        Raises:
            RuntimeError: If no IFC file is loaded or element not found
        """
        if not self.ifc_file:
            raise RuntimeError("No IFC file loaded. Call open_file() first.")

        # Get element by GlobalId
        element = self.get_element_by_guid(global_id)
        if not element:
            raise RuntimeError(f"Element not found with GlobalId: {global_id}")

        # Extract basic attributes
        element_type = element.is_a()
        name = getattr(element, 'Name', None)
        description = getattr(element, 'Description', None)

        # Extract PropertySets using IfcOpenShell utility
        # This uses ifcopenshell.util.element.get_psets() which is the recommended approach
        psets = ifcopenshell.util.element.get_psets(element)

        # Separate PropertySets, Quantities, and Type properties
        property_sets = {}
        quantities = {}
        type_properties = {}

        for pset_name, pset_data in psets.items():
            # Check if this is a quantity set (starts with "Qto_")
            if pset_name.startswith("Qto_"):
                quantities[pset_name] = self._clean_property_dict(pset_data)
            # Check if this is from the element type
            elif pset_name.endswith("Type") or "Type." in pset_name:
                type_properties[pset_name] = self._clean_property_dict(pset_data)
            else:
                property_sets[pset_name] = self._clean_property_dict(pset_data)

        return IfcElementProperties(
            global_id=global_id,
            element_type=element_type,
            name=name,
            description=description,
            property_sets=property_sets,
            quantities=quantities,
            type_properties=type_properties
        )

    def extract_properties_batch(self, global_ids: List[str]) -> Dict[str, IfcElementProperties]:
        """
        Extract properties for multiple elements in batch.

        Args:
            global_ids: List of IFC GlobalIds

        Returns:
            Dictionary mapping GlobalId to IfcElementProperties

        Raises:
            RuntimeError: If no IFC file is loaded
        """
        if not self.ifc_file:
            raise RuntimeError("No IFC file loaded. Call open_file() first.")

        results = {}
        for global_id in global_ids:
            try:
                properties = self.extract_properties(global_id)
                results[global_id] = properties
            except RuntimeError:
                # Skip elements that can't be found
                continue

        return results

    def get_all_elements_with_properties(self) -> List[str]:
        """
        Get GlobalIds of all elements that have properties.

        Returns:
            List of GlobalIds

        Raises:
            RuntimeError: If no IFC file is loaded
        """
        if not self.ifc_file:
            raise RuntimeError("No IFC file loaded. Call open_file() first.")

        # Get all IfcProduct elements (which can have properties)
        products = self.ifc_file.by_type("IfcProduct")

        global_ids = []
        for product in products:
            if hasattr(product, 'GlobalId'):
                global_ids.append(product.GlobalId)

        return global_ids

    def _clean_property_dict(self, pset_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean PropertySet data by removing internal keys and ensuring JSON-serializable values.

        Args:
            pset_data: Raw PropertySet dictionary from IfcOpenShell

        Returns:
            Cleaned dictionary with only property values
        """
        cleaned = {}
        for key, value in pset_data.items():
            # Skip internal keys (starting with 'id' or containing metadata)
            if key in ['id', 'type']:
                continue

            # Convert non-serializable types to strings
            if value is None:
                cleaned[key] = None
            elif isinstance(value, (str, int, float, bool)):
                cleaned[key] = value
            elif isinstance(value, (list, tuple)):
                cleaned[key] = [str(v) if not isinstance(v, (str, int, float, bool)) else v for v in value]
            else:
                cleaned[key] = str(value)

        return cleaned
