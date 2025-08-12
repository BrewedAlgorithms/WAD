# microservices_python/config/settings.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # Application settings
    SERVICE_HOST: str = "0.0.0.0"
    SERVICE_PORT: int = 5001
    TEMP_DIR: str = "/tmp/research_files"
    
    # Logging level for the application
    LOG_LEVEL: str = "INFO" 

    # File validation
    SUPPORTED_FORMATS: List[str] = ["pdf"]
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB

    # Gemini AI settings
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TEMPERATURE: float = 0.3
    GEMINI_MAX_TOKENS: int = 15000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=False
    )

# Create a single settings instance to be used across the application
settings = Settings()