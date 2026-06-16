import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptFile, getDocumentType, isValidFileType } from "@/lib/crypto";
import { ActivityType } from "@prisma/client";

// Ensure this route runs in the Node.js runtime so Prisma works correctly
export const runtime = "nodejs";

export const maxDuration = 60;

/**
 * POST /api/documents/transfer
 * Enkripsi file menggunakan public key penerima (bukan public key pengirim)
 * Alur: File → AES-256-CBC → Ciphertext
 *       AES Key → RSA-2048-OAEP(recipientPublicKey) → EncryptedAESKey
 *       Simpan dengan recipientId agar hanya penerima bisa dekripsi
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const recipientId = formData.get("recipientId") as string | null;
    const keyId = formData.get("keyId") as string | null;

    if (!file || !recipientId || !keyId) {
      return NextResponse.json({ error: "File, penerima, dan key pair wajib diisi" }, { status: 400 });
    }

    // Validasi tipe file
    if (!isValidFileType(file.type)) {
      return NextResponse.json({ error: "Tipe file tidak didukung. Gunakan PDF, DOCX, DOC, atau TXT" }, { status: 400 });
    }

    // Validasi ukuran (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
    }

    // Ambil public key penerima
    const recipientKey = await prisma.rsaKeyPair.findFirst({
      where: { id: keyId, userId: recipientId, isActive: true },
    });

    if (!recipientKey) {
      return NextResponse.json({ error: "Key pair penerima tidak ditemukan" }, { status: 404 });
    }

    // Debug logging (sensible info only)
    console.debug(`[TRANSFER] user=${session.user.id} recipient=${recipientId} keyId=${keyId} fileName=${file.name} fileSize=${file.size}`);

    // Pastikan penerima ada
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Penerima tidak ditemukan" }, { status: 404 });
    }

    // Baca file sebagai base64
    const arrayBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(arrayBuffer).toString("base64");

    // Enkripsi dengan public key PENERIMA
    const startTime = Date.now();
    let result;
    try {
      result = encryptFile(fileBase64, recipientKey.publicKey);
    } catch (err) {
      console.error("[TRANSFER ERROR] encryptFile failed", err);
      const message = err instanceof Error ? err.message : "Enkripsi gagal";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const encryptionTime = Date.now() - startTime;

    // Simpan ke database, connect relations explicitly
    let document;
    try {
      const data: any = {
        userId: session.user.id, // pengirim
        originalName: file.name,
        originalSize: file.size,
        mimeType: file.type,
        fileType: getDocumentType(file.type) as any,
        encryptedData: result.encryptedData,
        encryptedAesKey: result.encryptedAesKey,
        aesIv: result.aesIv,
        status: "ENCRYPTED",
      };

      if (recipientId) {
        // Use foreign key fields directly to avoid nested connect validation issues
        data.recipientId = recipientId;
      }
      if (keyId) {
        data.rsaKeyPairId = keyId;
      }

      // DEBUG: Log a trimmed version of the data object to inspect runtime shape
      try {
        const safe = { ...data } as any;
        // avoid printing huge base64 payloads; replace them with a short marker
        if (safe.encryptedData && typeof safe.encryptedData === "string") {
          safe.encryptedData = `[base64:${safe.encryptedData.length}chars]`;
        }
        if (safe.encryptedAesKey && typeof safe.encryptedAesKey === "string") {
          safe.encryptedAesKey = `[base64:${safe.encryptedAesKey.length}chars]`;
        }
        console.debug("[TRANSFER DEBUG] prisma.create data:", JSON.stringify(safe));
      } catch (e) {
        console.debug("[TRANSFER DEBUG] failed to stringify data", e);
      }

      document = await prisma.document.create({ data });
    } catch (err: any) {
      // Log detailed Prisma error info for debugging (safe in dev only)
      try {
        const details = {
          name: err?.name,
          message: err?.message,
          code: err?.code,
          meta: err?.meta,
          stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined,
        };
        console.error("[TRANSFER ERROR] prisma.document.create failed", details);
      } catch (logErr) {
        console.error("[TRANSFER ERROR] prisma.document.create failed (failed logging details)", logErr, err);
      }

      const message = err instanceof Error ? err.message : "Gagal menyimpan dokumen";
      // Expose error details in development to help diagnosis
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json(
          { error: message, details: { name: err?.name, code: err?.code, meta: err?.meta, stack: err?.stack } },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Log aktivitas pengirim
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        documentId: document.id,
        action: ActivityType.TRANSFER,
        description: `File "${file.name}" dikirim ke ${recipient.email ?? recipient.name}`,
        metadata: {
          recipientId,
          recipientEmail: recipient.email,
          originalSize: file.size,
          encryptedSize: result.encryptedSize,
          algorithm: "AES-256-CBC + RSA-2048-OAEP",
          encryptionTimeMs: encryptionTime,
        },
      },
    });

    return NextResponse.json({
      message: `File berhasil dienkripsi dan dikirim ke ${recipient.email}`,
      document: {
        id: document.id,
        originalName: document.originalName,
        originalSize: document.originalSize,
        encryptedSize: result.encryptedSize,
        encryptionTimeMs: encryptionTime,
        recipient: {
          name: recipient.name,
          email: recipient.email,
        },
      },
    });
  } catch (error) {
    console.error("[TRANSFER ERROR]", error);
    const message = error instanceof Error ? error.message : "Gagal mengirim file";
    // Expose stack in development only
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: message, stack: (error as any)?.stack ?? null }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
