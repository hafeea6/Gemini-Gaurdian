# =============================================================================
# MIDDLEWARES PACKAGE
# =============================================================================
# Exports all middleware classes for request/response processing.
# Middleware handles cross-cutting concerns like logging, CORS, and errors.
# =============================================================================

from .logging_middleware import LoggingMiddleware
from .error_middleware import ErrorHandlingMiddleware

__all__ = [
    "LoggingMiddleware",
    "ErrorHandlingMiddleware",
]
