import { NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config';
import { getCasesCatalog } from '@/lib/repositories/case-repository';

export async function GET() {
  const cases = await getCasesCatalog();
  return NextResponse.json({
    demoMode: APP_CONFIG.demoMode,
    count: cases.length,
    cases,
  });
}
