// =============================================================================
// GEMINI GUARDIAN - EMERGENCY STATE STORE
// =============================================================================
// Zustand store for managing emergency session state.
// Provides reactive state management for the emergency workflow.
//
// This is a life-critical application - state must be predictable.
// =============================================================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
import { createLogger } from "@/lib/logger";
import type {
  EmergencyType,
  SeverityLevel,
  EmergencyStatus,
  FirstAidInstruction,
  AnalysisData,
  SessionData,
} from "@/types";

// =============================================================================
// LOGGER
// =============================================================================

const logger = createLogger("EmergencyStore");

// =============================================================================
// STATE INTERFACE
// =============================================================================

/**
 * Emergency session state interface.
 * Contains all state related to the current emergency session.
 */
interface EmergencyState {
  // ---------------------------------------------------------------------------
  // Session State
  // ---------------------------------------------------------------------------
  /** Current session ID */
  sessionId: string | null;
  /** Session status */
  status: EmergencyStatus | null;
  /** Whether a session is active */
  isActive: boolean;
  /** Session start time */
  startedAt: Date | null;
  
  // ---------------------------------------------------------------------------
  // Analysis State
  // ---------------------------------------------------------------------------
  /** Detected emergency type */
  emergencyType: EmergencyType | null;
  /** Assessed severity level */
  severity: SeverityLevel | null;
  /** AI confidence score */
  confidenceScore: number | null;
  /** Scene observations */
  observations: string[];
  /** Recommended action */
  recommendedAction: string | null;
  /** Whether to call 911 */
  callEmergencyServices: boolean;
  
  // ---------------------------------------------------------------------------
  // Instruction State
  // ---------------------------------------------------------------------------
  /** All first aid instructions */
  instructions: FirstAidInstruction[];
  /** Current step number (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Current instruction object */
  currentInstruction: FirstAidInstruction | null;
  
  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  /** Whether analyzing a frame */
  isAnalyzing: boolean;
  /** Loading message */
  loadingMessage: string | null;
  /** Error message */
  error: string | null;
  /** Voice guidance text to speak */
  voiceGuidance: string | null;
  
  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  /** Start a new session */
  startSession: (sessionData: SessionData) => void;
  /** Update session with analysis results */
  setAnalysis: (analysis: AnalysisData) => void;
  /** Advance to next instruction */
  advanceStep: () => void;
  /** Set current instruction */
  setCurrentInstruction: (instruction: FirstAidInstruction | null) => void;
  /** End the session */
  endSession: () => void;
  /** Set analyzing state */
  setAnalyzing: (isAnalyzing: boolean, message?: string) => void;
  /** Set error */
  setError: (error: string | null) => void;
  /** Set voice guidance */
  setVoiceGuidance: (text: string | null) => void;
  /** Reset all state */
  reset: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Initial state values.
 * Used for resetting state.
 */
const initialState = {
  // Session
  sessionId: null,
  status: null,
  isActive: false,
  startedAt: null,
  // Analysis
  emergencyType: null,
  severity: null,
  confidenceScore: null,
  observations: [],
  recommendedAction: null,
  callEmergencyServices: false,
  // Instructions
  instructions: [],
  currentStep: 0,
  totalSteps: 0,
  currentInstruction: null,
  // UI
  isAnalyzing: false,
  loadingMessage: null,
  error: null,
  voiceGuidance: null,
};

// =============================================================================
// STORE CREATION
// =============================================================================

/**
 * Emergency state store using Zustand.
 * 
 * Uses devtools middleware for debugging in development.
 * 
 * @example
 * // Access state
 * const { sessionId, isActive } = useEmergencyStore();
 * 
 * // Call actions
 * const { startSession, setAnalysis } = useEmergencyStore();
 * startSession(sessionData);
 */
export const useEmergencyStore = create<EmergencyState>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,
      
      // -----------------------------------------------------------------------
      // Session Actions
      // -----------------------------------------------------------------------
      
      /**
       * Start a new emergency session.
       * Initializes session state from API response.
       * 
       * @param sessionData - Session data from API
       */
      startSession: (sessionData: SessionData) => {
        logger.info("Starting session", { sessionId: sessionData.session_id, status: sessionData.status });
        
        set({
          sessionId: sessionData.session_id,
          status: sessionData.status,
          isActive: true,
          startedAt: new Date(sessionData.started_at),
          currentStep: sessionData.current_step,
          totalSteps: sessionData.total_steps,
          emergencyType: sessionData.emergency_type || null,
          severity: sessionData.severity || null,
          error: null,
        });
      },
      
