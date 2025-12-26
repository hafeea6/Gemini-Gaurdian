// =============================================================================
// GEMINI GUARDIAN - MEDIA STATE STORE
// =============================================================================
// Zustand store for managing camera and microphone state.
// Handles media device permissions and streams.
//
// Media handling is critical for real-time emergency assistance.
// =============================================================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createLogger } from "@/lib/logger";
import type { CameraState, MicrophoneState, ConnectionState } from "@/types";

// =============================================================================
// LOGGER
// =============================================================================

const logger = createLogger("MediaStore");

// =============================================================================
// STATE INTERFACE
// =============================================================================

/**
 * Media state interface.
 * Contains state for camera, microphone, and connection.
 */
interface MediaState {
  // ---------------------------------------------------------------------------
  // Camera State
  // ---------------------------------------------------------------------------
  camera: CameraState;
  
  // ---------------------------------------------------------------------------
  // Microphone State
  // ---------------------------------------------------------------------------
  microphone: MicrophoneState;
  
  // ---------------------------------------------------------------------------
  // Connection State
  // ---------------------------------------------------------------------------
  connection: ConnectionState;
  
  // ---------------------------------------------------------------------------
  // Camera Actions
  // ---------------------------------------------------------------------------
  /** Initialize camera */
  initCamera: (facingMode?: "user" | "environment") => Promise<MediaStream | null>;
  /** Stop camera */
  stopCamera: () => void;
  /** Toggle camera facing */
  toggleCameraFacing: () => Promise<void>;
  /** Set camera error */
  setCameraError: (error: string | null) => void;
  
  // ---------------------------------------------------------------------------
  // Microphone Actions
  // ---------------------------------------------------------------------------
  /** Initialize microphone */
  initMicrophone: () => Promise<MediaStream | null>;
  /** Stop microphone */
  stopMicrophone: () => void;
  /** Set recording state */
  setRecording: (isRecording: boolean) => void;
  /** Update audio level */
  setAudioLevel: (level: number) => void;
  /** Set microphone error */
  setMicrophoneError: (error: string | null) => void;
  
  // ---------------------------------------------------------------------------
  // Connection Actions
  // ---------------------------------------------------------------------------
  /** Set connection state */
  setConnected: (isConnected: boolean) => void;
  /** Set connecting state */
  setConnecting: (isConnecting: boolean) => void;
  /** Set connection error */
  setConnectionError: (error: string | null) => void;
  
  // ---------------------------------------------------------------------------
  // General Actions
  // ---------------------------------------------------------------------------
  /** Stop all media */
  stopAllMedia: () => void;
  /** Reset state */
  reset: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Initial camera state.
 */
const initialCameraState: CameraState = {
  isAvailable: false,
  isActive: false,
  error: null,
  deviceId: null,
  stream: null,
  width: 1280,
  height: 720,
  facingMode: "environment", // Default to back camera for emergencies
};

/**
 * Initial microphone state.
 */
const initialMicrophoneState: MicrophoneState = {
  isAvailable: false,
  isActive: false,
  error: null,
  deviceId: null,
  stream: null,
  isRecording: false,
  audioLevel: 0,
};

/**
 * Initial connection state.
 */
const initialConnectionState: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  error: null,
  lastConnected: null,
};

// =============================================================================
// STORE CREATION
// =============================================================================

/**
 * Media state store using Zustand.
 * 
 * Manages camera, microphone, and connection state.
 * 
 * @example
 * // Access state
 * const { camera, microphone } = useMediaStore();
 * 
 * // Initialize camera
 * const { initCamera } = useMediaStore();
 * await initCamera("environment");
 */
