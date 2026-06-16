import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailViaGmail, buildEmailBody } from "@/lib/gmail";
import { ActivityType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fitur kirim email hanya untuk user yang login via Google
  if (!session.googleAccessToken) {
    return NextResponse.json(
      {
        error:
          "Fitur kirim email hanya tersedia jika Anda login menggunakan akun Google. " +
          "Silakan logout dan login ulang dengan Google.",
        code: "GOOGLE_AUTH_REQUIRED",
      },
      { status: 403 }
    );
  }

  const { id } = await params;
  const { recipientEmail } = await req.json();

  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return NextResponse.json(
      { error: "Alamat email tujuan tidak valid" },
      { status: 400 }
    );
  }

  // Ambil dokumen milik user
  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!document || !document.encryptedData) {
    return NextResponse.json(
      { error: "Dokumen tidak ditemukan" },
      { status: 404 }
    );
  }

  // Bangun file bundle (sama seperti endpoint download)
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
  const bundleBase64 = Buffer.from(bundleJson).toString("base64");
  const attachmentFilename = `${document.originalName}.encrypted`;

  const senderName = session.user.name ?? session.user.email ?? "Pengguna";
  const senderEmail = session.user.email!;

  const bodyHtml = buildEmailBody({
    senderName,
    recipientEmail,
    fileName: attachmentFilename,
    originalSize: document.originalSize,
    algorithm: "AES-256-CBC + RSA-2048-OAEP",
    encryptedAt: new Date(document.createdAt).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  try {
    await sendEmailViaGmail({
      accessToken: session.googleAccessToken,
      from: senderEmail,
      to: recipientEmail,
      subject: `[HybridCrypto] Dokumen Terenkripsi: ${document.originalName}`,
      bodyHtml,
      attachment: {
        filename: attachmentFilename,
        content: bundleBase64,
        mimeType: "application/octet-stream",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengirim email";
    console.error("[SEND EMAIL ERROR]", err);

    // Cek apakah error karena token expired / scope kurang
    if (
      message.includes("invalid_grant") ||
      message.includes("Token has been expired") ||
      message.includes("Request had insufficient authentication scopes")
    ) {
      return NextResponse.json(
        {
          error:
            "Sesi Google Anda sudah kadaluarsa atau tidak memiliki izin Gmail. " +
            "Silakan logout dan login ulang dengan Google.",
          code: "GOOGLE_TOKEN_EXPIRED",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Log aktivitas
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      documentId: document.id,
      action: ActivityType.DOWNLOAD,
      description: `File terenkripsi "${document.originalName}" dikirim ke ${recipientEmail} via Gmail`,
      metadata: {
        recipientEmail,
        sentAt: new Date().toISOString(),
        via: "Gmail API",
      },
    },
  });

  return NextResponse.json({
    message: `Email berhasil dikirim ke ${recipientEmail}`,
  });
}
