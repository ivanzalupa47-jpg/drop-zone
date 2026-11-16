'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  FastForward,
  Hash,
  PlusCircle,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import {
  ServerCaseOpenPayload,
  useDemoState,
} from '@/context/DemoStateContext';
import { RARITY_META, formatDZ } from '@/lib/config';
import { CaseBox, InventoryEntry, SkinItem } from '@/types';
import { SkinArtwork } from '@/components/ui/SkinArtwork';
import { CaseCrateArtwork } from '@/components/ui/CaseCrateArtwork';

interface CaseOpeningArenaProps {
  caseBox: CaseBox;
}

const CARD_WIDTH = 160;
const CARD_GAP = 12;
const CARD_STRIDE = CARD_WIDTH + CARD_GAP;

export function CaseOpeningArena({ caseBox }: CaseOpeningArenaProps) {
  const {
    demoBalance,
    refillDemoCredits,
    openCaseOnServer,
    finalizeCaseDropInUi,
    sellInventoryItem,
  } = useDemoState();

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const spinLockRef = useRef(false);
  const sellLockRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);
  const pendingPayloadRef = useRef<ServerCaseOpenPayload | null>(null);

  const [fastMode, setFastMode] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [reelItems, setReelItems] = useState<SkinItem[]>([]);
  const [spinId, setSpinId] = useState(0);
  const [targetOffset, setTargetOffset] = useState(0);
  const [wonEntry, setWonEntry] = useState<InventoryEntry | null>(null);
  const [rollHash, setRollHash] = useState<string>('dz_sha256_server_ready');
  const [soldFeedback, setSoldFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flush any in-flight spin result into UI context if user navigates away mid-animation
  useEffect(() => {
    return () => {
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current);
      }
      if (pendingPayloadRef.current) {
        finalizeCaseDropInUi(pendingPayloadRef.current);
        pendingPayloadRef.current = null;
      }
    };
  }, [finalizeCaseDropInUi]);

  const sortedContents = useMemo(
    () =>
      [...caseBox.items].sort(
        (a, b) => b.skin.demoValue - a.skin.demoValue
      ),
    [caseBox.items]
  );

  const featuredSkin = sortedContents[0]?.skin ?? caseBox.items[0].skin;
  const canAfford = demoBalance >= caseBox.demoPrice;

  const handleOpenCase = async () => {
    if (spinLockRef.current || isRolling) return;
    spinLockRef.current = true;
    setErrorMsg(null);
    setWonEntry(null);
    setSoldFeedback(false);
    setIsRolling(true);

    try {
      const outcome = await openCaseOnServer(caseBox.slug);
      pendingPayloadRef.current = outcome;

      const viewportWidth = viewportRef.current?.clientWidth ?? 840;
      const jitter = Math.floor((Math.random() - 0.5) * 76);
      const centerOfWinner =
        outcome.winnerIndex * CARD_STRIDE + CARD_WIDTH / 2 + jitter;
      const calculatedOffset = viewportWidth / 2 - centerOfWinner;

      setReelItems(outcome.reel);
      setRollHash(outcome.rollHash);
      setTargetOffset(calculatedOffset);
      setSpinId((prev) => prev + 1);

      const durationMs = fastMode ? 1250 : 4300;

      revealTimerRef.current = window.setTimeout(() => {
        finalizeCaseDropInUi(outcome);
        pendingPayloadRef.current = null;
        setWonEntry(outcome.entry);
        setIsRolling(false);
        spinLockRef.current = false;
        revealTimerRef.current = null;
      }, durationMs + 120);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Ошибка открытия кейса на сервере'
      );
      setIsRolling(false);
      spinLockRef.current = false;
    }
  };

  const handleSellWonDrop = async () => {
    if (!wonEntry || soldFeedback || sellLockRef.current) return;
    sellLockRef.current = true;
    try {
      const ok = await sellInventoryItem(wonEntry.instanceId);
      if (ok) {
        setSoldFeedback(true);
      }
    } finally {
      sellLockRef.current = false;
    }
  };

  return (
    <div className="space-y-10">
      {/* Breadcrumb + Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-amber-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад в каталог кейсов
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-wide text-white sm:text-3xl">
              {caseBox.title}
            </h1>
            {caseBox.badge && (
              <span
                className="rounded-md px-2.5 py-0.5 text-[11px] font-black uppercase text-slate-950"
                style={{ backgroundColor: caseBox.accentColor }}
              >
                {caseBox.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            {caseBox.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-dz-border bg-dz-card px-3.5 py-2 text-xs text-slate-300">
          <Hash className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] text-slate-400">
            {rollHash}
          </span>
        </div>
      </div>

      {/* Main Roulette Stage */}
      <div className="relative overflow-hidden rounded-3xl border border-dz-border bg-gradient-to-b from-[#101726] to-[#0A0E17] p-5 sm:p-8">
        {/* Stage Header Controls */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Серверная транзакция PostgreSQL · Шансы прозрачны</span>
          </div>

          <button
            type="button"
            disabled={isRolling}
            onClick={() => setFastMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
              fastMode
                ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300'
                : 'border-dz-border bg-dz-card text-slate-400 hover:text-white'
            }`}
          >
            <FastForward className="h-3.5 w-3.5" />
            Быстрый прокрут: {fastMode ? 'ВКЛ' : 'ВЫКЛ'}
          </button>
        </div>

        {/* Roulette Viewport OR Idle Crate Preview */}
        <div
          ref={viewportRef}
          className="relative h-52 w-full overflow-hidden rounded-2xl border border-dz-border bg-[#070A10] shadow-inner"
        >
          {/* Edge Vignette */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-[#070A10] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-[#070A10] to-transparent" />

          {reelItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="group">
                <CaseCrateArtwork
                  accentColor={caseBox.accentColor}
                  featuredSkin={featuredSkin}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Center Tactical Laser Pointer */}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 -translate-x-1/2">
                <div className="mx-auto h-3 w-3 rotate-45 bg-amber-400 shadow-glow-amber" />
                <div className="mx-auto h-full w-[2px] bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400 shadow-[0_0_12px_#F59E0B]" />
              </div>

              {/* Sliding Reel */}
              <div className="flex h-full items-center">
                <motion.div
                  key={spinId}
                  initial={{ x: 24 }}
                  animate={{ x: targetOffset }}
                  transition={{
                    duration: fastMode ? 1.2 : 4.25,
                    ease: [0.12, 0.84, 0.18, 1],
                  }}
                  className="flex items-center"
                  style={{ gap: `${CARD_GAP}px` }}
                >
                  {reelItems.map((skin, idx) => {
                    const meta = RARITY_META[skin.rarity];
                    return (
                      <div
                        key={`${spinId}-${idx}-${skin.id}`}
                        style={{ width: `${CARD_WIDTH}px` }}
                        className={`relative flex h-40 shrink-0 flex-col justify-between overflow-hidden rounded-xl border ${meta.borderClass} bg-dz-card/95 p-3`}
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 h-1"
                          style={{ backgroundColor: meta.colorHex }}
                        />
                        <span
                          className={`text-[10px] font-bold uppercase ${meta.textClass}`}
                        >
                          {meta.label}
                        </span>
                        <div className="flex justify-center">
                          <SkinArtwork
                            kind={skin.kind}
                            rarity={skin.rarity}
                            accentHex={skin.accentHex}
                            className="h-20 w-32"
                          />
                        </div>
                        <div>
                          <p className="truncate text-[11px] font-bold text-white">
                            {skin.weapon}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">
                            {skin.skinName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </>
          )}
        </div>

        {/* Open CTA Bar */}
        <div className="mt-6 flex flex-col items-center justify-center gap-3">
          {errorMsg && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-300">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {canAfford || isRolling ? (
            <button
              type="button"
              disabled={isRolling}
              onClick={() => void handleOpenCase()}
              className={`inline-flex min-w-[260px] items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-black uppercase tracking-wider transition ${
                isRolling
                  ? 'cursor-wait border border-amber-400/30 bg-amber-500/20 text-amber-200'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-glow-amber hover:brightness-110'
              }`}
            >
              <RotateCw
                className={`h-4 w-4 ${isRolling ? 'animate-spin' : ''}`}
              />
              {isRolling
                ? 'Открываем кейс...'
                : `Открыть за ${formatDZ(caseBox.demoPrice)}`}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs text-amber-300">
                Недостаточно демо-кредитов для открытия ({formatDZ(caseBox.demoPrice)})
              </p>
              <button
                type="button"
                onClick={() => void refillDemoCredits(2500)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-500/25"
              >
                <PlusCircle className="h-4 w-4" />
                Бесплатно пополнить +2 500 DZ (DEMO)
              </button>
            </div>
          )}
        </div>

        {/* Won Skin Drop Reveal Banner */}
        <AnimatePresence>
          {wonEntry && !isRolling && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className={`mt-6 rounded-2xl border ${
                RARITY_META[wonEntry.skin.rarity].borderClass
              } bg-dz-card/95 p-5`}
              style={{
                boxShadow: RARITY_META[wonEntry.skin.rarity].glowStyle,
              }}
            >
              <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
                <div className="flex items-center gap-4">
                  <SkinArtwork
                    kind={wonEntry.skin.kind}
                    rarity={wonEntry.skin.rarity}
                    accentHex={wonEntry.skin.accentHex}
                    className="h-24 w-36 shrink-0"
                  />
                  <div>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        RARITY_META[wonEntry.skin.rarity].bgClass
                      } ${RARITY_META[wonEntry.skin.rarity].textClass}`}
                    >
                      {RARITY_META[wonEntry.skin.rarity].label}
                    </span>
                    <h3 className="mt-1 text-xl font-black text-white">
                      {wonEntry.skin.weapon} | {wonEntry.skin.skinName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {wonEntry.skin.wearLabel} · Float:{' '}
                      <span className="font-mono text-slate-200">
                        {wonEntry.floatValue}
                      </span>{' '}
                      · Ценность:{' '}
                      <span className="font-bold text-amber-400">
                        {formatDZ(wonEntry.skin.demoValue)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {soldFeedback ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Продано за {formatDZ(wonEntry.skin.demoValue)}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleSellWonDrop()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25"
                      >
                        <Coins className="h-4 w-4" />
                        Продать за {formatDZ(wonEntry.skin.demoValue)}
                      </button>
                      <Link
                        href="/inventory"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"
                      >
                        В инвентарь
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Case Contents Grid */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-wide text-white">
              СОДЕРЖИМОЕ КЕЙСА ({sortedContents.length})
            </h2>
            <p className="text-xs text-slate-400">
              Полная таблица предметов и вероятностей выпадения в демо-режиме
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sortedContents.map(({ skin, dropChance }) => {
            const meta = RARITY_META[skin.rarity];
            return (
              <div
                key={skin.id}
                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border ${meta.borderClass} bg-dz-card/90 p-4 transition hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${meta.textClass}`}>
                    {meta.label}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-slate-300">
                    {dropChance}%
                  </span>
                </div>

                <div className="my-4 flex justify-center">
                  <SkinArtwork
                    kind={skin.kind}
                    rarity={skin.rarity}
                    accentHex={skin.accentHex}
                    className="h-24 w-40"
                  />
                </div>

                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold text-slate-400">
                    {skin.weapon}
                  </p>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-white">
                      {skin.skinName}
                    </p>
                    <span className="shrink-0 text-xs font-black text-amber-400">
                      {formatDZ(skin.demoValue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
