import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { APP_CONFIG } from '@/lib/config';
import { getPrismaClient, runDbTransaction } from '@/lib/prisma';

export const DEMO_SESSION_COOKIE = 'dz_demo_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    'dropzone-demo-fallback-hmac-secret-do-not-use-real-money'
  );
}

const HEX_64_RE = /^[0-9a-f]{64}$/;

function signRawTokenBytes(rawToken: string): Buffer {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(rawToken)
    .digest();
}

function hashRawToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function createSignedCookieValue(): {
  cookieValue: string;
  tokenHash: string;
} {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const sig = signRawTokenBytes(rawToken).toString('hex');
  return {
    cookieValue: `${rawToken}.${sig}`,
    tokenHash: hashRawToken(rawToken),
  };
}

function verifySignedCookieValue(cookieValue: string): string | null {
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [rawToken, providedSig] = parts;
  if (!HEX_64_RE.test(rawToken) || !HEX_64_RE.test(providedSig)) return null;

  const providedBytes = Buffer.from(providedSig, 'hex');
  const expectedBytes = signRawTokenBytes(rawToken);
  if (providedBytes.length !== expectedBytes.length) return null;
  if (!crypto.timingSafeEqual(providedBytes, expectedBytes)) return null;

  return hashRawToken(rawToken);
}

function isHttpsRequest(req: NextRequest): boolean {
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim() === 'https';
  }
  return req.nextUrl.protocol === 'https:';
}

export interface ResolvedDemoAuth {
  user: User;
  cookieToSet: { value: string; isHttps: boolean } | null;
}

export async function getOrCreateDemoUser(
  req: NextRequest
): Promise<ResolvedDemoAuth> {
  const prisma = getPrismaClient();
  const rawCookie = req.cookies.get(DEMO_SESSION_COOKIE)?.value;

  if (rawCookie) {
    const tokenHash = verifySignedCookieValue(rawCookie);
    if (tokenHash) {
      const existingSession = await prisma.demoSession.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (existingSession && existingSession.expiresAt > new Date()) {
        return {
          user: existingSession.user,
          cookieToSet: null,
        };
      }
    }
  }

  const { cookieValue, tokenHash } = createSignedCookieValue();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const createdUser = await runDbTransaction(async (tx) => {
    let username = `Operator_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const conflict = await tx.user.findUnique({ where: { username } });
    if (conflict) {
      username = `Operator_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    const user = await tx.user.create({
      data: {
        username,
        demoBalance: APP_CONFIG.initialDemoBalance, // strictly 5000 DZ on server
        casesOpened: 0,
        upgradesTried: 0,
      },
    });

    await tx.demoSession.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return user;
  });

  return {
    user: createdUser,
    cookieToSet: {
      value: cookieValue,
      isHttps: isHttpsRequest(req),
    },
  };
}

export function attachSessionCookie<T>(
  res: NextResponse<T>,
  cookieToSet: ResolvedDemoAuth['cookieToSet']
): NextResponse<T> {
  if (!cookieToSet) return res;

  if (cookieToSet.isHttps) {
    res.cookies.set({
      name: DEMO_SESSION_COOKIE,
      value: cookieToSet.value,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
  } else {
    res.cookies.set({
      name: DEMO_SESSION_COOKIE,
      value: cookieToSet.value,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
  }

  return res;
}
