'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Backpack,
  Box,
  Coins,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useDemoState } from '@/context/DemoStateContext';
import { RARITY_META, formatDZ } from '@/lib/config';
import { RarityTier } from '@/types';
import { SkinArtwork } from '@/components/ui/SkinArtwork';

const RARITY_FILTERS: { id: 'ALL' | RarityTier; label: string }[] = [
  { id: 'ALL', label: 'Все редкости' },
  { id: 'SPECIAL_GOLD', label: 'Особые' },
  { id: 'COVERT', label: 'Тайное' },
  { id: 'CLASSIFIED', label: 'Засекреченное' },
  { id: 'RESTRICTED', label: 'Запрещённое' },
  { id: 'MIL_SPEC', label: 'Армейское' },
];

export default function InventoryPage() {
  const { inventory, sellInventoryItem, sellAllInventory } = useDemoState();
  const [rarityFilter, setRarityFilter] = useState<'ALL' | RarityTier>('ALL');

  const filteredItems = useMemo(() => {
    if (rarityFilter === 'ALL') return inventory;
    return inventory.filter((item) => item.skin.rarity === rarityFilter);
  }, [inventory, rarityFilter]);

  const totalDemoWorth = useMemo(
    () => inventory.reduce((acc, item) => acc + item.skin.demoValue, 0),
    [inventory]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-dz-border bg-gradient-to-r from-dz-card to-dz-surface p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Backpack className="h-4 w-4" />
            Виртуальное хранилище (DEMO)
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            МОЙ ДЕМО-ИНВЕНТАРЬ
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Предметов: <strong className="text-white">{inventory.length}</strong>{' '}
            · Суммарная демо-оценка:{' '}
            <strong className="text-amber-400">{formatDZ(totalDemoWorth)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/25"
          >
            <Sparkles className="h-4 w-4" />
            Отправить в Апгрейд
          </Link>

          {inventory.length > 0 && (
            <button
              type="button"
              onClick={sellAllInventory}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25"
            >
              <Trash2 className="h-4 w-4" />
              Продать всё за {formatDZ(totalDemoWorth)}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {RARITY_FILTERS.map((f) => {
          const active = rarityFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setRarityFilter(f.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-amber-400 text-slate-950'
                  : 'border border-dz-border bg-dz-card text-slate-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dz-border bg-dz-card/60 p-12 text-center">
          <Box className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-4 text-lg font-extrabold text-white">
            В демо-инвентаре пока пусто
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
            Откройте любой кейс CS2 за виртуальные демо-кредиты DZ, чтобы
            собрать свою первую коллекцию скинов.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-glow-amber hover:brightness-110"
          >
            Перейти к кейсам
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {filteredItems.map((entry) => {
              const meta = RARITY_META[entry.skin.rarity];
              return (
                <motion.div
                  key={entry.instanceId}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex flex-col justify-between rounded-2xl border ${meta.borderClass} bg-dz-card p-4`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${meta.textClass}`}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-slate-400">
                      Float {entry.floatValue}
                    </span>
                  </div>

                  <div className="my-4 flex justify-center">
                    <SkinArtwork
                      kind={entry.skin.kind}
                      rarity={entry.skin.rarity}
                      accentHex={entry.skin.accentHex}
                      className="h-24 w-40"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      {entry.skin.weapon}
                    </p>
                    <p className="truncate text-sm font-extrabold text-white">
                      {entry.skin.skinName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Источник: {entry.caseTitle ?? entry.source}
                    </p>

                    <button
                      type="button"
                      onClick={() => sellInventoryItem(entry.instanceId)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
                    >
                      <Coins className="h-3.5 w-3.5" />
                      Продать за {formatDZ(entry.skin.demoValue)}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
