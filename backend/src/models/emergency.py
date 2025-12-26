# =============================================================================
# GEMINI GUARDIAN - EMERGENCY MODELS
# =============================================================================
# Pydantic models for emergency-related data structures.
# These models are used internally and for database persistence.
#
# All models are fully typed and validated for life-critical reliability.
# =============================================================================

import logging
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# ENUMERATIONS
# =============================================================================

class EmergencyType(str, Enum):
    """
    Classification of emergency types recognized by the system.
    
    Each type maps to specific first aid protocols and response procedures.
    The system uses these classifications to provide appropriate guidance.
    """
    # Cardiac emergencies
    CARDIAC_ARREST = "cardiac_arrest"
    HEART_ATTACK = "heart_attack"
    
    # Respiratory emergencies
    CHOKING = "choking"
    DROWNING = "drowning"
    ASTHMA_ATTACK = "asthma_attack"
    
    # Trauma emergencies
    SEVERE_BLEEDING = "severe_bleeding"
    FRACTURE = "fracture"
    BURN = "burn"
    HEAD_INJURY = "head_injury"
    
    # Medical emergencies
    STROKE = "stroke"
    SEIZURE = "seizure"
    DIABETIC_EMERGENCY = "diabetic_emergency"
    ALLERGIC_REACTION = "allergic_reaction"
    POISONING = "poisoning"
    
    # Other emergencies
    UNCONSCIOUS = "unconscious"
    SHOCK = "shock"
    UNKNOWN = "unknown"


class SeverityLevel(int, Enum):
    """
    Severity classification for emergency situations.
    
    Higher numbers indicate more critical situations requiring
    immediate intervention. This affects instruction priority
    and the urgency of the guidance provided.
    
    Levels:
        1 - LOW: Minor injury, non-life-threatening
        2 - MODERATE: Requires attention but stable
        3 - HIGH: Serious, requires immediate action
        4 - CRITICAL: Life-threatening, every second counts
        5 - EXTREME: Imminent death without intervention
    """
    LOW = 1
    MODERATE = 2
    HIGH = 3
    CRITICAL = 4
    EXTREME = 5


class EmergencyStatus(str, Enum):
    """
    Current status of an emergency session.
    
    Tracks the lifecycle of an emergency from detection to resolution.
    """
    # Initial states
    PENDING = "pending"          # Awaiting initial analysis
    ANALYZING = "analyzing"      # AI is processing the situation
    
    # Active states
    ACTIVE = "active"            # Emergency confirmed, providing assistance
    MONITORING = "monitoring"    # Situation stable, watching for changes
    
    # Terminal states
    RESOLVED = "resolved"        # Emergency successfully handled
    ESCALATED = "escalated"      # Handed off to professional services
    CANCELLED = "cancelled"      # User cancelled the session


# =============================================================================
# DATA MODELS
# =============================================================================

class FirstAidInstruction(BaseModel):
    """
    A single first aid instruction step.
    
    Instructions are ordered and may include timing requirements,
    visual cues, and voice guidance text.
    
    Attributes:
        step_number: Sequential order of this instruction
        instruction_text: Clear, concise instruction for the user
        voice_text: Text optimized for text-to-speech output
        duration_seconds: Estimated time to complete this step
        requires_confirmation: Whether user must confirm completion
        warning: Optional safety warning for this step
        visual_cue: Optional description for visual guidance
    """
    step_number: int = Field(
        ...,
        ge=1,
        description="Sequential step number starting from 1"
    )
    instruction_text: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Clear instruction text for display"
    )
    voice_text: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Instruction text optimized for speech synthesis"
    )
    duration_seconds: Optional[int] = Field(
        default=None,
        ge=0,
        description="Estimated seconds to complete this step"
    )
    requires_confirmation: bool = Field(
        default=False,
        description="Whether user must confirm step completion"
    )
    warning: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Safety warning for this step"
    )
    visual_cue: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Visual guidance description"
    )
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "step_number": 1,
                "instruction_text": "Place the heel of your hand on the center of the chest",
                "voice_text": "Place the heel of your hand on the center of the person's chest, between the nipples.",
                "duration_seconds": 5,
                "requires_confirmation": True,
                "warning": "Ensure the person is on a firm, flat surface",
                "visual_cue": "Hand position should be on the lower half of the breastbone"
            }
        }


