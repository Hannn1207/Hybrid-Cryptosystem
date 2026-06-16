"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { formatFileSize } from "@/lib/crypto";
import ConfirmModal from "@/components/ConfirmModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserResult {
  id: string;
  name: string | null;
  email: string | null;
  hasKeys: boolean;
  keyPairs: { id: string; label: string; keySize: number; publicKey: string }[];
}

interface TransferResult {
  id: string;
  originalName: string;
  originalSize: number;
  encryptedSize: number;
  encryptionTimeMs: number;
  recipient: { name: string | null; email: string | null };
}

interface InboxDocument {
  id: string;
  originalName: string;
  originalSize: number;
  mimeType: string;
  fileType: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
  rsaKeyPair: { id: string; label: string } | null;
}

interface DecryptResult {
  decryptedData: string;
  originalName: string;
  mimeType: string;
  originalSize: number;
  decryptionTimeMs: number;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
          done ? "bg-green-500 text-white" : active ? "bg-primary-600 text-white" : "text-sm font-medium"
        }`}
        style={
          !done && !active ? { backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" } : undefined
        }
      >
        {done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          n
        )}
      </div>
      <span className="text-sm font-medium" style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

// ── KIRIM Tab ─────────────────────────────────────────────────────────────────
function SendTab() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [recipient, setRecipient] = useState<UserResult | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step tracking
  const step = !recipient ? 1 : !file ? 2 : 3;

  // Search users
  const handleSearch = (q: string) => {
    setQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 3) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?email=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectRecipient = (user: UserResult) => {
    setRecipient(user);
    setSelectedKeyId(user.keyPairs[0]?.id ?? "");
    setResults([]);
    setQuery(user.email ?? "");
  };

  // Dropzone
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (rej) => {
      const err = rej[0]?.errors[0];
      if (err?.code === "file-too-large") toast.error("File terlalu besar. Maksimal 10MB");
      else toast.error("Tipe file tidak didukung");
    },
  });

  const handleSend = async () => {
    if (!file || !recipient || !selectedKeyId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("recipientId", recipient.id);
      fd.append("keyId", selectedKeyId);
      const res = await fetch("/api/documents/transfer", { method: "POST", body: fd, credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim");
      } else {
        setResult(data.document);
        toast.success("File berhasil dikirim!");
        setFile(null);
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const fileIcon = (name: string) => (name.endsWith(".pdf") ? "📄" : name.endsWith(".docx") || name.endsWith(".doc") ? "📝" : "📃");

  return (
    <div className="max-w-2xl">
      {/* Progress steps */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Step n={1} label="Pilih Penerima" active={step === 1} done={step > 1} />
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)", minWidth: 16 }} />
          <Step n={2} label="Upload File" active={step === 2} done={step > 2} />
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)", minWidth: 16 }} />
          <Step n={3} label="Enkripsi & Kirim" active={step === 3} done={!!result} />
        </div>
      </div>

      {/* ── Step 1: Cari Penerima ── */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Pilih Penerima
          </h2>
        </div>

        <div className="relative">
          <input
            type="email"
            className="input-field pr-10"
            placeholder="Cari email penerima (min. 3 karakter)..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {/* Dropdown hasil pencarian */}
          {results.length > 0 && (
            <div
              className="absolute top-full mt-1 left-0 right-0 rounded-xl shadow-xl z-10 overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectRecipient(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}
                  >
                    {(u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {u.name ?? "(Tanpa nama)"}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {u.email}
                    </p>
                  </div>
                  {u.hasKeys ? (
                    <span className="badge-green text-xs flex-shrink-0">{u.keyPairs.length} kunci</span>
                  ) : (
                    <span className="badge-red text-xs flex-shrink-0">Tidak ada kunci</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {query.length >= 3 && !searching && results.length === 0 && !recipient && (
            <div
              className="absolute top-full mt-1 left-0 right-0 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              Tidak ada pengguna ditemukan dengan email "{query}"
            </div>
          )}
        </div>

        {/* Penerima terpilih */}
        {recipient && (
          <div
            className="mt-4 rounded-xl p-4 animate-slide-up"
            style={{ backgroundColor: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}
              >
                {(recipient.name?.[0] ?? recipient.email?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  {recipient.name ?? "(Tanpa nama)"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {recipient.email}
                </p>

                {recipient.keyPairs.length > 1 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Pilih key pair penerima:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recipient.keyPairs.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => setSelectedKeyId(k.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            selectedKeyId === k.id ? "bg-primary-600 text-white border-primary-600" : ""
                          }`}
                          style={
                            selectedKeyId !== k.id
                              ? {
                                  backgroundColor: "var(--bg-elevated)",
                                  borderColor: "var(--border)",
                                  color: "var(--text-secondary)",
                                }
                              : undefined
                          }
                        >
                          {k.label} <span className="font-mono opacity-70">RSA-{k.keySize}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recipient.keyPairs.length === 1 && (
                  <p className="text-xs mt-2 font-mono" style={{ color: "var(--text-muted)" }}>
                    🔑 Menggunakan: {recipient.keyPairs[0].label} (RSA-{recipient.keyPairs[0].keySize})
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setRecipient(null);
                  setQuery("");
                  setSelectedKeyId("");
                }}
                className="text-xs px-2 py-1 rounded"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Step 2: Upload File ── */}
      <div className="card p-6 mb-4" style={{ opacity: !recipient ? 0.5 : 1 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Upload File
          </h2>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive ? "border-primary-500 bg-primary-500/5" : file ? "border-green-500 bg-green-500/5" : ""
          }`}
          style={!isDragActive && !file ? { borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" } : undefined}
        >
          <input {...getInputProps()} disabled={!recipient} />
          {file ? (
            <div>
              <div className="text-4xl mb-2">{fileIcon(file.name)}</div>
              <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                {file.name}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {formatFileSize(file.size)}
              </p>
              <p className="text-primary-500 text-xs mt-2">Klik untuk ganti file</p>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {!recipient ? "Pilih penerima dulu" : isDragActive ? "Lepas file..." : "Drag & drop atau klik untuk browse"}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                PDF, DOCX, DOC, TXT · Maks 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 3: Proses Enkripsi ── */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Enkripsi & Kirim
          </h2>
        </div>

        {/* Alur visual */}
        <div
          className="rounded-xl p-4 mb-4 font-mono text-xs space-y-1.5"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <p className="font-semibold text-xs mb-2" style={{ color: "var(--text-primary)" }}>
            Alur Hybrid Cryptosystem:
          </p>
          <p>
            ① Generate <span className="text-yellow-500">AES-256 Key</span> + IV (acak)
          </p>
          <p>
            ② File → <span className="text-yellow-500">AES-256-CBC</span>(Key, IV) → Ciphertext
          </p>
          <p>
            ③ AES Key → <span className="text-green-500">RSA-2048-OAEP</span>(Public Key Penerima) → Encrypted Key
          </p>
          <p>④ Simpan: Ciphertext + Encrypted Key + IV</p>
          <p className="pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            Hanya <span style={{ color: "var(--text-primary)" }}>{recipient?.name ?? recipient?.email ?? "penerima"}</span> yang bisa mendekripsi
            (private key mereka)
          </p>
        </div>

        <button onClick={handleSend} disabled={!file || !recipient || !selectedKeyId || loading} className="btn-primary w-full py-3">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mengenkripsi & Mengirim...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enkripsi & Kirim ke {recipient?.name ?? recipient?.email ?? "Penerima"}
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-6 animate-slide-up" style={{ borderColor: "#16a34a" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-green-400" style={{ backgroundColor: "rgba(22,163,74,0.15)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-500">Berhasil Dikirim!</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                File terenkripsi untuk {result.recipient.name ?? result.recipient.email}
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-4 font-mono text-xs space-y-1.5"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <p>
              File: <span style={{ color: "var(--text-primary)" }}>{result.originalName}</span>
            </p>
            <p>
              Ukuran asli: <span style={{ color: "var(--text-primary)" }}>{formatFileSize(result.originalSize)}</span>
            </p>
            <p>
              Ukuran terenkripsi: <span style={{ color: "var(--text-primary)" }}>{formatFileSize(result.encryptedSize)}</span>
            </p>
            <p>
              Waktu enkripsi: <span className="text-green-500">{result.encryptionTimeMs}ms</span>
            </p>
            <p>
              Penerima: <span className="text-primary-400">{result.recipient.email}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KOTAK MASUK Tab ───────────────────────────────────────────────────────────
function InboxTab() {
  const [docs, setDocs] = useState<InboxDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const requestDelete = (id: string) => setDeleteTarget(id);

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal menghapus dokumen");
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success(data?.message || "Dokumen dihapus");
    } catch (e) {
      toast.error("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    fetch("/api/documents/inbox")
      .then(async (r) => {
        // Pastikan response punya body dan valid JSON
        const text = await r.text();
        if (!text) {
          setLoading(false);
          return;
        }
        try {
          const d = JSON.parse(text);
          if (d.error) {
            toast.error(d.error);
          } else {
            setDocs(d.documents ?? []);
          }
        } catch {
          console.error("Invalid JSON from /api/documents/inbox");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Inbox fetch error:", err);
        toast.error("Gagal memuat kotak masuk");
        setLoading(false);
      });
  }, []);

  const handleDecrypt = async (doc: InboxDocument) => {
    if (!doc.rsaKeyPair) {
      toast.error("Key pair tidak ditemukan");
      return;
    }
    setDecrypting(doc.id);
    try {
      const res = await fetch("/api/documents/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data: DecryptResult = await res.json();
      if (!res.ok) {
        toast.error((data as any).error || "Dekripsi gagal");
        return;
      }

      // Download otomatis
      const binary = atob(data.decryptedData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.originalName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File berhasil didekripsi dan diunduh!");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setDecrypting(null);
    }
  };

  const fileIcon = (t: string) => (t === "PDF" ? "📄" : t === "DOCX" || t === "DOC" ? "📝" : "📃");

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <svg className="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );

  if (docs.length === 0)
    return (
      <div className="card p-16 text-center max-w-md mx-auto">
        <svg
          className="w-16 h-16 mx-auto mb-4 opacity-20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: "var(--text-muted)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
          Kotak masuk kosong
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Belum ada file terenkripsi yang dikirimkan kepada Anda
        </p>
      </div>
    );

  return (
    <div className="space-y-3 max-w-2xl">
      {docs.map((doc) => (
        <div key={doc.id} className="card p-5">
          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0 mt-0.5">{fileIcon(doc.fileType)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {doc.originalName}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="badge-blue">{doc.fileType}</span>
                <span className="badge-green">Terenkripsi</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatFileSize(doc.originalSize)}
                </span>
              </div>
              {/* Pengirim */}
              <div className="flex items-center gap-2 mt-2">
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "var(--text-muted)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Dari: <span className="font-medium">{doc.user.name ?? doc.user.email}</span>
                  {doc.user.email && doc.user.name && <span style={{ color: "var(--text-muted)" }}> ({doc.user.email})</span>}
                </p>
              </div>
              {doc.rsaKeyPair && (
                <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                  🔑 Key: {doc.rsaKeyPair.label}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {new Date(doc.createdAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {/* Tombol Dekripsi */}
            <div className="flex-shrink-0">
              {doc.rsaKeyPair ? (
                <button onClick={() => handleDecrypt(doc)} disabled={decrypting === doc.id} className="btn-primary text-xs px-4 py-2">
                  {decrypting === doc.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                      Dekripsi
                    </>
                  )}
                </button>
              ) : (
                <span className="badge-red text-xs">Key dihapus</span>
              )}
              <button onClick={() => requestDelete(doc.id)} className="text-xs px-3 py-1.5 rounded-lg border text-red-500 hover:bg-red-50">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-1-3H6L5 7" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 11v6m4-6v6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
      {/* Confirm modal for inbox deletions */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Dokumen"
        description="Yakin ingin menghapus dokumen ini dari kotak masuk? Aksi ini tidak dapat dikembalikan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && performDelete(deleteTarget)}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransferPage() {
  const [tab, setTab] = useState<"send" | "inbox">("send");

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Transfer Aman
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          Enkripsi file dengan public key penerima — hanya penerima yang bisa membuka dengan private key mereka
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {(
          [
            { key: "send", label: "📤 Kirim File" },
            { key: "inbox", label: "📥 Kotak Masuk" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={
              tab === t.key
                ? {
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid var(--border)",
                  }
                : {
                    color: "var(--text-muted)",
                  }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "send" && <SendTab />}
      {tab === "inbox" && <InboxTab />}
    </div>
  );
}
