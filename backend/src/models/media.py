# =============================================================================
# GEMINI GUARDIAN - MEDIA MODELS
# =============================================================================
# Pydantic models for media data structures (video frames, audio chunks).
# These models handle the real-time streaming data from the frontend.
#
# All media processing must be optimized for low latency.
# =============================================================================

import logging
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# ENUMERATIONS
# =============================================================================

class MediaType(str, Enum):
    """
    Types of media that can be processed by the system.
    
    Each type has different processing requirements and latency constraints.
    """
    VIDEO = "video"    # Video frames from camera
    AUDIO = "audio"    # Audio chunks from microphone
    IMAGE = "image"    # Single image capture


# =============================================================================
# DATA MODELS
# =============================================================================

class MediaFrame(BaseModel):
    """
    Base class for all media frames/chunks.
    
    Contains common metadata for tracking and processing media data.
    
    Attributes:
        frame_id: Unique identifier for this frame
        session_id: Associated emergency session ID
        media_type: Type of media content
        timestamp: When the frame was captured
        sequence_number: Order in the stream
        data: Base64 encoded media data
    """
    frame_id: UUID = Field(
        default_factory=uuid4,
        description="Unique frame identifier"
    )
    session_id: UUID = Field(
        ...,
        description="Associated session ID"
    )
    media_type: MediaType = Field(
        ...,
        description="Type of media content"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Capture timestamp"
    )
    sequence_number: int = Field(
        ...,
        ge=0,
        description="Sequence number in stream"
    )
    data: str = Field(
        ...,
        min_length=1,
        description="Base64 encoded media data"
    )
    
    @field_validator("data")
    @classmethod
    def validate_data_not_empty(cls, value: str) -> str:
        """
        Validate that media data is not empty or whitespace.
        
        Args:
            value: The base64 encoded data string
            
        Returns:
            The validated data string
            
        Raises:
            ValueError: If data is empty or invalid
        """
        # Strip whitespace
        stripped = value.strip()
        
        # Check if empty after stripping
        if not stripped:
            logger.error("Received empty media data")
            raise ValueError("Media data cannot be empty")
        
        return stripped


class VideoFrame(MediaFrame):
    """
    A single video frame from the camera feed.
    
    Contains additional metadata specific to video processing
    such as resolution and frame rate information.
    
    Attributes:
        width: Frame width in pixels
        height: Frame height in pixels
        format: Image format (jpeg, png, webp)
        quality: Compression quality (0-100)
    """
    media_type: MediaType = Field(
        default=MediaType.VIDEO,
        description="Always 'video' for video frames"
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
        description="Image format: jpeg, png, webp"
    )
    quality: int = Field(
        default=85,
        ge=1,
        le=100,
        description="Compression quality percentage"
    )
    
    @field_validator("format")
    @classmethod
    def validate_format(cls, value: str) -> str:
        """
        Validate video frame format.
        
        Args:
            value: The format string
            
        Returns:
            Validated and lowercased format
            
        Raises:
            ValueError: If format is not supported
        """
        # Define supported formats
        supported_formats = ["jpeg", "jpg", "png", "webp"]
        
        # Normalize to lowercase
        normalized = value.lower()
        
        # Check if supported
        if normalized not in supported_formats:
            logger.warning(f"Unsupported video format: {value}")
            raise ValueError(
                f"Unsupported format '{value}'. "
                f"Supported: {', '.join(supported_formats)}"
            )
        
        # Normalize jpg to jpeg
        if normalized == "jpg":
            normalized = "jpeg"
        
        return normalized
    
    def get_aspect_ratio(self) -> float:
        """
        Calculate the aspect ratio of the frame.
        
        Returns:
            Aspect ratio as width/height
        """
        # Prevent division by zero
        if self.height == 0:
            logger.error("Frame height is zero, cannot calculate aspect ratio")
            return 0.0
        
        return self.width / self.height
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "sequence_number": 42,
                "data": "base64_encoded_image_data...",
                "width": 1280,
                "height": 720,
                "format": "jpeg",
                "quality": 85
            }
        }


class AudioChunk(MediaFrame):
    """
    A chunk of audio data from the microphone.
    
    Contains additional metadata specific to audio processing
    such as sample rate and channel information.
    
    Attributes:
        sample_rate: Audio sample rate in Hz
        channels: Number of audio channels
        bit_depth: Bits per sample
        duration_ms: Duration of this chunk in milliseconds
        format: Audio format (pcm, wav, webm)
    """
    media_type: MediaType = Field(
        default=MediaType.AUDIO,
        description="Always 'audio' for audio chunks"
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
    bit_depth: int = Field(
        default=16,
        description="Bits per sample"
    )
    duration_ms: int = Field(
        ...,
        ge=1,
        le=60000,
        description="Chunk duration in milliseconds"
    )
    format: str = Field(
        default="pcm",
        description="Audio format: pcm, wav, webm"
    )
    
    @field_validator("format")
    @classmethod
    def validate_audio_format(cls, value: str) -> str:
        """
        Validate audio format.
        
        Args:
            value: The format string
            
        Returns:
            Validated and lowercased format
            
        Raises:
            ValueError: If format is not supported
        """
        # Define supported formats
        supported_formats = ["pcm", "wav", "webm", "ogg", "mp3"]
        
        # Normalize to lowercase
        normalized = value.lower()
        
        # Check if supported
        if normalized not in supported_formats:
            logger.warning(f"Unsupported audio format: {value}")
            raise ValueError(
                f"Unsupported format '{value}'. "
                f"Supported: {', '.join(supported_formats)}"
            )
        
        return normalized
    
    @field_validator("bit_depth")
    @classmethod
    def validate_bit_depth(cls, value: int) -> int:
        """
        Validate audio bit depth.
        
        Args:
            value: Bit depth value
            
        Returns:
            Validated bit depth
            
        Raises:
            ValueError: If bit depth is not standard
        """
        # Define standard bit depths
        standard_depths = [8, 16, 24, 32]
        
        # Check if standard
        if value not in standard_depths:
            logger.warning(f"Non-standard bit depth: {value}")
            raise ValueError(
                f"Non-standard bit depth '{value}'. "
                f"Standard depths: {', '.join(map(str, standard_depths))}"
            )
        
        return value
    
    def get_duration_seconds(self) -> float:
        """
        Get the duration of this chunk in seconds.
        
        Returns:
            Duration in seconds
        """
        return self.duration_ms / 1000.0
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "sequence_number": 10,
                "data": "base64_encoded_audio_data...",
                "sample_rate": 16000,
                "channels": 1,
                "bit_depth": 16,
                "duration_ms": 500,
                "format": "pcm"
            }
        }
