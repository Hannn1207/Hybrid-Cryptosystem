import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptFile } from "@/lib/crypto";
import { ActivityType } from "@prisma/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    let encryptedData = form.get("encryptedData") as string | null;
    let encryptedAesKey = form.get("encryptedAesKey") as string | null;
    let aesIv = form.get("aesIv") as string | null;
    let originalName = (form.get("originalName") as string) ?? "uploaded.dat";
    let mimeType = (form.get("mimeType") as string) ?? "application/octet-stream";

    // If client uploaded a file (e.g. formatif.pdf.encrypted), read its content
    const uploadedFile = form.get("file") as any;
    if (!encryptedData && uploadedFile) {
      try {
        const txt = await uploadedFile.text();
        encryptedData = txt;
        // derive originalName/mimeType from filename if possible
        const fname = uploadedFile.name ?? originalName;
        if (fname && fname.endsWith(".encrypted")) {
          originalName = fname.replace(/\.encrypted$/i, "");
          const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
          const mimeMap: Record<string, string> = {
            pdf: "application/pdf",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            doc: "application/msword",
            txt: "text/plain",
          };
          mimeType = mimeMap[ext] ?? mimeType;
        } else if (uploadedFile.type) {
          mimeType = uploadedFile.type;
        }
      } catch (e) {
        console.error("[DECRYPT UPLOAD] failed to read uploaded file", e);
      }
    }

    if (!encryptedData || !encryptedAesKey || !aesIv) {
      return NextResponse.json({ error: "encryptedData, encryptedAesKey, aesIv wajib diisi" }, { status: 400 });
    }

    // Find an active RSA key pair for this user
    const keyPair = await prisma.rsaKeyPair.findFirst({ where: { userId: session.user.id, isActive: true } });
    if (!keyPair) {
      return NextResponse.json({ error: "Tidak ditemukan key pair aktif untuk user ini" }, { status: 404 });
    }

    // Decrypt
    const startTime = Date.now();
    let result;
    try {
      result = decryptFile(encryptedData, encryptedAesKey, aesIv, keyPair.privateKey);
    } catch (err) {
      console.error("[DECRYPT UPLOAD ERROR] decryptFile failed", err);
      return NextResponse.json({ error: "Gagal mendekripsi payload" }, { status: 500 });
    }
    const decryptionTime = Date.now() - startTime;

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: ActivityType.DECRYPT,
          description: `File upload "${originalName}" berhasil didekripsi`,
          metadata: { originalName, mimeType, decryptionTimeMs: decryptionTime },
        },
      });
    } catch (logErr) {
      console.error("[DECRYPT UPLOAD ERROR] failed to log activity", logErr);
    }

    return NextResponse.json({
      message: "File berhasil didekripsi",
      decryptedData: result.decryptedData,
      originalName: originalName,
      mimeType,
      originalSize: result.originalSize,
      decryptionTimeMs: decryptionTime,
    });
  } catch (error) {
    console.error("[DECRYPT UPLOAD ERROR]", error);
    const message = error instanceof Error ? error.message : "Gagal mendekripsi upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
