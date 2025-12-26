// =============================================================================
// GEMINI GUARDIAN - CAMERA FEED COMPONENT
// =============================================================================
// Real-time camera feed component with frame capture capabilities.
// Handles video stream display and frame extraction for AI analysis.
//
// This is a life-critical component - camera must work reliably.
// =============================================================================

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useMediaStore, useCameraState } from "@/stores/mediaStore";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

/**
 * Props for the CameraFeed component.
 */
interface CameraFeedProps {
  /** Whether to auto-start the camera on mount */
  autoStart?: boolean;
  /** Callback when a frame is captured */
  onFrameCapture?: (frameData: string) => void;
  /** Frame capture interval in milliseconds (default: 2000ms) */
  captureInterval?: number;
  /** Whether frame capture is enabled */
  enableCapture?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * CameraFeed component for displaying live video feed.
 *
 * Displays the camera stream and captures frames at regular intervals
 * for sending to the AI analysis service.
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * <CameraFeed
 *   autoStart={true}
 *   enableCapture={isAnalyzing}
 *   captureInterval={2000}
 *   onFrameCapture={(frame) => sendToAPI(frame)}
 * />
 */
export function CameraFeed({
  autoStart = false,
  onFrameCapture,
  captureInterval = 2000,
  enableCapture = false,
  className = ""
}: CameraFeedProps) {
  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  /** Video element ref for displaying stream */
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Canvas ref for frame capture (hidden) */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** Capture interval ref */
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Store State
  // ---------------------------------------------------------------------------

  /** Camera state from store */
  const camera = useCameraState();

  /** Media store actions */
  const { initCamera, stopCamera, toggleCameraFacing } = useMediaStore();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  /** Whether video is playing */
  const [isPlaying, setIsPlaying] = useState(false);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Auto-start camera on mount if enabled.
   */
  useEffect(() => {
    if (autoStart) {
      console.log("[CameraFeed] Auto-starting camera");
      initCamera();
    }

    // Cleanup on unmount
    return () => {
      console.log("[CameraFeed] Cleaning up camera");
      stopCamera();
    };
  }, [autoStart, initCamera, stopCamera]);

  /**
   * Attach stream to video element when camera starts.
   */
  useEffect(() => {
    if (camera.stream && videoRef.current) {
      console.log("[CameraFeed] Attaching stream to video element");

      // Set the video source
      videoRef.current.srcObject = camera.stream;

      // Play the video
      videoRef.current
        .play()
        .then(() => {
          console.log("[CameraFeed] Video playback started");
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("[CameraFeed] Video playback failed:", error);
          setIsPlaying(false);
        });
    }
  }, [camera.stream]);

  // ---------------------------------------------------------------------------
  // Frame Capture
  // ---------------------------------------------------------------------------

  /**
   * Capture current frame from video as base64 JPEG.
   *
   * Uses hidden canvas to extract frame data.
   */
  const captureFrame = useCallback(() => {
    // Validate refs
    if (!videoRef.current || !canvasRef.current) {
      console.warn("[CameraFeed] Cannot capture - refs not ready");
      return;
    }

    // Validate video is ready
    if (videoRef.current.readyState < 2) {
      console.warn("[CameraFeed] Cannot capture - video not ready");
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        console.error("[CameraFeed] Cannot get canvas context");
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(video, 0, 0);

      // Convert to base64 JPEG (quality 0.8 for balance of size/quality)
      const frameData = canvas.toDataURL("image/jpeg", 0.8);

      // Extract just the base64 part (remove data:image/jpeg;base64, prefix)
      const base64Data = frameData.split(",")[1];

      console.log("[CameraFeed] Frame captured:", {
        width: canvas.width,
        height: canvas.height,
        size: Math.round(base64Data.length / 1024) + "KB"
      });

      // Send to callback
      if (onFrameCapture) {
        onFrameCapture(base64Data);
      }
    } catch (error) {
      console.error("[CameraFeed] Frame capture failed:", error);
    }
  }, [onFrameCapture]);

  /**
   * Set up frame capture interval when enabled.
   */
  useEffect(() => {
    // Clear existing interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    // Start capture if enabled and camera is active
    if (enableCapture && camera.isActive && isPlaying && onFrameCapture) {
      console.log(
        `[CameraFeed] Starting frame capture every ${captureInterval}ms`
      );

      // Capture first frame immediately
      captureFrame();

      // Set up interval for subsequent frames
      captureIntervalRef.current = setInterval(captureFrame, captureInterval);
    }

    // Cleanup
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [
    enableCapture,
    camera.isActive,
    isPlaying,
    captureInterval,
    onFrameCapture,
    captureFrame
  ]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle start camera button click.
   */
  const handleStartCamera = useCallback(async () => {
    console.log("[CameraFeed] Start camera clicked");
    await initCamera();
  }, [initCamera]);

  /**
   * Handle stop camera button click.
   */
  const handleStopCamera = useCallback(() => {
    console.log("[CameraFeed] Stop camera clicked");
    stopCamera();
    setIsPlaying(false);
  }, [stopCamera]);

  /**
   * Handle camera switch button click.
   */
  const handleSwitchCamera = useCallback(async () => {
    console.log("[CameraFeed] Switch camera clicked");
    await toggleCameraFacing();
  }, [toggleCameraFacing]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
    >
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        aria-label="Camera feed"
      />

      {/* Overlay when camera is not active */}
      {!camera.isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
          {camera.error ? (
            // Error state
            <>
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-white text-lg mb-2">Camera Error</p>
              <p className="text-gray-400 text-sm text-center px-4 mb-6">
                {camera.error}
              </p>
              <button
                onClick={handleStartCamera}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Retry Camera
              </button>
            </>
          ) : (
            // Not started state
            <>
              <div className="text-gray-400 text-6xl mb-4">📷</div>
              <p className="text-white text-lg mb-6">Camera not active</p>
              <button
                onClick={handleStartCamera}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Start Camera
              </button>
            </>
          )}
        </div>
      )}

      {/* Camera controls overlay */}
      {camera.isActive && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          {/* Switch camera button */}
          <button
            onClick={handleSwitchCamera}
            className="p-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full transition-colors"
            aria-label="Switch camera"
            title="Switch camera"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Stop camera button */}
          <button
            onClick={handleStopCamera}
            className="p-3 bg-red-600/80 hover:bg-red-700/80 text-white rounded-full transition-colors"
            aria-label="Stop camera"
            title="Stop camera"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {enableCapture && camera.isActive && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 px-3 py-1 rounded-full">
          <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
        </div>
      )}

      {/* Camera facing indicator */}
      {camera.isActive && (
        <div className="absolute top-4 left-4 bg-gray-800/80 px-3 py-1 rounded-full">
          <span className="text-white text-sm">
            {camera.facingMode === "user" ? "Front" : "Back"} Camera
          </span>
        </div>
      )}
    </div>
  );
}
