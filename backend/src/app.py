# =============================================================================
# GEMINI GUARDIAN - FASTAPI APPLICATION SETUP
# =============================================================================
# Main FastAPI application configuration and setup.
# Configures middleware, routes, CORS, and lifecycle events.
#
# This is the central application configuration file.
# =============================================================================

import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.settings import settings
from .middlewares.logging_middleware import LoggingMiddleware
from .middlewares.error_middleware import ErrorHandlingMiddleware
from .routes import emergency_router, session_router, health_router
from .utils.logging_config import setup_logging, log_startup_info, log_shutdown_info
from .controllers.health_controller import set_app_start_time

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# APPLICATION LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.
    
    Handles startup and shutdown events for the application.
    
    Startup:
    - Configure logging
    - Initialize services
    - Log startup information
    
    Shutdown:
    - Clean up resources
    - Log shutdown information
    
    Args:
        app: The FastAPI application instance
        
    Yields:
        None during application runtime
    """
    # ==========================================================================
    # STARTUP
    # ==========================================================================
    
    # Configure logging first
    setup_logging()
    
    # Record start time
    start_time = datetime.utcnow()
    set_app_start_time(start_time)
    
    # Log startup information
    log_startup_info()
    
    # Initialize services (lazy initialization, so just log)
    logger.info("Services will be initialized on first use")
    
    # Log ready message
    logger.info(
        f"Application ready - accepting requests on "
        f"http://{settings.host}:{settings.port}"
    )
    
    # Yield control to the application
    yield
    
    # ==========================================================================
    # SHUTDOWN
    # ==========================================================================
    
    # Log shutdown
    log_shutdown_info()
    
    # Cleanup resources
    logger.info("Cleanup complete")


# =============================================================================
# APPLICATION FACTORY
# =============================================================================

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    This factory function:
    1. Creates the FastAPI instance
    2. Configures middleware (order matters!)
    3. Registers routes
    4. Sets up CORS
    
    Returns:
        Configured FastAPI application
        
    Example:
        >>> app = create_app()
        >>> # Run with uvicorn
    """
    logger.info("Creating FastAPI application")
    
    # -------------------------------------------------------------------------
    # Create FastAPI instance
    # -------------------------------------------------------------------------
    app = FastAPI(
        title=settings.app_name,
        description="""
        ## Gemini Guardian API
        
        Real-time emergency assistance powered by Google Gemini AI.
        
        ### Features:
        - **Video Analysis**: Real-time emergency detection from camera feed
        - **Voice Assistance**: Two-way voice communication for guidance
        - **First Aid Instructions**: Step-by-step emergency response guidance
        - **Session Management**: Track and manage emergency sessions
        
        ### Important Notes:
        - This is a **life-critical application**
        - Response times are optimized for emergency situations
        - Always call 911 for real emergencies
        """,
        version=settings.app_version,
        docs_url="/docs" if settings.debug else None,  # Disable in production
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )
    
    # -------------------------------------------------------------------------
    # Configure CORS
    # -------------------------------------------------------------------------
    logger.info("Configuring CORS middleware")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    
    # -------------------------------------------------------------------------
    # Configure Custom Middleware
    # Order matters! First added = outermost (runs first on request, last on response)
    # -------------------------------------------------------------------------
    
    # Error handling should be outermost to catch all exceptions
    logger.info("Adding error handling middleware")
    app.add_middleware(ErrorHandlingMiddleware)
    
    # Logging middleware to track all requests
    logger.info("Adding logging middleware")
    app.add_middleware(LoggingMiddleware)
    
    # -------------------------------------------------------------------------
    # Register Routes
    # -------------------------------------------------------------------------
    logger.info("Registering API routes")
    
    # Health check routes (no prefix for /health)
    app.include_router(health_router)
    
    # API routes under /api/v1 prefix
    app.include_router(session_router, prefix="/api/v1")
    app.include_router(emergency_router, prefix="/api/v1")
    
    # -------------------------------------------------------------------------
    # Root endpoint
    # -------------------------------------------------------------------------
    @app.get("/", tags=["Root"])
    async def root() -> dict:
        """
        Root endpoint - API information.
        
        Returns:
            API name and version
        """
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "operational",
            "docs": "/docs" if settings.debug else "disabled",
        }
    
    logger.info("FastAPI application created successfully")
    
    return app


# =============================================================================
# APPLICATION INSTANCE
# =============================================================================

# Create the application instance
# This is imported by the server module
app = create_app()
