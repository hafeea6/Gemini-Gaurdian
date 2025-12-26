# =============================================================================
# GEMINI GUARDIAN - RESPONSE DTOS
# =============================================================================
# Data Transfer Objects for API response formatting.
# These DTOs ensure consistent, typed responses to the frontend.
#
# All responses follow a consistent structure for predictable frontend parsing.
# =============================================================================

import logging
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

from ..models.emergency import (
    EmergencyAnalysis,
    EmergencyStatus,
    EmergencyType,
    FirstAidInstruction,
    SeverityLevel,
)

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Generic type variable for response data
# -----------------------------------------------------------------------------
T = TypeVar("T")


# =============================================================================
# BASE RESPONSE
# =============================================================================

class BaseResponse(BaseModel, Generic[T]):
    """
    Base response wrapper for all API responses.
    
    Provides a consistent structure with success status,
    message, and typed data payload.
    
    Attributes:
        success: Whether the request was successful
        message: Human-readable status message
        timestamp: Response generation timestamp
        data: Response payload (type varies by endpoint)
    """
    success: bool = Field(
        ...,
        description="Whether the request was successful"
    )
    message: str = Field(
        ...,
        description="Human-readable status message"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response timestamp"
    )
    data: Optional[T] = Field(
        default=None,
        description="Response payload"
    )


# =============================================================================
# SPECIFIC RESPONSE DTOS
# =============================================================================

class SessionData(BaseModel):
    """
    Data payload for session responses.
    
    Contains all relevant session information.
    
    Attributes:
        session_id: Unique session identifier
        status: Current session status
        started_at: When the session started
        current_step: Current instruction step
        total_steps: Total number of instruction steps
        emergency_type: Detected emergency type (if any)
        severity: Assessed severity level (if any)
    """
    session_id: UUID = Field(
        ...,
        description="Unique session identifier"
    )
    status: EmergencyStatus = Field(
        ...,
        description="Current session status"
    )
    started_at: datetime = Field(
        ...,
        description="Session start timestamp"
    )
    current_step: int = Field(
        default=0,
        ge=0,
        description="Current instruction step number"
    )
    total_steps: int = Field(
        default=0,
        ge=0,
        description="Total number of instruction steps"
    )
    emergency_type: Optional[EmergencyType] = Field(
        default=None,
        description="Detected emergency type"
    )
    severity: Optional[SeverityLevel] = Field(
        default=None,
        description="Assessed severity level"
    )


class SessionResponse(BaseResponse[SessionData]):
    """
    Response for session-related operations.
    
    Used for creating, updating, and retrieving sessions.
    """
    data: Optional[SessionData] = Field(
        default=None,
        description="Session data"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Session created successfully",
                "timestamp": "2024-01-15T10:30:00Z",
                "data": {
                    "session_id": "550e8400-e29b-41d4-a716-446655440000",
                    "status": "active",
                    "started_at": "2024-01-15T10:30:00Z",
                    "current_step": 0,
                    "total_steps": 0
                }
            }
        }


class AnalysisData(BaseModel):
    """
    Data payload for analysis responses.
    
    Contains the AI's assessment of the emergency situation.
    
    Attributes:
        session_id: Associated session ID
        emergency_type: Classified emergency type
        severity: Assessed severity level
        confidence_score: AI confidence in assessment
        observations: List of scene observations
        recommended_action: Immediate recommended action
        call_emergency_services: Whether to call 911
        instructions: List of first aid instructions
        voice_guidance: Text for voice synthesis
    """
    session_id: UUID = Field(
        ...,
        description="Associated session ID"
    )
    emergency_type: EmergencyType = Field(
        ...,
        description="Classified emergency type"
    )
    severity: SeverityLevel = Field(
        ...,
        description="Assessed severity level"
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="AI confidence score"
    )
    observations: List[str] = Field(
        default_factory=list,
        description="Scene observations"
    )
    recommended_action: str = Field(
        ...,
        description="Immediate recommended action"
    )
    call_emergency_services: bool = Field(
        default=True,
        description="Whether to call emergency services"
    )
    instructions: List[FirstAidInstruction] = Field(
        default_factory=list,
        description="First aid instruction steps"
    )
    voice_guidance: str = Field(
        ...,
        description="Voice guidance text"
    )


class AnalysisResponse(BaseResponse[AnalysisData]):
    """
    Response for emergency analysis operations.
    
    Returns AI analysis results and first aid instructions.
    """
    data: Optional[AnalysisData] = Field(
        default=None,
        description="Analysis data"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Analysis complete",
                "timestamp": "2024-01-15T10:30:05Z",
                "data": {
                    "session_id": "550e8400-e29b-41d4-a716-446655440000",
                    "emergency_type": "cardiac_arrest",
                    "severity": 5,
                    "confidence_score": 0.92,
                    "observations": [
                        "Person unresponsive on ground",
                        "No visible breathing"
                    ],
                    "recommended_action": "Begin CPR immediately",
                    "call_emergency_services": True,
                    "voice_guidance": "Stay calm. Call 911 if not already done."
                }
            }
        }


