"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { formatFileSize } from "@/lib/crypto";

interface KeyPair {
  id: string;
  label: string;
  keySize: number;
  createdAt: string;
}

interface EncryptResult {
  id: string;
  originalName: string;
  originalSize: number;
  encryptedSize: number;
  encryptionTimeMs: number;
}

export default function EncryptPage() {
  const [keys, setKeys] = useState<KeyPair[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EncryptResult | null>(null);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => r.json())
      .then((d) => {
        setKeys(d.keys ?? []);
        if (d.keys?.length > 0) setSelectedKey(d.keys[0].id);
      });
  }, []);

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
      else if (err?.code === "file-invalid-type") toast.error("Tipe file tidak didukung");
      else toast.error("File ditolak");
    },
  });

  const handleEncrypt = async () => {
    if (!file || !selectedKey) {
      toast.error("Pilih file dan key pair terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("keyId", selectedKey);

      const res = await fetch("/api/documents/encrypt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Enkripsi gagal");
      } else {
        setResult(data.document);
        toast.success("File berhasil dienkripsi!");
        setFile(null);
      }
    } catch {
      toast.error("Terjadi kesalahan saat enkripsi");
    } finally {
      setLoading(false);
    }
  };

  const fileIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "📄";
    if (name.endsWith(".docx") || name.endsWith(".doc")) return "📝";
    return "📃";
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Enkripsi Dokumen</h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          Upload file PDF/Word, pilih RSA key pair, dan enkripsi dengan AES-256-CBC
        </p>
      </div>

      {/* Step 1 — Select Key */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Pilih RSA Key Pair</h2>
        </div>

        {keys.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 text-sm text-yellow-300">
            <p className="font-medium mb-1">Belum ada key pair</p>
            <p>Buat RSA key pair terlebih dahulu di menu{" "}
              <a href="/dashboard/keys" className="underline">Kelola Kunci</a>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {keys.map((key) => (
              <button
                key={key.id}
                onClick={() => setSelectedKey(key.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedKey === key.id
                    ? "border-primary-600 bg-primary-900/20"
                    : "hover:border-dark-600"
                }`}
                style={selectedKey !== key.id ? {
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-elevated)",
                } : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{key.label}</p>
                    <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>RSA-{key.keySize}</p>
                  </div>
                  {selectedKey === key.id && (
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {new Date(key.createdAt).toLocaleDateString("id-ID")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 — Upload File */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Upload File</h2>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-primary-500 bg-primary-900/20"
              : file
              ? "border-green-600 bg-green-900/10"
              : ""
          }`}
          style={(!isDragActive && !file) ? {
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-elevated)",
          } : undefined}
        >
          <input {...getInputProps()} />
          {file ? (
            <div>
              <div className="text-4xl mb-3">{fileIcon(file.name)}</div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>{file.name}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{formatFileSize(file.size)}</p>
              <p className="text-primary-400 text-xs mt-3">Klik atau drag untuk ganti file</p>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                {isDragActive ? "Lepas file di sini..." : "Drag & drop file, atau klik untuk browse"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>PDF, DOCX, DOC, TXT · Maksimal 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 3 — Encrypt */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Enkripsi</h2>
        </div>

        <div
          className="rounded-xl p-4 mb-4 font-mono text-xs space-y-1"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <p>Algoritma: <span className="text-primary-400">AES-256-CBC</span> + <span className="text-green-400">RSA-2048-OAEP</span></p>
          <p>Langkah: File → AES-256(random key) → Ciphertext</p>
          <p>          AES Key → RSA-2048(public key) → Encrypted Key</p>
          <p>Padding RSA: <span style={{ color: "var(--text-primary)" }}>OAEP-SHA256</span></p>
        </div>

        <button
          onClick={handleEncrypt}
          disabled={!file || !selectedKey || loading || keys.length === 0}
          className="btn-primary w-full py-3"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mengenkripsi...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Enkripsi File
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-6 border-green-700 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-900/50 text-green-400 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-green-400">Enkripsi Berhasil!</h3>
          </div>
          <div
            className="rounded-xl p-4 font-mono text-xs space-y-2 mb-4"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <p>File: <span style={{ color: "var(--text-primary)" }}>{result.originalName}</span></p>
            <p>Ukuran asli: <span style={{ color: "var(--text-primary)" }}>{formatFileSize(result.originalSize)}</span></p>
            <p>Ukuran terenkripsi: <span style={{ color: "var(--text-primary)" }}>{formatFileSize(result.encryptedSize)}</span></p>
            <p>Waktu enkripsi: <span className="text-green-400">{result.encryptionTimeMs}ms</span></p>
          </div>
          <a
            href={`/api/documents/${result.id}/download`}
            className="btn-secondary w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download File Terenkripsi
          </a>
        </div>
      )}
    </div>
  );
}
