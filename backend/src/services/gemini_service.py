# =============================================================================
# GEMINI GUARDIAN - GEMINI AI SERVICE
# =============================================================================
# Service for integrating with Google's Gemini AI models.
# Handles video/audio analysis and real-time emergency reasoning.
#
# This is the core AI component - reliability is critical.
# =============================================================================

import asyncio
import base64
import logging
from typing import Any, Dict, List, Optional, AsyncGenerator
from datetime import datetime

from google import genai
from google.genai import types

from ..config.settings import settings
from ..models.emergency import (
    EmergencyType,
    SeverityLevel,
    EmergencyAnalysis,
    FirstAidInstruction,
)

# -----------------------------------------------------------------------------
# Configure module-level logger with detailed formatting
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# =============================================================================
# SYSTEM PROMPTS
# =============================================================================

EMERGENCY_ANALYSIS_PROMPT = """You are Gemini Guardian, an AI emergency medical dispatcher assistant. 
Your role is to analyze video/images of emergency situations and provide life-saving guidance.

CRITICAL RESPONSIBILITIES:
1. Quickly assess the emergency type and severity
2. Provide clear, calm, step-by-step first aid instructions
3. Always recommend calling emergency services (911) for serious situations
4. Use simple language that panicked bystanders can understand
5. Prioritize actions that save lives

When analyzing a scene, identify:
- Type of emergency (cardiac arrest, choking, bleeding, etc.)
- Severity level (1-5, where 5 is life-threatening)
- Immediate dangers to victim or bystanders
- Required first aid steps in order of priority

RESPONSE FORMAT:
Provide your analysis as a structured assessment including:
- emergency_type: The classified type of emergency
- severity: Severity level 1-5
- observations: List of key observations from the scene
- recommended_action: The most important immediate action
- call_emergency_services: Whether 911 should be called
- instructions: Step-by-step first aid instructions

Remember: Lives depend on your guidance. Be accurate, be clear, be calm."""


VOICE_ASSISTANT_PROMPT = """You are Gemini Guardian, a calm and reassuring emergency voice assistant.
You are speaking directly to someone who may be panicked and scared.

YOUR VOICE CHARACTERISTICS:
- Calm and steady tone
- Clear and simple words
- Short sentences
- Reassuring but urgent when needed
- Never judgmental

When responding to user questions or providing guidance:
1. Acknowledge their concern briefly
2. Provide clear, actionable guidance
3. Offer reassurance
4. Ask clarifying questions if needed

Keep responses concise - the user needs quick, actionable information."""


# =============================================================================
# GEMINI SERVICE CLASS
# =============================================================================

