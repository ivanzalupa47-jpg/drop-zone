import { NextRequest, NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config';
import { attachSessionCookie, getOrCreateDemoUser } from '@/lib/auth-session';
import { runDbTransaction } from '@/lib/prisma';
import { readIdempotencyKey, withIdempotency } from '@/lib/server-game-engine';

export const dynamic = 'force-dynamic';

const ALLOWED_DEMO_PACKS = new Set([1500, 2500, 10000]);
const MAX_DEMO_BALANCE = 250_000;

interface RefillBody {
  amount?: unknown;
}

export async function POST(req: NextRequest) {
  if (!APP_CONFIG.demoMode) {
    return NextResponse.json(
      { error: 'DEMO_MODE_DISABLED', message: 'Демо-режим отключён' },
      { status: 403 }
    );
  }

  let requestedAmount: number = APP_CONFIG.freeRefillAmount;
  try {
    const body = (await req.json()) as RefillBody;
    if (typeof body.amount === 'number') {
      requestedAmount = body.amount;
    }
  } catch {
    // empty body defaults to APP_CONFIG.freeRefillAmount (2500)
  }

  if (!ALLOWED_DEMO_PACKS.has(requestedAmount)) {
    return NextResponse.json(
      {
        error: 'INVALID_DEMO_PACK',
        message: 'Допустимы только стандартные демо-пакеты: 1500, 2500 или 10000 DZ',
      },
      { status: 400 }
    );
  }

  const { user, cookieToSet } = await getOrCreateDemoUser(req);
  const idempotencyKey = readIdempotencyKey(req);

  const txResult = await runDbTransaction(async (tx) =>
    withIdempotency(tx, {
      userId: user.id,
      key: idempotencyKey,
      action: `DEMO_REFILL:${requestedAmount}`,
      execute: async () => {
        const current = await tx.user.findUniqueOrThrow({
          where: { id: user.id },
          select: { demoBalance: true },
        });

        const nextBalance = Math.min(
          MAX_DEMO_BALANCE,
          current.demoBalance + requestedAmount
        );
        const added = nextBalance - current.demoBalance;

        const updated = await tx.user.update({
          where: { id: user.id },
          data: { demoBalance: nextBalance },
          select: { demoBalance: true },
        });

        return {
          statusCode: 200,
          body: {
            added,
            demoBalance: updated.demoBalance,
            maxBalanceReached: added === 0,
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
