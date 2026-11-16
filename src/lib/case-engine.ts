import { CaseBox, SkinItem } from '@/types';

export interface CaseRollOutcome {
  winner: SkinItem;
  floatValue: number;
  rollHash: string;
  reel: SkinItem[];
  winnerIndex: number;
}

export function pickWeightedSkin(caseBox: CaseBox): SkinItem {
  const totalWeight = caseBox.items.reduce(
    (acc, entry) => acc + entry.dropChance,
    0
  );
  let cursor = Math.random() * totalWeight;

  for (const entry of caseBox.items) {
    cursor -= entry.dropChance;
    if (cursor <= 0) {
      return entry.skin;
    }
  }

  return caseBox.items[0].skin;
}

function generateDemoHash(): string {
  const chars = '0123456789abcdef';
  let out = 'dz_demo_';
  for (let i = 0; i < 24; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function rollDemoCase(
  caseBox: CaseBox,
  reelLength = 46,
  winnerIndex = 36
): CaseRollOutcome {
  const winner = pickWeightedSkin(caseBox);
  const reel: SkinItem[] = [];

  for (let i = 0; i < reelLength; i += 1) {
    if (i === winnerIndex) {
      reel.push(winner);
    } else {
      reel.push(pickWeightedSkin(caseBox));
    }
  }

  const floatValue = Number((0.005 + Math.random() * 0.14).toFixed(4));

  return {
    winner,
    floatValue,
    rollHash: generateDemoHash(),
    reel,
    winnerIndex,
  };
}
