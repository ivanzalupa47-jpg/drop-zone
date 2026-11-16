import { NextRequest, NextResponse } from 'next/server';
import { InventoryStatus } from '@prisma/client';
import { attachSessionCookie, getOrCreateDemoUser } from '@/lib/auth-session';
import { runDbTransaction } from '@/lib/prisma';
import {
  generateServerCaseSpin,
  readIdempotencyKey,
  withIdempotency,
} from '@/lib/server-game-engine';
import { serializeInventoryItem, serializeLiveDrop } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    slug: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const slug = params.slug?.trim();
  if (!slug || slug.length > 64) {
    return NextResponse.json(
      { error: 'INVALID_CASE_SLUG', message: 'Некорректный идентификатор кейса' },
      { status: 400 }
    );
  }

  const { user, cookieToSet } = await getOrCreateDemoUser(req);
  const idempotencyKey = readIdempotencyKey(req);

  const txResult = await runDbTransaction(async (tx) =>
    withIdempotency(tx, {
      userId: user.id,
      key: idempotencyKey,
      action: `OPEN_CASE:${slug}`,
      execute: async () => {
        const dbCase = await tx.case.findUnique({
          where: { slug },
          include: {
            items: {
              include: { skin: true },
            },
          },
        });

        if (!dbCase || dbCase.items.length === 0) {
          return {
            statusCode: 404,
            body: {
              error: 'CASE_NOT_FOUND',
              message: 'Кейс не найден в базе данных',
            },
          };
        }

        const deducted = await tx.user.updateMany({
          where: {
            id: user.id,
            demoBalance: { gte: dbCase.demoPrice },
          },
          data: {
            demoBalance: { decrement: dbCase.demoPrice },
            casesOpened: { increment: 1 },
          },
        });

        if (deducted.count === 0) {
          const freshUser = await tx.user.findUnique({
            where: { id: user.id },
            select: { demoBalance: true },
          });
          return {
            statusCode: 400,
            body: {
              error: 'INSUFFICIENT_DEMO_BALANCE',
              message: 'Недостаточно демо-кредитов DZ на сервере',
              demoBalance: freshUser?.demoBalance ?? 0,
            },
          };
        }

        const spin = generateServerCaseSpin(slug, user.id, dbCase.items);

        const createdItem = await tx.inventoryItem.create({
          data: {
            userId: user.id,
            skinId: spin.winnerSkin.id,
            floatValue: spin.floatValue,
            status: InventoryStatus.IN_INVENTORY,
            source: 'CASE',
            caseTitle: dbCase.title,
          },
          include: { skin: true },
        });

        const dropLog = await tx.dropLog.create({
          data: {
            userId: user.id,
            caseId: dbCase.id,
            skinId: spin.winnerSkin.id,
            rollSeed: spin.rollHash,
          },
          include: {
            user: { select: { username: true } },
            caseBox: { select: { title: true } },
            skin: true,
          },
        });

        const updatedUser = await tx.user.findUniqueOrThrow({
          where: { id: user.id },
          select: {
            demoBalance: true,
            casesOpened: true,
          },
        });

        return {
          statusCode: 200,
          body: {
            demoBalance: updatedUser.demoBalance,
            casesOpened: updatedUser.casesOpened,
            entry: serializeInventoryItem(createdItem),
            rollHash: spin.rollHash,
            reel: spin.reel,
            winnerIndex: spin.winnerIndex,
            liveDrop: serializeLiveDrop(dropLog),
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
