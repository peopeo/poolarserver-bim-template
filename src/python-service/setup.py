"""
IFC Intelligence Service - Setup Script

This package provides IFC processing capabilities for the BIM viewer backend.
Inspired by Bonsai/BlenderBIM concepts but independently implemented using
IfcOpenShell API (LGPL).

License: MIT (our code) + LGPL (IfcOpenShell library)
"""

from setuptools import setup, find_packages

with open("requirements.txt") as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith("#")]

setup(
    name="ifc-intelligence",
    version="0.1.0",
    description="IFC Intelligence Service - BIM data extraction and processing",
    author="Your Team",
    author_email="your-email@example.com",
    packages=find_packages(),
    install_requires=requirements,
    python_requires=">=3.10",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    entry_points={
        "console_scripts": [
            "ifc-parse=scripts.parse_ifc:main",
            "ifc-export-gltf=scripts.export_gltf:main",
            "ifc-extract-properties=scripts.extract_properties:main",
            "ifc-extract-spatial=scripts.extract_spatial:main",
        ],
    },
)
