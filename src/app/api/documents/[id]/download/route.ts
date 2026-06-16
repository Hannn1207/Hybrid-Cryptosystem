import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!document || !document.encryptedData) {
    return NextResponse.json(
      { error: "Dokumen tidak ditemukan" },
      { status: 404 }
    );
  }

  // Build encrypted file bundle (JSON with all needed data)
  const bundle = {
    version: "1.0",
    algorithm: "AES-256-CBC+RSA-2048-OAEP",
    originalName: document.originalName,
    mimeType: document.mimeType,
    originalSize: document.originalSize,
    encryptedData: document.encryptedData,
    encryptedAesKey: document.encryptedAesKey,
    aesIv: document.aesIv,
    createdAt: document.createdAt,
  };

  const bundleJson = JSON.stringify(bundle, null, 2);
  const filename = `${document.originalName}.encrypted`;

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      documentId: document.id,
      action: ActivityType.DOWNLOAD,
      description: `File terenkripsi "${document.originalName}" diunduh`,
    },
  });

  return new NextResponse(bundleJson, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
