"use client";

import { useState, useEffect } from "react";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  document: { id: string; originalName: string } | null;
}

const actionColors: Record<string, string> = {
  ENCRYPT: "badge-blue",
  DECRYPT: "badge-green",
  UPLOAD: "badge-yellow",
  DOWNLOAD: "badge-gray",
  TRANSFER: "badge-blue",
  KEY_GENERATE: "badge-green",
  KEY_DELETE: "badge-red",
  LOGIN: "badge-gray",
  REGISTER: "badge-blue",
  LOGOUT: "badge-gray",
};

const actionLabels: Record<string, string> = {
  ENCRYPT: "🔒 Enkripsi",
  DECRYPT: "🔓 Dekripsi",
  UPLOAD: "📤 Upload",
  DOWNLOAD: "📥 Download",
  TRANSFER: "📨 Transfer",
  KEY_GENERATE: "🔑 Buat Kunci",
  KEY_DELETE: "🗑️ Hapus Kunci",
  LOGIN: "👤 Login",
  REGISTER: "✅ Register",
  LOGOUT: "👋 Logout",
};

const actionIcons: Record<string, string> = {
  ENCRYPT: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  DECRYPT: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
  UPLOAD: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
  DOWNLOAD: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  KEY_GENERATE: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  KEY_DELETE: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  LOGIN: "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1",
  REGISTER: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  LOGOUT: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchActivities = async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/activities?page=${p}&limit=15`);
    const data = await res.json();
    setActivities(data.activities ?? []);
    setPagination(data.pagination ?? { total: 0, pages: 1 });
    setLoading(false);
  };

  useEffect(() => { fetchActivities(page); }, [page]);

  const formatMeta = (meta: Record<string, unknown> | null) => {
    if (!meta) return null;
    const parts: string[] = [];
    if (meta.algorithm) parts.push(`Algo: ${meta.algorithm}`);
    if (meta.originalSize) parts.push(`Size: ${Math.round((meta.originalSize as number) / 1024)}KB`);
    if (meta.encryptionTimeMs) parts.push(`${meta.encryptionTimeMs}ms`);
    if (meta.decryptionTimeMs) parts.push(`${meta.decryptionTimeMs}ms`);
    if (meta.keySize) parts.push(`RSA-${meta.keySize}`);
    return parts.length ? parts.join(" · ") : null;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Riwayat Aktivitas</h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          {pagination.total} total aktivitas tercatat
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : activities.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>Belum ada aktivitas</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden mb-6">
            <div style={{ borderColor: "var(--border)" }} className="divide-y">
              {activities.map((activity, idx) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 px-6 py-4 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                      ${activity.action.includes("ENCRYPT") || activity.action === "REGISTER" ? "bg-primary-900/50 text-primary-400" :
                        activity.action.includes("DECRYPT") || activity.action === "KEY_GENERATE" ? "bg-green-900/50 text-green-400" :
                        activity.action === "KEY_DELETE" ? "bg-red-900/50 text-red-400" :
                        ""}`}
                      style={
                        !activity.action.includes("ENCRYPT") &&
                        activity.action !== "REGISTER" &&
                        !activity.action.includes("DECRYPT") &&
                        activity.action !== "KEY_GENERATE" &&
                        activity.action !== "KEY_DELETE"
                          ? { backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }
                          : undefined
                      }
                    >
                      <svg className="w-4.5 h-4.5" style={{ width: "1.125rem", height: "1.125rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={actionIcons[activity.action] ?? actionIcons.LOGIN} />
                      </svg>
                    </div>
                    {idx < activities.length - 1 && (
                      <div className="w-px h-full mt-2 min-h-4" style={{ backgroundColor: "var(--border)" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${actionColors[activity.action] ?? "badge-gray"}`}>
                        {actionLabels[activity.action] ?? activity.action}
                      </span>
                      {activity.document && (
                        <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {activity.document.originalName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{activity.description}</p>
                    {formatMeta(activity.metadata) && (
                      <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>{formatMeta(activity.metadata)}</p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(activity.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short"
                      })}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(activity.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Halaman {page} dari {pagination.pages} · {pagination.total} aktivitas
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  ← Sebelumnya
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
