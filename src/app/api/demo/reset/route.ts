import { NextRequest, NextResponse } from 'next/server';
import { InventoryStatus } from '@prisma/client';
import { APP_CONFIG } from '@/lib/config';
import { attachSessionCookie, getOrCreateDemoUser } from '@/lib/auth-session';
import { runDbTransaction } from '@/lib/prisma';
import { readIdempotencyKey, withIdempotency } from '@/lib/server-game-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!APP_CONFIG.demoMode) {
    return NextResponse.json(
      { error: 'DEMO_MODE_DISABLED', message: 'Демо-режим отключён' },
      { status: 403 }
    );
  }

  const { user, cookieToSet } = await getOrCreateDemoUser(req);
  const idempotencyKey = readIdempotencyKey(req);

  const txResult = await runDbTransaction(async (tx) =>
    withIdempotency(tx, {
      userId: user.id,
      key: idempotencyKey,
      action: 'DEMO_RESET',
      execute: async () => {
        await tx.inventoryItem.updateMany({
          where: {
            userId: user.id,
            status: InventoryStatus.IN_INVENTORY,
          },
          data: {
            status: InventoryStatus.SOLD_DEMO,
          },
        });

        const resetUser = await tx.user.update({
          where: { id: user.id },
          data: {
            demoBalance: APP_CONFIG.initialDemoBalance,
            casesOpened: 0,
            upgradesTried: 0,
          },
          select: {
            demoBalance: true,
            casesOpened: true,
            upgradesTried: true,
          },
        });

        return {
          statusCode: 200,
          body: {
            demoBalance: resetUser.demoBalance,
            casesOpened: resetUser.casesOpened,
            upgradesTried: resetUser.upgradesTried,
            inventory: [],
          },
        };
      },
    })
  );

  const res = NextResponse.json(
    { ...txResult.body, replayed: txResult.replayed },
    { status: txResult.statusCode }
  );
  return attachSessionCookie(res, cookieToSet);
}
