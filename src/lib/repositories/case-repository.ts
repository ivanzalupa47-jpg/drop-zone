import { APP_CONFIG } from '@/lib/config';
import { DEMO_CASES, DEMO_SKINS } from '@/lib/demo-data';
import { getPrismaClient } from '@/lib/prisma';
import { CaseBox, CaseCategory, RarityTier, SkinItem, WeaponKind } from '@/types';

const categoryLabels: Record<CaseCategory, string> = {
  FEATURED: 'Хиты DROP ZONE',
  OPERATIONS: 'Операции',
  KNIVES: 'Ножевые',
  SNIPERS: 'Снайперские',
  BUDGET: 'Бюджетные',
};

export async function getCasesCatalog(): Promise<CaseBox[]> {
  if (APP_CONFIG.demoMode) {
    return DEMO_CASES;
  }

  try {
    const prisma = getPrismaClient();
    const dbCases = await prisma.case.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          include: { skin: true },
        },
      },
    });

    if (dbCases.length === 0) {
      return DEMO_CASES;
    }

    return dbCases.map((c) => {
      const cat = (c.category as CaseCategory) || 'FEATURED';
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        category: cat,
        categoryLabel: categoryLabels[cat] ?? 'Кейсы',
        demoPrice: c.demoPrice,
        accentColor: c.accentColor,
        badge: c.badge ?? undefined,
        isFeatured: c.isFeatured,
        items: c.items.map((entry) => ({
          dropChance: entry.dropChance,
          skin: {
            id: entry.skin.id,
            slug: entry.skin.slug,
            weapon: entry.skin.weapon,
            skinName: entry.skin.skinName,
            kind: entry.skin.kind as WeaponKind,
            rarity: entry.skin.rarity as RarityTier,
            demoValue: entry.skin.demoValue,
            wearLabel: entry.skin.wearLabel,
            accentHex: entry.skin.accentHex,
          },
        })),
      };
    });
  } catch {
    return DEMO_CASES;
  }
}

export async function getCaseBySlug(slug: string): Promise<CaseBox | null> {
  const allCases = await getCasesCatalog();
  return allCases.find((c) => c.slug === slug) ?? null;
}

export async function getAllSkins(): Promise<SkinItem[]> {
  if (APP_CONFIG.demoMode) {
    return DEMO_SKINS;
  }

  try {
    const prisma = getPrismaClient();
    const skins = await prisma.skin.findMany({
      orderBy: { demoValue: 'asc' },
    });
    if (skins.length === 0) return DEMO_SKINS;

    return skins.map((s) => ({
      id: s.id,
      slug: s.slug,
      weapon: s.weapon,
      skinName: s.skinName,
      kind: s.kind as WeaponKind,
      rarity: s.rarity as RarityTier,
      demoValue: s.demoValue,
      wearLabel: s.wearLabel,
      accentHex: s.accentHex,
    }));
  } catch {
    return DEMO_SKINS;
  }
}
