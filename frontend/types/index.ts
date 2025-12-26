// =============================================================================
// GEMINI GUARDIAN - FRONTEND TYPE DEFINITIONS
// =============================================================================
// TypeScript interfaces matching backend Pydantic models.
// Ensures type safety across the full stack.
//
// This is a life-critical application - type safety is essential.
// =============================================================================

// =============================================================================
// ENUMERATIONS
// =============================================================================

/**
 * Classification of emergency types recognized by the system.
 * Maps to backend EmergencyType enum.
 */
export enum EmergencyType {
  CARDIAC_ARREST = "cardiac_arrest",
  HEART_ATTACK = "heart_attack",
  CHOKING = "choking",
  DROWNING = "drowning",
  ASTHMA_ATTACK = "asthma_attack",
  SEVERE_BLEEDING = "severe_bleeding",
  FRACTURE = "fracture",
  BURN = "burn",
  HEAD_INJURY = "head_injury",
  STROKE = "stroke",
  SEIZURE = "seizure",
  DIABETIC_EMERGENCY = "diabetic_emergency",
  ALLERGIC_REACTION = "allergic_reaction",
  POISONING = "poisoning",
  UNCONSCIOUS = "unconscious",
  SHOCK = "shock",
  UNKNOWN = "unknown",
}

/**
 * Severity classification for emergency situations.
 * 1 = LOW (minor), 5 = EXTREME (life-threatening)
 */
export enum SeverityLevel {
  LOW = 1,
  MODERATE = 2,
  HIGH = 3,
  CRITICAL = 4,
  EXTREME = 5,
}

/**
 * Current status of an emergency session.
 */
export enum EmergencyStatus {
  PENDING = "pending",
  ANALYZING = "analyzing",
  ACTIVE = "active",
  MONITORING = "monitoring",
  RESOLVED = "resolved",
  ESCALATED = "escalated",
  CANCELLED = "cancelled",
}

/**
 * Types of WebSocket messages exchanged.
 */
export enum WebSocketMessageType {
  // Client -> Server
  VIDEO_FRAME = "video_frame",
  AUDIO_CHUNK = "audio_chunk",
  USER_MESSAGE = "user_message",
  STEP_CONFIRM = "step_confirm",
  REQUEST_HELP = "request_help",
  END_SESSION = "end_session",
  // Server -> Client
  ANALYSIS_RESULT = "analysis_result",
  INSTRUCTION = "instruction",
  VOICE_RESPONSE = "voice_response",
  SESSION_UPDATE = "session_update",
  ERROR = "error",
  HEARTBEAT = "heartbeat",
}

// =============================================================================
// CORE DATA TYPES
// =============================================================================

/**
 * A single first aid instruction step.
 * Matches backend FirstAidInstruction model.
 */
export interface FirstAidInstruction {
  /** Sequential step number starting from 1 */
  step_number: number;
  /** Clear instruction text for display */
  instruction_text: string;
  /** Text optimized for text-to-speech */
  voice_text: string;
  /** Estimated seconds to complete (optional) */
  duration_seconds?: number | null;
  /** Whether user must confirm completion */
  requires_confirmation: boolean;
  /** Safety warning for this step (optional) */
  warning?: string | null;
  /** Visual guidance description (optional) */
  visual_cue?: string | null;
}

/**
 * Result of AI analysis of an emergency situation.
 * Matches backend EmergencyAnalysis model.
 */
