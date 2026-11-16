import { InventoryItem, Skin } from '@prisma/client';
import { InventoryEntry, LiveDropItem, RarityTier, SkinItem, WeaponKind } from '@/types';

export function serializeSkin(skin: Skin): SkinItem {
  return {
    id: skin.id,
    slug: skin.slug,
    weapon: skin.weapon,
    skinName: skin.skinName,
    kind: skin.kind as WeaponKind,
    rarity: skin.rarity as RarityTier,
    demoValue: skin.demoValue,
    wearLabel: skin.wearLabel,
    accentHex: skin.accentHex,
  };
}

export function serializeInventoryItem(
  item: InventoryItem & { skin: Skin }
): InventoryEntry {
  return {
    instanceId: item.id,
    skin: serializeSkin(item.skin),
    floatValue: item.floatValue,
    obtainedAt: item.obtainedAt.toISOString(),
    source: item.source === 'UPGRADE' ? 'UPGRADE' : 'CASE',
    caseTitle: item.caseTitle ?? (item.source === 'UPGRADE' ? 'АПГРЕЙД' : undefined),
  };
}

export function formatRelativeTimeRu(date: Date): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 10) return 'только что';
  if (diffSec < 60) return `${diffSec} сек назад`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours} ч назад`;
}

export function serializeLiveDrop(drop: {
  id: string;
  createdAt: Date;
  user: { username: string };
  caseBox: { title: string };
  skin: Skin;
}): LiveDropItem {
  return {
    id: drop.id,
    username: drop.user.username,
    skin: serializeSkin(drop.skin),
    caseTitle: drop.caseBox.title,
    timestamp: formatRelativeTimeRu(drop.createdAt),
  };
}
