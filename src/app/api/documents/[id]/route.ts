import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Ensure the document belongs to the current user
  const document = await prisma.document.findFirst({ where: { id, userId: session.user.id } });
  if (!document) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan atau Anda tidak berwenang" }, { status: 404 });
  }

  try {
    await prisma.document.delete({ where: { id: document.id } });

    // Log activity (reuse UPLOAD enum as closest available)
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          documentId: document.id,
          action: ActivityType.UPLOAD,
          description: `Dokumen \"${document.originalName}\" dihapus oleh pemilik`,
        },
      });
    } catch (e) {
      console.warn("Gagal membuat activity log untuk penghapusan", e);
    }

    return NextResponse.json({ message: "Dokumen berhasil dihapus" });
  } catch (err) {
    console.error("[DELETE DOCUMENT ERROR]", err);
    return NextResponse.json({ error: "Gagal menghapus dokumen" }, { status: 500 });
  }
}
