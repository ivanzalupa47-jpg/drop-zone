import React from 'react';
import { Cpu, Lock, Sparkles } from 'lucide-react';
import { getCasesCatalog } from '@/lib/repositories/case-repository';
import { HeroBanner } from '@/components/cases/HeroBanner';
import { CaseCatalog } from '@/components/cases/CaseCatalog';

export default async function HomePage() {
  const cases = await getCasesCatalog();
  const featuredCase =
    cases.find((c) => c.slug === 'dragon-vault') ?? cases[0];

  return (
    <div>
      <HeroBanner featuredCase={featuredCase} />
      <CaseCatalog cases={cases} />

      {/* Platform Architecture & Demo Highlights */}
      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-dz-border bg-dz-card/70 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-extrabold text-white">
            Безопасный DEMO_MODE=true
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Никаких реальных платежей и пополнений. Баланс исчисляется в
            виртуальных кредитах DZ с мгновенным бесплатным пополнением в один
            клик.
          </p>
        </div>

        <div className="rounded-2xl border border-dz-border bg-dz-card/70 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-extrabold text-white">
            Прозрачные шансы и Float
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Каждый кейс отображает точные вероятности выпадения предметов CS2 по
            редкости — от Армейского качества до Особых ножей и перчаток.
          </p>
        </div>

        <div className="rounded-2xl border border-dz-border bg-dz-card/70 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-extrabold text-white">
            Готовая архитектура PostgreSQL + Prisma
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Слой репозиториев автоматически работает с локальным демо-каталогом
            при DEMO_MODE=true и готов к подключению PostgreSQL через Prisma ORM.
          </p>
        </div>
      </section>
    </div>
  );
}
