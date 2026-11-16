import React from 'react';
import { SkinItem } from '@/types';
import { SkinArtwork } from '@/components/ui/SkinArtwork';

interface CaseCrateArtworkProps {
  accentColor: string;
  featuredSkin: SkinItem;
}

export function CaseCrateArtwork({
  accentColor,
  featuredSkin,
}: CaseCrateArtworkProps) {
  return (
    <div className="relative flex h-44 w-full items-center justify-center">
      {/* Ambient Aura */}
      <div
        className="pointer-events-none absolute h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-90 opacity-55"
        style={{ backgroundColor: accentColor }}
      />

      {/* Tactical CS2 Crate Base SVG */}
      <svg
        viewBox="0 0 220 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-36 w-52 drop-shadow-[0_14px_20px_rgba(0,0,0,0.75)]"
      >
        {/* Crate Lid */}
        <path
          d="M28 52L46 34H174L192 52H28Z"
          fill="#1A2334"
          stroke={accentColor}
          strokeWidth="2"
        />
        {/* Crate Body */}
        <rect
          x="24"
          y="52"
          width="172"
          height="66"
          rx="8"
          fill="#0F1624"
          stroke="#2A3954"
          strokeWidth="2.2"
        />
        {/* Corner Reinforcements */}
        <path d="M24 68V56C24 53.8 25.8 52 28 52H42" stroke={accentColor} strokeWidth="3" />
        <path d="M196 68V56C196 53.8 194.2 52 192 52H178" stroke={accentColor} strokeWidth="3" />
        <path d="M24 102V114C24 116.2 25.8 118 28 118H42" stroke={accentColor} strokeWidth="3" />
        <path d="M196 102V114C196 116.2 194.2 118 192 118H178" stroke={accentColor} strokeWidth="3" />

        {/* Hazard / Lock Center Plate */}
        <rect
          x="84"
          y="46"
          width="52"
          height="14"
          rx="3"
          fill={accentColor}
        />
        <text
          x="110"
          y="56"
          textAnchor="middle"
          fill="#080A0F"
          fontSize="8"
          fontWeight="800"
          letterSpacing="1.2"
        >
          DROP ZONE
        </text>

        {/* Ribbed Lines */}
        <line x1="46" y1="72" x2="46" y2="106" stroke="#1E293B" strokeWidth="4" />
        <line x1="60" y1="72" x2="60" y2="106" stroke="#1E293B" strokeWidth="4" />
        <line x1="160" y1="72" x2="160" y2="106" stroke="#1E293B" strokeWidth="4" />
        <line x1="174" y1="72" x2="174" y2="106" stroke="#1E293B" strokeWidth="4" />
      </svg>

      {/* Floating Featured Weapon Over Crate */}
      <div className="pointer-events-none absolute -top-1 z-20 transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105">
        <SkinArtwork
          kind={featuredSkin.kind}
          rarity={featuredSkin.rarity}
          accentHex={featuredSkin.accentHex}
          className="h-24 w-40"
        />
      </div>
    </div>
  );
}
