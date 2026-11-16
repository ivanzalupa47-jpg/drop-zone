import React from 'react';
import { RARITY_META } from '@/lib/config';
import { RarityTier, WeaponKind } from '@/types';

interface SkinArtworkProps {
  kind: WeaponKind;
  rarity: RarityTier;
  accentHex: string;
  className?: string;
}

export function SkinArtwork({
  kind,
  rarity,
  accentHex,
  className = 'w-32 h-20',
}: SkinArtworkProps) {
  const rarityHex = RARITY_META[rarity].colorHex;
  const gradId = `skin-grad-${kind}-${accentHex.replace('#', '')}-${rarity}`;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div
        className="pointer-events-none absolute inset-2 rounded-full blur-xl opacity-45"
        style={{
          background: `radial-gradient(circle, ${accentHex} 0%, ${rarityHex} 60%, transparent 100%)`,
        }}
      />
      <svg
        viewBox="0 0 220 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-full w-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.65)]"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentHex} />
            <stop offset="55%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor={rarityHex} />
          </linearGradient>
        </defs>

        {kind === 'SNIPER' && (
          <g>
            {/* Scope */}
            <rect
              x="76"
              y="22"
              width="58"
              height="10"
              rx="3"
              fill="#1E293B"
              stroke={accentHex}
              strokeWidth="1.8"
            />
            <line
              x1="92"
              y1="32"
              x2="92"
              y2="40"
              stroke="#94A3B8"
              strokeWidth="3"
            />
            <line
              x1="118"
              y1="32"
              x2="118"
              y2="40"
              stroke="#94A3B8"
              strokeWidth="3"
            />
            {/* Long Barrel */}
            <rect
              x="132"
              y="43"
              width="78"
              height="6"
              rx="2"
              fill="#CBD5E1"
            />
            <rect
              x="202"
              y="41"
              width="10"
              height="10"
              rx="1.5"
              fill={accentHex}
            />
            {/* Body & Stock */}
            <path
              d="M16 42L54 40H142L146 54H106L98 76H84L88 55H56L42 68H14L16 42Z"
              fill={`url(#${gradId})`}
              stroke="#0F172A"
              strokeWidth="2"
            />
            {/* Magazine */}
            <path
              d="M106 54H124L120 74H102L106 54Z"
              fill="#1E293B"
              stroke={rarityHex}
              strokeWidth="1.6"
            />
          </g>
        )}

        {kind === 'RIFLE' && (
          <g>
            {/* Barrel */}
            <rect x="148" y="42" width="54" height="6" rx="2" fill="#94A3B8" />
            <path d="M188 36L194 42H184L188 36Z" fill={accentHex} />
            {/* Receiver + Handguard + Stock */}
            <path
              d="M18 44L52 40H154L158 53H114L104 75H90L96 54H62L46 68H18V44Z"
              fill={`url(#${gradId})`}
              stroke="#0F172A"
              strokeWidth="2"
            />
            {/* Curved AK/M4 Magazine */}
            <path
              d="M114 53H131L140 84L123 87L114 53Z"
              fill="#1E293B"
              stroke={accentHex}
              strokeWidth="1.8"
            />
            {/* Tactical Stripe */}
            <line
              x1="64"
              y1="46"
              x2="144"
              y2="46"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeDasharray="8 4"
            />
          </g>
        )}

        {kind === 'SMG' && (
          <g>
            <rect x="144" y="43" width="38" height="7" rx="2" fill="#94A3B8" />
            <path
              d="M40 38H148L152 56H112L106 82H92L96 56H66L54 74H40V38Z"
              fill={`url(#${gradId})`}
              stroke="#0F172A"
              strokeWidth="2"
            />
            <rect
              x="116"
              y="56"
              width="12"
              height="32"
              rx="2"
              fill="#1E293B"
              stroke={accentHex}
              strokeWidth="1.6"
            />
          </g>
        )}

        {kind === 'PISTOL' && (
          <g>
            <path
              d="M58 34H162L166 52H106L94 84H72L82 52H58V34Z"
              fill={`url(#${gradId})`}
              stroke="#0F172A"
              strokeWidth="2.2"
            />
            <rect
              x="68"
              y="39"
              width="82"
              height="5"
              rx="2"
              fill="#0F172A"
              opacity="0.45"
            />
            <circle cx="96" cy="57" r="5" stroke={accentHex} strokeWidth="1.8" />
          </g>
        )}

        {kind === 'KNIFE' && (
          <g>
            {/* Curved Karambit / Tactical Blade */}
            <path
              d="M48 68C58 58 72 54 86 55L96 45C124 24 162 22 188 34C162 42 138 56 116 74L92 67C78 68 66 74 56 84L48 68Z"
              fill={`url(#${gradId})`}
              stroke="#F8FAFC"
              strokeWidth="1.8"
            />
            {/* Finger Ring */}
            <circle
              cx="46"
              cy="76"
              r="11"
              fill="#0F172A"
              stroke={accentHex}
              strokeWidth="3"
            />
            {/* Handle Grips */}
            <path
              d="M56 68L88 56L94 66L62 78L56 68Z"
              fill="#1E293B"
              stroke={rarityHex}
              strokeWidth="1.5"
            />
          </g>
        )}

        {kind === 'GLOVES' && (
          <g>
            <path
              d="M66 84V44C66 39 73 39 73 44V34C73 29 82 29 82 34V30C82 25 91 25 91 30V35C91 30 100 30 100 35V52L110 44C115 41 120 46 116 52L100 74V84H66Z"
              fill={`url(#${gradId})`}
              stroke="#0F172A"
              strokeWidth="2"
            />
            <path
              d="M114 84V44C114 39 121 39 121 44V34C121 29 130 29 130 34V30C130 25 139 25 139 30V35C139 30 148 30 148 35V52L158 44C163 41 168 46 164 52L148 74V84H114Z"
              fill={`url(#${gradId})`}
              stroke="#0F172A"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
