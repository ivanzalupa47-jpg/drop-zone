'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CaseBox, CaseCategory } from '@/types';
import { CaseCard } from '@/components/cases/CaseCard';

interface CaseCatalogProps {
  cases: CaseBox[];
}

const CATEGORY_TABS: { id: 'ALL' | CaseCategory; label: string }[] = [
  { id: 'ALL', label: 'Все кейсы' },
  { id: 'FEATURED', label: 'Хиты DROP ZONE' },
  { id: 'OPERATIONS', label: 'Операции' },
  { id: 'KNIVES', label: 'Ножевые' },
  { id: 'SNIPERS', label: 'Снайперские' },
  { id: 'BUDGET', label: 'Бюджетные' },
];

export function CaseCatalog({ cases }: CaseCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CaseCategory>(
    'ALL'
  );
  const [query, setQuery] = useState('');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesCategory =
        selectedCategory === 'ALL' || c.category === selectedCategory;
      const q = query.trim().toLowerCase();
      if (!q) return matchesCategory;

      const inCase =
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q);
      const inSkins = c.items.some(
        (item) =>
          item.skin.weapon.toLowerCase().includes(q) ||
          item.skin.skinName.toLowerCase().includes(q)
      );
      return matchesCategory && (inCase || inSkins);
    });
  }, [cases, selectedCategory, query]);

  return (
    <section className="mt-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black tracking-wide text-white">
            АРСЕНАЛ КЕЙСОВ CS2
          </h2>
          <p className="text-xs text-slate-400">
            Выберите кейс или найдите нужный скин по названию оружия
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск кейса или скина (AWP, AK-47)..."
            className="w-full rounded-xl border border-dz-border bg-dz-card py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-amber-400/60"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => {
          const active = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-amber-400 text-slate-950 shadow-glow-amber'
                  : 'border border-dz-border bg-dz-card text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Cases Grid */}
      {filteredCases.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dz-border bg-dz-card/60 p-10 text-center">
          <p className="text-sm font-semibold text-slate-300">
            По вашему запросу кейсы не найдены
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setQuery('');
            }}
            className="mt-3 rounded-lg bg-amber-400/15 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/25"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((caseBox, idx) => (
            <CaseCard key={caseBox.id} caseBox={caseBox} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}