class GeminiService:
    """
    Service for Google Gemini AI integration.
    
    Provides methods for:
    - Emergency scene analysis from video frames
    - Real-time voice conversation
    - First aid instruction generation
    
    This service uses the Gemini 2.0 Flash model for low-latency
    responses critical in emergency situations.
    
    Attributes:
        client: The Gemini API client
        model_name: Name of the Gemini model to use
        is_initialized: Whether the service is ready
    """
    
    def __init__(self) -> None:
        """
        Initialize the Gemini service.
        
        Sets up the API client but defers actual connection
        until first use to improve startup time.
        """
        # Log initialization start
        logger.info("Initializing GeminiService")
        
        # Store configuration
        self.model_name: str = settings.gemini_model
        self.api_key: str = settings.gemini_api_key
        
        # Initialize client as None - will be created on first use
        self._client: Optional[genai.Client] = None
        self._is_initialized: bool = False
        
        # Log configuration (without exposing API key)
        logger.debug(f"GeminiService configured with model: {self.model_name}")
        logger.debug(f"API key configured: {bool(self.api_key)}")
    
    @property
    def client(self) -> genai.Client:
        """
        Get the Gemini client, initializing if needed.
        
        Uses lazy initialization to avoid blocking startup.
        
        Returns:
            The initialized Gemini client
            
        Raises:
            ValueError: If API key is not configured
        """
        # Check if already initialized
        if self._client is not None:
            return self._client
        
        # Validate API key exists
        if not self.api_key:
            logger.error("Gemini API key not configured")
            raise ValueError(
                "Gemini API key not configured. "
                "Set GEMINI_API_KEY environment variable."
            )
        
        # Create the client
        logger.info("Creating Gemini API client")
        try:
            self._client = genai.Client(api_key=self.api_key)
            self._is_initialized = True
            logger.info("Gemini API client created successfully")
        except Exception as e:
            logger.error(f"Failed to create Gemini client: {e}")
            raise
        
        return self._client
    
    @property
    def is_initialized(self) -> bool:
        """Check if the service is initialized."""
        return self._is_initialized
    
    async def analyze_emergency_frame(
        self,
        frame_data: str,
        context: Optional[str] = None
    ) -> EmergencyAnalysis:
        """
        Analyze a video frame for emergency detection and assessment.
        
        Uses Gemini's vision capabilities to analyze the scene and
        provide structured emergency information.
        
        Args:
            frame_data: Base64 encoded image data
            context: Optional additional context about the situation
            
        Returns:
            EmergencyAnalysis with classified emergency and recommendations
            
        Raises:
            Exception: If analysis fails
        """
        # Log analysis start
        logger.info("Starting emergency frame analysis")
        start_time = datetime.utcnow()
        
        try:
            # Decode base64 image data
            logger.debug("Decoding base64 image data")
            image_bytes = base64.b64decode(frame_data)
            
            # Build the prompt with optional context
            prompt = EMERGENCY_ANALYSIS_PROMPT
            if context:
                prompt += f"\n\nAdditional context from user: {context}"
            
            prompt += """

Analyze this image and respond with a JSON object containing:
{
    "emergency_type": "one of: cardiac_arrest, heart_attack, choking, drowning, asthma_attack, severe_bleeding, fracture, burn, head_injury, stroke, seizure, diabetic_emergency, allergic_reaction, poisoning, unconscious, shock, unknown",
    "severity": 1-5 integer,
    "confidence_score": 0.0-1.0 float,
    "observations": ["list", "of", "observations"],
    "recommended_action": "immediate action string",
    "call_emergency_services": true/false,
    "additional_context": "any additional notes"
}"""
            
            # Create image part for the API
            logger.debug("Creating image part for Gemini API")
            
            # Call Gemini API with image
            logger.info("Sending frame to Gemini for analysis")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_bytes(
                                data=image_bytes,
                                mime_type="image/jpeg"
                            ),
                            types.Part.from_text(text=prompt)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.1,  # Low temperature for consistent analysis
                    max_output_tokens=1024,
                )
            )
            
            # Parse response
            logger.debug("Parsing Gemini response")
            response_text = response.text
            logger.debug(f"Raw response: {response_text[:500]}...")
            
            # Extract JSON from response
            analysis_data = self._parse_analysis_response(response_text)
            
            # Create EmergencyAnalysis object
            analysis = EmergencyAnalysis(
                emergency_type=EmergencyType(analysis_data.get("emergency_type", "unknown")),
                severity=SeverityLevel(analysis_data.get("severity", 3)),
                confidence_score=float(analysis_data.get("confidence_score", 0.5)),
                observations=analysis_data.get("observations", []),
                recommended_action=analysis_data.get("recommended_action", "Assess the situation"),
                call_emergency_services=analysis_data.get("call_emergency_services", True),
                additional_context=analysis_data.get("additional_context")
            )
            
            # Log completion
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"Emergency analysis complete in {elapsed:.2f}s - "
                f"Type: {analysis.emergency_type.value}, "
                f"Severity: {analysis.severity.value}"
            )
            
            return analysis
            
        except Exception as e:
            # Log error with details
            logger.error(f"Emergency frame analysis failed: {e}", exc_info=True)
            
            # Return a safe default analysis
            logger.warning("Returning default analysis due to error")
            return EmergencyAnalysis(
                emergency_type=EmergencyType.UNKNOWN,
                severity=SeverityLevel.HIGH,
                confidence_score=0.0,
                observations=["Analysis failed - please describe the situation"],
                recommended_action="Call 911 immediately and describe the emergency",
                call_emergency_services=True,
                additional_context=f"Analysis error: {str(e)}"
            )
    
    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the JSON response from Gemini.
        
        Handles various response formats and extracts the JSON data.
        
        Args:
            response_text: Raw response text from Gemini
            
        Returns:
            Parsed dictionary with analysis data
        """
        import json
        import re
        
        logger.debug("Parsing analysis response")
        
        try:
            # Try to find JSON in the response
            # Look for JSON block in markdown code blocks
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                logger.debug("Found JSON in code block")
            else:
                # Try to find raw JSON object
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    logger.debug("Found raw JSON object")
                else:
                    logger.warning("No JSON found in response")
                    return {}
            
            # Parse the JSON
            data = json.loads(json_str)
            logger.debug(f"Successfully parsed JSON with keys: {list(data.keys())}")
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            return {}
    
    async def generate_first_aid_instructions(
        self,
        emergency_type: EmergencyType,
        severity: SeverityLevel,
        observations: List[str]
    ) -> List[FirstAidInstruction]:
        """
        Generate step-by-step first aid instructions for an emergency.
        
        Creates detailed, actionable instructions based on the
        emergency type and severity.
        
        Args:
            emergency_type: The classified emergency type
            severity: The assessed severity level
            observations: List of scene observations
            
        Returns:
            List of FirstAidInstruction objects in order
        """
        logger.info(
            f"Generating first aid instructions for {emergency_type.value} "
            f"(severity: {severity.value})"
        )
        
        try:
            # Build prompt for instruction generation
            prompt = f"""Generate step-by-step first aid instructions for the following emergency:

