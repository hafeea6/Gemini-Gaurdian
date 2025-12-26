# =============================================================================
# GEMINI GUARDIAN - EMERGENCY CONTROLLER
# =============================================================================
# Controller for handling emergency-related API requests.
# Coordinates between routes and emergency/session services.
#
# All controller methods handle HTTP-level concerns (status codes, responses).
# =============================================================================

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from ..dtos.requests import AnalyzeFrameRequest, ProcessAudioRequest, AdvanceStepRequest
from ..dtos.responses import (
    AnalysisResponse,
    AnalysisData,
    InstructionResponse,
    InstructionData,
    ErrorResponse,
    ErrorData,
)
from ..services.emergency_service import emergency_service, EmergencyService
from ..services.session_service import session_service, SessionService

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# EMERGENCY CONTROLLER CLASS
# =============================================================================

class EmergencyController:
    """
    Controller for emergency analysis and instruction endpoints.
    
    Handles:
    - Video frame analysis requests
    - Audio processing requests
    - Instruction progression
    - Voice response generation
    
    This controller coordinates between the HTTP layer and
    the business logic in the services.
    
    Attributes:
        emergency_svc: The emergency service instance
        session_svc: The session service instance
    """
    
    def __init__(
        self,
        emergency_svc: EmergencyService = emergency_service,
        session_svc: SessionService = session_service
    ) -> None:
        """
        Initialize the emergency controller.
        
        Args:
            emergency_svc: Emergency service for analysis logic
            session_svc: Session service for session management
        """
        # Log initialization
        logger.info("Initializing EmergencyController")
        
        # Store service references
        self.emergency_svc = emergency_svc
        self.session_svc = session_svc
        
        # Log successful initialization
        logger.debug("EmergencyController initialized")
    
    async def analyze_frame(
        self,
        request: AnalyzeFrameRequest
    ) -> AnalysisResponse:
        """
        Handle video frame analysis request.
        
        Processes a single video frame through Gemini AI to
        detect and analyze emergency situations.
        
        Args:
            request: The frame analysis request with image data
            
        Returns:
            AnalysisResponse with detection results and instructions
            
        Raises:
            HTTPException: If session not found or analysis fails
        """
        # Log request receipt
        logger.info(
            f"Received frame analysis request for session {request.session_id}"
        )
        logger.debug(
            f"Frame details - Size: {request.width}x{request.height}, "
            f"Format: {request.format}, Sequence: {request.sequence_number}"
        )
        
        try:
            # Retrieve the session
            session = await self.session_svc.get_session(request.session_id)
            
            # Check if session exists
            if not session:
                logger.warning(f"Session {request.session_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session {request.session_id} not found"
                )
            
            # Log session found
            logger.debug(f"Found session with status: {session.status.value}")
            
            # Perform analysis
            analysis, instructions = await self.emergency_svc.analyze_frame(
                session=session,
                frame_data=request.frame_data,
                user_context=None
            )
            
            # Update session with results
            await self.session_svc.update_session(session)
            
            # Build response data
            analysis_data = await self.emergency_svc.build_analysis_response(session)
            
            # Log success
            logger.info(
                f"Frame analysis successful for session {request.session_id} - "
                f"Type: {analysis.emergency_type.value}, "
                f"Severity: {analysis.severity.value}"
            )
            
            # Return success response
            return AnalysisResponse(
                success=True,
                message="Emergency analysis complete",
                data=analysis_data
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
            
        except Exception as e:
            # Log the error
            logger.error(
                f"Frame analysis failed for session {request.session_id}: {e}",
                exc_info=True
            )
            
            # Raise HTTP exception with error details
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis failed: {str(e)}"
            )
    
    async def process_audio(
        self,
        request: ProcessAudioRequest
    ) -> AnalysisResponse:
        """
        Handle audio processing request.
        
        Processes audio from the user's microphone for
        speech recognition and AI response.
        
        Args:
            request: The audio processing request
            
        Returns:
            AnalysisResponse with voice response
            
        Raises:
            HTTPException: If session not found or processing fails
        """
        # Log request receipt
        logger.info(
            f"Received audio processing request for session {request.session_id}"
        )
        logger.debug(
            f"Audio details - Sample rate: {request.sample_rate}, "
            f"Duration: {request.duration_ms}ms, Format: {request.format}"
        )
        
        try:
            # Retrieve the session
            session = await self.session_svc.get_session(request.session_id)
            
            # Check if session exists
            if not session:
                logger.warning(f"Session {request.session_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session {request.session_id} not found"
                )
            
            # For now, we'll handle audio as transcribed text
            # In production, this would use speech-to-text first
            # The audio_data would be transcribed before processing
            
            # Log audio received (in production, would transcribe first)
            logger.info(f"Audio received for session {request.session_id}")
            
            # Placeholder response - in production would process through STT
            voice_response = "I received your audio. Please describe what you see."
            
            # Build a minimal response
            return AnalysisResponse(
                success=True,
                message="Audio received",
                data=None  # Would contain transcription and response
            )
            
        except HTTPException:
            raise
            
        except Exception as e:
            logger.error(
                f"Audio processing failed for session {request.session_id}: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Audio processing failed: {str(e)}"
            )
    
    async def advance_step(
        self,
        request: AdvanceStepRequest
    ) -> InstructionResponse:
        """
        Handle instruction step advancement request.
        
        Moves to the next instruction step when user confirms
        completion of the current step.
        
        Args:
            request: The advance step request
            
        Returns:
            InstructionResponse with new instruction details
            
        Raises:
            HTTPException: If session not found or advancement fails
        """
        # Log request receipt
        logger.info(
            f"Received advance step request for session {request.session_id} "
            f"from step {request.current_step}"
        )
        
        try:
            # Retrieve the session
            session = await self.session_svc.get_session(request.session_id)
            
            # Check if session exists
            if not session:
                logger.warning(f"Session {request.session_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session {request.session_id} not found"
                )
            
            # Verify step matches
            if session.current_step != request.current_step:
                logger.warning(
                    f"Step mismatch: expected {session.current_step}, "
                    f"got {request.current_step}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Step mismatch: current step is {session.current_step}"
                )
            
            # Advance to next step
            success, new_instruction = await self.emergency_svc.advance_instruction(
                session=session,
                feedback=request.feedback
            )
            
            # Update session
            await self.session_svc.update_session(session)
            
            # Check if we've completed all steps
            if not success:
                logger.info(f"Session {request.session_id} completed all steps")
                return InstructionResponse(
                    success=True,
                    message="All instructions completed",
                    data=None
                )
            
            # Get next instruction preview if available
            next_instruction = None
            if session.current_step < len(session.instructions):
                next_idx = session.current_step  # current_step is 1-indexed
                if next_idx < len(session.instructions):
                    next_instruction = session.instructions[next_idx]
            
            # Build voice text
            voice_text = (
                f"Step {session.current_step} of {len(session.instructions)}. "
                f"{new_instruction.voice_text if new_instruction else 'Complete.'}"
            )
            
            # Build response data
            instruction_data = InstructionData(
                session_id=session.session_id,
                current_step=session.current_step,
                total_steps=len(session.instructions),
                instruction=new_instruction,
                next_instruction=next_instruction,
                voice_text=voice_text
            ) if new_instruction else None
            
            # Log success
            logger.info(
                f"Advanced to step {session.current_step}/{len(session.instructions)} "
                f"for session {request.session_id}"
            )
            
            return InstructionResponse(
                success=True,
                message=f"Advanced to step {session.current_step}",
                data=instruction_data
            )
            
        except HTTPException:
            raise
            
        except Exception as e:
            logger.error(
                f"Step advancement failed for session {request.session_id}: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Step advancement failed: {str(e)}"
            )
    
    async def get_current_instruction(
        self,
        session_id: UUID
    ) -> InstructionResponse:
        """
        Get the current instruction for a session.
        
        Retrieves the current first aid instruction without advancing.
        
        Args:
            session_id: The session to get instruction for
            
        Returns:
            InstructionResponse with current instruction
            
        Raises:
            HTTPException: If session not found
        """
        # Log request
        logger.info(f"Getting current instruction for session {session_id}")
        
        try:
            # Retrieve the session
            session = await self.session_svc.get_session(session_id)
            
            # Check if session exists
            if not session:
                logger.warning(f"Session {session_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session {session_id} not found"
                )
            
            # Check if session has instructions
            if not session.instructions:
                logger.info(f"Session {session_id} has no instructions yet")
                return InstructionResponse(
                    success=True,
                    message="No instructions available yet",
                    data=None
                )
            
            # Get current instruction
            current_instruction = await self.emergency_svc.get_current_instruction(session)
            
            if not current_instruction:
                return InstructionResponse(
                    success=True,
                    message="No current instruction",
                    data=None
                )
            
            # Get next instruction preview
            next_instruction = None
            if session.current_step < len(session.instructions):
                next_instruction = session.instructions[session.current_step]
            
            # Build voice text
            voice_text = (
                f"Step {session.current_step} of {len(session.instructions)}. "
                f"{current_instruction.voice_text}"
            )
            
            # Build response
            instruction_data = InstructionData(
                session_id=session.session_id,
                current_step=session.current_step,
                total_steps=len(session.instructions),
                instruction=current_instruction,
                next_instruction=next_instruction,
                voice_text=voice_text
            )
            
            logger.info(
                f"Retrieved instruction step {session.current_step} "
                f"for session {session_id}"
            )
            
            return InstructionResponse(
                success=True,
                message="Current instruction retrieved",
                data=instruction_data
            )
            
        except HTTPException:
            raise
            
        except Exception as e:
            logger.error(
                f"Failed to get instruction for session {session_id}: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get instruction: {str(e)}"
            )


# -----------------------------------------------------------------------------
# Module-level controller instance
# -----------------------------------------------------------------------------
emergency_controller = EmergencyController()
