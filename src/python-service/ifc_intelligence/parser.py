"""
IFC File Parser

Extracts metadata from IFC files using IfcOpenShell API.

This is an independent implementation inspired by Bonsai concepts but
implemented from scratch using IfcOpenShell documentation.

License: MIT (our code) + LGPL (IfcOpenShell library)
"""

import ifcopenshell
from typing import Dict
from .models import IfcMetadata


class IfcParser:
    """
    Parse IFC files and extract metadata.

    Uses IfcOpenShell API (LGPL) for IFC file access.
    Algorithm inspired by Bonsai's approach but independently implemented.
    """

    def parse_file(self, file_path: str) -> IfcMetadata:
        """
        Parse IFC file and extract metadata.

        Args:
            file_path: Path to .ifc file

        Returns:
            IfcMetadata object with project info and entity counts

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If IFC file is invalid
        """
        # Open IFC file using IfcOpenShell (LGPL library)
        try:
            ifc_file = ifcopenshell.open(file_path)
        except FileNotFoundError:
            raise FileNotFoundError(f"IFC file not found: {file_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to open IFC file: {str(e)}")

        # Extract project information
        try:
            project = ifc_file.by_type("IfcProject")[0]
        except (IndexError, KeyError):
            raise RuntimeError("No IfcProject found in file")

        # Count entities by type
        entity_counts = self._count_entities(ifc_file)

        # Extract authoring information
        author, org, app = self._extract_authoring_info(ifc_file)

        return IfcMetadata(
            model_id=project.GlobalId,
            project_name=project.Name or "Unnamed Project",
            schema=ifc_file.schema,
            entity_counts=entity_counts,
            author=author,
            organization=org,
            application=app
        )

    def _count_entities(self, ifc_file) -> Dict[str, int]:
        """
        Count common IFC entity types.

        Strategy: Count frequently used building elements.
        This is our own selection of relevant types.

        Args:
            ifc_file: Opened IfcOpenShell file object

        Returns:
            Dictionary mapping entity type names to counts
        """
        # Common IFC entity types to count
        # Selection based on typical BIM usage (not copied from Bonsai)
        types_to_count = [
            # Building elements
            "IfcWall",
            "IfcWallStandardCase",
            "IfcDoor",
            "IfcWindow",
            "IfcSlab",
            "IfcBeam",
            "IfcColumn",
            "IfcStair",
            "IfcRoof",
            "IfcRailing",

            # Spatial structure
            "IfcSpace",
            "IfcBuildingStorey",
            "IfcBuilding",
            "IfcSite",

            # MEP elements
            "IfcPipeFitting",
            "IfcPipeSegment",
            "IfcDuctFitting",
            "IfcDuctSegment",

            # Furniture & Equipment
            "IfcFurnishingElement",
            "IfcFurniture",
        ]

        counts = {}
        for entity_type in types_to_count:
            entities = ifc_file.by_type(entity_type)
            if entities:
                counts[entity_type] = len(entities)

        return counts

    def _extract_authoring_info(self, ifc_file) -> tuple[str | None, str | None, str | None]:
        """
        Extract author, organization, and application information.

        Reads IfcOwnerHistory for metadata about file creation.

        Args:
            ifc_file: Opened IfcOpenShell file object

        Returns:
            Tuple of (author_name, organization_name, application_name)
            Each can be None if not available
        """
        try:
            # Get first IfcOwnerHistory (usually attached to IfcProject)
            owner_history = ifc_file.by_type("IfcOwnerHistory")[0]

            # Extract person info
            person = None
            org = None
            app = None

            if hasattr(owner_history, 'OwningUser') and owner_history.OwningUser:
                user = owner_history.OwningUser

                # Person information
                if hasattr(user, 'ThePerson') and user.ThePerson:
                    person = user.ThePerson
                    if hasattr(person, 'GivenName') and hasattr(person, 'FamilyName'):
                        if person.GivenName or person.FamilyName:
                            author_name = f"{person.GivenName or ''} {person.FamilyName or ''}".strip()
                        else:
                            author_name = None
                    else:
                        author_name = None
                else:
                    author_name = None

                # Organization information
                if hasattr(user, 'TheOrganization') and user.TheOrganization:
                    org = user.TheOrganization
                    org_name = org.Name if hasattr(org, 'Name') else None
                else:
                    org_name = None
            else:
                author_name = None
                org_name = None

            # Application information
            if hasattr(owner_history, 'OwningApplication') and owner_history.OwningApplication:
                app = owner_history.OwningApplication
                app_name = app.ApplicationFullName if hasattr(app, 'ApplicationFullName') else None
            else:
                app_name = None

            return author_name, org_name, app_name

        except (IndexError, AttributeError, KeyError) as e:
            # If any required attribute is missing, return None values
            return None, None, None
