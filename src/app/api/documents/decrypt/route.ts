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
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID wajib diisi" },
        { status: 400 }
      );
    }

    // Get document — pengirim ATAU penerima boleh dekripsi
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId: session.user.id },
          { recipientId: session.user.id },
        ],
      },
      include: { rsaKeyPair: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!document.encryptedData) {
      return NextResponse.json(
        { error: "Data enkripsi tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!document.rsaKeyPair) {
      return NextResponse.json(
        { error: "Key pair tidak ditemukan atau sudah dihapus" },
        { status: 404 }
      );
    }

    // Decrypt file
    const startTime = Date.now();
    const result = decryptFile(
      document.encryptedData,
      document.encryptedAesKey,
      document.aesIv,
      document.rsaKeyPair.privateKey
    );
    const decryptionTime = Date.now() - startTime;

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        documentId: document.id,
        action: ActivityType.DECRYPT,
        description: `File "${document.originalName}" berhasil didekripsi`,
        metadata: {
          originalSize: document.originalSize,
          algorithm: "AES-256-CBC + RSA-2048-OAEP",
          decryptionTimeMs: decryptionTime,
          isTransfer: document.recipientId === session.user.id,
        },
      },
    });

    return NextResponse.json({
      message: "File berhasil didekripsi",
      decryptedData: result.decryptedData,
      originalName: document.originalName,
      mimeType: document.mimeType,
      originalSize: result.originalSize,
      decryptionTimeMs: decryptionTime,
    });
  } catch (error) {
    console.error("[DECRYPT ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Gagal mendekripsi file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
