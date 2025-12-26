// =============================================================================
// GEMINI GUARDIAN - API SERVICE
// =============================================================================
// HTTP API client for communicating with the FastAPI backend.
// Provides typed methods for all API endpoints.
//
// This is a life-critical application - reliability is essential.
// =============================================================================

import { createLogger } from "@/lib/logger";
import type {
  StartSessionRequest,
  AnalyzeFrameRequest,
  ProcessAudioRequest,
  AdvanceStepRequest,
  EndSessionRequest,
  SessionResponse,
  AnalysisResponse,
  InstructionResponse,
  HealthCheckResponse,
  ErrorResponse,
} from "@/types";

// =============================================================================
// LOGGER
// =============================================================================

const logger = createLogger("API");

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * API base URL from environment or default.
 * Uses localhost:8000 for development.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Health endpoint URL (no /api/v1 prefix).
 */
const HEALTH_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

/**
 * Default request timeout in milliseconds.
 * Emergency situations require fast responses.
 */
const DEFAULT_TIMEOUT_MS = 10000;

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

/**
 * Log API request details.
 * 
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param body - Request body (optional)
 */
function logRequest(method: string, endpoint: string, body?: unknown): void {
  logger.debug(`${method} ${endpoint}`, body);
}

/**
 * Log API response details.
 * 
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param status - HTTP status code
 * @param duration - Request duration in ms
 */
function logResponse(
  method: string,
  endpoint: string,
  status: number,
  duration: number
): void {
  const isSuccess = status >= 200 && status < 300;
  const message = `${method} ${endpoint} - ${status} (${duration}ms)`;
  
  if (isSuccess) {
    logger.info(message);
  } else {
    logger.warn(message, { status, duration });
  }
}

/**
 * Log API error details.
 * 
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param error - Error object
 */
function logError(method: string, endpoint: string, error: unknown): void {
  logger.error(`${method} ${endpoint} failed`, error);
}

// =============================================================================
// FETCH WRAPPER
// =============================================================================

/**
 * Custom error class for API errors.
 * Contains response details for better error handling.
 */
export class ApiError extends Error {
  /** HTTP status code */
  public readonly status: number;
  /** Error code from backend */
  public readonly code: string;
  /** Error details */
  public readonly details?: string;
  /** Request ID for support */
  public readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    code: string = "UNKNOWN",
    details?: string,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

/**
 * Make an HTTP request to the API.
 * 
 * Handles:
 * - Request/response logging
 * - Timeout handling
 * - Error parsing
 * - Type-safe responses
 * 
 * @param method - HTTP method
 * @param endpoint - API endpoint (relative to base URL)
 * @param body - Request body (optional)
 * @param timeoutMs - Request timeout in ms
 * @returns Parsed response data
 * @throws ApiError on failure
 */
async function fetchApi<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  // Build full URL
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Log the request
  logRequest(method, endpoint, body);
  
  // Record start time for duration logging
  const startTime = Date.now();
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Make the request
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Log response
    logResponse(method, endpoint, response.status, duration);
    
    // Parse response body
    const data = await response.json();
    
    // Check for error response
    if (!response.ok) {
      // Extract error details from response
      const errorData = data as ErrorResponse;
      throw new ApiError(
        errorData.message || "Request failed",
        response.status,
        errorData.data?.error_code || "UNKNOWN",
        errorData.data?.details || undefined,
        errorData.data?.request_id || undefined
      );
    }
    
    // Return successful response
    return data as T;
    
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    // Log the error
    logError(method, endpoint, error);
    
    // Handle abort (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        "Request timed out",
        408,
        "TIMEOUT",
        `Request exceeded ${timeoutMs}ms timeout`
      );
    }
    
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Wrap other errors
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error",
      0,
      "NETWORK_ERROR",
      "Failed to connect to server"
    );
  }
}

// =============================================================================
// SESSION API
// =============================================================================

/**
 * Start a new emergency session.
 * 
 * Creates a new session for tracking the emergency assistance workflow.
 * The returned session_id must be included in all subsequent requests.
 * 
 * @param request - Session creation parameters
 * @returns Session response with session_id
 * @throws ApiError on failure
 * 
 * @example
 * const response = await startSession({
 *   user_notes: "Person collapsed in park",
 *   location_data: "40.7128,-74.0060"
 * });
 * console.log(response.data?.session_id);
 */
export async function startSession(
  request: StartSessionRequest
): Promise<SessionResponse> {
  console.log("[API] Starting new emergency session");
  return fetchApi<SessionResponse>("POST", "/session/start", request);
}

/**
 * Get session details by ID.
 * 
 * Retrieves the current state of an emergency session.
 * 
 * @param sessionId - The session UUID
 * @returns Session details
 * @throws ApiError if session not found
 */
export async function getSession(sessionId: string): Promise<SessionResponse> {
  console.log(`[API] Getting session ${sessionId}`);
  return fetchApi<SessionResponse>("GET", `/session/${sessionId}`);
}

/**
 * End an emergency session.
 * 
 * Terminates the session with resolution information.
 * 
 * @param sessionId - The session UUID
 * @param request - End session parameters
 * @returns Final session state
 * @throws ApiError if session not found or already ended
 */
export async function endSession(
  sessionId: string,
  request: EndSessionRequest
): Promise<SessionResponse> {
  console.log(`[API] Ending session ${sessionId}`);
  return fetchApi<SessionResponse>("POST", `/session/${sessionId}/end`, request);
}

// =============================================================================
// EMERGENCY API
// =============================================================================

