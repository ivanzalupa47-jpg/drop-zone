import { NextRequest, NextResponse } from 'next/server';
import { InventoryStatus } from '@prisma/client';
import { attachSessionCookie, getOrCreateDemoUser } from '@/lib/auth-session';
import { runDbTransaction } from '@/lib/prisma';
import {
  cryptoRandomUnit,
  readIdempotencyKey,
  withIdempotency,
} from '@/lib/server-game-engine';
import { serializeInventoryItem, serializeSkin } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

interface UpgradeRequestBody {
  instanceId?: unknown;
  targetSkinSlug?: unknown;
}

export async function POST(req: NextRequest) {
  let payload: UpgradeRequestBody;
  try {
    payload = (await req.json()) as UpgradeRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Некорректный формат JSON' },
      { status: 400 }
    );
  }

  const instanceId =
    typeof payload.instanceId === 'string' ? payload.instanceId.trim() : '';
  const targetSkinSlug =
    typeof payload.targetSkinSlug === 'string'
      ? payload.targetSkinSlug.trim()
      : '';

  if (
    !instanceId ||
    !targetSkinSlug ||
    instanceId.length > 64 ||
    targetSkinSlug.length > 96
  ) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYLOAD',
        message: 'Необходимо указать instanceId и targetSkinSlug',
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
      action: `UPGRADE:${instanceId}:${targetSkinSlug}`,
      execute: async () => {
        const sourceItem = await tx.inventoryItem.findFirst({
          where: {
            id: instanceId,
            userId: user.id,
            status: InventoryStatus.IN_INVENTORY,
          },
          include: { skin: true },
        });

        if (!sourceItem) {
          return {
            statusCode: 409,
            body: {
              error: 'SOURCE_ITEM_UNAVAILABLE',
              message: 'Исходный предмет не найден или уже использован',
            },
          };
        }

        const targetSkin = await tx.skin.findUnique({
          where: { slug: targetSkinSlug },
        });

        if (!targetSkin) {
          return {
            statusCode: 404,
            body: {
              error: 'TARGET_SKIN_NOT_FOUND',
              message: 'Целевой скин не найден в базе данных',
            },
          };
        }

        if (targetSkin.demoValue < sourceItem.skin.demoValue + 40) {
          return {
            statusCode: 400,
            body: {
              error: 'INVALID_TARGET_VALUE',
              message:
                'Целевой скин должен стоить минимум на 40 DZ дороже исходного',
            },
          };
        }

        const consumed = await tx.inventoryItem.updateMany({
          where: {
            id: sourceItem.id,
            userId: user.id,
            status: InventoryStatus.IN_INVENTORY,
          },
          data: {
            status: InventoryStatus.UPGRADED,
          },
        });

        if (consumed.count === 0) {
          return {
            statusCode: 409,
            body: {
              error: 'ALREADY_CONSUMED',
              message: 'Предмет уже использован в другом запросе',
            },
          };
        }

        const rawChance =
          (sourceItem.skin.demoValue / targetSkin.demoValue) * 92;
        const chancePercent = Number(
          Math.min(80, Math.max(5, rawChance)).toFixed(1)
        );
        const roll = Number((cryptoRandomUnit() * 100).toFixed(4));
        const succeeded = roll <= chancePercent;

        await tx.upgradeLog.create({
          data: {
            userId: user.id,
            sourceValue: sourceItem.skin.demoValue,
            targetValue: targetSkin.demoValue,
            chance: chancePercent,
            roll,
            succeeded,
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            upgradesTried: { increment: 1 },
          },
          select: {
            demoBalance: true,
            upgradesTried: true,
          },
        });

        let wonEntry = null;

        if (succeeded) {
          const floatValue = Number(
            (0.008 + cryptoRandomUnit() * 0.09).toFixed(4)
          );
          const created = await tx.inventoryItem.create({
            data: {
              userId: user.id,
              skinId: targetSkin.id,
              floatValue,
              status: InventoryStatus.IN_INVENTORY,
              source: 'UPGRADE',
              caseTitle: 'АПГРЕЙД',
            },
            include: { skin: true },
          });
          wonEntry = serializeInventoryItem(created);
        }

        return {
          statusCode: 200,
          body: {
            succeeded,
            chancePercent,
            roll,
            consumedInstanceId: sourceItem.id,
            targetSkin: serializeSkin(targetSkin),
            wonEntry,
            demoBalance: updatedUser.demoBalance,
            upgradesTried: updatedUser.upgradesTried,
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
