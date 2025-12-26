# =============================================================================
# GEMINI GUARDIAN - SESSION CONTROLLER
# =============================================================================
# Controller for handling session management API requests.
# Manages session lifecycle from creation to termination.
#
# Sessions track the full emergency assistance workflow.
# =============================================================================

import logging
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status

from ..dtos.requests import StartSessionRequest, EndSessionRequest
from ..dtos.responses import SessionResponse, SessionData
from ..services.session_service import session_service, SessionService

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# SESSION CONTROLLER CLASS
# =============================================================================

class SessionController:
    """
    Controller for session management endpoints.
    
    Handles:
    - Session creation
    - Session retrieval
    - Session termination
    - Session status queries
    
    Attributes:
        session_svc: The session service instance
    """
    
    def __init__(
        self,
        session_svc: SessionService = session_service
    ) -> None:
        """
        Initialize the session controller.
        
        Args:
            session_svc: Session service for session operations
        """
        # Log initialization
        logger.info("Initializing SessionController")
        
        # Store service reference
        self.session_svc = session_svc
        
        # Log successful initialization
        logger.debug("SessionController initialized")
    
    async def create_session(
        self,
        request: StartSessionRequest
    ) -> SessionResponse:
        """
        Handle session creation request.
        
        Creates a new emergency session with the provided initial data.
        
        Args:
            request: The session creation request
            
        Returns:
            SessionResponse with new session details
            
        Raises:
            HTTPException: If session creation fails
        """
        # Log request receipt
        logger.info("Received session creation request")
        if request.user_notes:
            logger.debug(f"User notes provided: {request.user_notes[:100]}...")
        if request.location_data:
            logger.debug(f"Location data: {request.location_data}")
        
        try:
            # Create the session
            session = await self.session_svc.create_session(request)
            
            # Build response data
            session_data = self.session_svc.build_session_response(session)
            
            # Log success
            logger.info(f"Session created successfully: {session.session_id}")
            
            # Return success response
            return SessionResponse(
                success=True,
                message="Emergency session created. Ready to receive video feed.",
                data=session_data
            )
            
        except Exception as e:
            # Log the error
            logger.error(f"Session creation failed: {e}", exc_info=True)
            
            # Raise HTTP exception
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create session: {str(e)}"
            )
    
    async def get_session(
        self,
        session_id: UUID
    ) -> SessionResponse:
        """
        Handle session retrieval request.
        
        Gets the current state of an existing session.
        
        Args:
            session_id: The UUID of the session to retrieve
            
        Returns:
            SessionResponse with session details
            
        Raises:
            HTTPException: If session not found
        """
        # Log request
        logger.info(f"Received session retrieval request for {session_id}")
        
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
            
            # Build response data
            session_data = self.session_svc.build_session_response(session)
            
            # Log success
            logger.info(
                f"Session {session_id} retrieved - Status: {session.status.value}"
            )
            
            # Return response
            return SessionResponse(
                success=True,
                message="Session retrieved successfully",
                data=session_data
            )
            
        except HTTPException:
            raise
            
        except Exception as e:
            logger.error(
                f"Session retrieval failed for {session_id}: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve session: {str(e)}"
            )
    
    async def end_session(
        self,
        session_id: UUID,
        request: EndSessionRequest
    ) -> SessionResponse:
        """
        Handle session termination request.
        
        Ends an active session with resolution information.
        
        Args:
            session_id: The session to end
            request: End session request with resolution details
            
        Returns:
            SessionResponse with final session state
            
        Raises:
            HTTPException: If session not found or already ended
        """
        # Log request
        logger.info(
            f"Received session end request for {session_id} - "
            f"Reason: {request.reason}"
        )
        
        try:
            # Validate session_id matches request
            if session_id != request.session_id:
                logger.warning(
                    f"Session ID mismatch: URL {session_id} vs body {request.session_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Session ID in URL does not match request body"
                )
            
            # End the session
            session = await self.session_svc.end_session(session_id, request)
            
            # Build response data
            session_data = self.session_svc.build_session_response(session)
            
            # Determine appropriate message
            if request.emergency_services_called:
                message = "Session ended. Emergency services have been notified."
            else:
                message = "Session ended successfully."
            
            # Log success
            logger.info(
                f"Session {session_id} ended - "
                f"Final status: {session.status.value}"
            )
            
            return SessionResponse(
                success=True,
                message=message,
                data=session_data
            )
            
        except HTTPException:
            raise
            
        except ValueError as e:
            # Session not found or already ended
            logger.warning(f"Session end validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
            
        except Exception as e:
            logger.error(
                f"Session end failed for {session_id}: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to end session: {str(e)}"
            )
    
    async def get_session_status(
        self,
        session_id: UUID
    ) -> SessionResponse:
        """
        Get a lightweight status check for a session.
        
        Returns just the session status without full details.
        
        Args:
            session_id: The session to check
            
        Returns:
            SessionResponse with status information
        """
        # Log request
        logger.debug(f"Session status check for {session_id}")
        
        # This is essentially the same as get_session but could be optimized
        return await self.get_session(session_id)


# -----------------------------------------------------------------------------
# Module-level controller instance
# -----------------------------------------------------------------------------
session_controller = SessionController()
