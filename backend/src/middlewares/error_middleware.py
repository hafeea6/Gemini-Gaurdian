# =============================================================================
# GEMINI GUARDIAN - ERROR HANDLING MIDDLEWARE
# =============================================================================
# Middleware for centralized error handling and formatting.
# Ensures all errors are returned in a consistent format.
#
# Proper error handling is critical for debugging emergencies.
# =============================================================================

import logging
import traceback
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from ..dtos.responses import ErrorResponse, ErrorData

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# ERROR HANDLING MIDDLEWARE CLASS
# =============================================================================

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for centralized exception handling.
    
    Catches all unhandled exceptions and returns them in a
    consistent JSON format suitable for frontend consumption.
    
    Features:
    - Consistent error response format
    - Error logging with stack traces
    - Request ID correlation
    - Safe error messages (no sensitive data exposure)
    """
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Process the request and handle any exceptions.
        
        Args:
            request: The incoming HTTP request
            call_next: The next middleware/endpoint in the chain
            
        Returns:
            The HTTP response or error response
        """
        try:
            # Process the request normally
            response = await call_next(request)
            return response
            
        except Exception as e:
            # Get request ID if available
            request_id = getattr(request.state, "request_id", "unknown")
            
            # Log the full exception with stack trace
            logger.error(
                f"[{request_id}] Unhandled exception: {type(e).__name__}: {e}",
                exc_info=True
            )
            
            # Determine error code and message based on exception type
            error_code, error_message, status_code = self._classify_error(e)
            
            # Build error response
            error_data = ErrorData(
                error_code=error_code,
                error_type=type(e).__name__,
                details=self._get_safe_error_details(e),
                request_id=request_id
            )
            
            error_response = ErrorResponse(
                success=False,
                message=error_message,
                data=error_data
            )
            
            # Return JSON error response
            return JSONResponse(
                status_code=status_code,
                content=error_response.model_dump(),
                headers={"X-Request-ID": request_id}
            )
    
    def _classify_error(self, error: Exception) -> tuple[str, str, int]:
        """
        Classify an exception into error code, message, and status code.
        
        Maps exception types to appropriate HTTP responses.
        
        Args:
            error: The exception to classify
            
        Returns:
            Tuple of (error_code, message, http_status_code)
        """
        # Import here to avoid circular imports
        from fastapi import HTTPException
        
        # Handle FastAPI HTTP exceptions
        if isinstance(error, HTTPException):
            return (
                f"HTTP_{error.status_code}",
                str(error.detail),
                error.status_code
            )
        
        # Handle validation errors
        if "ValidationError" in type(error).__name__:
            return (
                "VALIDATION_ERROR",
                "Request validation failed",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Handle value errors
        if isinstance(error, ValueError):
            return (
                "VALUE_ERROR",
                str(error),
                status.HTTP_400_BAD_REQUEST
            )
        
        # Handle type errors
        if isinstance(error, TypeError):
            return (
                "TYPE_ERROR",
                "Invalid data type provided",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Handle connection errors
        if "ConnectionError" in type(error).__name__:
            return (
                "CONNECTION_ERROR",
                "Service connection failed",
                status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Handle timeout errors
        if "TimeoutError" in type(error).__name__ or "Timeout" in type(error).__name__:
            return (
                "TIMEOUT_ERROR",
                "Request timed out",
                status.HTTP_504_GATEWAY_TIMEOUT
            )
        
        # Default: Internal server error
        return (
            "INTERNAL_ERROR",
            "An unexpected error occurred",
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    def _get_safe_error_details(self, error: Exception) -> str:
        """
        Get safe error details that can be exposed to clients.
        
        Filters out sensitive information like file paths and
        internal implementation details.
        
        Args:
            error: The exception to get details from
            
        Returns:
            Safe error details string
        """
        # Get the basic error message
        error_str = str(error)
        
        # List of sensitive patterns to filter
        sensitive_patterns = [
            "/home/",
            "/app/",
            "C:\\",
            "password",
            "secret",
            "api_key",
            "token",
        ]
        
        # Check if error contains sensitive information
        for pattern in sensitive_patterns:
            if pattern.lower() in error_str.lower():
                # Return generic message
                logger.debug(
                    f"Filtered sensitive information from error: {error_str[:50]}..."
                )
                return "An error occurred. Check server logs for details."
        
        # Truncate very long error messages
        if len(error_str) > 200:
            return error_str[:200] + "..."
        
        return error_str
