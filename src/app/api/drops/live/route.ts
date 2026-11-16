import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { serializeLiveDrop } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prisma = getPrismaClient();

  const recentDrops = await prisma.dropLog.findMany({
    take: 12,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { username: true } },
      caseBox: { select: { title: true } },
      skin: true,
    },
  });

  return NextResponse.json({
    drops: recentDrops.map(serializeLiveDrop),
  });
}
