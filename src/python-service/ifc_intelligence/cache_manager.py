"""
IFC File Cache Manager

Provides LRU (Least Recently Used) caching for loaded IFC files.
Keeps frequently accessed IFC files in RAM to avoid repeated parsing.

License: MIT (our code) + LGPL (IfcOpenShell library)
"""

import ifcopenshell
import time
import os
import sys
from typing import Optional, Dict
from collections import OrderedDict


class IfcCacheManager:
    """
    LRU cache for loaded IFC files.

    Keeps frequently accessed IFC files in RAM to avoid repeated parsing.
    Implements LRU eviction when cache is full.
    """

    def __init__(self, max_size: int = 10, ttl_hours: int = 24):
        """
        Initialize cache manager.

        Args:
            max_size: Maximum number of files to cache (default: 10)
            ttl_hours: Time-to-live in hours (default: 24)
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_hours * 3600

        # OrderedDict for LRU behavior
        self._cache: OrderedDict[str, ifcopenshell.file] = OrderedDict()
        self._access_times: Dict[str, float] = {}
        self._file_sizes: Dict[str, int] = {}

        # Statistics
        self._hits = 0
        self._misses = 0
        self._evictions = 0

    def get_or_load(self, file_path: str) -> ifcopenshell.file:
        """
        Get IFC file from cache or load if not cached.

        Implements LRU eviction when cache is full.

        Args:
            file_path: Absolute path to IFC file

        Returns:
            Opened IfcOpenShell file object

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If file cannot be opened
        """
        current_time = time.time()

        # Check if in cache
        if file_path in self._cache:
            # Check TTL
            if current_time - self._access_times[file_path] < self.ttl_seconds:
                # Move to end (most recently used)
                self._cache.move_to_end(file_path)
                self._access_times[file_path] = current_time
                self._hits += 1

                # Log cache hit
                self._log_cache_event("HIT", file_path)

                return self._cache[file_path]
            else:
                # Expired, remove
                self._log_cache_event("EXPIRED", file_path)
                del self._cache[file_path]
                del self._access_times[file_path]
                del self._file_sizes[file_path]

        # Not in cache or expired - load file
        self._misses += 1
        self._log_cache_event("MISS", file_path)

        # Check file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"IFC file not found: {file_path}")

        # Load file
        try:
            ifc_file = ifcopenshell.open(file_path)
        except Exception as e:
            raise RuntimeError(f"Failed to open IFC file: {str(e)}")

        # Get file size
        file_size = os.path.getsize(file_path)

        # Evict oldest if cache full
        if len(self._cache) >= self.max_size:
            oldest_key = next(iter(self._cache))
            self._log_cache_event("EVICT", oldest_key)

            del self._cache[oldest_key]
            del self._access_times[oldest_key]
            del self._file_sizes[oldest_key]
            self._evictions += 1

        # Add to cache
        self._cache[file_path] = ifc_file
        self._access_times[file_path] = current_time
        self._file_sizes[file_path] = file_size

        self._log_cache_event("LOAD", file_path)

        return ifc_file

    def clear(self):
        """Clear entire cache."""
        self._cache.clear()
        self._access_times.clear()
        self._file_sizes.clear()

        self._log_cache_event("CLEAR", "all")

    def remove(self, file_path: str):
        """
        Remove specific file from cache.

        Args:
            file_path: Path to file to remove
        """
        if file_path in self._cache:
            del self._cache[file_path]
            del self._access_times[file_path]
            del self._file_sizes[file_path]

            self._log_cache_event("REMOVE", file_path)

    def get_stats(self) -> dict:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache statistics
        """
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0

        total_size_bytes = sum(self._file_sizes.values())
        total_size_mb = total_size_bytes / (1024 * 1024)

        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "hits": self._hits,
            "misses": self._misses,
            "evictions": self._evictions,
            "hit_rate": round(hit_rate, 2),
            "total_requests": total_requests,
            "cached_files": list(self._cache.keys()),
            "total_size_mb": round(total_size_mb, 2),
            "ttl_hours": self.ttl_seconds / 3600
        }

    def _log_cache_event(self, event: str, file_path: str):
        """
        Log cache event (for debugging).

        Args:
            event: Event type (HIT, MISS, LOAD, EVICT, etc.)
            file_path: File path involved
        """
        # Simple console logging
        # In production, use proper logging framework
        filename = os.path.basename(file_path) if file_path != "all" else "all"

        if event == "HIT":
            print(f"[Cache] ✓ HIT: {filename}", file=sys.stderr)
        elif event == "MISS":
            print(f"[Cache] ✗ MISS: {filename}", file=sys.stderr)
        elif event == "LOAD":
            size_mb = self._file_sizes.get(file_path, 0) / (1024 * 1024)
            print(f"[Cache] ⇧ LOAD: {filename} ({size_mb:.2f} MB)", file=sys.stderr)
        elif event == "EVICT":
            print(f"[Cache] ⇩ EVICT: {filename}", file=sys.stderr)
        elif event == "EXPIRED":
            print(f"[Cache] ⏱ EXPIRED: {filename}", file=sys.stderr)
        elif event == "CLEAR":
            print(f"[Cache] 🗑 CLEAR: all files", file=sys.stderr)
        elif event == "REMOVE":
            print(f"[Cache] ⊗ REMOVE: {filename}", file=sys.stderr)


# Global cache instance (singleton pattern)
_global_cache: Optional[IfcCacheManager] = None


def get_global_cache(max_size: int = 10, ttl_hours: int = 24) -> IfcCacheManager:
    """
    Get or create global cache instance.

    Args:
        max_size: Maximum number of files to cache (default: 10)
        ttl_hours: Time-to-live in hours (default: 24)

    Returns:
        Global IfcCacheManager instance
    """
    global _global_cache

    if _global_cache is None:
        _global_cache = IfcCacheManager(max_size=max_size, ttl_hours=ttl_hours)

    return _global_cache
