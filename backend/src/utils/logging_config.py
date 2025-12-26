# =============================================================================
# GEMINI GUARDIAN - LOGGING CONFIGURATION
# =============================================================================
# Centralized logging setup for the application.
# Provides consistent log formatting and level configuration.
#
# Good logging is essential for debugging life-critical systems.
# =============================================================================

import logging
import sys
from datetime import datetime
from typing import Optional

from ..config.settings import settings


# =============================================================================
# CUSTOM FORMATTER
# =============================================================================

class ColoredFormatter(logging.Formatter):
    """
    Custom formatter that adds colors to log output.
    
    Colors are only applied when outputting to a terminal.
    This makes logs easier to read during development.
    """
    
    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    
    def __init__(self, fmt: str, use_colors: bool = True) -> None:
        """
        Initialize the formatter.
        
        Args:
            fmt: Log format string
            use_colors: Whether to apply colors
        """
        super().__init__(fmt)
        self.use_colors = use_colors
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format the log record with optional colors.
        
        Args:
            record: The log record to format
            
        Returns:
            Formatted log string
        """
        # Apply color if enabled and outputting to terminal
        if self.use_colors and sys.stderr.isatty():
            color = self.COLORS.get(record.levelname, "")
            record.levelname = f"{color}{record.levelname}{self.RESET}"
        
        return super().format(record)


# =============================================================================
# LOGGING SETUP FUNCTIONS
# =============================================================================

def setup_logging(
    level: Optional[str] = None,
    use_colors: bool = True
) -> None:
    """
    Configure application-wide logging.
    
    Sets up logging with:
    - Consistent format across all loggers
    - Appropriate log level from settings
    - Colored output for development
    - Timestamp and module information
    
    Args:
        level: Log level override (uses settings if not provided)
        use_colors: Whether to use colored output
        
    Example:
        >>> setup_logging()
        >>> logger = logging.getLogger(__name__)
        >>> logger.info("Application started")
    """
    # Determine log level
    log_level = level or settings.log_level
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Define log format
    # Format: TIMESTAMP | LEVEL | MODULE | MESSAGE
    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s"
    )
    
    # Create formatter
    formatter = ColoredFormatter(log_format, use_colors=use_colors)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add console handler
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    # Keep our application loggers at the configured level
    logging.getLogger("src").setLevel(numeric_level)
    
    # Log the configuration
    root_logger.info(
        f"Logging configured - Level: {log_level}, "
        f"Colors: {use_colors}"
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Convenience function for getting loggers with consistent naming.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Configured logger instance
        
    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Processing request")
    """
    return logging.getLogger(name)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def log_startup_info() -> None:
    """
    Log application startup information.
    
    Logs important configuration details at startup for debugging.
    """
    logger = logging.getLogger(__name__)
    
    logger.info("=" * 60)
    logger.info("GEMINI GUARDIAN - STARTING UP")
    logger.info("=" * 60)
    logger.info(f"Application: {settings.app_name}")
    logger.info(f"Version: {settings.app_version}")
    logger.info(f"Debug Mode: {settings.debug}")
    logger.info(f"Log Level: {settings.log_level}")
    logger.info(f"Host: {settings.host}:{settings.port}")
    logger.info(f"Gemini Model: {settings.gemini_model}")
    logger.info(f"API Key Configured: {bool(settings.gemini_api_key)}")
    logger.info("=" * 60)


def log_shutdown_info() -> None:
    """
    Log application shutdown information.
    
    Called during graceful shutdown to record the event.
    """
    logger = logging.getLogger(__name__)
    
    logger.info("=" * 60)
    logger.info("GEMINI GUARDIAN - SHUTTING DOWN")
    logger.info(f"Shutdown time: {datetime.utcnow().isoformat()}")
    logger.info("=" * 60)
