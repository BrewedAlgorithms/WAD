# microservices_python/utils/validators.py

from fastapi import UploadFile, HTTPException
from starlette.status import HTTP_413_REQUEST_ENTITY_TOO_LARGE, HTTP_415_UNSUPPORTED_MEDIA_TYPE

from config.settings import Settings

def validate_file(file: UploadFile, settings: Settings):
    """
    Validates an uploaded file against size and format constraints.

    Args:
        file (UploadFile): The file uploaded via FastAPI.
        settings (Settings): The application settings instance.

    Raises:
        HTTPException: If the file is too large or has an unsupported format.
    """
    # 1. Validate file size
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the limit of {settings.MAX_FILE_SIZE // (1024*1024)}MB."
        )

    # 2. Validate file format
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File format '.{file_extension}' is not supported. Supported formats: {settings.SUPPORTED_FORMATS}"
        )