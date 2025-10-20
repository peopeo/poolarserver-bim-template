"""
Data Models for IFC Intelligence Service

This module defines Pydantic models for structured IFC data.
Independent implementation using IfcOpenShell API (LGPL).
"""

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class IfcMetadata:
    """
    Metadata extracted from an IFC file.

    This is our own data structure, independently designed
    (not copied from Bonsai/BlenderBIM).

    Attributes:
        model_id: GlobalId of the IfcProject
        project_name: Name of the IfcProject
        schema: IFC schema version (IFC2X3, IFC4, IFC4X3, etc.)
        entity_counts: Count of each IFC entity type
        author: Author name from IfcOwnerHistory (optional)
        organization: Organization from IfcOwnerHistory (optional)
        application: Application that created the file (optional)
    """
    model_id: str
    project_name: str
    schema: str
    entity_counts: Dict[str, int]
    author: Optional[str] = None
    organization: Optional[str] = None
    application: Optional[str] = None
