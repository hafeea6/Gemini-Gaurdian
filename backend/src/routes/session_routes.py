# =============================================================================
# GEMINI GUARDIAN - SESSION ROUTES
# =============================================================================
# API route definitions for session management endpoints.
# Handles session lifecycle: creation, retrieval, and termination.
#
# Sessions track the full emergency assistance workflow.
# =============================================================================

import logging
from uuid import UUID

from fastapi import APIRouter, Depends

from ..dtos.requests import StartSessionRequest, EndSessionRequest
from ..dtos.responses import SessionResponse
from ..controllers.session_controller import session_controller, SessionController

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Create router with prefix and tags
# -----------------------------------------------------------------------------
router = APIRouter(
    prefix="/session",
    tags=["Session"],
    responses={
        404: {"description": "Session not found"},
        500: {"description": "Internal server error"},
    }
)


# =============================================================================
# ROUTE DEFINITIONS
# =============================================================================

@router.post(
    "/start",
    response_model=SessionResponse,
    summary="Start a new emergency session",
    description="""
    Create a new emergency assistance session. This should be called
    when the user initiates an emergency call.
    
    The session tracks:
    - Emergency analysis results
    - First aid instructions
    - Progress through instruction steps
    - Session timing and status
    
    Returns a session ID that must be included in all subsequent requests.
    """
)
async def start_session(
    request: StartSessionRequest,
    controller: SessionController = Depends(lambda: session_controller)
) -> SessionResponse:
    """
    Start a new emergency session.
    
    Creates a new session and returns the session ID for tracking.
    
    Args:
        request: Optional initial notes and location data
        controller: Session controller (injected)
        
    Returns:
        New session details including session_id
    """
    # Log route hit
    logger.info("POST /session/start - Creating new session")
    
    # Delegate to controller
    return await controller.create_session(request)


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Get session details",
    description="""
    Retrieve the current state of an emergency session.
    
    Includes:
    - Session status
    - Emergency type (if detected)
    - Severity level (if assessed)
    - Current instruction step
    - Total instruction steps
    """
)
async def get_session(
    session_id: UUID,
    controller: SessionController = Depends(lambda: session_controller)
) -> SessionResponse:
    """
    Get session details by ID.
    
    Retrieves the current state of a session.
    
    Args:
        session_id: The session UUID
        controller: Session controller (injected)
        
    Returns:
        Session details and status
    """
    # Log route hit
    logger.info(f"GET /session/{session_id}")
    
    # Delegate to controller
    return await controller.get_session(session_id)


@router.post(
    "/{session_id}/end",
    response_model=SessionResponse,
    summary="End an emergency session",
    description="""
    End an active emergency session. Should be called when:
    - Emergency services arrive
    - The situation is resolved
    - The user cancels the session
    
    The reason for ending should be provided for record-keeping.
    """
)
async def end_session(
    session_id: UUID,
    request: EndSessionRequest,
    controller: SessionController = Depends(lambda: session_controller)
) -> SessionResponse:
    """
    End an emergency session.
    
    Terminates the session and records the resolution.
    
    Args:
        session_id: The session UUID
        request: End reason and optional notes
        controller: Session controller (injected)
        
    Returns:
        Final session state
    """
    # Log route hit
    logger.info(f"POST /session/{session_id}/end - Reason: {request.reason}")
    
    # Delegate to controller
    return await controller.end_session(session_id, request)


@router.get(
    "/{session_id}/status",
    response_model=SessionResponse,
    summary="Quick session status check",
    description="""
    Lightweight endpoint to check session status.
    Useful for polling or reconnection scenarios.
    """
)
async def get_session_status(
    session_id: UUID,
    controller: SessionController = Depends(lambda: session_controller)
) -> SessionResponse:
    """
    Get session status.
    
    Quick status check for a session.
    
    Args:
        session_id: The session UUID
        controller: Session controller (injected)
        
    Returns:
        Session status information
    """
    # Log route hit
    logger.debug(f"GET /session/{session_id}/status")
    
    # Delegate to controller
    return await controller.get_session_status(session_id)
