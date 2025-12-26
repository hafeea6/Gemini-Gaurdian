# =============================================================================
# GEMINI GUARDIAN - EMERGENCY SERVICE
# =============================================================================
# Service for emergency analysis and first aid guidance orchestration.
# Coordinates between Gemini AI and session management.
#
# This is the primary business logic layer for emergency handling.
# =============================================================================

import logging
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from ..models.emergency import (
    EmergencyAnalysis,
    EmergencySession,
    EmergencyStatus,
    EmergencyType,
    FirstAidInstruction,
    SeverityLevel,
)
from ..dtos.responses import AnalysisData
from .gemini_service import gemini_service, GeminiService

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# EMERGENCY SERVICE CLASS
# =============================================================================

class EmergencyService:
    """
    Service for emergency analysis and first aid coordination.
    
    Orchestrates the emergency handling workflow:
    1. Receives video/audio input
    2. Analyzes the emergency using Gemini AI
    3. Generates appropriate first aid instructions
    4. Tracks instruction progress
    
    This service acts as the coordinator between the AI service
    and the session management service.
    
    Attributes:
        gemini: The Gemini AI service instance
    """
    
    def __init__(self, gemini: GeminiService = gemini_service) -> None:
        """
        Initialize the emergency service.
        
        Args:
            gemini: The Gemini service to use for AI analysis
        """
        # Log initialization
        logger.info("Initializing EmergencyService")
        
        # Store the Gemini service reference
        self.gemini = gemini
        
        # Log successful initialization
        logger.debug("EmergencyService initialized successfully")
    
    async def analyze_frame(
        self,
        session: EmergencySession,
        frame_data: str,
        user_context: Optional[str] = None
    ) -> Tuple[EmergencyAnalysis, List[FirstAidInstruction]]:
        """
        Analyze a video frame and generate emergency response.
        
        This is the main entry point for frame analysis. It:
        1. Sends the frame to Gemini for analysis
        2. Generates first aid instructions based on the analysis
        3. Updates the session with the results
        
        Args:
            session: The current emergency session
            frame_data: Base64 encoded image data
            user_context: Optional additional context from the user
            
        Returns:
            Tuple of (EmergencyAnalysis, List[FirstAidInstruction])
            
        Raises:
            Exception: If analysis or instruction generation fails
        """
        # Log analysis start
        logger.info(f"Analyzing frame for session {session.session_id}")
        start_time = datetime.utcnow()
        
        try:
            # Update session status to analyzing
            session.status = EmergencyStatus.ANALYZING
            session.updated_at = datetime.utcnow()
            logger.debug(f"Session status updated to: {session.status.value}")
            
            # Combine user notes with provided context
            full_context = self._build_context(session, user_context)
            
            # Analyze the frame using Gemini
            logger.info("Sending frame to Gemini for analysis")
            analysis = await self.gemini.analyze_emergency_frame(
                frame_data=frame_data,
                context=full_context
            )
            
            # Log analysis results
            logger.info(
                f"Frame analysis complete - "
                f"Type: {analysis.emergency_type.value}, "
                f"Severity: {analysis.severity.value}, "
                f"Confidence: {analysis.confidence_score:.2f}"
            )
            
            # Generate first aid instructions based on analysis
            logger.info("Generating first aid instructions")
            instructions = await self.gemini.generate_first_aid_instructions(
                emergency_type=analysis.emergency_type,
                severity=analysis.severity,
                observations=analysis.observations
            )
            
            # Log instruction generation results
            logger.info(f"Generated {len(instructions)} instructions")
            
            # Update session with analysis results
            session.analysis = analysis
            session.instructions = instructions
            session.status = EmergencyStatus.ACTIVE
            session.current_step = 1 if instructions else 0
            session.updated_at = datetime.utcnow()
            
            # Log completion
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"Frame analysis workflow complete in {elapsed:.2f}s for session {session.session_id}"
            )
            
            return analysis, instructions
            
        except Exception as e:
            # Log the error
            logger.error(
                f"Frame analysis failed for session {session.session_id}: {e}",
                exc_info=True
            )
            
            # Update session status
            session.status = EmergencyStatus.ACTIVE  # Keep active, provide defaults
            session.updated_at = datetime.utcnow()
            
            # Re-raise for controller to handle
            raise
    
    def _build_context(
        self,
        session: EmergencySession,
        additional_context: Optional[str] = None
    ) -> Optional[str]:
        """
        Build context string from session data and additional input.
        
        Combines all available context for better AI analysis.
        
        Args:
            session: The current session with user notes
            additional_context: Any additional context provided
            
        Returns:
            Combined context string or None if no context available
        """
        logger.debug("Building analysis context")
        
        # Collect context pieces
        context_parts: List[str] = []
        
        # Add session user notes if present
        if session.user_notes:
            context_parts.append(f"User notes: {session.user_notes}")
            logger.debug("Added user notes to context")
        
        # Add location data if present
        if session.location_data:
            context_parts.append(f"Location: {session.location_data}")
            logger.debug("Added location to context")
        
        # Add additional context if provided
        if additional_context:
            context_parts.append(f"Additional info: {additional_context}")
            logger.debug("Added additional context")
        
        # Join all context parts
        if context_parts:
            full_context = ". ".join(context_parts)
            logger.debug(f"Built context with {len(context_parts)} parts")
            return full_context
        
        logger.debug("No context available")
        return None
    
    async def get_current_instruction(
        self,
        session: EmergencySession
    ) -> Optional[FirstAidInstruction]:
        """
        Get the current instruction for a session.
        
        Returns the instruction corresponding to the current step.
        
        Args:
            session: The emergency session
            
        Returns:
            The current FirstAidInstruction or None
        """
        logger.debug(
            f"Getting current instruction for session {session.session_id}, "
            f"step {session.current_step}"
        )
        
        # Check if there are instructions
        if not session.instructions:
            logger.warning(f"Session {session.session_id} has no instructions")
            return None
        
        # Check if current step is valid
        if session.current_step < 1 or session.current_step > len(session.instructions):
            logger.warning(
                f"Invalid current step {session.current_step} for session {session.session_id}"
            )
            return None
        
        # Return the instruction (1-indexed)
        instruction = session.instructions[session.current_step - 1]
        logger.debug(f"Retrieved instruction for step {session.current_step}")
        
        return instruction
    
    async def advance_instruction(
        self,
        session: EmergencySession,
        feedback: Optional[str] = None
    ) -> Tuple[bool, Optional[FirstAidInstruction]]:
        """
        Advance to the next instruction step.
        
        Moves the session to the next step and returns the new instruction.
        
        Args:
            session: The emergency session
            feedback: Optional feedback about the completed step
            
        Returns:
            Tuple of (success, next_instruction)
        """
        logger.info(
            f"Advancing instruction for session {session.session_id} "
            f"from step {session.current_step}"
        )
        
        # Log feedback if provided
        if feedback:
            logger.info(f"Step {session.current_step} feedback: {feedback}")
        
        # Check if we can advance
        if not session.instructions:
            logger.warning("Cannot advance - no instructions in session")
            return False, None
        
        if session.current_step >= len(session.instructions):
            logger.info("Already at last instruction - marking session as resolved")
            session.status = EmergencyStatus.RESOLVED
            session.ended_at = datetime.utcnow()
            session.updated_at = datetime.utcnow()
            return False, None
        
        # Advance the step
        session.current_step += 1
        session.updated_at = datetime.utcnow()
        
        # Get the new current instruction
        new_instruction = await self.get_current_instruction(session)
        
        logger.info(
            f"Advanced to step {session.current_step}/{len(session.instructions)}"
        )
        
        return True, new_instruction
    
    async def process_voice_input(
        self,
        session: EmergencySession,
        transcribed_text: str
    ) -> str:
        """
        Process voice input from the user during an emergency.
        
        Provides conversational support and guidance.
        
        Args:
            session: The current emergency session
            transcribed_text: The transcribed speech from the user
            
        Returns:
            Response text for voice synthesis
        """
        logger.info(f"Processing voice input for session {session.session_id}")
        logger.debug(f"User speech: {transcribed_text[:100]}...")
        
        # Build context for the AI
        context_parts: List[str] = []
        
        # Add emergency type if known
        if session.analysis:
            context_parts.append(
                f"Emergency type: {session.analysis.emergency_type.value}"
            )
            context_parts.append(
                f"Severity: {session.analysis.severity.value}/5"
            )
        
        # Add current step info
        if session.instructions and session.current_step > 0:
            current_inst = await self.get_current_instruction(session)
            if current_inst:
                context_parts.append(
                    f"Current instruction (step {session.current_step}): {current_inst.instruction_text}"
                )
        
        # Combine context
        context = ". ".join(context_parts) if context_parts else None
        
        # Process through Gemini
        response = await self.gemini.process_voice_input(
            audio_text=transcribed_text,
            context=context
        )
        
        logger.info(f"Generated voice response for session {session.session_id}")
        
        return response
    
    def calculate_severity_score(
        self,
        emergency_type: EmergencyType,
        observations: List[str]
    ) -> int:
        """
        Calculate a severity score based on emergency type and observations.
        
        Used as a fallback when AI analysis doesn't provide severity.
        
        Args:
            emergency_type: The type of emergency
            observations: List of observations about the scene
            
        Returns:
            Severity score from 1-5
        """
        logger.debug(f"Calculating severity for {emergency_type.value}")
        
        # Base severity by emergency type
        type_severity = {
            EmergencyType.CARDIAC_ARREST: 5,
            EmergencyType.STROKE: 5,
            EmergencyType.DROWNING: 5,
            EmergencyType.SEVERE_BLEEDING: 4,
            EmergencyType.CHOKING: 4,
            EmergencyType.HEAD_INJURY: 4,
            EmergencyType.HEART_ATTACK: 4,
            EmergencyType.POISONING: 4,
            EmergencyType.ALLERGIC_REACTION: 4,
            EmergencyType.SEIZURE: 3,
            EmergencyType.ASTHMA_ATTACK: 3,
            EmergencyType.DIABETIC_EMERGENCY: 3,
            EmergencyType.BURN: 3,
            EmergencyType.UNCONSCIOUS: 4,
            EmergencyType.SHOCK: 4,
            EmergencyType.FRACTURE: 2,
            EmergencyType.UNKNOWN: 3,
        }
        
        # Get base severity
        severity = type_severity.get(emergency_type, 3)
        
        # Adjust based on critical keywords in observations
        critical_keywords = [
            "not breathing", "no pulse", "unconscious", "unresponsive",
            "severe", "massive", "arterial", "profuse"
        ]
        
        # Check observations for critical keywords
        obs_text = " ".join(observations).lower()
        for keyword in critical_keywords:
            if keyword in obs_text:
                severity = min(5, severity + 1)
                logger.debug(f"Found critical keyword '{keyword}', increased severity")
                break
        
        logger.info(f"Calculated severity: {severity} for {emergency_type.value}")
        
        return severity
    
    async def build_analysis_response(
        self,
        session: EmergencySession
    ) -> AnalysisData:
        """
        Build the analysis response data for a session.
        
        Creates the AnalysisData DTO from session information.
        
        Args:
            session: The emergency session with analysis
            
        Returns:
            AnalysisData DTO ready for API response
        """
        logger.debug(f"Building analysis response for session {session.session_id}")
        
        # Ensure analysis exists
        if not session.analysis:
            logger.error(f"Session {session.session_id} has no analysis")
            raise ValueError("Session has no analysis results")
        
        # Get current instruction for voice guidance
        current_instruction = await self.get_current_instruction(session)
        voice_guidance = self._build_voice_guidance(session, current_instruction)
        
        # Create and return AnalysisData
        return AnalysisData(
            session_id=session.session_id,
            emergency_type=session.analysis.emergency_type,
            severity=session.analysis.severity,
            confidence_score=session.analysis.confidence_score,
            observations=session.analysis.observations,
            recommended_action=session.analysis.recommended_action,
            call_emergency_services=session.analysis.call_emergency_services,
            instructions=session.instructions,
            voice_guidance=voice_guidance
        )
    
    def _build_voice_guidance(
        self,
        session: EmergencySession,
        current_instruction: Optional[FirstAidInstruction]
    ) -> str:
        """
        Build voice guidance text for text-to-speech.
        
        Creates a complete voice message including status and instructions.
        
        Args:
            session: The emergency session
            current_instruction: The current instruction if any
            
        Returns:
            Voice guidance text
        """
        logger.debug("Building voice guidance")
        
        parts: List[str] = []
        
        # Add emergency service reminder for critical situations
        if session.analysis and session.analysis.call_emergency_services:
            if session.analysis.severity.value >= 4:
                parts.append("This is a critical emergency. Call 911 immediately if you haven't already.")
            else:
                parts.append("Consider calling 911 if professional help is needed.")
        
        # Add recommended action
        if session.analysis and session.analysis.recommended_action:
            parts.append(session.analysis.recommended_action)
        
        # Add current instruction
        if current_instruction:
            parts.append(
                f"Step {current_instruction.step_number}: {current_instruction.voice_text}"
            )
        
        voice_text = " ".join(parts)
        logger.debug(f"Built voice guidance: {voice_text[:100]}...")
        
        return voice_text


# -----------------------------------------------------------------------------
# Module-level service instance for dependency injection
# -----------------------------------------------------------------------------
emergency_service = EmergencyService()
