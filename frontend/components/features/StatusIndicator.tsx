// =============================================================================
// GEMINI GUARDIAN - STATUS INDICATOR COMPONENT
// =============================================================================
// Connection and session status indicator with visual feedback.
// Shows system health and connection state at a glance.
//
// Status visibility is critical for user confidence during emergencies.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { useConnectionState } from "@/stores/mediaStore";
import { useSessionState, useUIState } from "@/stores/emergencyStore";
import { apiClient } from "@/services/api";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

/**
 * Props for the StatusIndicator component.
 */
interface StatusIndicatorProps {
  /** Whether to show detailed status */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Health check status.
 */
interface HealthStatus {
  healthy: boolean;
  geminiConnected: boolean;
  timestamp: Date | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * StatusIndicator component showing system health.
 *
 * Displays connection status, session state, and API health.
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * <StatusIndicator showDetails={true} />
 */
export function StatusIndicator({
  showDetails = false,
  className = ""
}: StatusIndicatorProps) {
  // ---------------------------------------------------------------------------
  // Store State
  // ---------------------------------------------------------------------------

  /** Connection state - reserved for WebSocket connection status */
  const _connection = useConnectionState();

  /** Session state */
  const { sessionId, isActive, status } = useSessionState();

  /** UI state */
  const { isAnalyzing, error } = useUIState();

  // Suppress unused variable warning for future use
  void _connection;

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  /** API health status */
  const [health, setHealth] = useState<HealthStatus>({
    healthy: false,
    geminiConnected: false,
    timestamp: null
  });

  /** Whether expanded to show details */
  const [expanded, setExpanded] = useState(showDetails);

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------

  /**
   * Check API health periodically.
   */
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiClient.checkHealth();

        setHealth({
          healthy: response.data?.status === "healthy",
          geminiConnected: response.data?.gemini_connected || false,
          timestamp: new Date()
        });

        console.log("[StatusIndicator] Health check:", response.data);
      } catch (err) {
        console.error("[StatusIndicator] Health check failed:", err);

        setHealth({
          healthy: false,
          geminiConnected: false,
          timestamp: new Date()
        });
      }
    };

    // Check immediately
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  /**
   * Get overall status color and text.
   */
  const getOverallStatus = () => {
    // Error state takes priority
    if (error) {
      return { color: "bg-red-500", text: "Error", pulse: true };
    }

    // Analyzing
    if (isAnalyzing) {
      return { color: "bg-yellow-500", text: "Analyzing", pulse: true };
    }

    // Session active
    if (isActive) {
      return { color: "bg-green-500", text: "Active", pulse: false };
    }

    // API healthy but no session
    if (health.healthy) {
      return { color: "bg-blue-500", text: "Ready", pulse: false };
    }

    // Not connected
    return { color: "bg-gray-500", text: "Offline", pulse: false };
  };

  const statusInfo = getOverallStatus();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={`relative ${className}`}>
      {/* Compact status dot */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
        aria-label="Toggle status details"
      >
        {/* Status dot */}
        <span
          className={`
            w-3 h-3 rounded-full ${statusInfo.color}
            ${statusInfo.pulse ? "animate-pulse" : ""}
          `}
        />

        {/* Status text */}
        <span className="text-white text-sm font-medium">
          {statusInfo.text}
        </span>

        {/* Expand icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded details dropdown */}
      {expanded && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700">
            <h3 className="text-white font-semibold">System Status</h3>
          </div>

          {/* Status items */}
          <div className="p-4 space-y-3">
            {/* API Status */}
            <StatusItem
              label="API Server"
              status={health.healthy}
              loading={!health.timestamp}
            />

            {/* Gemini Status */}
            <StatusItem
              label="Gemini AI"
              status={health.geminiConnected}
              loading={!health.timestamp}
            />

            {/* Session Status */}
            <StatusItem
              label="Emergency Session"
              status={isActive}
              detail={
                sessionId ? `ID: ${sessionId.substring(0, 8)}...` : "No session"
              }
            />

            {/* Session state */}
            {status && (
              <StatusItem
                label="Session State"
                status={status === "active"}
                detail={status.charAt(0).toUpperCase() + status.slice(1)}
              />
            )}

            {/* Error display */}
            {error && (
              <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}
          </div>

          {/* Footer with timestamp */}
          {health.timestamp && (
            <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-700">
              <p className="text-gray-500 text-xs">
                Last checked: {health.timestamp.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Individual status item component.
 */
function StatusItem({
  label,
  status,
  detail,
  loading = false
}: {
  label: string;
  status: boolean;
  detail?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-gray-500 text-xs">{detail}</span>}
        {loading ? (
          <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
        ) : (
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold
              ${
                status
                  ? "bg-green-500 text-green-900"
                  : "bg-gray-600 text-gray-400"
              }
            `}
          >
            {status ? "✓" : "×"}
          </span>
        )}
      </div>
    </div>
  );
}
