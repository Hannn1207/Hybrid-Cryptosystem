"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
      aria-label={isDark ? "Aktifkan light mode" : "Aktifkan dark mode"}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                 transition-all duration-200 group"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-2.5">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: "var(--bg-hover)" }}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {isDark ? "Dark Mode" : "Light Mode"}
        </span>
      </div>

      {/* Toggle pill */}
      <div
        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0
                    ${isDark ? "bg-primary-700" : "bg-primary-500"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md
                      transition-all duration-300 flex items-center justify-center text-xs
                      ${isDark ? "left-5" : "left-0.5"}`}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
      </div>
    </button>
  );
}
