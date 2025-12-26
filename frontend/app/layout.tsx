// =============================================================================
// GEMINI GUARDIAN - ROOT LAYOUT
// =============================================================================
// Root layout component for the Next.js application.
// Provides global styling and metadata configuration.
// =============================================================================

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// =============================================================================
// FONTS
// =============================================================================

/**
 * Inter font configuration.
 * Clean, readable sans-serif font optimized for UI.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

// =============================================================================
// METADATA
// =============================================================================

/**
 * Application metadata for SEO and PWA.
 */
export const metadata: Metadata = {
  title: "Gemini Guardian - Emergency Assistance",
  description:
    "AI-powered real-time emergency assistance with live video analysis and first aid guidance.",
  keywords: [
    "emergency",
    "first aid",
    "AI",
    "medical assistance",
    "Gemini",
    "real-time"
  ],
  authors: [{ name: "Gemini Guardian Team" }],
  creator: "Gemini Guardian",
  publisher: "Gemini Guardian",
  applicationName: "Gemini Guardian",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gemini Guardian"
  },
  formatDetection: {
    telephone: true // Enable phone number detection for 911
  },
  openGraph: {
    type: "website",
    title: "Gemini Guardian - Emergency Assistance",
    description:
      "AI-powered real-time emergency assistance with live video analysis.",
    siteName: "Gemini Guardian"
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemini Guardian - Emergency Assistance",
    description:
      "AI-powered real-time emergency assistance with live video analysis."
  }
};

/**
 * Viewport configuration for mobile optimization.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevent zoom for better UX in emergencies
  userScalable: false,
  themeColor: "#111827", // Dark theme color
  colorScheme: "dark"
};

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================

/**
 * Root layout component.
 *
 * Wraps all pages with consistent styling and configuration.
 * Optimized for mobile-first emergency response.
 *
 * @param children - Page content
 * @returns JSX element
 */
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <time dateTime="2016-10-25" suppressHydrationWarning />
      <html lang="en" className={`${inter.variable} dark`}>
        <head>
          {/* Preconnect to API server */}
          <link rel="preconnect" href="http://localhost:8000" />

          {/* PWA icons */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
        </head>
        <body className="font-sans antialiased bg-gray-950 text-white">
          {/* Skip to main content for accessibility */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
          >
            Skip to main content
          </a>

          {/* Main content */}
          <div id="main">{children}</div>

          {/* Emergency notification banner (can be triggered by app) */}
          <div id="emergency-banner" />
        </body>
      </html>
    </>
  );
}
