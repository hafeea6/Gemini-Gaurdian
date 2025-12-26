# =============================================================================
# DTOS PACKAGE - DATA TRANSFER OBJECTS
# =============================================================================
# Exports all DTOs used for API request/response validation.
# DTOs ensure type-safe data transfer between frontend and backend.
# =============================================================================

from .requests import (
    StartSessionRequest,
    AnalyzeFrameRequest,
    ProcessAudioRequest,
    AdvanceStepRequest,
    EndSessionRequest,
    WebSocketMessage,
    WebSocketMessageType,
)
from .responses import (
    SessionResponse,
    AnalysisResponse,
    InstructionResponse,
    ErrorResponse,
    HealthCheckResponse,
    WebSocketResponse,
)

__all__ = [
    # Request DTOs
    "StartSessionRequest",
    "AnalyzeFrameRequest",
    "ProcessAudioRequest",
    "AdvanceStepRequest",
    "EndSessionRequest",
    "WebSocketMessage",
    "WebSocketMessageType",
    # Response DTOs
    "SessionResponse",
    "AnalysisResponse",
    "InstructionResponse",
    "ErrorResponse",
    "HealthCheckResponse",
    "WebSocketResponse",
]