export const useMediaStore = create<MediaState>()(
  devtools(
    (set, get) => ({
      // Initial state
      camera: initialCameraState,
      microphone: initialMicrophoneState,
      connection: initialConnectionState,
      
      // -----------------------------------------------------------------------
      // Camera Actions
      // -----------------------------------------------------------------------
      
      /**
       * Initialize the camera and get video stream.
       * 
       * Requests camera permission and starts video capture.
       * Uses specified facing mode or current state.
       * 
       * @param facingMode - Camera facing mode (front/back)
       * @returns MediaStream or null on failure
       */
      initCamera: async (facingMode?: "user" | "environment"): Promise<MediaStream | null> => {
        logger.info("Initializing camera", { facingMode });
        
        // Get current state
        const { camera } = get();
        const targetFacingMode = facingMode || camera.facingMode;
        
        // Stop existing stream if any
        if (camera.stream) {
          camera.stream.getTracks().forEach((track) => track.stop());
        }
        
        try {
          // Request camera permission with constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: targetFacingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false, // Audio handled separately
          });
          
          // Get actual video track settings
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          
          logger.info("Camera initialized", {
            width: settings.width,
            height: settings.height,
            facingMode: settings.facingMode,
            deviceId: settings.deviceId
          });
          
          // Update state
          set({
            camera: {
              ...camera,
              isAvailable: true,
              isActive: true,
              error: null,
              stream,
              width: settings.width || 1280,
              height: settings.height || 720,
              facingMode: targetFacingMode,
              deviceId: settings.deviceId || null,
            },
          });
          
          return stream;
          
        } catch (error) {
          // Handle permission denied or other errors
          const errorMessage =
            error instanceof Error ? error.message : "Camera access failed";
          
          logger.error("Camera initialization failed", error instanceof Error ? error : new Error(errorMessage));
          
          set({
            camera: {
              ...camera,
              isAvailable: false,
              isActive: false,
              error: errorMessage,
              stream: null,
            },
          });
          
          return null;
        }
      },
      
      /**
       * Stop the camera and release resources.
       */
      stopCamera: () => {
        logger.info("Stopping camera");
        
        const { camera } = get();
        
        // Stop all tracks
        if (camera.stream) {
          camera.stream.getTracks().forEach((track) => {
            track.stop();
            logger.debug("Stopped track", { kind: track.kind });
          });
        }
        
        // Update state
        set({
          camera: {
            ...camera,
            isActive: false,
            stream: null,
          },
        });
      },
      
      /**
       * Toggle between front and back camera.
       */
      toggleCameraFacing: async () => {
        logger.info("Toggling camera facing");
        
        const { camera, initCamera } = get();
        const newFacingMode = camera.facingMode === "user" ? "environment" : "user";
        
        await initCamera(newFacingMode);
      },
      
      /**
       * Set camera error message.
       * 
       * @param error - Error message or null to clear
       */
      setCameraError: (error: string | null) => {
        set((state) => ({
          camera: { ...state.camera, error },
        }));
      },
      
      // -----------------------------------------------------------------------
      // Microphone Actions
      // -----------------------------------------------------------------------
      
      /**
       * Initialize the microphone and get audio stream.
       * 
       * Requests microphone permission and starts audio capture.
       * 
       * @returns MediaStream or null on failure
       */
      initMicrophone: async (): Promise<MediaStream | null> => {
        logger.info("Initializing microphone");
        
        const { microphone } = get();
        
        // Stop existing stream if any
        if (microphone.stream) {
          microphone.stream.getTracks().forEach((track) => track.stop());
        }
        
        try {
          // Request microphone permission
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 16000, // Optimal for speech recognition
            },
            video: false,
          });
          
          // Get audio track settings
          const audioTrack = stream.getAudioTracks()[0];
          const settings = audioTrack.getSettings();
          
          logger.info("Microphone initialized", settings);
          
          // Update state
          set({
            microphone: {
              ...microphone,
              isAvailable: true,
              isActive: true,
              error: null,
              stream,
              deviceId: settings.deviceId || null,
            },
          });
          
          return stream;
          
        } catch (error) {
          // Handle permission denied or other errors
          const errorMessage =
            error instanceof Error ? error.message : "Microphone access failed";
          
          logger.error("Microphone initialization failed", error instanceof Error ? error : new Error(errorMessage));
          
          set({
            microphone: {
              ...microphone,
              isAvailable: false,
              isActive: false,
              error: errorMessage,
              stream: null,
            },
          });
          
          return null;
        }
      },
      
      /**
       * Stop the microphone and release resources.
       */
      stopMicrophone: () => {
        logger.info("Stopping microphone");
        
        const { microphone } = get();
        
        // Stop all tracks
        if (microphone.stream) {
          microphone.stream.getTracks().forEach((track) => {
            track.stop();
          });
        }
        
        // Update state
        set({
          microphone: {
            ...microphone,
            isActive: false,
            isRecording: false,
            stream: null,
            audioLevel: 0,
          },
        });
      },
      
      /**
       * Set recording state.
       * 
       * @param isRecording - Whether recording
       */
      setRecording: (isRecording: boolean) => {
        logger.debug("Recording state changed", { isRecording });
        set((state) => ({
          microphone: { ...state.microphone, isRecording },
        }));
      },
      
      /**
       * Update audio level for visualization.
       * 
       * @param level - Audio level (0-1)
       */
      setAudioLevel: (level: number) => {
        set((state) => ({
          microphone: { ...state.microphone, audioLevel: level },
        }));
      },
      
      /**
       * Set microphone error message.
       * 
       * @param error - Error message or null to clear
       */
      setMicrophoneError: (error: string | null) => {
        set((state) => ({
          microphone: { ...state.microphone, error },
        }));
      },
      
      // -----------------------------------------------------------------------
      // Connection Actions
      // -----------------------------------------------------------------------
      
      /**
       * Set connection state.
       * 
       * @param isConnected - Whether connected
       */
      setConnected: (isConnected: boolean) => {
        logger.info("Connection state changed", { isConnected });
        set((state) => ({
          connection: {
            ...state.connection,
            isConnected,
            isConnecting: false,
            lastConnected: isConnected ? new Date() : state.connection.lastConnected,
          },
        }));
      },
      
      /**
       * Set connecting state.
       * 
       * @param isConnecting - Whether connecting
       */
      setConnecting: (isConnecting: boolean) => {
        set((state) => ({
          connection: { ...state.connection, isConnecting },
        }));
      },
      
      /**
       * Set connection error message.
       * 
       * @param error - Error message or null to clear
       */
      setConnectionError: (error: string | null) => {
        set((state) => ({
          connection: { ...state.connection, error, isConnected: false },
        }));
      },
      
      // -----------------------------------------------------------------------
      // General Actions
      // -----------------------------------------------------------------------
      
      /**
       * Stop all media streams.
       */
      stopAllMedia: () => {
        logger.info("Stopping all media");
        const { stopCamera, stopMicrophone } = get();
        stopCamera();
        stopMicrophone();
      },
      
      /**
       * Reset all state to initial values.
       */
      reset: () => {
        logger.info("Resetting media state");
        const { stopAllMedia } = get();
        stopAllMedia();
        set({
          camera: initialCameraState,
          microphone: initialMicrophoneState,
          connection: initialConnectionState,
        });
      },
    }),
    {
      name: "media-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Select camera state.
 */
export const useCameraState = () => useMediaStore((state) => state.camera);

/**
 * Select microphone state.
 */
export const useMicrophoneState = () => useMediaStore((state) => state.microphone);

/**
 * Select connection state.
 */
export const useConnectionState = () => useMediaStore((state) => state.connection);
