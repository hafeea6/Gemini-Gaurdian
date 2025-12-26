"use client";

import { useRef, useState } from "react";

type Status = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export function useCamera() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function requestPermissions() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("unsupported");
      setError("Camera/Microphone not supported");
      return false;
    }

    try {
      setStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setStatus("granted");
      setError(null);
      return true;
    } catch (e: any) {
      setStatus("denied");
      setError(e?.message ?? "Permission denied");
      return false;
    }
  }

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStatus("idle");
    }
  }

  return { status, error, requestPermissions, stop, streamRef } as const;
}