class InstructionData(BaseModel):
    """
    Data payload for instruction responses.
    
    Contains the current instruction and progress information.
    
    Attributes:
        session_id: Associated session ID
        current_step: Current step number
        total_steps: Total number of steps
        instruction: Current instruction details
        next_instruction: Preview of next instruction
        voice_text: Text for voice synthesis
    """
    session_id: UUID = Field(
        ...,
        description="Associated session ID"
    )
    current_step: int = Field(
        ...,
        ge=1,
        description="Current step number"
    )
    total_steps: int = Field(
        ...,
        ge=1,
        description="Total number of steps"
    )
    instruction: FirstAidInstruction = Field(
        ...,
        description="Current instruction details"
    )
    next_instruction: Optional[FirstAidInstruction] = Field(
        default=None,
        description="Preview of next instruction"
    )
    voice_text: str = Field(
        ...,
        description="Text for voice synthesis"
    )


class InstructionResponse(BaseResponse[InstructionData]):
    """
    Response for instruction-related operations.
    
    Returns current instruction and progress.
    """
    data: Optional[InstructionData] = Field(
        default=None,
        description="Instruction data"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Instruction retrieved",
                "timestamp": "2024-01-15T10:30:10Z",
                "data": {
                    "session_id": "550e8400-e29b-41d4-a716-446655440000",
                    "current_step": 1,
                    "total_steps": 5,
                    "instruction": {
                        "step_number": 1,
                        "instruction_text": "Place heel of hand on center of chest",
                        "voice_text": "Place the heel of your hand on the center of the chest."
                    },
                    "voice_text": "Step 1 of 5. Place the heel of your hand on the center of the chest."
                }
            }
        }


class ErrorData(BaseModel):
    """
    Data payload for error responses.
    
    Contains detailed error information for debugging.
    
    Attributes:
        error_code: Application-specific error code
        error_type: Type of error that occurred
        details: Additional error details
        request_id: Request tracking ID
    """
    error_code: str = Field(
        ...,
        description="Application-specific error code"
    )
    error_type: str = Field(
        ...,
        description="Type of error"
    )
    details: Optional[str] = Field(
        default=None,
        description="Additional error details"
    )
    request_id: Optional[str] = Field(
        default=None,
        description="Request tracking ID for support"
    )


class ErrorResponse(BaseResponse[ErrorData]):
    """
    Response for error conditions.
    
    Returns structured error information.
    """
    success: bool = Field(
        default=False,
        description="Always False for errors"
    )
    data: Optional[ErrorData] = Field(
        default=None,
        description="Error data"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "success": False,
                "message": "An error occurred processing your request",
                "timestamp": "2024-01-15T10:30:00Z",
                "data": {
                    "error_code": "ANALYSIS_FAILED",
                    "error_type": "AIProcessingError",
                    "details": "Unable to process video frame",
                    "request_id": "req_abc123"
                }
            }
        }


class HealthCheckData(BaseModel):
    """
    Data payload for health check responses.
    
    Contains service health information.
    
    Attributes:
        service: Service name
        version: Service version
        status: Service status
        uptime_seconds: Service uptime
        gemini_connected: Whether Gemini API is accessible
    """
    service: str = Field(
        ...,
        description="Service name"
    )
    version: str = Field(
        ...,
        description="Service version"
    )
    status: str = Field(
        ...,
        description="Service status"
    )
    uptime_seconds: float = Field(
        ...,
        ge=0,
        description="Service uptime in seconds"
    )
    gemini_connected: bool = Field(
        ...,
        description="Whether Gemini API is accessible"
    )


class HealthCheckResponse(BaseResponse[HealthCheckData]):
    """
    Response for health check endpoint.
    
    Returns service health information.
    """
    data: Optional[HealthCheckData] = Field(
        default=None,
        description="Health check data"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Service is healthy",
                "timestamp": "2024-01-15T10:30:00Z",
                "data": {
                    "service": "Gemini Guardian API",
                    "version": "1.0.0",
                    "status": "healthy",
                    "uptime_seconds": 3600.5,
                    "gemini_connected": True
                }
            }
        }


class WebSocketResponseData(BaseModel):
    """
    Data payload for WebSocket responses.
    
    Contains the message type and payload.
    
    Attributes:
        type: Message type identifier
        session_id: Associated session ID
        payload: Message-specific data
    """
    type: str = Field(
        ...,
        description="Message type identifier"
    )
    session_id: UUID = Field(
        ...,
        description="Associated session ID"
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Message-specific payload"
    )


class WebSocketResponse(BaseResponse[WebSocketResponseData]):
    """
    Response wrapper for WebSocket messages.
    
    Provides consistent structure for WebSocket communication.
    """
    data: Optional[WebSocketResponseData] = Field(
        default=None,
        description="WebSocket response data"
    )