export interface EmergencyAnalysis {
  /** Classified type of emergency */
  emergency_type: EmergencyType;
  /** Assessed severity level (1-5) */
  severity: SeverityLevel;
  /** AI confidence score (0.0-1.0) */
  confidence_score: number;
  /** List of observations from the scene */
  observations: string[];
  /** Immediate recommended action */
  recommended_action: string;
  /** Whether to advise calling 911 */
  call_emergency_services: boolean;
  /** Additional context from AI */
  additional_context?: string | null;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Request to start a new emergency session.
 * Matches backend StartSessionRequest DTO.
 */
export interface StartSessionRequest {
  /** Initial notes about the emergency */
  user_notes?: string | null;
  /** GPS coordinates or location description */
  location_data?: string | null;
  /** Device and browser information */
  device_info?: string | null;
}

/**
 * Request to analyze a video frame.
 * Matches backend AnalyzeFrameRequest DTO.
 */
export interface AnalyzeFrameRequest {
  /** Session ID this frame belongs to */
  session_id: string;
  /** Base64 encoded image data */
  frame_data: string;
  /** Frame sequence number */
  sequence_number: number;
  /** Frame width in pixels */
  width: number;
  /** Frame height in pixels */
  height: number;
  /** Image format (jpeg, png, webp) */
  format: string;
  /** Frame capture timestamp */
  timestamp?: string;
}

/**
 * Request to process audio.
 * Matches backend ProcessAudioRequest DTO.
 */
export interface ProcessAudioRequest {
  /** Session ID this audio belongs to */
  session_id: string;
  /** Base64 encoded audio data */
  audio_data: string;
  /** Audio chunk sequence number */
  sequence_number: number;
  /** Sample rate in Hz */
  sample_rate: number;
  /** Number of audio channels */
  channels: number;
  /** Duration in milliseconds */
  duration_ms: number;
  /** Audio format */
  format: string;
}

/**
 * Request to advance instruction step.
 * Matches backend AdvanceStepRequest DTO.
 */
export interface AdvanceStepRequest {
  /** Session ID to advance */
  session_id: string;
  /** Current step being completed */
  current_step: number;
  /** Optional feedback about the step */
  feedback?: string | null;
}

/**
 * Request to end a session.
 * Matches backend EndSessionRequest DTO.
 */
export interface EndSessionRequest {
  /** Session ID to end */
  session_id: string;
  /** Reason for ending */
  reason: string;
  /** Notes about resolution */
  notes?: string | null;
  /** Whether 911 was called */
  emergency_services_called: boolean;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Base response structure for all API responses.
 * Generic over the data type T.
 */
export interface BaseResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Human-readable status message */
  message: string;
  /** Response timestamp */
  timestamp: string;
  /** Response payload */
  data: T | null;
}

/**
 * Session data in API responses.
 * Matches backend SessionData model.
 */
export interface SessionData {
  /** Unique session identifier */
  session_id: string;
  /** Current session status */
  status: EmergencyStatus;
  /** Session start timestamp */
  started_at: string;
  /** Current instruction step */
  current_step: number;
  /** Total instruction steps */
  total_steps: number;
  /** Detected emergency type */
  emergency_type?: EmergencyType | null;
  /** Assessed severity */
  severity?: SeverityLevel | null;
}

/**
 * Analysis data in API responses.
 * Matches backend AnalysisData model.
 */
export interface AnalysisData {
  /** Associated session ID */
  session_id: string;
  /** Classified emergency type */
  emergency_type: EmergencyType;
  /** Assessed severity level */
  severity: SeverityLevel;
  /** AI confidence score */
  confidence_score: number;
  /** Scene observations */
  observations: string[];
  /** Immediate recommended action */
  recommended_action: string;
  /** Whether to call emergency services */
  call_emergency_services: boolean;
  /** First aid instructions */
  instructions: FirstAidInstruction[];
  /** Voice guidance text */
  voice_guidance: string;
}

/**
 * Instruction data in API responses.
 * Matches backend InstructionData model.
 */
export interface InstructionData {
  /** Associated session ID */
  session_id: string;
  /** Current step number */
  current_step: number;
  /** Total steps */
  total_steps: number;
  /** Current instruction */
  instruction: FirstAidInstruction;
  /** Next instruction preview */
  next_instruction?: FirstAidInstruction | null;
  /** Voice text */
  voice_text: string;
}

/**
 * Error data in API responses.
 * Matches backend ErrorData model.
 */
export interface ErrorData {
  /** Application-specific error code */
  error_code: string;
  /** Type of error */
  error_type: string;
  /** Additional details */
  details?: string | null;
  /** Request tracking ID */
  request_id?: string | null;
}

/**
 * Health check data in API responses.
 * Matches backend HealthCheckData model.
 */
export interface HealthCheckData {
  /** Service name */
  service: string;
  /** Service version */
  version: string;
  /** Service status */
  status: string;
  /** Uptime in seconds */
  uptime_seconds: number;
  /** Gemini connection status */
  gemini_connected: boolean;
}

// =============================================================================
// TYPED RESPONSE ALIASES
// =============================================================================

/** Response for session operations */
export type SessionResponse = BaseResponse<SessionData>;

/** Response for analysis operations */
export type AnalysisResponse = BaseResponse<AnalysisData>;

/** Response for instruction operations */
export type InstructionResponse = BaseResponse<InstructionData>;

/** Response for errors */
export type ErrorResponse = BaseResponse<ErrorData>;

/** Response for health checks */
export type HealthCheckResponse = BaseResponse<HealthCheckData>;

// =============================================================================
// WEBSOCKET TYPES
// =============================================================================

/**
 * WebSocket message structure.
 */
export interface WebSocketMessage<T = unknown> {
  /** Message type identifier */
  type: WebSocketMessageType;
  /** Associated session ID */
  session_id: string;
  /** Message timestamp */
  timestamp: string;
  /** Message payload */
  payload: T;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * Media device state for camera/microphone.
 */
export interface MediaDeviceState {
  /** Whether device is available */
  isAvailable: boolean;
  /** Whether device is currently active */
  isActive: boolean;
  /** Error message if any */
  error?: string | null;
  /** Device ID if selected */
  deviceId?: string | null;
}

/**
 * Camera state for video capture.
 */
export interface CameraState extends MediaDeviceState {
  /** Current video stream */
  stream?: MediaStream | null;
  /** Video width */
  width: number;
  /** Video height */
  height: number;
  /** Facing mode (user/environment) */
  facingMode: "user" | "environment";
}

/**
 * Microphone state for audio capture.
 */
export interface MicrophoneState extends MediaDeviceState {
  /** Current audio stream */
  stream?: MediaStream | null;
  /** Whether recording */
  isRecording: boolean;
  /** Audio level (0-1) */
  audioLevel: number;
}

/**
 * Connection state for API/WebSocket.
 */
export interface ConnectionState {
  /** Whether connected to backend */
  isConnected: boolean;
  /** Whether connecting */
  isConnecting: boolean;
  /** Last error */
  error?: string | null;
  /** Last successful connection time */
  lastConnected?: Date | null;
}
