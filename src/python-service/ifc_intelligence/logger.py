"""
Structured logging configuration for IFC Intelligence service.

This module provides structured logging with strict stdout/stderr separation:
- ALL log messages go to stderr
- ONLY data (JSON) goes to stdout

This prevents mixing of log messages and data output when scripts are called
by the .NET backend.
"""

import sys
import logging
import structlog


def setup_logging(log_level: str = "INFO"):
    """
    Configure structured logging for the IFC Intelligence service.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Configure standard logging to stderr
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stderr,  # ALL logs go to stderr
        level=getattr(logging, log_level.upper()),
    )

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None):
    """
    Get a structured logger instance.

    Args:
        name: Logger name (typically __name__ of the module)

    Returns:
        Structured logger instance
    """
    return structlog.get_logger(name)


# Auto-configure logging on module import
setup_logging()
