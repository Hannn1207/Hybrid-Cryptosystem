import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRsaKeyPair } from "@/lib/crypto";
import { ActivityType } from "@prisma/client";

// GET - list all key pairs for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.rsaKeyPair.findMany({
    where: { userId: session.user.id, isActive: true },
    select: {
      id: true,
      label: true,
      publicKey: true,
      keySize: true,
      isActive: true,
      createdAt: true,
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

// POST - generate new RSA key pair
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { label } = await req.json();
    const { publicKey, privateKey, keySize } = generateRsaKeyPair(2048);

    const keyPair = await prisma.rsaKeyPair.create({
      data: {
        userId: session.user.id,
        label: label || "Key Pair Baru",
        publicKey,
        privateKey,
        keySize,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: ActivityType.KEY_GENERATE,
        description: `RSA-${keySize} key pair dibuat: "${keyPair.label}"`,
        metadata: { keyId: keyPair.id, keySize },
      },
    });

    return NextResponse.json({
      message: "Key pair berhasil dibuat",
      key: {
        id: keyPair.id,
        label: keyPair.label,
        publicKey: keyPair.publicKey,
        keySize: keyPair.keySize,
        createdAt: keyPair.createdAt,
      },
    });
  } catch (error) {
    console.error("[KEY GEN ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat key pair" },
      { status: 500 }
    );
  }
}
