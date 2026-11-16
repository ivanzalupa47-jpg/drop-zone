'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Layers, Shield, Zap } from 'lucide-react';
import { useDemoState } from '@/context/DemoStateContext';
import { formatDZ } from '@/lib/config';
import { CaseBox } from '@/types';
import { SkinArtwork } from '@/components/ui/SkinArtwork';

interface HeroBannerProps {
  featuredCase: CaseBox;
}

export function HeroBanner({ featuredCase }: HeroBannerProps) {
  const { casesOpened, inventory, refillDemoCredits } = useDemoState();
  const [bonusClaimed, setBonusClaimed] = useState(false);

  const topSkin =
    featuredCase.items[featuredCase.items.length - 1]?.skin ??
    featuredCase.items[0].skin;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-dz-border bg-gradient-to-br from-[#0F1729] via-[#0B101B] to-[#131122] p-6 sm:p-10">
      {/* Background Glow & Grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-50" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12">
        {/* Left Copy */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Shield className="h-3.5 w-3.5" />
            Тактическая CS2 Демо-Арена · Без реальных платежей
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            ДОБРО ПОЖАЛОВАТЬ В{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              DROP ZONE
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Испытай механику открытия кейсов CS2, живую ленту дропов и систему
            апгрейда скинов в безопасном режиме{' '}
            <span className="font-semibold text-amber-300">DEMO_MODE=true</span>.
            Открывай легендарные коллекции и собирай редкий демо-инвентарь.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/cases/${featuredCase.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-slate-950 shadow-glow-amber transition hover:brightness-110"
            >
              Открыть «{featuredCase.title}»
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              disabled={bonusClaimed}
              onClick={() => {
                refillDemoCredits(1500);
                setBonusClaimed(true);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-bold transition ${
                bonusClaimed
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 cursor-default'
                  : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
              }`}
            >
              <Gift className="h-4 w-4" />
              {bonusClaimed
                ? 'Демо-бонус +1 500 DZ получен'
                : 'Забрать демо-бонус +1 500 DZ'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-lg">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Открыто вами
              </div>
              <p className="mt-0.5 text-lg font-extrabold text-white">
                {casesOpened}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                В инвентаре
              </div>
              <p className="mt-0.5 text-lg font-extrabold text-white">
                {inventory.length}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
              <div className="text-[11px] text-slate-400">Режим</div>
              <p className="mt-0.5 text-sm font-extrabold text-emerald-400">
                100% DEMO
              </p>
            </div>
          </div>
        </div>

        {/* Right Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-5"
        >
          <Link
            href={`/cases/${featuredCase.slug}`}
            className="group relative block overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-b from-amber-500/10 via-dz-card to-dz-surface p-6 transition hover:border-amber-400/70"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-amber-400 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-950">
                ГЛАВНЫЙ ДРОП СЕЗОНА
              </span>
              <span className="text-xs font-bold text-amber-300">
                Кейс: {formatDZ(featuredCase.demoPrice)}
              </span>
            </div>

            <div className="my-6 flex justify-center">
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{
                  duration: 3.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <SkinArtwork
                  kind={topSkin.kind}
                  rarity={topSkin.rarity}
                  accentHex={topSkin.accentHex}
                  className="h-36 w-64"
                />
              </motion.div>
            </div>

            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  {topSkin.weapon}
                </p>
                <p className="text-lg font-extrabold text-white">
                  {topSkin.skinName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Демо-ценность</p>
                <p className="text-base font-black text-amber-400">
                  {formatDZ(topSkin.demoValue)}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
