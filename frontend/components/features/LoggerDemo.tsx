// =============================================================================
// GEMINI GUARDIAN - LOGGER DEMO COMPONENT
// =============================================================================
// Demonstration component showing how to use the logger in different scenarios
// =============================================================================

"use client";

import { useState } from "react";
import { createLogger } from "@/lib/logger";
import { Button } from "@/components/ui/Button";

const logger = createLogger("LoggerDemo");

/**
 * Logger Demo Component
 *
 * Shows examples of different log levels and usage patterns.
 * Use this component to test logging in the browser and VS Code debug console.
 */
export function LoggerDemo() {
  const [counter, setCounter] = useState(0);

  const handleDebugLog = () => {
    logger.debug("Debug message clicked", {
      counter,
      timestamp: new Date().toISOString()
    });
  };

  const handleInfoLog = () => {
    logger.info("Info message clicked", {
      counter,
      user: "demo-user"
    });
    setCounter(counter + 1);
  };

  const handleWarnLog = () => {
    logger.warn("Warning message clicked", {
      counter,
      warningType: "test-warning"
    });
  };

  const handleErrorLog = () => {
    try {
      throw new Error("This is a test error");
    } catch (error) {
      logger.error("Error message clicked", error, {
        counter,
        context: "demo"
      });
    }
  };

  const handleComplexLog = () => {
    const childLogger = logger.child("ComplexOperation");

    childLogger.info("Starting complex operation");
    childLogger.debug("Step 1: Initialize", { step: 1 });
    childLogger.debug("Step 2: Process", { step: 2 });
    childLogger.debug("Step 3: Finalize", { step: 3 });
    childLogger.info("Complex operation complete", {
      steps: 3,
      duration: "123ms"
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Logger Demo</h1>

      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-700">
          Click the buttons below to generate different types of logs. Open the
          browser console or VS Code Debug Console to see the output.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Counter: <strong>{counter}</strong>
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={handleDebugLog} variant="outline" className="w-full">
          🔵 DEBUG Log - Detailed debugging info
        </Button>

        <Button onClick={handleInfoLog} variant="default" className="w-full">
          🟢 INFO Log - General information
        </Button>

        <Button
          onClick={handleWarnLog}
          variant="warning"
          className="w-full bg-yellow-500 hover:bg-yellow-600"
        >
          🟡 WARN Log - Warning message
        </Button>

        <Button
          onClick={handleErrorLog}
          variant="danger"
          className="w-full bg-red-500 hover:bg-red-600"
        >
          🔴 ERROR Log - Error with stack trace
        </Button>

        <Button onClick={handleComplexLog} variant="outline" className="w-full">
          🎯 Complex Operation - Multiple logs
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h2 className="font-semibold mb-2">How to View Logs:</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            <strong>Browser Console:</strong> F12 → Console tab
          </li>
          <li>
            <strong>VS Code:</strong> Run & Debug (F5) → Debug Console
          </li>
          <li>
            <strong>Log Files:</strong> <code>frontend/logs/app-*.log</code>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default LoggerDemo;
