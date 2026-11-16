import { NextRequest, NextResponse } from 'next/server';
import { InventoryStatus } from '@prisma/client';
import { attachSessionCookie, getOrCreateDemoUser } from '@/lib/auth-session';
import { runDbTransaction } from '@/lib/prisma';
import { readIdempotencyKey, withIdempotency } from '@/lib/server-game-engine';

export const dynamic = 'force-dynamic';

interface SellRequestBody {
  instanceId?: unknown;
  sellAll?: unknown;
}

export async function POST(req: NextRequest) {
  let payload: SellRequestBody;
  try {
    payload = (await req.json()) as SellRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Некорректный формат JSON' },
      { status: 400 }
    );
  }

  const sellAll = payload.sellAll === true;
  const instanceId =
    typeof payload.instanceId === 'string' ? payload.instanceId.trim() : '';

  if (!sellAll && (!instanceId || instanceId.length > 64)) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYLOAD',
        message: 'Укажите instanceId предмета или флаг sellAll: true',
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
      action: sellAll ? 'SELL_ALL' : `SELL_ITEM:${instanceId}`,
      execute: async () => {
        if (sellAll) {
          const activeItems = await tx.inventoryItem.findMany({
            where: {
              userId: user.id,
              status: InventoryStatus.IN_INVENTORY,
            },
            include: { skin: { select: { demoValue: true } } },
          });

          if (activeItems.length === 0) {
            const currentUser = await tx.user.findUniqueOrThrow({
              where: { id: user.id },
              select: { demoBalance: true },
            });
            return {
              statusCode: 200,
              body: {
                soldCount: 0,
                creditedAmount: 0,
                soldIds: [] as string[],
                demoBalance: currentUser.demoBalance,
              },
            };
          }

          const ids = activeItems.map((i) => i.id);
          const marked = await tx.inventoryItem.updateMany({
            where: {
              id: { in: ids },
              userId: user.id,
              status: InventoryStatus.IN_INVENTORY,
            },
            data: {
              status: InventoryStatus.SOLD_DEMO,
            },
          });

          if (marked.count === 0) {
            return {
              statusCode: 409,
              body: {
                error: 'ALREADY_SOLD',
                message: 'Предметы уже были проданы',
              },
            };
          }

          const totalCredit = activeItems.reduce(
            (sum, item) => sum + item.skin.demoValue,
            0
          );

          const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: {
              demoBalance: { increment: totalCredit },
            },
            select: { demoBalance: true },
          });

          return {
            statusCode: 200,
            body: {
              soldCount: marked.count,
              creditedAmount: totalCredit,
              soldIds: ids,
              demoBalance: updatedUser.demoBalance,
            },
          };
        }

        const item = await tx.inventoryItem.findFirst({
          where: {
            id: instanceId,
            userId: user.id,
            status: InventoryStatus.IN_INVENTORY,
          },
          include: { skin: { select: { demoValue: true } } },
        });

        if (!item) {
          return {
            statusCode: 409,
            body: {
              error: 'ITEM_NOT_AVAILABLE',
              message: 'Предмет не найден в инвентаре или уже продан',
            },
          };
        }

        const marked = await tx.inventoryItem.updateMany({
          where: {
            id: item.id,
            userId: user.id,
            status: InventoryStatus.IN_INVENTORY,
          },
          data: {
            status: InventoryStatus.SOLD_DEMO,
          },
        });

        if (marked.count === 0) {
          return {
            statusCode: 409,
            body: {
              error: 'ITEM_ALREADY_SOLD',
              message: 'Предмет уже обработан другим запросом',
            },
          };
        }

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            demoBalance: { increment: item.skin.demoValue },
          },
          select: { demoBalance: true },
        });

        return {
          statusCode: 200,
          body: {
            soldCount: 1,
            creditedAmount: item.skin.demoValue,
            soldIds: [item.id],
            demoBalance: updatedUser.demoBalance,
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
