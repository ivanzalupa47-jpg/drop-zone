'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Box,
  CheckCircle2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  ServerUpgradePayload,
  useDemoState,
} from '@/context/DemoStateContext';
import { RARITY_META, formatDZ } from '@/lib/config';
import { DEMO_SKINS } from '@/lib/demo-data';
import { SkinItem } from '@/types';
import { SkinArtwork } from '@/components/ui/SkinArtwork';

export default function UpgradePage() {
  const { inventory, runUpgradeOnServer, finalizeUpgradeInUi } = useDemoState();

  const upgradeLockRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const pendingUpgradeRef = useRef<ServerUpgradePayload | null>(null);

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  );
  const [selectedTargetSlug, setSelectedTargetSlug] = useState<string | null>(
    null
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [needleAngle, setNeedleAngle] = useState(0);
  const [lastResult, setLastResult] = useState<{
    ok: boolean;
    skinName: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      if (pendingUpgradeRef.current) {
        finalizeUpgradeInUi(pendingUpgradeRef.current);
        pendingUpgradeRef.current = null;
      }
    };
  }, [finalizeUpgradeInUi]);

  const sourceItem = useMemo(
    () =>
      inventory.find((item) => item.instanceId === selectedInstanceId) ?? null,
    [inventory, selectedInstanceId]
  );

  const availableTargets = useMemo(() => {
    const minVal = sourceItem ? sourceItem.skin.demoValue + 40 : 200;
    return [...DEMO_SKINS]
      .filter((s) => s.demoValue >= minVal)
      .sort((a, b) => a.demoValue - b.demoValue);
  }, [sourceItem]);

  const targetSkin: SkinItem | null = useMemo(() => {
    if (!selectedTargetSlug) return availableTargets[0] ?? null;
    const found = availableTargets.find((s) => s.slug === selectedTargetSlug);
    return found ?? availableTargets[0] ?? null;
  }, [availableTargets, selectedTargetSlug]);

  const chancePercent = useMemo(() => {
    if (!sourceItem || !targetSkin) return 0;
    const raw = (sourceItem.skin.demoValue / targetSkin.demoValue) * 92;
    return Number(Math.min(80, Math.max(5, raw)).toFixed(1));
  }, [sourceItem, targetSkin]);

  const handleRunUpgrade = async () => {
    if (!sourceItem || !targetSkin || isSpinning || upgradeLockRef.current) {
      return;
    }

    upgradeLockRef.current = true;
    setErrorMsg(null);
    setLastResult(null);
    setIsSpinning(true);

    try {
      const outcome = await runUpgradeOnServer(
        sourceItem.instanceId,
        targetSkin.slug
      );
      pendingUpgradeRef.current = outcome;

      const landingDegrees = (outcome.roll / 100) * 360;
      const baseFullSpins = (Math.floor(needleAngle / 360) + 6) * 360;
      const nextAngle = baseFullSpins + landingDegrees;
      setNeedleAngle(nextAngle);

      timerRef.current = window.setTimeout(() => {
        finalizeUpgradeInUi(outcome);
        pendingUpgradeRef.current = null;
        setSelectedInstanceId(null);
        setLastResult({
          ok: outcome.succeeded,
          skinName: `${outcome.targetSkin.weapon} | ${outcome.targetSkin.skinName}`,
        });
        setIsSpinning(false);
        upgradeLockRef.current = false;
        timerRef.current = null;
      }, 2900);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Ошибка проведения апгрейда'
      );
      setIsSpinning(false);
      upgradeLockRef.current = false;
    }
  };

  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (chancePercent / 100) * circumference;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-4 w-4" />
          Тактическая лаборатория CS2 · DEMO_MODE=true
        </div>
        <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
          АПГРЕЙД СКИНОВ
        </h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Выберите предмет из демо-инвентаря и желаемый скин более высокого
          ранга. Зелёный сектор показывает точный шанс успешного апгрейда.
        </p>
      </div>

      {/* Upgrade Stage */}
      <div className="grid items-center gap-6 rounded-3xl border border-dz-border bg-gradient-to-b from-[#101726] to-[#0A0E17] p-6 lg:grid-cols-3 sm:p-8">
        {/* Left: Source Item */}
        <div className="flex h-64 flex-col justify-between rounded-2xl border border-dz-border bg-dz-card/80 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Ваш демо-скин
          </span>
          {sourceItem ? (
            <>
              <div className="flex justify-center">
                <SkinArtwork
                  kind={sourceItem.skin.kind}
                  rarity={sourceItem.skin.rarity}
                  accentHex={sourceItem.skin.accentHex}
                  className="h-28 w-44"
                />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">
                    {sourceItem.skin.weapon}
                  </p>
                  <p className="text-base font-extrabold text-white">
                    {sourceItem.skin.skinName}
                  </p>
                </div>
                <span className="text-sm font-black text-amber-400">
                  {formatDZ(sourceItem.skin.demoValue)}
                </span>
              </div>
            </>
          ) : (
            <div className="my-auto text-center text-xs text-slate-500">
              Выберите предмет из вашего демо-инвентаря ниже
            </div>
          )}
        </div>

        {/* Center: Circular Chance Dial */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex h-52 w-52 items-center justify-center">
            <svg className="h-52 w-52 -rotate-90" viewBox="0 0 210 210">
              <circle
                cx="105"
                cy="105"
                r={radius}
                stroke="#1E293B"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="105"
                cy="105"
                r={radius}
                stroke="#10B981"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300"
              />
            </svg>

            {/* Rotating Pointer */}
            <motion.div
              animate={{ rotate: needleAngle }}
              transition={{ duration: 2.8, ease: [0.14, 0.85, 0.2, 1] }}
              className="pointer-events-none absolute inset-0 flex justify-center"
            >
              <div className="mt-1 h-5 w-1.5 rounded-full bg-amber-400 shadow-glow-amber" />
            </motion.div>

            {/* Center Percentage */}
            <div className="text-center">
              <span className="block text-2xl font-black text-white">
                {chancePercent}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ШАНС УСПЕХА
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!sourceItem || !targetSkin || isSpinning}
            onClick={() => void handleRunUpgrade()}
            className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-xs font-black uppercase tracking-wider transition ${
              !sourceItem || !targetSkin
                ? 'cursor-not-allowed border border-dz-border bg-dz-card text-slate-500'
                : isSpinning
                  ? 'cursor-wait bg-amber-500/30 text-amber-200'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-glow-amber hover:brightness-110'
            }`}
          >
            {isSpinning ? 'Крутим апгрейд...' : 'Запустить демо-апгрейд'}
            <ArrowRight className="h-4 w-4" />
          </button>

          {errorMsg && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-300">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {lastResult && (
            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold ${
                lastResult.ok
                  ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border border-rose-500/40 bg-rose-500/15 text-rose-300'
              }`}
            >
              {lastResult.ok ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Успех! {lastResult.skinName} в инвентаре
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Неудача — стрелка вышла за зелёный сектор
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Target Item */}
        <div className="flex h-64 flex-col justify-between rounded-2xl border border-dz-border bg-dz-card/80 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            2. Желаемый скин
          </span>
          {targetSkin ? (
            <>
              <div className="flex justify-center">
                <SkinArtwork
                  kind={targetSkin.kind}
                  rarity={targetSkin.rarity}
                  accentHex={targetSkin.accentHex}
                  className="h-28 w-44"
                />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">{targetSkin.weapon}</p>
                  <p className="text-base font-extrabold text-white">
                    {targetSkin.skinName}
                  </p>
                </div>
                <span className="text-sm font-black text-cyan-300">
                  {formatDZ(targetSkin.demoValue)}
                </span>
              </div>
            </>
          ) : (
            <div className="my-auto text-center text-xs text-slate-500">
              Нет доступной цели
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pickers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inventory Picker */}
        <div className="rounded-2xl border border-dz-border bg-dz-card/60 p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Ваш демо-инвентарь ({inventory.length})
          </h2>
          {inventory.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dz-border bg-dz-bg/60 p-8 text-center">
              <Box className="mx-auto h-7 w-7 text-slate-500" />
              <p className="mt-2 text-xs text-slate-400">
                Откройте кейс, чтобы получить предметы для апгрейда
              </p>
              <Link
                href="/"
                className="mt-3 inline-block rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950"
              >
                Открыть кейсы
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
              {inventory.map((entry) => {
                const selected = entry.instanceId === selectedInstanceId;
                const meta = RARITY_META[entry.skin.rarity];
                return (
                  <button
                    key={entry.instanceId}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => setSelectedInstanceId(entry.instanceId)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-amber-400 bg-amber-500/15'
                        : `${meta.borderClass} bg-dz-bg/70 hover:bg-dz-bg`
                    }`}
                  >
                    <SkinArtwork
                      kind={entry.skin.kind}
                      rarity={entry.skin.rarity}
                      accentHex={entry.skin.accentHex}
                      className="mx-auto h-14 w-24"
                    />
                    <p className="mt-2 truncate text-[11px] font-bold text-white">
                      {entry.skin.weapon}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {entry.skin.skinName}
                    </p>
                    <p className="mt-1 text-[11px] font-extrabold text-amber-400">
                      {formatDZ(entry.skin.demoValue)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Target Skin Picker */}
        <div className="rounded-2xl border border-dz-border bg-dz-card/60 p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Целевые скины CS2 ({availableTargets.length})
          </h2>
          <div className="mt-4 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
            {availableTargets.map((skin) => {
              const selected = targetSkin?.slug === skin.slug;
              const meta = RARITY_META[skin.rarity];
              return (
                <button
                  key={skin.id}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => setSelectedTargetSlug(skin.slug)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-cyan-400 bg-cyan-500/15'
                      : `${meta.borderClass} bg-dz-bg/70 hover:bg-dz-bg`
                  }`}
                >
                  <SkinArtwork
                    kind={skin.kind}
                    rarity={skin.rarity}
                    accentHex={skin.accentHex}
                    className="mx-auto h-14 w-24"
                  />
                  <p className="mt-2 truncate text-[11px] font-bold text-white">
                    {skin.weapon}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {skin.skinName}
                  </p>
                  <p className="mt-1 text-[11px] font-extrabold text-cyan-300">
                    {formatDZ(skin.demoValue)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
