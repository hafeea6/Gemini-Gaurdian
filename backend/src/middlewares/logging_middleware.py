# =============================================================================
# GEMINI GUARDIAN - LOGGING MIDDLEWARE
# =============================================================================
# Middleware for comprehensive request/response logging.
# Provides detailed logs for debugging and monitoring.
#
# Logs are essential for debugging emergency situations.
# =============================================================================

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# LOGGING MIDDLEWARE CLASS
# =============================================================================

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging all HTTP requests and responses.
    
    Logs:
    - Request method, path, and timing
    - Response status codes
    - Error conditions
    - Request IDs for correlation
    
    This middleware is critical for debugging issues in production.
    """
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Process the request and log details.
        
        Args:
            request: The incoming HTTP request
            call_next: The next middleware/endpoint in the chain
            
        Returns:
            The HTTP response
        """
        # Generate unique request ID for correlation
        request_id = str(uuid.uuid4())[:8]
        
        # Store request ID in request state for access in handlers
        request.state.request_id = request_id
        
        # Record start time for latency calculation
        start_time = time.time()
        
        # Extract request information
        method = request.method
        path = request.url.path
        query = str(request.query_params) if request.query_params else ""
        client_ip = self._get_client_ip(request)
        
        # Log incoming request
        logger.info(
            f"[{request_id}] --> {method} {path} "
            f"{'?' + query if query else ''} "
            f"from {client_ip}"
        )
        
        # Log request headers at debug level
        logger.debug(
            f"[{request_id}] Headers: "
            f"Content-Type={request.headers.get('content-type', 'N/A')}, "
            f"Content-Length={request.headers.get('content-length', 'N/A')}"
        )
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            # Determine log level based on status code
            status_code = response.status_code
            if status_code >= 500:
                log_func = logger.error
            elif status_code >= 400:
                log_func = logger.warning
            else:
                log_func = logger.info
            
            # Log response
            log_func(
                f"[{request_id}] <-- {method} {path} "
                f"- {status_code} in {latency_ms:.2f}ms"
            )
            
            # Log slow requests
            if latency_ms > 1000:
                logger.warning(
                    f"[{request_id}] Slow request detected: "
                    f"{method} {path} took {latency_ms:.2f}ms"
                )
            
            return response
            
        except Exception as e:
            # Calculate latency even for errors
            latency_ms = (time.time() - start_time) * 1000
            
            # Log the exception
            logger.error(
                f"[{request_id}] !!! {method} {path} "
                f"- Exception after {latency_ms:.2f}ms: {type(e).__name__}: {e}"
            )
            
            # Re-raise for error handling middleware
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Extract the client IP address from the request.
        
        Handles X-Forwarded-For header for reverse proxy setups.
        
        Args:
            request: The HTTP request
            
        Returns:
            The client IP address
        """
        # Check for forwarded header (from reverse proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the first IP (original client)
            return forwarded.split(",")[0].strip()
        
        # Fall back to direct client IP
        if request.client:
            return request.client.host
        
        return "unknown"
