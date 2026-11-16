'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { formatDZ } from '@/lib/config';
import { CaseBox } from '@/types';
import { CaseCrateArtwork } from '@/components/ui/CaseCrateArtwork';

interface CaseCardProps {
  caseBox: CaseBox;
  index: number;
}

export function CaseCard({ caseBox, index }: CaseCardProps) {
  const topItem =
    [...caseBox.items].sort((a, b) => b.skin.demoValue - a.skin.demoValue)[0]
      ?.skin ?? caseBox.items[0].skin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      <Link
        href={`/cases/${caseBox.slug}`}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-dz-border bg-gradient-to-b from-dz-card to-dz-surface p-5 transition-colors hover:border-amber-400/50"
      >
        {/* Top Row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {caseBox.categoryLabel}
          </span>
          {caseBox.badge && (
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950"
              style={{ backgroundColor: caseBox.accentColor }}
            >
              {caseBox.badge}
            </span>
          )}
        </div>

        {/* Crate + Featured Weapon Artwork */}
        <div className="my-2">
          <CaseCrateArtwork
            accentColor={caseBox.accentColor}
            featuredSkin={topItem}
          />
        </div>

        {/* Title & Action */}
        <div>
          <h3 className="text-lg font-extrabold tracking-wide text-white group-hover:text-amber-300 transition-colors">
            {caseBox.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-slate-400">
            {caseBox.subtitle}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-dz-border/80 pt-3.5">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                Стоимость открытия
              </span>
              <span className="text-sm font-black text-amber-400">
                {formatDZ(caseBox.demoPrice)}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition group-hover:border-amber-400/50 group-hover:bg-amber-400 group-hover:text-slate-950">
              Открыть
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