/**
 * Analyze a video frame for emergency detection.
 * 
 * Sends a single video frame to be analyzed by Gemini AI.
 * Returns emergency type, severity, and first aid instructions.
 * 
 * **This is the primary endpoint for emergency detection.**
 * 
 * @param request - Frame data and session information
 * @returns Analysis results with instructions
 * @throws ApiError on failure
 * 
 * @example
 * const response = await analyzeFrame({
 *   session_id: "uuid...",
 *   frame_data: "base64...",
 *   sequence_number: 1,
 *   width: 1280,
 *   height: 720,
 *   format: "jpeg"
 * });
 */
export async function analyzeFrame(
  request: AnalyzeFrameRequest
): Promise<AnalysisResponse> {
  console.log(`[API] Analyzing frame ${request.sequence_number} for session ${request.session_id}`);
  // Use longer timeout for AI analysis
  return fetchApi<AnalysisResponse>("POST", "/emergency/analyze", request, 30000);
}

/**
 * Process audio from user microphone.
 * 
 * Sends audio data for speech recognition and AI response.
 * 
 * @param request - Audio data and session information
 * @returns Processing results
 * @throws ApiError on failure
 */
export async function processAudio(
  request: ProcessAudioRequest
): Promise<AnalysisResponse> {
  console.log(`[API] Processing audio chunk ${request.sequence_number}`);
  return fetchApi<AnalysisResponse>("POST", "/emergency/audio", request, 15000);
}

/**
 * Advance to the next instruction step.
 * 
 * Called when user confirms completion of current step.
 * 
 * @param request - Step confirmation
 * @returns Next instruction or completion status
 * @throws ApiError on failure
 */
export async function advanceStep(
  request: AdvanceStepRequest
): Promise<InstructionResponse> {
  console.log(`[API] Advancing from step ${request.current_step}`);
  return fetchApi<InstructionResponse>("POST", "/emergency/advance", request);
}

/**
 * Get current instruction for a session.
 * 
 * Retrieves the current instruction without advancing.
 * 
 * @param sessionId - The session UUID
 * @returns Current instruction details
 * @throws ApiError if session not found
 */
export async function getCurrentInstruction(
  sessionId: string
): Promise<InstructionResponse> {
  console.log(`[API] Getting current instruction for ${sessionId}`);
  return fetchApi<InstructionResponse>("GET", `/emergency/instruction/${sessionId}`);
}

// =============================================================================
// HEALTH API
// =============================================================================

/**
 * Check API health status.
 * 
 * Simple liveness check for the backend.
 * 
 * @returns Health status
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  console.log("[API] Checking health");
  // Health endpoint doesn't have /api/v1 prefix
  const response = await fetch(`${HEALTH_URL}/health`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return response.json();
}

/**
 * Check API readiness status.
 * 
 * Detailed check including Gemini connectivity.
 * 
 * @returns Readiness status
 */
export async function checkReadiness(): Promise<HealthCheckResponse> {
  console.log("[API] Checking readiness");
  const response = await fetch(`${HEALTH_URL}/health/ready`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return response.json();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert a Blob to base64 string.
 * 
 * Useful for encoding images and audio for API requests.
 * 
 * @param blob - The blob to encode
 * @returns Base64 encoded string (without data URL prefix)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert an HTMLCanvasElement to base64 JPEG.
 * 
 * @param canvas - The canvas to encode
 * @param quality - JPEG quality (0-1)
 * @returns Base64 encoded JPEG string
 */
export function canvasToBase64(canvas: HTMLCanvasElement, quality: number = 0.8): string {
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.split(",")[1];
}

// =============================================================================
// API CLIENT OBJECT
// =============================================================================

/**
 * Unified API client object for convenient access to all endpoints.
 * 
 * @example
 * import { apiClient } from "@/services/api";
 * 
 * const session = await apiClient.startSession({});
 * await apiClient.analyzeFrame(sessionId, frameRequest);
 */
export const apiClient = {
  // Session methods (simplified signatures)
  startSession: (request: StartSessionRequest = {}) => startSession(request),
  getSession,
  endSession: (sessionId: string, reason: string = "completed") =>
    endSession(sessionId, {
      session_id: sessionId,
      reason,
      emergency_services_called: false,
    }),
  
  // Emergency methods (simplified signatures)
  analyzeFrame: (sessionId: string, frame: {
    frame_data: string;
    media_type: string;
    format: string;
    timestamp?: string;
  }) =>
    analyzeFrame({
      session_id: sessionId,
      frame_data: frame.frame_data,
      sequence_number: Date.now(),
      width: 1280,
      height: 720,
      format: frame.format,
      timestamp: frame.timestamp,
    }),
  
  processAudio: (sessionId: string, audio: {
    audio_data: string;
    media_type: string;
    format: string;
    timestamp?: string;
    duration_seconds?: number;
    sample_rate?: number;
  }) =>
    processAudio({
      session_id: sessionId,
      audio_data: audio.audio_data,
      sequence_number: Date.now(),
      sample_rate: audio.sample_rate || 16000,
      channels: 1,
      duration_ms: (audio.duration_seconds || 1) * 1000,
      format: audio.format,
    }),
  
  advanceStep: (sessionId: string, currentStep: number = 1) =>
    advanceStep({
      session_id: sessionId,
      current_step: currentStep,
    }),
  
  getCurrentInstruction,
  
  // Health methods
  checkHealth,
  checkReadiness,
  
  // Utilities
  blobToBase64,
  canvasToBase64,
};
