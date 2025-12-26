// =============================================================================
// GEMINI GUARDIAN - INSTRUCTIONS DISPLAY COMPONENT
// =============================================================================
// Display component for first aid instructions with step-by-step guidance.
// Shows current instruction, progress, and allows step navigation.
//
// Clear instruction display is critical for emergency guidance.
// =============================================================================

"use client";

import { useEffect, useCallback } from "react";
import {
  useEmergencyStore,
  useInstructionState,
  useAnalysisState
} from "@/stores/emergencyStore";
import { SeverityLevel } from "@/types";
import type { FirstAidInstruction } from "@/types";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

/**
 * Props for the InstructionsDisplay component.
 */
interface InstructionsDisplayProps {
  /** Callback when user advances to next step */
  onAdvanceStep?: () => void;
  /** Whether voice guidance is enabled */
  enableVoice?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get color class based on severity level.
 *
 * @param severity - The severity level
 * @returns Tailwind color class
 */
function getSeverityColor(severity: SeverityLevel | null): string {
  if (severity === null) return "text-gray-500 bg-gray-500/10 border-gray-500";

  switch (severity) {
    case SeverityLevel.CRITICAL:
    case SeverityLevel.EXTREME:
      return "text-red-500 bg-red-500/10 border-red-500";
    case SeverityLevel.HIGH:
      return "text-orange-500 bg-orange-500/10 border-orange-500";
    case SeverityLevel.MODERATE:
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500";
    case SeverityLevel.LOW:
      return "text-green-500 bg-green-500/10 border-green-500";
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500";
  }
}

/**
 * Get severity display text.
 *
 * @param severity - The severity level
 * @returns Human-readable severity text
 */
function getSeverityText(severity: SeverityLevel | null): string {
  if (severity === null) return "Assessing situation...";

  switch (severity) {
    case SeverityLevel.CRITICAL:
    case SeverityLevel.EXTREME:
      return "CRITICAL - Immediate Action Required";
    case SeverityLevel.HIGH:
      return "HIGH - Urgent Attention Needed";
    case SeverityLevel.MODERATE:
      return "MEDIUM - Prompt Care Required";
    case SeverityLevel.LOW:
      return "LOW - Minor Attention Needed";
    default:
      return "Assessing situation...";
  }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Step indicator component showing progress through instructions.
 */
function StepIndicator({
  currentStep,
  totalSteps
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Progress dots */}
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${i < currentStep ? "bg-green-500" : ""}
              ${i === currentStep - 1 ? "bg-blue-500 scale-125" : ""}
              ${i >= currentStep ? "bg-gray-600" : ""}
            `}
          />
        ))}
      </div>

      {/* Step counter */}
      <span className="text-gray-400 text-sm ml-2">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}

/**
 * Single instruction card component.
 */
function InstructionCard({
  instruction,
  isActive
}: {
  instruction: FirstAidInstruction;
  isActive: boolean;
}) {
  return (
    <div
      className={`
        p-6 rounded-xl border-2 transition-all duration-300
        ${
          isActive
            ? "bg-blue-500/10 border-blue-500 scale-105"
            : "bg-gray-800/50 border-gray-700"
        }
      `}
    >
      {/* Step number badge */}
      <div className="flex items-start gap-4">
        <div
          className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            font-bold text-lg
            ${isActive ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"}
          `}
        >
          {instruction.step_number}
        </div>

        <div className="flex-1">
          {/* Main instruction text */}
          <p
            className={`
              text-lg font-medium leading-relaxed
              ${isActive ? "text-white" : "text-gray-400"}
            `}
          >
            {instruction.instruction_text}
          </p>

          {/* Visual cue if any */}
          {instruction.visual_cue && (
            <p className="mt-2 text-gray-400 text-sm">
              {instruction.visual_cue}
            </p>
          )}

          {/* Warning if present */}
          {instruction.warning && (
            <div className="mt-3 flex items-center gap-2 text-red-500 text-sm font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{instruction.warning}</span>
            </div>
          )}

          {/* Time estimate */}
          {instruction.duration_seconds && (
            <div className="mt-2 text-gray-500 text-xs">
              Estimated time: {instruction.duration_seconds}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * InstructionsDisplay component for showing first aid guidance.
 *
 * Displays current instruction prominently with step navigation.
 * Optionally speaks instructions using text-to-speech.
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * <InstructionsDisplay
 *   enableVoice={true}
 *   onAdvanceStep={() => api.advanceStep(sessionId)}
 * />
 */
export function InstructionsDisplay({
  onAdvanceStep,
  enableVoice = true,
  className = ""
}: InstructionsDisplayProps) {
  // ---------------------------------------------------------------------------
  // Store State
  // ---------------------------------------------------------------------------

  /** Instruction state */
  const { instructions, currentStep, totalSteps, currentInstruction } =
    useInstructionState();

  /** Analysis state */
  const { severity, emergencyType, callEmergencyServices } = useAnalysisState();

  /** Emergency store actions */
  const { advanceStep: advanceStoreStep, voiceGuidance } = useEmergencyStore();

  // ---------------------------------------------------------------------------
  // Voice Guidance
  // ---------------------------------------------------------------------------

  /**
   * Speak text using Web Speech API.
   */
  const speak = useCallback(
    (text: string) => {
      if (!enableVoice || typeof window === "undefined") return;

      // Check if speech synthesis is available
      if (!("speechSynthesis" in window)) {
        console.warn("[InstructionsDisplay] Speech synthesis not available");
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      utterance.volume = 1;

      // Speak
      console.log(
        "[InstructionsDisplay] Speaking:",
        text.substring(0, 50) + "..."
      );
      window.speechSynthesis.speak(utterance);
    },
    [enableVoice]
  );

  /**
   * Speak voice guidance when it changes.
   */
  useEffect(() => {
    if (voiceGuidance) {
      speak(voiceGuidance);
    }
  }, [voiceGuidance, speak]);

  /**
   * Speak current instruction when it changes.
   */
  useEffect(() => {
    if (currentInstruction?.voice_text) {
      speak(currentInstruction.voice_text);
    }
  }, [currentInstruction, speak]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle advance step button click.
   */
  const handleAdvanceStep = useCallback(() => {
    console.log("[InstructionsDisplay] Advancing step");

    // Update local state
    advanceStoreStep();

    // Call API callback
    if (onAdvanceStep) {
      onAdvanceStep();
    }
  }, [advanceStoreStep, onAdvanceStep]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // No instructions yet
  if (instructions.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 ${className}`}
      >
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <p className="text-white text-lg">Analyzing situation...</p>
        <p className="text-gray-500 text-sm mt-2">
          Point camera at the emergency scene
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Emergency type and severity header */}
      <div className="flex flex-col gap-3">
        {/* Emergency type */}
        {emergencyType && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            <h2 className="text-xl font-bold text-white capitalize">
              {emergencyType.replace(/_/g, " ")} Detected
            </h2>
          </div>
        )}

        {/* Severity badge */}
        <div
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full border
            ${getSeverityColor(severity)}
          `}
        >
          <span className="text-sm font-bold uppercase">
            {getSeverityText(severity)}
          </span>
        </div>

        {/* Call 911 warning */}
        {callEmergencyServices && (
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse">
            <span className="text-2xl">📞</span>
            <div>
              <p className="font-bold">CALL 911 IMMEDIATELY</p>
              <p className="text-sm opacity-90">
                This situation requires professional emergency services
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step progress indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

      {/* Current instruction */}
      {currentInstruction && (
        <InstructionCard instruction={currentInstruction} isActive={true} />
      )}

      {/* Navigation buttons */}
      <div className="flex gap-4">
        {/* Complete step button */}
        {currentStep < totalSteps && (
          <button
            onClick={handleAdvanceStep}
            className="flex-1 py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>Done - Next Step</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Completed all steps */}
        {currentStep >= totalSteps && (
          <div className="flex-1 py-4 px-6 bg-green-500/20 border border-green-500 text-green-500 rounded-xl font-bold text-lg text-center">
            ✓ All Steps Completed
          </div>
        )}
      </div>

      {/* Upcoming steps preview */}
      {currentStep < totalSteps && (
        <div className="mt-4">
          <h3 className="text-gray-400 text-sm mb-3">Upcoming Steps:</h3>
          <div className="space-y-2 opacity-60">
            {instructions
              .slice(currentStep, currentStep + 2)
              .map((instruction) => (
                <InstructionCard
                  key={instruction.step_number}
                  instruction={instruction}
                  isActive={false}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
