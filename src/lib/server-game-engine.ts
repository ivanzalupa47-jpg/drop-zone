import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { Prisma, Skin } from '@prisma/client';
import { serializeSkin } from '@/lib/serializers';
import { SkinItem } from '@/types';

/**
 * Cryptographically uniform float in [0, 1) using 48 bits of OS CSPRNG entropy.
 */
export function cryptoRandomUnit(): number {
  const bytes = crypto.randomBytes(6);
  const int48 =
    bytes[0] * 2 ** 40 +
    bytes[1] * 2 ** 32 +
    bytes[2] * 2 ** 24 +
    bytes[3] * 2 ** 16 +
    bytes[4] * 2 ** 8 +
    bytes[5];
  return int48 / 2 ** 48;
}

export function pickWeightedDbSkin(
  entries: Array<{ dropChance: number; skin: Skin }>
): Skin {
  if (entries.length === 0) {
    throw new Error('Case has no items configured');
  }

  const totalWeight = entries.reduce((sum, item) => sum + item.dropChance, 0);
  let cursor = cryptoRandomUnit() * totalWeight;

  for (const item of entries) {
    cursor -= item.dropChance;
    if (cursor <= 0) {
      return item.skin;
    }
  }

  return entries[entries.length - 1].skin;
}

export interface ServerCaseSpinResult {
  winnerSkin: Skin;
  floatValue: number;
  rollHash: string;
  reel: SkinItem[];
  winnerIndex: number;
}

export function generateServerCaseSpin(
  caseSlug: string,
  userId: string,
  entries: Array<{ dropChance: number; skin: Skin }>,
  reelLength = 48,
  winnerIndex = 37
): ServerCaseSpinResult {
  const serverSeed = crypto.randomBytes(16).toString('hex');
  const winnerSkin = pickWeightedDbSkin(entries);
  const floatValue = Number((0.005 + cryptoRandomUnit() * 0.14).toFixed(4));

  const hmac = crypto
    .createHmac('sha256', serverSeed)
    .update(`${caseSlug}:${userId}:${winnerSkin.slug}:${floatValue}`)
    .digest('hex')
    .slice(0, 24);

  const rollHash = `dz_sha256_${hmac}`;

  const reel: SkinItem[] = [];
  for (let i = 0; i < reelLength; i += 1) {
    if (i === winnerIndex) {
      reel.push(serializeSkin(winnerSkin));
    } else {
      reel.push(serializeSkin(pickWeightedDbSkin(entries)));
    }
  }

  return {
    winnerSkin,
    floatValue,
    rollHash,
    reel,
    winnerIndex,
  };
}

export function readIdempotencyKey(req: NextRequest): string | null {
  const raw = req.headers.get('idempotency-key')?.trim();
  if (!raw) return null;
  if (raw.length > 128) {
    return raw.slice(0, 128);
  }
  return raw;
}

export async function withIdempotency(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    key: string | null;
    action: string;
    execute: () => Promise<{
      statusCode: number;
      body: Record<string, unknown>;
    }>;
  }
): Promise<{
  statusCode: number;
  body: Record<string, unknown>;
  replayed: boolean;
}> {
  const { userId, key, action, execute } = params;

  if (key) {
    const existing = await tx.idempotencyRecord.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    if (existing) {
      return {
        statusCode: existing.statusCode,
        body: JSON.parse(existing.responseJson) as Record<string, unknown>,
        replayed: true,
      };
    }
  }

  const { statusCode, body } = await execute();

  if (key) {
    await tx.idempotencyRecord.create({
      data: {
        userId,
        key,
        action,
        statusCode,
        responseJson: JSON.stringify(body),
      },
    });
  }

  return { statusCode, body, replayed: false };
}
