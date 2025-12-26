# =============================================================================
# GEMINI GUARDIAN - EMERGENCY ROUTES
# =============================================================================
# API route definitions for emergency-related endpoints.
# Handles frame analysis, audio processing, and instruction management.
#
# These endpoints are time-critical for emergency response.
# =============================================================================

import logging
from uuid import UUID

from fastapi import APIRouter, Depends

from ..dtos.requests import AnalyzeFrameRequest, ProcessAudioRequest, AdvanceStepRequest
from ..dtos.responses import AnalysisResponse, InstructionResponse
from ..controllers.emergency_controller import emergency_controller, EmergencyController

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Create router with prefix and tags
# -----------------------------------------------------------------------------
router = APIRouter(
    prefix="/emergency",
    tags=["Emergency"],
    responses={
        404: {"description": "Session not found"},
        500: {"description": "Internal server error"},
    }
)


# =============================================================================
# ROUTE DEFINITIONS
# =============================================================================

@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Analyze video frame for emergency detection",
    description="""
    Analyze a single video frame from the camera feed to detect and assess
    emergency situations. Uses Gemini AI for real-time analysis.
    
    **This is the primary endpoint for emergency detection.**
    
    The frame should be a base64-encoded JPEG image. Analysis includes:
    - Emergency type classification
    - Severity assessment (1-5 scale)
    - First aid instructions generation
    - Voice guidance text
    
    Response time target: < 2 seconds
    """
)
async def analyze_frame(
    request: AnalyzeFrameRequest,
    controller: EmergencyController = Depends(lambda: emergency_controller)
) -> AnalysisResponse:
    """
    Analyze a video frame for emergency detection.
    
    This endpoint receives video frames from the frontend camera feed
    and processes them through Gemini AI for emergency analysis.
    
    Args:
        request: Frame data and session information
        controller: Emergency controller (injected)
        
    Returns:
        Analysis results with emergency type, severity, and instructions
    """
    # Log route hit
    logger.info(f"POST /emergency/analyze - Session: {request.session_id}")
    
    # Delegate to controller
    return await controller.analyze_frame(request)


@router.post(
    "/audio",
    response_model=AnalysisResponse,
    summary="Process audio from user microphone",
    description="""
    Process audio input from the user's microphone for speech recognition
    and AI response generation.
    
    Audio should be base64-encoded in WebM or PCM format. The system will:
    - Transcribe the speech
    - Process the query through Gemini AI
    - Generate an appropriate response
    
    Response time target: < 3 seconds
    """
)
async def process_audio(
    request: ProcessAudioRequest,
    controller: EmergencyController = Depends(lambda: emergency_controller)
) -> AnalysisResponse:
    """
    Process audio input from the user.
    
    Handles voice commands and questions from the user during
    an emergency session.
    
    Args:
        request: Audio data and session information
        controller: Emergency controller (injected)
        
    Returns:
        Processing results with voice response
    """
    # Log route hit
    logger.info(f"POST /emergency/audio - Session: {request.session_id}")
    
    # Delegate to controller
    return await controller.process_audio(request)


@router.post(
    "/advance",
    response_model=InstructionResponse,
    summary="Advance to next instruction step",
    description="""
    Advance the emergency session to the next first aid instruction step.
    Called when the user confirms completion of the current step.
    
    The current_step in the request must match the session's current step
    to prevent double-advances or step skipping.
    """
)
async def advance_step(
    request: AdvanceStepRequest,
    controller: EmergencyController = Depends(lambda: emergency_controller)
) -> InstructionResponse:
    """
    Advance to the next instruction step.
    
    Moves the session forward when the user has completed
    the current first aid step.
    
    Args:
        request: Step confirmation and optional feedback
        controller: Emergency controller (injected)
        
    Returns:
        The next instruction or completion status
    """
    # Log route hit
    logger.info(
        f"POST /emergency/advance - Session: {request.session_id}, "
        f"Step: {request.current_step}"
    )
    
    # Delegate to controller
    return await controller.advance_step(request)


@router.get(
    "/instruction/{session_id}",
    response_model=InstructionResponse,
    summary="Get current instruction",
    description="""
    Get the current first aid instruction for a session without advancing.
    Useful for refreshing the display or recovering from disconnection.
    """
)
async def get_instruction(
    session_id: UUID,
    controller: EmergencyController = Depends(lambda: emergency_controller)
) -> InstructionResponse:
    """
    Get the current instruction for a session.
    
    Retrieves the current instruction without modifying state.
    
    Args:
        session_id: The session UUID
        controller: Emergency controller (injected)
        
    Returns:
        Current instruction details
    """
    # Log route hit
    logger.info(f"GET /emergency/instruction/{session_id}")
    
    # Delegate to controller
    return await controller.get_current_instruction(session_id)
