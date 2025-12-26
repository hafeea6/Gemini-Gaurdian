// =============================================================================
// GEMINI GUARDIAN - EMERGENCY CONTROLS COMPONENT
// =============================================================================
// Main control panel for starting/stopping emergency sessions.
// Provides clear, large buttons for panic-scenario usability.
//
// Controls must be obvious and reliable in emergency situations.
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import {
  useEmergencyStore,
  useSessionState,
  useUIState
} from "@/stores/emergencyStore";
import { useMediaStore } from "@/stores/mediaStore";
import { apiClient } from "@/services/api";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

/**
 * Props for the EmergencyControls component.
 */
interface EmergencyControlsProps {
  /** Callback when session starts */
  onSessionStart?: (sessionId: string) => void;
  /** Callback when session ends */
  onSessionEnd?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * EmergencyControls component for session management.
 *
 * Large, clear buttons for starting and ending emergency sessions.
 * Designed for high-stress situations with minimal cognitive load.
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * <EmergencyControls
 *   onSessionStart={(id) => console.log("Started:", id)}
 *   onSessionEnd={() => console.log("Ended")}
 * />
 */
export function EmergencyControls({
  onSessionStart,
  onSessionEnd,
  className = ""
}: EmergencyControlsProps) {
  // ---------------------------------------------------------------------------
  // Store State
  // ---------------------------------------------------------------------------

  /** Session state */
  const { sessionId, isActive } = useSessionState();

  /** UI state */
  const { isAnalyzing, error, loadingMessage } = useUIState();

  /** Emergency store actions */
  const { startSession, endSession, setAnalyzing, setError, reset } =
    useEmergencyStore();

  /** Media store actions */
  const { initCamera, initMicrophone, stopAllMedia } = useMediaStore();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  /** Loading state for buttons */
  const [isLoading, setIsLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * Start a new emergency session.
   *
   * Initializes camera, microphone, and creates session via API.
   */
  const handleStartSession = useCallback(async () => {
    console.log("[EmergencyControls] Starting session");
    setIsLoading(true);
    setError(null);

    try {
      // Initialize camera first
      setAnalyzing(true, "Initializing camera...");
      const cameraStream = await initCamera("environment");
      if (!cameraStream) {
        throw new Error("Camera access is required for emergency assistance");
      }

      // Initialize microphone
      setAnalyzing(true, "Initializing microphone...");
      await initMicrophone();

      // Create session via API
      setAnalyzing(true, "Connecting to emergency services...");
      const response = await apiClient.startSession();

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to start session");
      }

      // Update store with session data
      startSession(response.data);

      console.log(
        "[EmergencyControls] Session started:",
        response.data.session_id
      );

      // Call callback
      if (onSessionStart) {
        onSessionStart(response.data.session_id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start session";
      console.error("[EmergencyControls] Start session error:", errorMessage);
      setError(errorMessage);

      // Clean up on failure
      stopAllMedia();
    } finally {
      setIsLoading(false);
      setAnalyzing(false);
    }
  }, [
    initCamera,
    initMicrophone,
    startSession,
    setAnalyzing,
    setError,
    stopAllMedia,
    onSessionStart
  ]);

  /**
   * End the current emergency session.
   */
  const handleEndSession = useCallback(async () => {
    if (!sessionId) {
      console.warn("[EmergencyControls] No session to end");
      return;
    }

    console.log("[EmergencyControls] Ending session:", sessionId);
    setIsLoading(true);

    try {
      // End session via API
      await apiClient.endSession(sessionId);

      // Stop media
      stopAllMedia();

      // Update store
      endSession();

      console.log("[EmergencyControls] Session ended");

      // Call callback
      if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (err) {
      console.error("[EmergencyControls] End session error:", err);
      // Still end locally even if API fails
      stopAllMedia();
      endSession();
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, endSession, stopAllMedia, onSessionEnd]);

  /**
   * Reset everything and start fresh.
   */
  const handleReset = useCallback(() => {
    console.log("[EmergencyControls] Resetting");
    stopAllMedia();
    reset();
  }, [stopAllMedia, reset]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main action button */}
      {!isActive ? (
        // Start session button
        <button
          onClick={handleStartSession}
          disabled={isLoading}
          className={`
            relative py-6 px-8 rounded-2xl font-bold text-xl
            transition-all duration-200
            ${
              isLoading
                ? "bg-gray-600 cursor-wait"
                : "bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95"
            }
            text-white shadow-lg
          `}
          aria-label="Start emergency assistance"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>Starting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🆘</span>
              <span>START EMERGENCY ASSISTANCE</span>
            </div>
          )}
        </button>
      ) : (
        // Session active - show end button
        <div className="space-y-3">
          {/* Session active indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Session Active</span>
          </div>

          {/* End session button */}
          <button
            onClick={handleEndSession}
            disabled={isLoading}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg
              transition-all duration-200
              ${
                isLoading
                  ? "bg-gray-600 cursor-wait"
                  : "bg-orange-600 hover:bg-orange-700"
              }
              text-white
            `}
            aria-label="End emergency session"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ending...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>End Session</span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Reset button (only show if there's an error or stuck state) */}
      {(error || (isActive && !isAnalyzing)) && (
        <button
          onClick={handleReset}
          className="py-2 px-4 text-gray-400 hover:text-white text-sm underline"
          aria-label="Reset and start over"
        >
          Reset & Start Over
        </button>
      )}

      {/* Analyzing indicator */}
      {isAnalyzing && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-400 animate-pulse">
            {loadingMessage || "Analyzing..."}
          </span>
        </div>
      )}
    </div>
  );
}
