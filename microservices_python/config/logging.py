# microservices_python/config/logging.py

import logging
import sys
from logging.handlers import RotatingFileHandler
import os
from .settings import settings

# --- Logging Configuration ---

# Ensure logs directory exists
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

# Create a logger instance
logger = logging.getLogger("research_companion_ai")
logger.setLevel(settings.LOG_LEVEL.upper())
logger.propagate = False  # Prevent duplicate logs in parent loggers

# Remove existing handlers to avoid duplication
if logger.hasHandlers():
    logger.handlers.clear()

# Create a formatter
formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(funcName)s:%(lineno)d - %(message)s"
)

# --- Console Handler ---
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
logger.addHandler(stream_handler)

# --- File Handlers ---

# Combined log file
combined_log_path = os.path.join(LOGS_DIR, 'ai_combined.log')
combined_handler = RotatingFileHandler(
    combined_log_path, 
    maxBytes=settings.LOG_FILE_MAX_SIZE, 
    backupCount=settings.LOG_FILE_BACKUP_COUNT
)
combined_handler.setFormatter(formatter)
logger.addHandler(combined_handler)

# Error log file
error_log_path = os.path.join(LOGS_DIR, 'ai_error.log')
error_handler = RotatingFileHandler(
    error_log_path, 
    maxBytes=settings.LOG_FILE_MAX_SIZE, 
    backupCount=settings.LOG_FILE_BACKUP_COUNT
)
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(formatter)
logger.addHandler(error_handler)


def get_logger(name: str) -> logging.Logger:
    """
    Returns a logger instance with the specified name.
    """
    return logging.getLogger(name)