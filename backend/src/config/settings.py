# =============================================================================
# GEMINI GUARDIAN - APPLICATION SETTINGS
# =============================================================================
# Centralized configuration management using Pydantic BaseSettings.
# All environment variables are validated and typed for safety.
#
# This is a life-critical application - configuration errors must fail fast.
# =============================================================================

import logging
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# -----------------------------------------------------------------------------
# Configure module-level logger for settings operations
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    This class uses Pydantic's BaseSettings to automatically load and validate
    configuration from environment variables and .env files.
    
    Attributes:
        app_name: Name of the application
        app_version: Current version string
        debug: Enable debug mode (NEVER in production)
        log_level: Logging verbosity level
        gemini_api_key: Google Gemini API key for AI processing
        allowed_origins: CORS allowed origins list
        host: Server host address
        port: Server port number
        max_video_size_mb: Maximum allowed video upload size
        max_audio_duration_seconds: Maximum audio clip duration
        gemini_model: Gemini model to use for analysis
        websocket_heartbeat_interval: WebSocket keepalive interval
    """
    
    # -------------------------------------------------------------------------
    # Application Metadata
    # -------------------------------------------------------------------------
    app_name: str = Field(
        default="Gemini Guardian",
        description="Application name displayed in logs and API docs"
    )
    app_version: str = Field(
        default="1.0.0",
        description="Semantic version of the application"
    )
    
    # -------------------------------------------------------------------------
    # Runtime Configuration
    # -------------------------------------------------------------------------
    debug: bool = Field(
        default=False,
        description="Enable debug mode - NEVER enable in production"
    )
    log_level: str = Field(
        default="INFO",
        description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL"
    )
    
    # -------------------------------------------------------------------------
    # AI Configuration
    # -------------------------------------------------------------------------
    gemini_api_key: str = Field(
        default="",
        description="Google Gemini API key for AI model access"
    )
    gemini_model: str = Field(
        default="gemini-2.0-flash-live-001",
        description="Gemini model identifier for emergency analysis"
    )
    
    # -------------------------------------------------------------------------
    # CORS Configuration
    # -------------------------------------------------------------------------
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="List of allowed CORS origins"
    )
    
    # -------------------------------------------------------------------------
    # Server Configuration
    # -------------------------------------------------------------------------
    host: str = Field(
        default="0.0.0.0",
        description="Server bind address"
    )
    port: int = Field(
        default=8000,
        description="Server port number"
    )
    
    # -------------------------------------------------------------------------
    # Media Limits
    # -------------------------------------------------------------------------
    max_video_size_mb: int = Field(
        default=50,
        description="Maximum video upload size in megabytes"
    )
    max_audio_duration_seconds: int = Field(
        default=60,
        description="Maximum audio recording duration in seconds"
    )
    
    # -------------------------------------------------------------------------
    # WebSocket Configuration
    # -------------------------------------------------------------------------
    websocket_heartbeat_interval: int = Field(
        default=30,
        description="WebSocket heartbeat interval in seconds"
    )
    
    # -------------------------------------------------------------------------
    # Pydantic Configuration
    # -------------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra environment variables
    )
    
    # -------------------------------------------------------------------------
    # Validators
    # -------------------------------------------------------------------------
    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, value: str) -> str:
        """
        Validate that log_level is a valid Python logging level.
        
        Args:
            value: The log level string to validate
            
        Returns:
            The validated log level in uppercase
            
        Raises:
            ValueError: If the log level is not valid
        """
        # Define valid log levels
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        
        # Convert to uppercase for comparison
        upper_value = value.upper()
        
        # Check if the value is valid
        if upper_value not in valid_levels:
            raise ValueError(
                f"Invalid log_level '{value}'. "
                f"Must be one of: {', '.join(valid_levels)}"
            )
        
        return upper_value
    
    @field_validator("port")
    @classmethod
    def validate_port(cls, value: int) -> int:
        """
        Validate that port is within valid range.
        
        Args:
            value: The port number to validate
            
        Returns:
            The validated port number
            
        Raises:
            ValueError: If the port is out of valid range
        """
        # Check port range (1-65535)
        if not 1 <= value <= 65535:
            raise ValueError(
                f"Invalid port '{value}'. Must be between 1 and 65535"
            )
        
        return value


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings instance.
    
    Uses lru_cache to ensure settings are only loaded once during application
    lifetime. This improves performance and ensures consistency.
    
    Returns:
        Settings: The application settings instance
        
    Example:
        >>> settings = get_settings()
        >>> print(settings.app_name)
        'Gemini Guardian'
    """
    # Log settings loading
    logger.info("Loading application settings from environment")
    
    # Create and return settings instance
    return Settings()


# -----------------------------------------------------------------------------
# Module-level settings instance for convenient import
# -----------------------------------------------------------------------------
settings = get_settings()
