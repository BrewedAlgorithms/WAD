# microservices_python/config/logging.py

import logging
import sys
from .settings import settings

# --- Logging Configuration ---

# Create a logger instance
logger = logging.getLogger("research_companion")
logger.setLevel(settings.LOG_LEVEL.upper())

# Create a handler to output logs to the console
stream_handler = logging.StreamHandler(sys.stdout)

# Create a formatter and set it for the handler
formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
stream_handler.setFormatter(formatter)

# Add the handler to the logger
logger.addHandler(stream_handler)

def get_logger(name: str) -> logging.Logger:
    """
    Returns a logger instance with the specified name.
    """
    return logging.getLogger(name)