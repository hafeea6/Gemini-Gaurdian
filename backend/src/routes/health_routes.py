# =============================================================================
# GEMINI GUARDIAN - HEALTH ROUTES
# =============================================================================
# API route definitions for health check endpoints.
# Provides liveness and readiness probes for monitoring.
#
# Health endpoints are critical for load balancers and orchestration.
# =============================================================================

import logging

from fastapi import APIRouter, Depends

from ..dtos.responses import HealthCheckResponse
from ..controllers.health_controller import health_controller, HealthController

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Create router with prefix and tags
# -----------------------------------------------------------------------------
router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


# =============================================================================
# ROUTE DEFINITIONS
# =============================================================================

@router.get(
    "",
    response_model=HealthCheckResponse,
    summary="Basic health check",
    description="""
    Basic liveness probe. Returns immediately if the service is running.
    Does not check external dependencies.
    
    Use this endpoint for Kubernetes liveness probes.
    """
)
async def health_check(
    controller: HealthController = Depends(lambda: health_controller)
) -> HealthCheckResponse:
    """
    Basic health check endpoint.
    
    Returns simple health status.
    
    Args:
        controller: Health controller (injected)
        
    Returns:
        Health status
    """
    # Log at debug level to avoid log spam
    logger.debug("GET /health - Liveness check")
    
    # Delegate to controller
    return await controller.health_check()


@router.get(
    "/ready",
    response_model=HealthCheckResponse,
    summary="Readiness check",
    description="""
    Detailed readiness probe. Checks all dependencies including
    the Gemini AI service connection.
    
    Use this endpoint for Kubernetes readiness probes.
    """
)
async def readiness_check(
    controller: HealthController = Depends(lambda: health_controller)
) -> HealthCheckResponse:
    """
    Readiness check endpoint.
    
    Verifies all dependencies are ready.
    
    Args:
        controller: Health controller (injected)
        
    Returns:
        Detailed health status
    """
    # Log readiness checks
    logger.debug("GET /health/ready - Readiness check")
    
    # Delegate to controller
    return await controller.readiness_check()


@router.get(
    "/version",
    summary="Get service version",
    description="Returns service name, version, and environment."
)
async def get_version(
    controller: HealthController = Depends(lambda: health_controller)
) -> dict:
    """
    Get service version information.
    
    Args:
        controller: Health controller (injected)
        
    Returns:
        Version information dictionary
    """
    # Log version request
    logger.debug("GET /health/version")
    
    # Delegate to controller
    return await controller.version()
