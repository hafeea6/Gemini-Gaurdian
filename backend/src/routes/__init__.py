# =============================================================================
# ROUTES PACKAGE
# =============================================================================
# Exports all API route definitions.
# Routes define the API endpoints and connect to controllers.
# =============================================================================

from .emergency_routes import router as emergency_router
from .session_routes import router as session_router
from .health_routes import router as health_router

__all__ = [
    "emergency_router",
    "session_router",
    "health_router",
]
