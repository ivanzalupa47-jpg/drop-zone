import { RarityTier } from '@/types';

export const APP_CONFIG = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'DROP ZONE',
  demoMode:
    (process.env.DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE ?? 'true') !==
    'false',
  currencySymbol: 'DZ',
  currencyLabel: 'Демо-кредиты',
  initialDemoBalance: 5000,
  freeRefillAmount: 2500,
} as const;

export interface RarityMeta {
  label: string;
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  glowStyle: string;
}

export const RARITY_META: Record<RarityTier, RarityMeta> = {
  MIL_SPEC: {
    label: 'Армейское',
    colorHex: '#4B69FF',
    bgClass: 'bg-[#4B69FF]/15',
    borderClass: 'border-[#4B69FF]/50',
    textClass: 'text-[#6E87FF]',
    glowStyle: '0 0 24px -4px rgba(75, 105, 255, 0.45)',
  },
  RESTRICTED: {
    label: 'Запрещённое',
    colorHex: '#8847FF',
    bgClass: 'bg-[#8847FF]/15',
    borderClass: 'border-[#8847FF]/50',
    textClass: 'text-[#A675FF]',
    glowStyle: '0 0 24px -4px rgba(136, 71, 255, 0.45)',
  },
  CLASSIFIED: {
    label: 'Засекреченное',
    colorHex: '#D32CE6',
    bgClass: 'bg-[#D32CE6]/15',
    borderClass: 'border-[#D32CE6]/50',
    textClass: 'text-[#E566F4]',
    glowStyle: '0 0 26px -4px rgba(211, 44, 230, 0.5)',
  },
  COVERT: {
    label: 'Тайное',
    colorHex: '#EB4B4B',
    bgClass: 'bg-[#EB4B4B]/15',
    borderClass: 'border-[#EB4B4B]/50',
    textClass: 'text-[#FF6B6B]',
    glowStyle: '0 0 28px -4px rgba(235, 75, 75, 0.55)',
  },
  SPECIAL_GOLD: {
    label: 'Особый предмет',
    colorHex: '#F59E0B',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-400',
    glowStyle: '0 0 32px -4px rgba(245, 158, 11, 0.65)',
  },
};

export function formatDZ(value: number): string {
  return `${value.toLocaleString('ru-RU')} ${APP_CONFIG.currencySymbol}`;
}
