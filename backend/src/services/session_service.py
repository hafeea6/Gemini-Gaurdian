# =============================================================================
# GEMINI GUARDIAN - SESSION SERVICE
# =============================================================================
# Service for managing emergency session lifecycle.
# Handles session creation, retrieval, updates, and termination.
#
# Sessions track the full workflow of an emergency assistance interaction.
# =============================================================================

import logging
from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from ..models.emergency import EmergencySession, EmergencyStatus
from ..dtos.requests import StartSessionRequest, EndSessionRequest
from ..dtos.responses import SessionData

# -----------------------------------------------------------------------------
# Configure module-level logger
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# SESSION SERVICE CLASS
# =============================================================================

class SessionService:
    """
    Service for managing emergency session lifecycle.
    
    Provides methods for:
    - Creating new emergency sessions
    - Retrieving active sessions
    - Updating session state
    - Ending sessions properly
    
    Sessions are currently stored in memory. In production, this would
    be backed by a persistent database.
    
    Attributes:
        _sessions: In-memory storage for active sessions
    """
    
    def __init__(self) -> None:
        """
        Initialize the session service.
        
        Sets up the in-memory session storage.
        """
        # Log initialization
        logger.info("Initializing SessionService")
        
        # In-memory session storage
        # Key: session_id (UUID), Value: EmergencySession
        self._sessions: Dict[UUID, EmergencySession] = {}
        
        # Log successful initialization
        logger.debug("SessionService initialized with empty session store")
    
    async def create_session(
        self,
        request: StartSessionRequest
    ) -> EmergencySession:
        """
        Create a new emergency session.
        
        Initializes a new session with the provided information
        and stores it for tracking.
        
        Args:
            request: The session creation request with initial data
            
        Returns:
            The newly created EmergencySession
        """
        # Log session creation start
        logger.info("Creating new emergency session")
        
        # Create the session object
        session = EmergencySession(
            user_notes=request.user_notes,
            location_data=request.location_data,
            status=EmergencyStatus.PENDING
        )
        
        # Store the session
        self._sessions[session.session_id] = session
        
        # Log successful creation
        logger.info(
            f"Created session {session.session_id} - "
            f"Status: {session.status.value}"
        )
        
        # Log additional details at debug level
        if request.user_notes:
            logger.debug(f"Session notes: {request.user_notes[:100]}...")
        if request.location_data:
            logger.debug(f"Session location: {request.location_data}")
        if request.device_info:
            logger.debug(f"Device info: {request.device_info}")
        
        return session
    
    async def get_session(
        self,
        session_id: UUID
    ) -> Optional[EmergencySession]:
        """
        Retrieve an existing session by ID.
        
        Args:
            session_id: The UUID of the session to retrieve
            
        Returns:
            The EmergencySession if found, None otherwise
        """
        logger.debug(f"Retrieving session {session_id}")
        
        # Look up the session
        session = self._sessions.get(session_id)
        
        # Log result
        if session:
            logger.debug(
                f"Found session {session_id} - Status: {session.status.value}"
            )
        else:
            logger.warning(f"Session {session_id} not found")
        
        return session
    
    async def update_session(
        self,
        session: EmergencySession
    ) -> EmergencySession:
        """
        Update an existing session.
        
        Persists changes made to the session object.
        
        Args:
            session: The session with updates to persist
            
        Returns:
            The updated session
            
        Raises:
            ValueError: If session doesn't exist
        """
        logger.debug(f"Updating session {session.session_id}")
        
        # Verify session exists
        if session.session_id not in self._sessions:
            logger.error(f"Cannot update non-existent session {session.session_id}")
            raise ValueError(f"Session {session.session_id} not found")
        
        # Update the timestamp
        session.updated_at = datetime.utcnow()
        
        # Store the updated session
        self._sessions[session.session_id] = session
        
        # Log the update
        logger.info(
            f"Updated session {session.session_id} - Status: {session.status.value}"
        )
        
        return session
    
    async def end_session(
        self,
        session_id: UUID,
        request: EndSessionRequest
    ) -> EmergencySession:
        """
        End an emergency session.
        
        Marks the session as complete with resolution information.
        
        Args:
            session_id: The session to end
            request: End session request with resolution details
            
        Returns:
            The ended session
            
        Raises:
            ValueError: If session doesn't exist or is already ended
        """
        logger.info(f"Ending session {session_id}")
        
        # Get the session
        session = await self.get_session(session_id)
        if not session:
            logger.error(f"Cannot end non-existent session {session_id}")
            raise ValueError(f"Session {session_id} not found")
        
        # Check if already ended
        if session.status in [EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED]:
            logger.warning(f"Session {session_id} is already ended")
            raise ValueError(f"Session {session_id} is already ended")
        
        # Determine end status based on reason
        if request.emergency_services_called:
            session.status = EmergencyStatus.ESCALATED
        elif "cancel" in request.reason.lower():
            session.status = EmergencyStatus.CANCELLED
        else:
            session.status = EmergencyStatus.RESOLVED
        
        # Update session fields
        session.ended_at = datetime.utcnow()
        session.updated_at = datetime.utcnow()
        
        # Add notes if provided
        if request.notes:
            existing_notes = session.user_notes or ""
            session.user_notes = f"{existing_notes}\n\nResolution: {request.notes}".strip()
        
        # Store the updated session
        self._sessions[session.session_id] = session
        
        # Log the end
        logger.info(
            f"Ended session {session_id} - "
            f"Status: {session.status.value}, "
            f"Reason: {request.reason}"
        )
        
        return session
    
    async def get_active_sessions_count(self) -> int:
        """
        Get the count of currently active sessions.
        
        Useful for monitoring and rate limiting.
        
        Returns:
            Number of active sessions
        """
        # Count sessions that are not in terminal states
        active_statuses = [
            EmergencyStatus.PENDING,
            EmergencyStatus.ANALYZING,
            EmergencyStatus.ACTIVE,
            EmergencyStatus.MONITORING
        ]
        
        count = sum(
            1 for session in self._sessions.values()
            if session.status in active_statuses
        )
        
        logger.debug(f"Active sessions count: {count}")
        
        return count
    
    async def cleanup_expired_sessions(
        self,
        max_age_hours: int = 24
    ) -> int:
        """
        Clean up old sessions from memory.
        
        Removes sessions that have been ended for longer than max_age_hours.
        
        Args:
            max_age_hours: Maximum age in hours for ended sessions
            
        Returns:
            Number of sessions cleaned up
        """
        logger.info(f"Cleaning up sessions older than {max_age_hours} hours")
        
        # Calculate cutoff time
        cutoff = datetime.utcnow()
        from datetime import timedelta
        cutoff = cutoff - timedelta(hours=max_age_hours)
        
        # Find sessions to remove
        to_remove: list[UUID] = []
        for session_id, session in self._sessions.items():
            # Only clean up ended sessions
            if session.status in [EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED, EmergencyStatus.ESCALATED]:
                # Check if old enough
                end_time = session.ended_at or session.updated_at
                if end_time < cutoff:
                    to_remove.append(session_id)
        
        # Remove old sessions
        for session_id in to_remove:
            del self._sessions[session_id]
            logger.debug(f"Removed expired session {session_id}")
        
        # Log cleanup results
        logger.info(f"Cleaned up {len(to_remove)} expired sessions")
        
        return len(to_remove)
    
    def build_session_response(
        self,
        session: EmergencySession
    ) -> SessionData:
        """
        Build the session response data.
        
        Creates a SessionData DTO from the session object.
        
        Args:
            session: The emergency session
            
        Returns:
            SessionData DTO ready for API response
        """
        logger.debug(f"Building session response for {session.session_id}")
        
        return SessionData(
            session_id=session.session_id,
            status=session.status,
            started_at=session.started_at,
            current_step=session.current_step,
            total_steps=len(session.instructions),
            emergency_type=session.analysis.emergency_type if session.analysis else None,
            severity=session.analysis.severity if session.analysis else None
        )


# -----------------------------------------------------------------------------
# Module-level service instance for dependency injection
# -----------------------------------------------------------------------------
session_service = SessionService()
