"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import HeroCard from "../components/HeroCard";
import SessionControl from "../components/SessionControl";
import Sidebar from "../components/Sidebar";
import { useCamera } from "../lib/useCamera";

export default function Home() {
  const [active, setActive] = useState(false);
  const [missionLog, setMissionLog] = useState<string[]>([]);

  const { status, error, requestPermissions, stop } = useCamera();

  const addLog = (msg: string) => setMissionLog((s) => [msg, ...s]);

  async function handleStart() {
    const ok = await requestPermissions();
    if (ok) {
      setActive(true);
      addLog("Session started — camera granted.");
    } else {
      addLog("Error: " + (error ?? "Camera/Microphone access denied."));
    }
  }

  async function handleRequestPermissions() {
    const ok = await requestPermissions();
    if (!ok) {
      addLog(
        "Error: " +
          (error ??
            "Camera/Microphone access denied. Please check browser settings.")
      );
    } else {
      addLog("Camera/Microphone permission granted.");
    }
    return ok;
  }

  function handleToggle() {
    if (active) {
      stop();
      setActive(false);
      addLog("Session ended.");
    } else {
      setActive(true);
      addLog("Session started (manual toggle).");
    }
  }

  return (
    <div className="min-h-screen bg-gg-dark text-gg-fg font-sans">
      <div className="container mx-auto grid grid-cols-12 gap-6 px-6 py-10">
        <Header />

        <main className="col-span-9 space-y-6">
          <HeroCard onStart={handleStart} permissionStatus={status} />
          <SessionControl
            active={active}
            onToggle={handleToggle}
            onRequestPermissions={handleRequestPermissions}
            permissionStatus={status}
          />
        </main>

        <aside className="col-span-3">
          <Sidebar
            missionLog={
              missionLog.length
                ? missionLog
                : [error ? `Error: ${error}` : "No entries"]
            }
          />
        </aside>
      </div>
    </div>
  );
}
