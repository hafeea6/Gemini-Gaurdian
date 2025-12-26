// =============================================================================
// GEMINI GUARDIAN - MAIN EMERGENCY PAGE
// =============================================================================
// Main application page for emergency assistance.
// Integrates camera, microphone, and AI-powered first aid guidance.
//
// This is the primary user interface for life-critical emergency response.
// Design prioritizes clarity, speed, and reliability.
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CameraFeed,
  MicrophoneControl,
  InstructionsDisplay,
  StatusIndicator,
  EmergencyControls
} from "@/components/features";
import {
  useEmergencyStore,
  useSessionState,
  useUIState
} from "@/stores/emergencyStore";
import { useCameraState } from "@/stores/mediaStore";
import { apiClient } from "@/services/api";

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Main emergency assistance page.
 *
 * Full-screen mobile-first interface for emergency response.
 * Provides real-time AI analysis of video feed and step-by-step guidance.
 *
 * @returns JSX element
 */
export default function EmergencyPage() {
  // ---------------------------------------------------------------------------
  // Store State
  // ---------------------------------------------------------------------------

  /** Session state */
  const { sessionId, isActive } = useSessionState();

  /** UI state */
  const { isAnalyzing, error } = useUIState();

  /** Camera state */
  const camera = useCameraState();

  /** Emergency store actions */
  const { setAnalysis, setAnalyzing, setError, advanceStep } =
    useEmergencyStore();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  /** Whether frame capture is enabled */
  const [captureEnabled, setCaptureEnabled] = useState(false);

  /** Frame analysis debounce flag */
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);

  // ---------------------------------------------------------------------------
  // Frame Analysis
  // ---------------------------------------------------------------------------

  /**
   * Handle captured frame from camera.
   * Sends frame to API for AI analysis.
   *
   * @param frameData - Base64 encoded JPEG frame
   */
  const handleFrameCapture = useCallback(
    async (frameData: string) => {
      // Skip if no session or already processing
      if (!sessionId || isProcessingFrame) {
        return;
      }

      console.log("[EmergencyPage] Processing captured frame");
      setIsProcessingFrame(true);

      try {
        // Send frame to API for analysis
        const response = await apiClient.analyzeFrame(sessionId, {
          frame_data: frameData,
          media_type: "image",
          format: "jpeg",
          timestamp: new Date().toISOString()
        });

        // Check for successful analysis
        if (response.success && response.data) {
          console.log(
            "[EmergencyPage] Analysis received:",
            response.data.emergency_type
          );

          // Update store with analysis results
          setAnalysis({
            session_id: sessionId,
            emergency_type: response.data.emergency_type,
            severity: response.data.severity,
            confidence_score: response.data.confidence_score,
            observations: response.data.observations,
            recommended_action: response.data.recommended_action,
            call_emergency_services: response.data.call_emergency_services,
            instructions: response.data.instructions,
            voice_guidance: response.data.voice_guidance
          });

          // Disable frame capture after successful analysis
          // (we have enough info to start guiding)
          if (response.data.instructions.length > 0) {
            setCaptureEnabled(false);
          }
        }
      } catch (err) {
        console.error("[EmergencyPage] Frame analysis error:", err);
        // Don't show error for individual frame failures
        // Just continue capturing
      } finally {
        setIsProcessingFrame(false);
      }
    },
    [sessionId, isProcessingFrame, setAnalysis]
  );

  // ---------------------------------------------------------------------------
  // Voice Input
  // ---------------------------------------------------------------------------

  /**
   * Handle audio capture from microphone.
   * Sends audio to API for voice command processing.
   *
   * @param audioData - Base64 encoded audio
   * @param duration - Duration in seconds
   */
  const handleAudioCapture = useCallback(
    async (audioData: string, duration: number) => {
      if (!sessionId) {
        return;
      }

      console.log(
        "[EmergencyPage] Processing audio:",
        duration.toFixed(2) + "s"
      );

      try {
        // Send audio to API
        const response = await apiClient.processAudio(sessionId, {
          audio_data: audioData,
          media_type: "audio",
          format: "webm",
          timestamp: new Date().toISOString(),
          duration_seconds: duration,
          sample_rate: 16000
        });

        // Handle response
        if (response.success && response.data) {
          console.log(
            "[EmergencyPage] Audio processed:",
            response.data.voice_guidance
          );

          // Update analysis if new info received
          if (response.data.emergency_type && sessionId) {
            setAnalysis({
              session_id: sessionId,
              emergency_type: response.data.emergency_type,
              severity: response.data.severity,
              confidence_score: response.data.confidence_score,
              observations: response.data.observations,
              recommended_action: response.data.recommended_action,
              call_emergency_services: response.data.call_emergency_services,
              instructions: response.data.instructions,
              voice_guidance: response.data.voice_guidance
            });
          }
        }
      } catch (err) {
        console.error("[EmergencyPage] Audio processing error:", err);
      }
    },
    [sessionId, setAnalysis]
  );

  // ---------------------------------------------------------------------------
  // Step Advancement
  // ---------------------------------------------------------------------------

  /**
   * Handle step advancement from instructions display.
   * Notifies API and updates local state.
   */
  const handleAdvanceStep = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    console.log("[EmergencyPage] Advancing step");

    try {
      // Notify API
      await apiClient.advanceStep(sessionId);
    } catch (err) {
      console.error("[EmergencyPage] Step advance error:", err);
      // Step already advanced locally, API failure is non-critical
    }
  }, [sessionId]);

  // ---------------------------------------------------------------------------
  // Session Events
  // ---------------------------------------------------------------------------

  /**
   * Handle session start.
   * Enables frame capture to begin analysis.
   */
  const handleSessionStart = useCallback((newSessionId: string) => {
    console.log("[EmergencyPage] Session started:", newSessionId);

    // Enable frame capture after short delay
    // (give camera time to stabilize)
    setTimeout(() => {
      setCaptureEnabled(true);
    }, 1000);
  }, []);

  /**
   * Handle session end.
   * Cleans up and resets state.
   */
  const handleSessionEnd = useCallback(() => {
    console.log("[EmergencyPage] Session ended");
    setCaptureEnabled(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Check API health on mount.
   */
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiClient.checkHealth();
        console.log("[EmergencyPage] API health:", response.data?.status);
      } catch (err) {
        console.error("[EmergencyPage] API health check failed:", err);
        setError("Cannot connect to server. Please check your connection.");
      }
    };

    checkHealth();
  }, [setError]);

  // Suppress unused variable warnings for future use
  void camera;
  void isAnalyzing;
  void advanceStep;
  void setAnalyzing;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h1 className="text-lg font-bold text-white">Gemini Guardian</h1>
            <p className="text-xs text-gray-400">Emergency Assistance</p>
          </div>
        </div>

        {/* Status indicator */}
        <StatusIndicator showDetails={false} />
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Camera */}
        <section className="lg:w-1/2 p-4">
          <div className="h-full min-h-[300px] lg:min-h-[500px]">
            <CameraFeed
              autoStart={false}
              enableCapture={captureEnabled && isActive}
              captureInterval={3000} // Capture every 3 seconds
              onFrameCapture={handleFrameCapture}
              className="w-full h-full"
            />
          </div>

          {/* Microphone control - below camera on mobile */}
          <div className="mt-4 flex justify-center lg:hidden">
            <MicrophoneControl
              enabled={isActive}
              onAudioCapture={handleAudioCapture}
            />
          </div>
        </section>

        {/* Right side - Controls and Instructions */}
        <section className="lg:w-1/2 p-4 flex flex-col gap-6">
          {/* Emergency controls */}
          <EmergencyControls
            onSessionStart={handleSessionStart}
            onSessionEnd={handleSessionEnd}
          />

          {/* Instructions display */}
          {isActive && (
            <div className="flex-1 overflow-y-auto">
              <InstructionsDisplay
                enableVoice={true}
                onAdvanceStep={handleAdvanceStep}
              />
            </div>
          )}

          {/* Initial state - instructions */}
          {!isActive && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-6xl mb-6">🚨</div>
              <h2 className="text-2xl font-bold mb-4">
                Emergency Assistance Ready
              </h2>
              <p className="text-gray-400 max-w-md mb-6">
                Press the button above to start. Point your camera at the
                emergency scene and follow the AI-guided instructions.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl mb-2">📷</div>
                  <p className="text-xs text-gray-400">Show the scene</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl mb-2">🤖</div>
                  <p className="text-xs text-gray-400">AI analyzes</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl mb-2">📋</div>
                  <p className="text-xs text-gray-400">Follow steps</p>
                </div>
              </div>
            </div>
          )}

          {/* Microphone control - side panel on desktop */}
          <div className="hidden lg:flex justify-center py-4 border-t border-gray-800">
            <MicrophoneControl
              enabled={isActive}
              onAudioCapture={handleAudioCapture}
            />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="p-4 bg-gray-900/80 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-xs">
          ⚠️ This is an AI assistant. Always call 911 for real emergencies.
        </p>
      </footer>
    </main>
  );
}
