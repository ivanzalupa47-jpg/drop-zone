'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Backpack,
  Box,
  Coins,
  PlusCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useDemoState } from '@/context/DemoStateContext';
import { APP_CONFIG, formatDZ } from '@/lib/config';

const NAV_LINKS = [
  { href: '/', label: 'Кейсы', icon: Box },
  { href: '/upgrade', label: 'Апгрейд', icon: Sparkles },
  { href: '/inventory', label: 'Инвентарь', icon: Backpack },
];

export function Navbar() {
  const pathname = usePathname();
  const { demoBalance, inventory, refillDemoCredits, resetDemoProgress } =
    useDemoState();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-dz-border bg-dz-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-400/25 to-cyan-400/10 shadow-glow-amber">
                <span className="text-base font-black tracking-tighter text-amber-400">
                  DZ
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-wider text-white">
                    DROP <span className="text-amber-400">ZONE</span>
                  </span>
                  <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    DEMO MODE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  CS2 Tactical Case Simulator
                </p>
              </div>
            </Link>

            {/* Primary Nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? pathname === '/' || pathname.startsWith('/cases')
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.href === '/inventory' && inventory.length > 0 && (
                      <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[11px] font-bold text-cyan-300">
                        {inventory.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Demo Balance & Free Refill */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-dz-border bg-dz-card px-3.5 py-2">
              <Coins className="h-4 w-4 text-amber-400" />
              <div className="leading-tight">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                  Демо-баланс
                </span>
                <span className="text-sm font-extrabold text-white">
                  {formatDZ(demoBalance)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-3.5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-glow-amber transition hover:brightness-110"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Демо +</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex items-center justify-around border-t border-dz-border/70 px-2 py-2 md:hidden">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/'
                ? pathname === '/' || pathname.startsWith('/cases')
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.href === '/inventory' && inventory.length > 0 && (
                  <span className="rounded-full bg-cyan-500/20 px-1.5 text-[10px] text-cyan-300">
                    {inventory.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Free Demo Credits Modal (Strictly No Real Payments) */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-dz-border bg-dz-surface p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-300">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    DEMO_MODE = true
                  </span>
                  <h3 className="mt-2 text-xl font-extrabold text-white">
                    Виртуальные демо-кредиты
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Платформа <strong>DROP ZONE</strong> работает в демонстрационном
                режиме. Реальные денежные операции, платежи и выводы полностью
                отключены. Вы можете бесплатно начислить виртуальные кредиты{' '}
                <strong>DZ</strong> для тестирования кейсов и апгрейдов.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    refillDemoCredits(2500);
                    setModalOpen(false);
                  }}
                  className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-500/25"
                >
                  +2 500 DZ
                  <span className="block text-[11px] font-normal text-slate-300">
                    Стандартный пакет
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    refillDemoCredits(10000);
                    setModalOpen(false);
                  }}
                  className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/25"
                >
                  +10 000 DZ
                  <span className="block text-[11px] font-normal text-slate-300">
                    Тест редких кейсов
                  </span>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dz-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetDemoProgress();
                    setModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-rose-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Сбросить демо-прогресс ({formatDZ(APP_CONFIG.initialDemoBalance)})
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