class EmergencyAnalysis(BaseModel):
    """
    Result of AI analysis of an emergency situation.
    
    Contains the AI's assessment of the situation including type,
    severity, confidence, and any observations.
    
    Attributes:
        emergency_type: Classified type of emergency
        severity: Assessed severity level
        confidence_score: AI confidence in the assessment (0.0-1.0)
        observations: List of relevant observations from the scene
        recommended_action: Immediate recommended action
        call_emergency_services: Whether to advise calling 911
        additional_context: Any additional context from the AI
    """
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
        description="AI confidence score between 0 and 1"
    )
    observations: List[str] = Field(
        default_factory=list,
        description="List of observations from the scene"
    )
    recommended_action: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Immediate recommended action"
    )
    call_emergency_services: bool = Field(
        default=True,
        description="Whether to advise calling emergency services"
    )
    additional_context: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Additional context from AI analysis"
    )
    
    @field_validator("observations")
    @classmethod
    def validate_observations(cls, value: List[str]) -> List[str]:
        """
        Validate and clean observation strings.
        
        Args:
            value: List of observation strings
            
        Returns:
            Cleaned list of observations
        """
        # Remove empty strings and strip whitespace
        cleaned = [obs.strip() for obs in value if obs and obs.strip()]
        
        # Log if observations were cleaned
        if len(cleaned) != len(value):
            logger.debug(
                f"Cleaned observations list: {len(value)} -> {len(cleaned)} items"
            )
        
        return cleaned


class EmergencySession(BaseModel):
    """
    Represents an active emergency assistance session.
    
    Tracks the full lifecycle of an emergency from start to finish,
    including all analysis results and instructions provided.
    
    Attributes:
        session_id: Unique identifier for this session
        status: Current session status
        started_at: When the session began
        updated_at: Last update timestamp
        ended_at: When the session ended (if applicable)
        analysis: AI analysis results
        instructions: List of first aid instructions
        current_step: Current instruction step number
        user_notes: Any notes from the user
        location_data: Optional GPS coordinates
    """
    session_id: UUID = Field(
        default_factory=uuid4,
        description="Unique session identifier"
    )
    status: EmergencyStatus = Field(
        default=EmergencyStatus.PENDING,
        description="Current session status"
    )
    started_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Session start timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last update timestamp"
    )
    ended_at: Optional[datetime] = Field(
        default=None,
        description="Session end timestamp"
    )
    analysis: Optional[EmergencyAnalysis] = Field(
        default=None,
        description="AI analysis results"
    )
    instructions: List[FirstAidInstruction] = Field(
        default_factory=list,
        description="First aid instruction steps"
    )
    current_step: int = Field(
        default=0,
        ge=0,
        description="Current instruction step (0 = not started)"
    )
    user_notes: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Notes from the user about the situation"
    )
    location_data: Optional[str] = Field(
        default=None,
        description="GPS coordinates or location description"
    )
    
    def advance_step(self) -> bool:
        """
        Advance to the next instruction step.
        
        Returns:
            bool: True if advanced, False if already at last step
        """
        # Check if we can advance
        if self.current_step < len(self.instructions):
            # Increment step counter
            self.current_step += 1
            
            # Update timestamp
            self.updated_at = datetime.utcnow()
            
            # Log the advancement
            logger.info(
                f"Session {self.session_id}: Advanced to step {self.current_step}"
            )
            
            return True
        
        # Already at or past last step
        logger.warning(
            f"Session {self.session_id}: Cannot advance past step {self.current_step}"
        )
        return False
    
    def get_current_instruction(self) -> Optional[FirstAidInstruction]:
        """
        Get the current instruction step.
        
        Returns:
            The current instruction or None if not started or completed
        """
        # Check bounds
        if 0 < self.current_step <= len(self.instructions):
            # Return the current instruction (1-indexed)
            return self.instructions[self.current_step - 1]
        
        return None
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "active",
                "started_at": "2024-01-15T10:30:00Z",
                "current_step": 1
            }
        }
