import { NextRequest, NextResponse } from 'next/server';
import { InventoryStatus } from '@prisma/client';
import { APP_CONFIG } from '@/lib/config';
import { attachSessionCookie, getOrCreateDemoUser } from '@/lib/auth-session';
import { getPrismaClient } from '@/lib/prisma';
import { serializeInventoryItem, serializeLiveDrop } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, cookieToSet } = await getOrCreateDemoUser(req);
  const prisma = getPrismaClient();

  const inventoryRows = await prisma.inventoryItem.findMany({
    where: {
      userId: user.id,
      status: InventoryStatus.IN_INVENTORY,
    },
    include: { skin: true },
    orderBy: { obtainedAt: 'desc' },
  });

  const recentDrops = await prisma.dropLog.findMany({
    take: 12,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { username: true } },
      caseBox: { select: { title: true } },
      skin: true,
    },
  });

  const response = NextResponse.json({
    demoMode: APP_CONFIG.demoMode,
    user: {
      id: user.id,
      username: user.username,
      demoBalance: user.demoBalance,
      casesOpened: user.casesOpened,
      upgradesTried: user.upgradesTried,
    },
    inventory: inventoryRows.map(serializeInventoryItem),
    liveDrops: recentDrops.map(serializeLiveDrop),
  });

  return attachSessionCookie(response, cookieToSet);
}
