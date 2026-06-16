"use client";

import { Toaster } from "react-hot-toast";
import { useTheme } from "@/components/ThemeProvider";

export default function ToasterWrapper() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: isDark ? "#1e293b" : "#ffffff",
          color: isDark ? "#f1f5f9" : "#1e1b4b",
          border: `1px solid ${isDark ? "#334155" : "#c7d2fe"}`,
          borderRadius: "0.75rem",
          fontSize: "0.875rem",
          fontFamily: "Inter, sans-serif",
          boxShadow: isDark
            ? "0 10px 25px rgba(0,0,0,0.4)"
            : "0 10px 25px rgba(99,102,241,0.15)",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: isDark ? "#1e293b" : "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: isDark ? "#1e293b" : "#ffffff",
          },
        },
      }}
    />
  );
}
