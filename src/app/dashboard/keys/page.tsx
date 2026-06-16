"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

interface KeyPair {
  id: string;
  label: string;
  publicKey: string;
  keySize: number;
  isActive: boolean;
  createdAt: string;
  _count: { documents: number };
}

export default function KeysPage() {
  const [keys, setKeys] = useState<KeyPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewKey, setViewKey] = useState<KeyPair | null>(null);

  const fetchKeys = async () => {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerate = async () => {
    if (!newLabel.trim()) {
      toast.error("Masukkan nama key pair");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat key pair");
      } else {
        toast.success("RSA-2048 key pair berhasil dibuat!");
        setNewLabel("");
        setShowCreateForm(false);
        fetchKeys();
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setGenerating(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const requestDelete = (id: string, label: string) => setDeleteTarget({ id, label });

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Key pair dihapus");
        fetchKeys();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Gagal menghapus key pair");
      }
    } catch {
      toast.error("Gagal menghapus key pair");
    } finally {
      setDeleteTarget(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard`);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Kelola RSA Key Pair
          </h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Generate dan kelola RSA-2048 key pair untuk enkripsi
          </p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Key Pair Baru
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card p-6 mb-6 border-primary-800 animate-slide-up">
          <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Generate RSA-2048 Key Pair
          </h2>
          <div
            className="rounded-xl p-4 mb-4 font-mono text-xs space-y-1"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <p>
              Algoritma: <span className="text-primary-400">RSA-2048</span>
            </p>
            <p>
              Public Exponent: <span style={{ color: "var(--text-primary)" }}>65537 (0x10001)</span>
            </p>
            <p>
              Padding: <span style={{ color: "var(--text-primary)" }}>OAEP-SHA256</span>
            </p>
            <p>
              Kegunaan: <span style={{ color: "var(--text-primary)" }}>Enkripsi kunci AES-256</span>
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Nama key pair (cth: Kunci Skripsi)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button onClick={handleGenerate} disabled={generating} className="btn-primary px-6">
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Key List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : keys.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <p className="font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Belum ada key pair
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Buat RSA key pair pertama Anda untuk mulai mengenkripsi dokumen
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <div key={key.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-yellow-900/50 text-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {key.label}
                      </h3>
                      <span className="badge-yellow font-mono">RSA-{key.keySize}</span>
                      <span className="badge-gray">{key._count.documents} dokumen</span>
                    </div>
                    <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                      Dibuat: {new Date(key.createdAt).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs mt-1 font-mono truncate" style={{ color: "var(--text-muted)" }}>
                      ID: {key.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setViewKey(viewKey?.id === key.id ? null : key)} className="btn-secondary text-xs px-3 py-1.5">
                    {viewKey?.id === key.id ? "Tutup" : "Lihat Public Key"}
                  </button>
                  <button onClick={() => requestDelete(key.id, key.label)} className="btn-danger text-xs px-3 py-1.5">
                    Hapus
                  </button>
                </div>
              </div>

              {/* Public Key Viewer */}
              {viewKey?.id === key.id && (
                <div className="mt-4 animate-slide-up">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Public Key (PEM)
                    </p>
                    <button
                      onClick={() => copyToClipboard(key.publicKey, "Public key")}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Salin
                    </button>
                  </div>
                  <pre
                    className="rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {key.publicKey}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Confirm modal for key deletion */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Key Pair"
        description={
          deleteTarget ? `Hapus key pair "${deleteTarget.label}"? Dokumen yang menggunakan key ini tidak bisa didekripsi lagi.` : undefined
        }
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && performDelete(deleteTarget.id)}
      />
    </div>
  );
}
