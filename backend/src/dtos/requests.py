# =============================================================================
# GEMINI GUARDIAN - REQUEST DTOS
# =============================================================================
# Data Transfer Objects for API request validation.
# These DTOs validate incoming data from the frontend before processing.
#
# All requests must be validated for security and data integrity.
# =============================================================================

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# WEBSOCKET MESSAGE TYPES
# =============================================================================

class WebSocketMessageType(str, Enum):
    """
    Types of WebSocket messages exchanged between client and server.
    
    Defines the protocol for real-time bidirectional communication.
    """
    # Client -> Server messages
    VIDEO_FRAME = "video_frame"        # Video frame data
    AUDIO_CHUNK = "audio_chunk"        # Audio chunk data
    USER_MESSAGE = "user_message"      # Text message from user
    STEP_CONFIRM = "step_confirm"      # User confirmed step completion
    REQUEST_HELP = "request_help"      # User requests additional help
    END_SESSION = "end_session"        # User wants to end session
    
    # Server -> Client messages
    ANALYSIS_RESULT = "analysis_result"    # AI analysis result
    INSTRUCTION = "instruction"            # First aid instruction
    VOICE_RESPONSE = "voice_response"      # AI voice response text
    SESSION_UPDATE = "session_update"      # Session status update
    ERROR = "error"                        # Error message
    HEARTBEAT = "heartbeat"                # Keep-alive ping/pong


# =============================================================================
# REQUEST DTOS
# =============================================================================

class StartSessionRequest(BaseModel):
    """
    Request to start a new emergency session.
    
    Creates a new session for tracking the emergency assistance workflow.
    
    Attributes:
        user_notes: Optional initial notes about the emergency
        location_data: Optional GPS coordinates or location description
        device_info: Optional device/browser information
    """
    user_notes: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Initial notes about the emergency situation"
    )
    location_data: Optional[str] = Field(
        default=None,
        max_length=500,
        description="GPS coordinates or location description"
    )
    device_info: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Device and browser information for debugging"
    )
    
    @field_validator("user_notes", "location_data", "device_info")
    @classmethod
    def strip_whitespace(cls, value: Optional[str]) -> Optional[str]:
        """
        Strip whitespace from string fields.
        
        Args:
            value: The string value to clean
            
        Returns:
            Cleaned string or None
        """
        if value is None:
            return None
        
        # Strip whitespace
        stripped = value.strip()
        
        # Return None if empty after stripping
        return stripped if stripped else None
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "user_notes": "Person collapsed while jogging in the park",
                "location_data": "40.7128,-74.0060",
                "device_info": "iPhone 14 Pro, iOS 17.2"
            }
        }


class AnalyzeFrameRequest(BaseModel):
    """
    Request to analyze a video frame for emergency detection.
    
    Contains a single video frame for AI analysis.
    
    Attributes:
        session_id: The session this frame belongs to
        frame_data: Base64 encoded image data
        sequence_number: Frame sequence number
        width: Frame width in pixels
        height: Frame height in pixels
        format: Image format (jpeg, png, webp)
        timestamp: When the frame was captured
    """
    session_id: UUID = Field(
        ...,
        description="Session ID this frame belongs to"
    )
    frame_data: str = Field(
        ...,
        min_length=100,  # Minimum realistic base64 image size
        description="Base64 encoded image data"
    )
    sequence_number: int = Field(
        ...,
        ge=0,
        description="Frame sequence number"
    )
    width: int = Field(
        ...,
        ge=1,
        le=4096,
        description="Frame width in pixels"
    )
    height: int = Field(
        ...,
        ge=1,
        le=4096,
        description="Frame height in pixels"
    )
    format: str = Field(
        default="jpeg",
        description="Image format"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Frame capture timestamp"
    )
    
    @field_validator("frame_data")
    @classmethod
    def validate_base64(cls, value: str) -> str:
        """
        Basic validation that data looks like base64.
        
        Args:
            value: The base64 string to validate
            
        Returns:
            The validated base64 string
            
        Raises:
            ValueError: If data doesn't look like valid base64
        """
        # Strip whitespace
        stripped = value.strip()
        
        # Remove data URL prefix if present
        if stripped.startswith("data:"):
            # Extract base64 portion after comma
            try:
                stripped = stripped.split(",", 1)[1]
            except IndexError:
                logger.error("Invalid data URL format in frame_data")
                raise ValueError("Invalid data URL format")
        
        # Basic check - base64 should only contain valid characters
        import re
        if not re.match(r'^[A-Za-z0-9+/=]+$', stripped):
            logger.warning("Frame data contains invalid base64 characters")
            raise ValueError("Invalid base64 encoding")
        
        return stripped
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "frame_data": "iVBORw0KGgoAAAANSUhEUg...",
                "sequence_number": 42,
                "width": 1280,
                "height": 720,
                "format": "jpeg"
            }
        }


