import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/search?email=xxx
 * Cari user lain berdasarkan email (untuk pilih penerima)
 * Hanya mengembalikan id, name, email, dan apakah punya active key pair
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim();

  if (!email || email.length < 3) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      email: { contains: email, mode: "insensitive" },
      id: { not: session.user.id }, // jangan tampilkan diri sendiri
    },
    select: {
      id: true,
      name: true,
      email: true,
      rsaKeyPairs: {
        where: { isActive: true },
        select: { id: true, label: true, publicKey: true, keySize: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    take: 10,
  });

  // Hanya tampilkan user yang punya active key pair
  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    hasKeys: u.rsaKeyPairs.length > 0,
    keyPairs: u.rsaKeyPairs.map((k) => ({
      id: k.id,
      label: k.label,
      keySize: k.keySize,
      publicKey: k.publicKey,
    })),
  }));

  return NextResponse.json({ users: result });
}
