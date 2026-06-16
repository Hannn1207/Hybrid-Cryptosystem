import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptFile, getDocumentType, isValidFileType } from "@/lib/crypto";
import { ActivityType } from "@prisma/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const keyId = formData.get("keyId") as string | null;

    if (!file || !keyId) {
      return NextResponse.json(
        { error: "File dan Key ID wajib diisi" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan PDF, DOCX, DOC, atau TXT" },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10MB" },
        { status: 400 }
      );
    }

    // Get RSA key pair
    const keyPair = await prisma.rsaKeyPair.findFirst({
      where: { id: keyId, userId: session.user.id, isActive: true },
    });

    if (!keyPair) {
      return NextResponse.json(
        { error: "Key pair tidak ditemukan" },
        { status: 404 }
      );
    }

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileBase64 = buffer.toString("base64");

    // Encrypt file
    const startTime = Date.now();
    const result = encryptFile(fileBase64, keyPair.publicKey);
    const encryptionTime = Date.now() - startTime;

    // Save to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        rsaKeyPairId: keyId,
        originalName: file.name,
        originalSize: file.size,
        mimeType: file.type,
        fileType: getDocumentType(file.type) as any,
        encryptedData: result.encryptedData,
        encryptedAesKey: result.encryptedAesKey,
        aesIv: result.aesIv,
        status: "ENCRYPTED",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        documentId: document.id,
        action: ActivityType.ENCRYPT,
        description: `File "${file.name}" berhasil dienkripsi`,
        metadata: {
          originalSize: file.size,
          encryptedSize: result.encryptedSize,
          algorithm: "AES-256-CBC + RSA-2048-OAEP",
          encryptionTimeMs: encryptionTime,
          keyId,
        },
      },
    });

    return NextResponse.json({
      message: "File berhasil dienkripsi",
      document: {
        id: document.id,
        originalName: document.originalName,
        originalSize: document.originalSize,
        encryptedSize: result.encryptedSize,
        encryptionTimeMs: encryptionTime,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("[ENCRYPT ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengenkripsi file" },
      { status: 500 }
    );
  }
}
