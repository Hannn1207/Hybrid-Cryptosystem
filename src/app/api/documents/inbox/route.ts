import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/documents/inbox
 * Ambil semua dokumen yang dikirimkan KEPADA user yang sedang login
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { recipientId: session.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        rsaKeyPair: { select: { id: true, label: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = documents.map(({ encryptedData: _enc, ...doc }) => doc);

    return NextResponse.json({ documents: sanitized });
  } catch (error) {
    console.error("[INBOX ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memuat kotak masuk", documents: [] },
      { status: 500 }
    );
  }
}
