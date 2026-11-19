/** Subject illustrations (64 grid) from the prototype; `{accent}` is the tile colour. */
export const subjectArt = {
  science:
    '<path d="M24 6h16v5h-3v13l15 25a7 7 0 01-6 10H18a7 7 0 01-6-10l15-25V11h-3z"/><circle cx="26" cy="46" r="4" fill="{accent}" opacity=".45"/><circle cx="38" cy="40" r="3" fill="{accent}" opacity=".45"/>',
  maths: '<path d="M26 6h12v20h20v12H38v20H26V38H6V26h20z"/>',
  english:
    '<path d="M10 8h44a6 6 0 016 6v28a6 6 0 01-6 6H34L18 60V48h-8a6 6 0 01-6-6V14a6 6 0 016-6z"/><path d="M22 38l8-20 8 20M25 32h10" fill="none" stroke="{accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>',
  nepali:
    '<text x="32" y="54" font-size="58" font-weight="700" text-anchor="middle" font-family="Baloo2_700Bold">क</text>',
  social:
    '<circle cx="32" cy="32" r="28"/><path d="M4 32h56M32 4c14 14 14 42 0 56M32 4C18 18 18 46 32 60" fill="none" stroke="{accent}" stroke-width="3" opacity=".5"/>',
  health: '<path d="M32 58S5 42 5 22a14 14 0 0127-7 14 14 0 0127 7c0 20-27 36-27 36z"/>',
} as const;
