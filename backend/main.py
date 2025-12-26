# =============================================================================
# GEMINI GUARDIAN - MAIN ENTRY POINT
# =============================================================================
# Application entry point for running with uvicorn.
# Imports the FastAPI app from the src package.
#
# Usage:
#   uvicorn main:app --reload --host 0.0.0.0 --port 8000
#
# Or run directly:
#   python main.py
# =============================================================================

import uvicorn

# Import the configured FastAPI application
from src.app import app

# Re-export for uvicorn
__all__ = ["app"]


if __name__ == "__main__":
    """
    Run the application directly with uvicorn.
    
    This allows running the server with: python main.py
    
    For production, use: uvicorn main:app --host 0.0.0.0 --port 8000
    """
    # Import settings for configuration
    from src.config.settings import settings
    
    # Run uvicorn with settings
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,  # Auto-reload in debug mode
        log_level=settings.log_level.lower(),
    )
