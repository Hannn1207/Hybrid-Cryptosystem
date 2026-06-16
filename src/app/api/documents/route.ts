import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    include: {
      rsaKeyPair: { select: { id: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Strip encrypted data from list response (too large)
  const sanitized = documents.map(({ encryptedData: _enc, ...doc }) => doc);

  return NextResponse.json({ documents: sanitized });
}
