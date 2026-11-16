import { NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: APP_CONFIG.appName,
    demoMode: APP_CONFIG.demoMode,
    realPaymentsEnabled: false,
    databaseProvider: 'postgresql',
    orm: 'prisma',
    timestamp: new Date().toISOString(),
  });
}
