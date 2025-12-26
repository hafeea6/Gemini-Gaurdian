"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import HeroCard from "../components/HeroCard";
import SessionControl from "../components/SessionControl";
import Sidebar from "../components/Sidebar";
import { useCamera } from "../lib/useCamera";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import muiTheme from "../lib/muiTheme";
import Box from "@mui/material/Box";

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
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
          fontFamily: muiTheme.typography.fontFamily,
          px: 3,
          py: 4
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 3
          }}
        >
          <Header />

          <Box sx={{ gridColumn: "1 / 2" }}>
            <HeroCard onStart={handleStart} permissionStatus={status} />
            <Box sx={{ mt: 3 }}>
              <SessionControl
                active={active}
                onToggle={handleToggle}
                onRequestPermissions={handleRequestPermissions}
                permissionStatus={status}
              />
            </Box>
          </Box>

          <Box sx={{ gridColumn: "2 / 3" }}>
            <Sidebar
              missionLog={
                missionLog.length
                  ? missionLog
                  : [error ? `Error: ${error}` : "No entries"]
              }
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
