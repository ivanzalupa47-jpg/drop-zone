'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { useDemoState } from '@/context/DemoStateContext';
import { RARITY_META, formatDZ } from '@/lib/config';
import { SkinArtwork } from '@/components/ui/SkinArtwork';

export function LiveDropsTicker() {
  const { liveDrops } = useDemoState();

  return (
    <div className="border-b border-dz-border bg-[#070A10]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-2">
        {/* Live Label */}
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          <div className="leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              LIVE ДРОПЫ
            </p>
            <p className="text-[10px] text-slate-400">DEMO ЛЕНТА</p>
          </div>
        </div>

        {/* Scrolling Cards */}
        <div className="flex flex-1 items-center gap-2.5 overflow-x-hidden">
          <AnimatePresence initial={false}>
            {liveDrops.slice(0, 7).map((drop) => {
              const meta = RARITY_META[drop.skin.rarity];
              return (
                <motion.div
                  key={drop.id}
                  layout
                  initial={{ opacity: 0, x: -32, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  className={`group relative flex w-48 shrink-0 items-center gap-2 rounded-lg border ${meta.borderClass} bg-dz-card/90 px-2.5 py-1.5`}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
                    style={{ backgroundColor: meta.colorHex }}
                  />
                  <SkinArtwork
                    kind={drop.skin.kind}
                    rarity={drop.skin.rarity}
                    accentHex={drop.skin.accentHex}
                    className="h-10 w-16 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-white">
                      {drop.skin.weapon} | {drop.skin.skinName}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {drop.username} · {formatDZ(drop.skin.demoValue)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
