"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [active, setActive] = useState(false);

  return (
    <div className="min-h-screen bg-gg-dark text-gg-fg font-sans">
      <div className="container mx-auto grid grid-cols-12 gap-6 px-6 py-10">
        <header className="col-span-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gg-accent flex items-center justify-center text-white font-bold">
              G
            </div>
            <h1 className="text-xl font-semibold tracking-wide">
              GEMINI GUARDIAN
            </h1>
            <span className="ml-3 text-xs text-gg-muted">
              HYBRID AI ARCHITECTURE · REASONING CORE: FLASH 3.0
            </span>
          </div>
          <button className="rounded px-4 py-2 bg-red-600 text-white text-sm font-medium">
            ALERT EMS
          </button>
        </header>

        <main className="col-span-9 space-y-6">
          <section className="card relative overflow-hidden">
            <div className="flex items-center justify-center py-16 px-8">
              <div className="text-center">
                <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gg-accent/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gg-accent"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-extrabold">SYSTEM READY</h2>
                <p className="mt-3 text-gg-muted max-w-xl mx-auto">
                  Establish a secure link for real-time visual triage and
                  life-saving medical guidance.
                </p>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setActive(true)}
                    className="btn-primary inline-flex items-center gap-3"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M12 5v14M5 12h14" strokeWidth={0} />
                    </svg>
                    START GUARDIAN SESSION
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="card flex items-center justify-between p-6">
            <div className="flex items-center gap-6">
              <div className="rounded-md bg-gg-muted/10 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gg-muted"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM5 10v1a7 7 0 0 0 14 0v-1" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gg-muted">SESSION CONTROL</div>
                <div className="text-sm font-semibold">
                  {active ? "LINK ACTIVE" : "NO ACTIVE LINK"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setActive(!active)} className="btn-start">
                {active ? "END SESSION" : "START SESSION"}
              </button>
              <div className="p-2 rounded bg-gg-muted/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gg-muted"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3v18" />
                </svg>
              </div>
            </div>
          </section>
        </main>

        <aside className="col-span-3">
          <div className="sidebar p-4">
            <div className="directive mb-6">
              <div className="text-xs text-gg-muted">CURRENT DIRECTIVE</div>
              <div className="mt-2 rounded bg-gg-muted/8 p-4 text-lg font-semibold">
                WAITING FOR ASSESSMENT ...
              </div>
            </div>

            <div className="mission-log">
              <div className="text-xs text-gg-muted mb-2">MISSION LOG</div>
              <div className="rounded bg-gg-muted/8 p-3 text-sm">
                <pre className="whitespace-pre-wrap text-gg-muted">
                  Error: Camera/Microphone access denied. Please check browser
                  settings.
                </pre>
                <div className="mt-3 text-xs text-gg-muted">
                  GUARDIAN AI • 14:13:12
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
