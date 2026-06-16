"use client";

import React from "react";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Ya, hapus",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-xl shadow-2xl p-5"
        style={{
          backgroundColor: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border, #e5e7eb)",
          color: "var(--text-primary, #0f172a)",
        }}
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary, #6b7280)" }}>
            {description}
          </p>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-md"
            style={{
              backgroundColor: "var(--bg-elevated, transparent)",
              border: "1px solid var(--border, #e5e7eb)",
              color: "var(--text-primary, #0f172a)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 rounded-md"
            style={{
              backgroundColor: "var(--danger, #dc2626)",
              color: "var(--danger-contrast, #ffffff)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
