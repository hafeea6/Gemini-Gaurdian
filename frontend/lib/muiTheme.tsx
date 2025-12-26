"use client";

import { createTheme } from "@mui/material/styles";

const muiTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#07070b", paper: "#0b0b0f" },
    primary: { main: "#5661ff" },
    secondary: { main: "#7a88ff" },
    error: { main: "#ff4d4f" },
    text: { primary: "#e6e7ea", secondary: "#9aa0a6" }
  },
  typography: {
    fontFamily: ["Inter", "Segoe UI", "Helvetica", "Arial"].join(","),
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          textTransform: "none",
          padding: "8px 18px"
        },
        containedPrimary: {
          boxShadow: "0 8px 40px rgba(86,97,255,0.18)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
          boxShadow: "0 6px 30px rgba(2,6,23,0.6)"
        }
      }
    }
  }
});

export default muiTheme;
