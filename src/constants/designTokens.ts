/**
 * Design tokens (DESIGN.md §3) — single source of truth for every color
 * consumed as a JS string: the canvas share card, inline style={{}} team/tier
 * theming, and confetti. DOM styling uses the Tailwind utilities generated
 * from @theme in src/index.css, which mirrors these hexes — if you change a
 * value here, change it there too (deliberate 8-line duplication; canvas
 * can't read CSS custom properties without a mounted DOM).
 */

export const PALETTE = {
  /** Background base — warm near-black. */
  ink: '#0A0A0B',
  /** Panel / card background. */
  panel: '#141416',
  /** Raised surface (hover targets, chips). */
  raised: '#1C1C1F',
  /** Hairline borders. */
  edge: '#26262B',
  /** Hot accent — primary CTA / hero. ONE accent action per screen. */
  accent: '#FF5A1F',
  /** Accent hover / pressed. */
  accentDeep: '#D8410E',
  /** Text primary — warm white, not pure #FFF. */
  cream: '#FAFAF7',
  /** Text secondary — replaces flat gray. */
  muted: '#8A8A94',
  win: '#3FB950',
  loss: '#F04438',
} as const

/** Rarity tiers (DESIGN.md §3): rarity IS the card frame. */
export const RARITY_HEX = {
  Common: '#9BA1A6',
  Rare: '#3B82F6',
  Elite: '#C026D3',
  Legendary: '#F5B301',
} as const

/** The flaw wheel keeps its own green→amber→red identity — never the accent. */
export const FLAW_TIER_HEX = {
  Minor: '#FACC15',
  Moderate: '#FB8C1A',
  Severe: '#F04438',
} as const

export const TEAM_TIER_HEX = {
  contender: '#F5B301',
  'playoff-lock': '#3FB950',
  middle: '#9BA1A6',
  rebuilding: '#FB8C1A',
  tanking: '#F04438',
} as const

/** Foil gradient stops shared by the DOM card frame and the canvas card. */
export const FOIL_STOPS = {
  Legendary: ['#F5B301', '#FFF3C4', '#F5B301', '#7A5A00'],
  Elite: ['#C026D3', '#F0ABFC', '#C026D3', '#5B0E66'],
} as const