Emergency Type: {emergency_type.value}
Severity Level: {severity.value} out of 5
Observations: {', '.join(observations) if observations else 'None provided'}

Provide 5-8 clear, actionable steps. For each step include:
- step_number: Sequential number
- instruction_text: Clear instruction for display
- voice_text: Version optimized for text-to-speech (slightly more detailed)
- duration_seconds: Estimated time (null if not applicable)
- requires_confirmation: Whether user should confirm completion
- warning: Any safety warning (null if none)
- visual_cue: Visual guidance description (null if none)

Respond with a JSON array of instruction objects."""

            # Call Gemini API
            logger.debug("Requesting instructions from Gemini")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=2048,
                )
            )
            
            # Parse response
            instructions_data = self._parse_instructions_response(response.text)
            
            # Convert to FirstAidInstruction objects
            instructions = []
            for i, inst_data in enumerate(instructions_data, 1):
                instruction = FirstAidInstruction(
                    step_number=inst_data.get("step_number", i),
                    instruction_text=inst_data.get("instruction_text", f"Step {i}"),
                    voice_text=inst_data.get("voice_text", inst_data.get("instruction_text", f"Step {i}")),
                    duration_seconds=inst_data.get("duration_seconds"),
                    requires_confirmation=inst_data.get("requires_confirmation", False),
                    warning=inst_data.get("warning"),
                    visual_cue=inst_data.get("visual_cue")
                )
                instructions.append(instruction)
            
            logger.info(f"Generated {len(instructions)} first aid instructions")
            return instructions
            
        except Exception as e:
            logger.error(f"Failed to generate instructions: {e}", exc_info=True)
            
            # Return basic default instructions
            return self._get_default_instructions(emergency_type)
    
    def _parse_instructions_response(self, response_text: str) -> List[Dict[str, Any]]:
        """
        Parse the JSON array response for instructions.
        
        Args:
            response_text: Raw response from Gemini
            
        Returns:
            List of instruction dictionaries
        """
        import json
        import re
        
        logger.debug("Parsing instructions response")
        
        try:
            # Look for JSON array
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    logger.warning("No JSON array found in response")
                    return []
            
            data = json.loads(json_str)
            if isinstance(data, list):
                return data
            return []
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse instructions JSON: {e}")
            return []
    
    def _get_default_instructions(
        self,
        emergency_type: EmergencyType
    ) -> List[FirstAidInstruction]:
        """
        Get default first aid instructions for an emergency type.
        
        Used as a fallback when AI generation fails.
        
        Args:
            emergency_type: The type of emergency
            
        Returns:
            List of default instructions
        """
        logger.warning(f"Using default instructions for {emergency_type.value}")
        
        # Default instructions for common emergencies
        default_instructions = {
            EmergencyType.CARDIAC_ARREST: [
                FirstAidInstruction(
                    step_number=1,
                    instruction_text="Call 911 immediately",
                    voice_text="First, call 911 or have someone else call. Time is critical.",
                    requires_confirmation=True
                ),
                FirstAidInstruction(
                    step_number=2,
                    instruction_text="Check for responsiveness",
                    voice_text="Tap the person's shoulders and shout 'Are you okay?'",
                    duration_seconds=5
                ),
                FirstAidInstruction(
                    step_number=3,
                    instruction_text="Begin chest compressions",
                    voice_text="Place the heel of your hand on the center of the chest. Push hard and fast, about 2 inches deep, 100 to 120 times per minute.",
                    warning="The person should be on a firm, flat surface",
                    requires_confirmation=True
                ),
            ],
            EmergencyType.CHOKING: [
                FirstAidInstruction(
                    step_number=1,
                    instruction_text="Ask if they can speak",
                    voice_text="Ask the person 'Are you choking?' If they cannot speak, cough, or breathe, they need help.",
                    duration_seconds=5
                ),
                FirstAidInstruction(
                    step_number=2,
                    instruction_text="Perform abdominal thrusts",
                    voice_text="Stand behind them, make a fist above their navel, and thrust inward and upward.",
                    warning="Be careful not to squeeze the ribs",
                    requires_confirmation=True
                ),
            ],
        }
        
        # Return specific instructions or generic ones
        return default_instructions.get(
            emergency_type,
            [
                FirstAidInstruction(
                    step_number=1,
                    instruction_text="Call 911 immediately",
                    voice_text="Call 911 immediately and describe the emergency.",
                    requires_confirmation=True
                ),
                FirstAidInstruction(
                    step_number=2,
                    instruction_text="Keep the person calm and still",
                    voice_text="Keep the person calm, still, and comfortable while waiting for help.",
                    requires_confirmation=True
                ),
            ]
        )
    
    async def process_voice_input(
        self,
        audio_text: str,
        context: Optional[str] = None
    ) -> str:
        """
        Process transcribed voice input and generate a response.
        
        Provides conversational assistance during an emergency.
        
        Args:
            audio_text: Transcribed text from user's voice
            context: Optional context about current situation
            
        Returns:
            Response text for voice synthesis
        """
        logger.info("Processing voice input")
        logger.debug(f"User said: {audio_text[:100]}...")
        
        try:
            # Build prompt
            prompt = VOICE_ASSISTANT_PROMPT
            if context:
                prompt += f"\n\nCurrent situation: {context}"
            prompt += f"\n\nUser says: {audio_text}\n\nRespond concisely:"
            
            # Call Gemini
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=256,
                )
            )
            
            response_text = response.text.strip()
            logger.info(f"Generated voice response: {response_text[:50]}...")
            return response_text
            
        except Exception as e:
            logger.error(f"Voice processing failed: {e}", exc_info=True)
            return "I'm having trouble understanding. Please describe what you see or what help you need."
    
    async def check_connection(self) -> bool:
        """
        Check if the Gemini API is accessible.
        
        Used for health checks and connection validation.
        
        Returns:
            True if connection is working, False otherwise
        """
        logger.debug("Checking Gemini API connection")
        
        try:
            # Simple test request
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[types.Content(role="user", parts=[types.Part.from_text(text="Hello")])],
                config=types.GenerateContentConfig(max_output_tokens=10)
            )
            
            if response.text:
                logger.info("Gemini API connection successful")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Gemini API connection check failed: {e}")
            return False


# -----------------------------------------------------------------------------
# Module-level service instance for dependency injection
# -----------------------------------------------------------------------------
gemini_service = GeminiService()