      /**
       * Update session with analysis results.
       * Called after frame analysis completes.
       * 
       * @param analysis - Analysis data from API
       */
      setAnalysis: (analysis: AnalysisData) => {
        logger.info("Setting analysis", { emergencyType: analysis.emergency_type, severity: analysis.severity });
        
        // Get first instruction if available
        const firstInstruction = analysis.instructions[0] || null;
        
        set({
          emergencyType: analysis.emergency_type,
          severity: analysis.severity,
          confidenceScore: analysis.confidence_score,
          observations: analysis.observations,
          recommendedAction: analysis.recommended_action,
          callEmergencyServices: analysis.call_emergency_services,
          instructions: analysis.instructions,
          totalSteps: analysis.instructions.length,
          currentStep: analysis.instructions.length > 0 ? 1 : 0,
          currentInstruction: firstInstruction,
          voiceGuidance: analysis.voice_guidance,
          isAnalyzing: false,
          loadingMessage: null,
          status: "active" as EmergencyStatus,
        });
      },
      
      /**
       * Advance to the next instruction step.
       * Updates current step and instruction.
       */
      advanceStep: () => {
        const { currentStep, totalSteps, instructions } = get();
        
        // Check if we can advance
        if (currentStep >= totalSteps) {
          logger.warn("Already at last step", { currentStep, totalSteps });
          return;
        }
        
        // Calculate new step (1-indexed)
        const newStep = currentStep + 1;
        
        // Get the new instruction (0-indexed array)
        const newInstruction = instructions[newStep - 1] || null;
        
        logger.info("Advancing to next step", { newStep, totalSteps });
        
        set({
          currentStep: newStep,
          currentInstruction: newInstruction,
          voiceGuidance: newInstruction?.voice_text || null,
        });
      },
      
      /**
       * Set the current instruction directly.
       * 
       * @param instruction - The instruction to set
       */
      setCurrentInstruction: (instruction: FirstAidInstruction | null) => {
        logger.debug("Setting current instruction", { hasInstruction: !!instruction });
        set({
          currentInstruction: instruction,
          voiceGuidance: instruction?.voice_text || null,
        });
      },
      
      /**
       * End the current session.
       * Marks session as ended but preserves data for reference.
       */
      endSession: () => {
        logger.info("Ending session");
        set({
          isActive: false,
          status: "resolved" as EmergencyStatus,
        });
      },
      
      // -----------------------------------------------------------------------
      // UI Actions
      // -----------------------------------------------------------------------
      
      /**
       * Set analyzing state.
       * Shows loading indicator during analysis.
       * 
       * @param isAnalyzing - Whether analyzing
       * @param message - Optional loading message
       */
      setAnalyzing: (isAnalyzing: boolean, message?: string) => {
        logger.debug("Analyzing state changed", { isAnalyzing, message });
        set({
          isAnalyzing,
          loadingMessage: isAnalyzing ? (message || "Analyzing...") : null,
        });
      },
      
      /**
       * Set error message.
       * 
       * @param error - Error message or null to clear
       */
      setError: (error: string | null) => {
        if (error) {
          logger.error("Error occurred", new Error(error));
        }
        set({ error });
      },
      
      /**
       * Set voice guidance text.
       * 
       * @param text - Text to speak or null to clear
       */
      setVoiceGuidance: (text: string | null) => {
        logger.debug("Voice guidance updated", { preview: text?.substring(0, 50) });
        set({ voiceGuidance: text });
      },
      
      /**
       * Reset all state to initial values.
       * Called when starting a completely new session.
       */
      reset: () => {
        logger.info("Resetting emergency state");
        set(initialState);
      },
    }),
    {
      name: "emergency-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Select session-related state.
 */

// IMPORTANT: Zustand hooks must only be used in Client Components.
// Do NOT use useSessionState or useEmergencyStore in Server Components or outside "use client" files.
// This prevents SSR/CSR hydration mismatch and getServerSnapshot errors in Next.js.
const sessionSelector = (state: EmergencyState) => ({
  sessionId: state.sessionId,
  status: state.status,
  isActive: state.isActive,
  startedAt: state.startedAt,
});

export const useSessionState = () => useEmergencyStore(useShallow(sessionSelector));

/**
 * Select analysis-related state.
 */
const analysisSelector = (state: EmergencyState) => ({
  emergencyType: state.emergencyType,
  severity: state.severity,
  confidenceScore: state.confidenceScore,
  observations: state.observations,
  recommendedAction: state.recommendedAction,
  callEmergencyServices: state.callEmergencyServices,
});

export const useAnalysisState = () => useEmergencyStore(useShallow(analysisSelector));

/**
 * Select instruction-related state.
 */
const instructionSelector = (state: EmergencyState) => ({
  instructions: state.instructions,
  currentStep: state.currentStep,
  totalSteps: state.totalSteps,
  currentInstruction: state.currentInstruction,
});

export const useInstructionState = () => useEmergencyStore(useShallow(instructionSelector));

/**
 * Select UI-related state.
 */
const uiSelector = (state: EmergencyState) => ({
  isAnalyzing: state.isAnalyzing,
  loadingMessage: state.loadingMessage,
  error: state.error,
  voiceGuidance: state.voiceGuidance,
});

export const useUIState = () => useEmergencyStore(useShallow(uiSelector));
