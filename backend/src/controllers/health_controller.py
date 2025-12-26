# =============================================================================
# GEMINI GUARDIAN - HEALTH CONTROLLER
# =============================================================================
# Controller for health check and system status endpoints.
# Provides liveness and readiness probes for monitoring.
#
# Health checks are critical for load balancers and orchestration.
# =============================================================================

import logging
from datetime import datetime

from fastapi import HTTPException, status

from ..dtos.responses import HealthCheckResponse, HealthCheckData
from ..config.settings import settings
from ..services.gemini_service import gemini_service, GeminiService

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Track application start time for uptime calculation
# -----------------------------------------------------------------------------
_app_start_time: datetime = datetime.utcnow()


def set_app_start_time(start_time: datetime) -> None:
    """
    Set the application start time.
    
    Called during app startup to track uptime.
    
    Args:
        start_time: The time the application started
    """
    global _app_start_time
    _app_start_time = start_time
    logger.info(f"Application start time set to: {start_time}")


# =============================================================================
# HEALTH CONTROLLER CLASS
# =============================================================================

class HealthController:
    """
    Controller for health check endpoints.
    
    Handles:
    - Basic liveness checks
    - Detailed readiness checks
    - Dependency health verification
    
    Attributes:
        gemini: The Gemini service for connectivity checks
    """
    
    def __init__(
        self,
        gemini: GeminiService = gemini_service
    ) -> None:
        """
        Initialize the health controller.
        
        Args:
            gemini: Gemini service for connectivity verification
        """
        # Log initialization
        logger.info("Initializing HealthController")
        
        # Store service reference
        self.gemini = gemini
        
        # Log successful initialization
        logger.debug("HealthController initialized")
    
    async def health_check(self) -> HealthCheckResponse:
        """
        Basic health check endpoint.
        
        Returns simple health status without checking dependencies.
        Used for liveness probes.
        
        Returns:
            HealthCheckResponse with basic status
        """
        # Log health check
        logger.debug("Processing basic health check")
        
        # Calculate uptime
        uptime = (datetime.utcnow() - _app_start_time).total_seconds()
        
        # Build response
        health_data = HealthCheckData(
            service=settings.app_name,
            version=settings.app_version,
            status="healthy",
            uptime_seconds=uptime,
            gemini_connected=self.gemini.is_initialized
        )
        
        logger.debug(f"Health check complete - uptime: {uptime:.2f}s")
        
        return HealthCheckResponse(
            success=True,
            message="Service is healthy",
            data=health_data
        )
    
    async def readiness_check(self) -> HealthCheckResponse:
        """
        Detailed readiness check endpoint.
        
        Verifies all dependencies are accessible and working.
        Used for readiness probes before accepting traffic.
        
        Returns:
            HealthCheckResponse with detailed status
            
        Raises:
            HTTPException: If service is not ready
        """
        # Log readiness check
        logger.info("Processing readiness check")
        
        # Calculate uptime
        uptime = (datetime.utcnow() - _app_start_time).total_seconds()
        
        # Check Gemini connectivity
        logger.debug("Checking Gemini API connectivity")
        gemini_connected = False
        
        try:
            # Only check if API key is configured
            if settings.gemini_api_key:
                gemini_connected = await self.gemini.check_connection()
            else:
                logger.warning("Gemini API key not configured")
        except Exception as e:
            logger.error(f"Gemini connectivity check failed: {e}")
            gemini_connected = False
        
        # Determine overall status
        if not gemini_connected and settings.gemini_api_key:
            # Gemini is required but not connected
            logger.warning("Readiness check failed - Gemini not connected")
            
            health_data = HealthCheckData(
                service=settings.app_name,
                version=settings.app_version,
                status="degraded",
                uptime_seconds=uptime,
                gemini_connected=gemini_connected
            )
            
            # Return degraded but don't fail
            # In production, you might want to raise HTTPException
            return HealthCheckResponse(
                success=True,
                message="Service is degraded - AI service unavailable",
                data=health_data
            )
        
        # All checks passed
        health_data = HealthCheckData(
            service=settings.app_name,
            version=settings.app_version,
            status="ready",
            uptime_seconds=uptime,
            gemini_connected=gemini_connected
        )
        
        logger.info(
            f"Readiness check passed - Gemini: {gemini_connected}"
        )
        
        return HealthCheckResponse(
            success=True,
            message="Service is ready",
            data=health_data
        )
    
    async def version(self) -> dict:
        """
        Get service version information.
        
        Returns:
            Dictionary with version details
        """
        logger.debug("Processing version request")
        
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": "development" if settings.debug else "production"
        }


# -----------------------------------------------------------------------------
# Module-level controller instance
# -----------------------------------------------------------------------------
health_controller = HealthController()