class ProcessAudioRequest(BaseModel):
    """
    Request to process an audio chunk for speech recognition.
    
    Contains audio data from the user's microphone.
    
    Attributes:
        session_id: The session this audio belongs to
        audio_data: Base64 encoded audio data
        sequence_number: Audio chunk sequence number
        sample_rate: Audio sample rate in Hz
        channels: Number of audio channels
        duration_ms: Duration of the chunk in milliseconds
        format: Audio format (pcm, wav, webm)
    """
    session_id: UUID = Field(
        ...,
        description="Session ID this audio belongs to"
    )
    audio_data: str = Field(
        ...,
        min_length=10,
        description="Base64 encoded audio data"
    )
    sequence_number: int = Field(
        ...,
        ge=0,
        description="Audio chunk sequence number"
    )
    sample_rate: int = Field(
        default=16000,
        ge=8000,
        le=96000,
        description="Sample rate in Hz"
    )
    channels: int = Field(
        default=1,
        ge=1,
        le=8,
        description="Number of audio channels"
    )
    duration_ms: int = Field(
        ...,
        ge=1,
        le=60000,
        description="Chunk duration in milliseconds"
    )
    format: str = Field(
        default="webm",
        description="Audio format"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "audio_data": "base64_audio_data...",
                "sequence_number": 5,
                "sample_rate": 16000,
                "channels": 1,
                "duration_ms": 500,
                "format": "webm"
            }
        }


class AdvanceStepRequest(BaseModel):
    """
    Request to advance to the next instruction step.
    
    Confirms the user has completed the current step.
    
    Attributes:
        session_id: The session to advance
        current_step: The step being completed
        feedback: Optional feedback about the step
    """
    session_id: UUID = Field(
        ...,
        description="Session ID to advance"
    )
    current_step: int = Field(
        ...,
        ge=1,
        description="The step number being completed"
    )
    feedback: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional feedback about the step"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "current_step": 1,
                "feedback": "Completed successfully"
            }
        }


class EndSessionRequest(BaseModel):
    """
    Request to end an emergency session.
    
    Terminates the session and optionally provides resolution details.
    
    Attributes:
        session_id: The session to end
        reason: Why the session is ending
        notes: Optional notes about the resolution
        emergency_services_called: Whether 911 was called
    """
    session_id: UUID = Field(
        ...,
        description="Session ID to end"
    )
    reason: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Reason for ending the session"
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Notes about the resolution"
    )
    emergency_services_called: bool = Field(
        default=False,
        description="Whether emergency services were contacted"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "reason": "Emergency services arrived",
                "notes": "Paramedics took over care",
                "emergency_services_called": True
            }
        }


class WebSocketMessage(BaseModel):
    """
    Generic WebSocket message format.
    
    All WebSocket communication uses this envelope format.
    
    Attributes:
        type: Message type identifier
        session_id: Associated session ID
        timestamp: Message timestamp
        payload: Message-specific data
    """
    type: WebSocketMessageType = Field(
        ...,
        description="Message type identifier"
    )
    session_id: UUID = Field(
        ...,
        description="Associated session ID"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Message timestamp"
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Message-specific payload data"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "type": "video_frame",
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": "2024-01-15T10:30:00Z",
                "payload": {
                    "frame_data": "base64...",
                    "sequence_number": 42
                }
            }
        }
