export type RarityTier =
  | 'MIL_SPEC'
  | 'RESTRICTED'
  | 'CLASSIFIED'
  | 'COVERT'
  | 'SPECIAL_GOLD';

export type WeaponKind =
  | 'RIFLE'
  | 'SNIPER'
  | 'PISTOL'
  | 'SMG'
  | 'KNIFE'
  | 'GLOVES';

export interface SkinItem {
  id: string;
  slug: string;
  weapon: string;
  skinName: string;
  kind: WeaponKind;
  rarity: RarityTier;
  demoValue: number;
  wearLabel: string;
  accentHex: string;
}

export interface CaseDropEntry {
  skin: SkinItem;
  dropChance: number; // percentage, e.g. 24.5
}

export type CaseCategory =
  | 'FEATURED'
  | 'OPERATIONS'
  | 'KNIVES'
  | 'SNIPERS'
  | 'BUDGET';

export interface CaseBox {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: CaseCategory;
  categoryLabel: string;
  demoPrice: number;
  accentColor: string;
  badge?: string;
  isFeatured?: boolean;
  items: CaseDropEntry[];
}

export interface InventoryEntry {
  instanceId: string;
  skin: SkinItem;
  floatValue: number;
  obtainedAt: string;
  source: 'CASE' | 'UPGRADE';
  caseTitle?: string;
}

export interface LiveDropItem {
  id: string;
  username: string;
  skin: SkinItem;
  caseTitle: string;
  timestamp: string;
}
