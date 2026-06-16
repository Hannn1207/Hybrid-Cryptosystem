import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

// GET - get single key (with private key for decryption)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const key = await prisma.rsaKeyPair.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!key) {
    return NextResponse.json({ error: "Key tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ key });
}

// DELETE - soft delete key pair
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const key = await prisma.rsaKeyPair.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!key) {
    return NextResponse.json({ error: "Key tidak ditemukan" }, { status: 404 });
  }

  await prisma.rsaKeyPair.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: ActivityType.KEY_DELETE,
      description: `Key pair "${key.label}" dihapus`,
    },
  });

  return NextResponse.json({ message: "Key pair berhasil dihapus" });
}
