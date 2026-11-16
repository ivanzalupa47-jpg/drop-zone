import { NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  let databaseConnected = false;
  let casesCount = 0;

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    casesCount = await prisma.case.count();
    databaseConnected = true;
  } catch (err) {
    console.error(
      '[health] PostgreSQL check failed:',
      err instanceof Error ? err.message : err
    );
  }

  return NextResponse.json(
    {
      status: databaseConnected ? 'ok' : 'degraded',
      app: APP_CONFIG.appName,
      demoMode: APP_CONFIG.demoMode,
      realPaymentsEnabled: false,
      databaseProvider: 'postgresql',
      databaseConnected,
      casesCount,
      orm: 'prisma',
      timestamp: new Date().toISOString(),
    },
    { status: databaseConnected ? 200 : 503 }
  );
}
