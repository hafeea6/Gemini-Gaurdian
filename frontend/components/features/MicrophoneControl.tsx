// =============================================================================
// GEMINI GUARDIAN - MICROPHONE CONTROL COMPONENT
// =============================================================================
// Push-to-talk microphone control with audio visualization.
// Handles voice input capture and audio level display.
//
// Voice communication is critical for hands-free emergency assistance.
// =============================================================================

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useMediaStore, useMicrophoneState } from "@/stores/mediaStore";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

/**
 * Props for the MicrophoneControl component.
 */
interface MicrophoneControlProps {
  /** Callback when audio is recorded */
  onAudioCapture?: (audioData: string, duration: number) => void;
  /** Whether voice input is enabled */
  enabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * MicrophoneControl component for voice input.
 *
 * Provides push-to-talk functionality with audio visualization.
 * Records audio and sends to AI for voice command processing.
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * <MicrophoneControl
 *   enabled={sessionActive}
 *   onAudioCapture={(audio, duration) => processVoice(audio)}
 * />
 */
export function MicrophoneControl({
  onAudioCapture,
  enabled = true,
  className = ""
}: MicrophoneControlProps) {
  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  /** MediaRecorder instance */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  /** Recorded audio chunks */
  const audioChunksRef = useRef<Blob[]>([]);

  /** Audio analyser for visualization */
  const analyserRef = useRef<AnalyserNode | null>(null);

  /** Animation frame ref */
  const animationFrameRef = useRef<number | null>(null);

  /** Recording start time */
  const recordingStartRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // Store State
  // ---------------------------------------------------------------------------

  /** Microphone state from store */
  const microphone = useMicrophoneState();

  /** Media store actions */
  const { initMicrophone, stopMicrophone, setRecording, setAudioLevel } =
    useMediaStore();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  /** Whether currently recording */
  const [isRecording, setIsRecordingLocal] = useState(false);

  /** Recording duration display */
  const [recordingDuration, setRecordingDuration] = useState(0);

  // ---------------------------------------------------------------------------
  // Audio Visualization
  // ---------------------------------------------------------------------------

  /**
   * Visualization loop to update audio level.
   *
   * Calculates RMS of audio data for smooth level display.
   */
  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS for smoother visualization
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Normalize to 0-1 range
      const level = rms / 255;

      // Update store
      setAudioLevel(level);

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, [setAudioLevel]);

  /**
   * Set up audio analyser for level visualization.
   *
   * Creates AudioContext and AnalyserNode to measure audio levels.
   *
   * @param stream - MediaStream from microphone
   */
  const setupAudioAnalyser = useCallback(
    (stream: MediaStream) => {
      console.log("[MicrophoneControl] Setting up audio analyser");

      try {
        // Create audio context
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        // Configure analyser
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        // Connect nodes
        source.connect(analyser);

        // Store ref
        analyserRef.current = analyser;

        // Start visualization loop
        visualizeAudio();
      } catch (error) {
        console.error(
          "[MicrophoneControl] Audio analyser setup failed:",
          error
        );
      }
    },
    [visualizeAudio]
  );

  // ---------------------------------------------------------------------------
  // Recording Logic
  // ---------------------------------------------------------------------------

  /**
   * Start recording audio.
   */
  const startRecording = useCallback(async () => {
    if (!enabled) {
      console.log("[MicrophoneControl] Recording disabled");
      return;
    }

    console.log("[MicrophoneControl] Starting recording");

    // Initialize microphone if not active
    let stream = microphone.stream;
    if (!stream) {
      stream = await initMicrophone();
      if (!stream) {
        console.error("[MicrophoneControl] Failed to get microphone stream");
        return;
      }
    }

    // Set up audio analyser
    setupAudioAnalyser(stream);

    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus"
    });

    // Store ref
    mediaRecorderRef.current = mediaRecorder;

    // Clear previous chunks
    audioChunksRef.current = [];

    // Handle data available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        console.log(
          "[MicrophoneControl] Audio chunk received:",
          event.data.size
        );
      }
    };

    // Handle recording stop
    mediaRecorder.onstop = async () => {
      console.log("[MicrophoneControl] Recording stopped, processing audio");

      // Calculate duration
      const duration = (Date.now() - recordingStartRef.current) / 1000;

      // Combine chunks into blob
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm"
      });

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];

        console.log("[MicrophoneControl] Audio processed:", {
          duration: duration.toFixed(2) + "s",
          size: Math.round(audioBlob.size / 1024) + "KB"
        });

        // Send to callback
        if (onAudioCapture) {
          onAudioCapture(base64Data, duration);
        }
      };
      reader.readAsDataURL(audioBlob);

      // Clean up
      audioChunksRef.current = [];
    };

    // Start recording
    recordingStartRef.current = Date.now();
    mediaRecorder.start(100); // Collect data every 100ms

    // Update state
    setIsRecordingLocal(true);
    setRecording(true);
    setRecordingDuration(0);

    // Start duration counter
    const durationInterval = setInterval(() => {
      setRecordingDuration((prev) => prev + 0.1);
    }, 100);

    // Store interval for cleanup
    (
      mediaRecorderRef.current as unknown as {
        durationInterval?: NodeJS.Timeout;
      }
    ).durationInterval = durationInterval;
  }, [
    enabled,
    microphone.stream,
    initMicrophone,
    setRecording,
    setupAudioAnalyser,
    onAudioCapture
  ]);

  /**
   * Stop recording audio.
   */
  const stopRecording = useCallback(() => {
    console.log("[MicrophoneControl] Stopping recording");

    // Stop MediaRecorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      // Clear duration interval
      const recorder = mediaRecorderRef.current as unknown as {
        durationInterval?: NodeJS.Timeout;
      };
      if (recorder.durationInterval) {
        clearInterval(recorder.durationInterval);
      }
      mediaRecorderRef.current.stop();
    }

    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset audio level
    setAudioLevel(0);

    // Update state
    setIsRecordingLocal(false);
    setRecording(false);
  }, [setRecording, setAudioLevel]);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop microphone
      stopMicrophone();
    };
  }, [stopMicrophone]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Audio level visualization */}
      <div className="relative w-16 h-16">
        {/* Background circle */}
        <div className="absolute inset-0 bg-gray-700 rounded-full" />

        {/* Audio level ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-green-500 transition-transform duration-75"
          style={{
            transform: `scale(${1 + microphone.audioLevel * 0.5})`,
            opacity: isRecording ? 1 : 0
          }}
        />

        {/* Mic icon */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={!enabled}
          className={`
            absolute inset-0 flex items-center justify-center rounded-full
            transition-all duration-200
            ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
            ${
              isRecording
                ? "bg-red-600 scale-110"
                : "bg-gray-800 hover:bg-gray-700"
            }
          `}
          aria-label={
            isRecording ? "Release to stop recording" : "Hold to record"
          }
          title={isRecording ? "Release to stop recording" : "Hold to record"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-8 w-8 ${
              isRecording ? "text-white" : "text-gray-300"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>
      </div>

      {/* Status text */}
      <div className="text-center">
        {microphone.error ? (
          <p className="text-red-500 text-sm">{microphone.error}</p>
        ) : isRecording ? (
          <p className="text-green-500 text-sm font-medium animate-pulse">
            Listening...
          </p>
        ) : (
          <p className="text-gray-400 text-sm">
            {enabled ? "Hold to speak" : "Voice input disabled"}
          </p>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 text-xs font-mono">
            {recordingDuration.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  );
}
