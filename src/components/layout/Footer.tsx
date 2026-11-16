import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-dz-border bg-[#070A10]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-black tracking-wider text-white">
                DROP <span className="text-amber-400">ZONE</span>
              </span>
              <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                DEMO_MODE={String(APP_CONFIG.demoMode)}
              </span>
            </div>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-400">
              Демонстрационная веб-платформа открытия кейсов и апгрейда скинов
              CS2. Все балансы ({APP_CONFIG.currencySymbol}) и предметы являются
              виртуальными и не имеют реальной денежной стоимости. Реальные
              платёжные операции отключены.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/" className="hover:text-amber-400">
              Каталог кейсов
            </Link>
            <Link href="/upgrade" className="hover:text-amber-400">
              Апгрейд скинов
            </Link>
            <Link href="/inventory" className="hover:text-amber-400">
              Демо-инвентарь
            </Link>
            <Link href="/api/health" className="hover:text-cyan-400">
              API Статус
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-dz-border/70 pt-6 text-[11px] text-slate-500 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>
              Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion ·
              Prisma PostgreSQL
            </span>
          </div>
          <span>© 2026 DROP ZONE (Demo Environment)</span>
        </div>
      </div>
    </footer>
  );
}
