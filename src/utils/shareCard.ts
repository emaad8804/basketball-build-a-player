import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, GROUP_LABELS } from '../constants/attributes'
import { BUDGET_TIER_BY_ID } from '../constants/budget'
import { FLAW_BY_ID, FLAW_TIER_COLORS } from '../constants/flaws'
import { teamTierFor } from '../constants/teamStrength'
import { FOIL_STOPS, PALETTE, RARITY_HEX } from '../constants/designTokens'
import { budgetSpent, efficiencyBadge } from '../game-logic/budget'
import type { GameState, Rarity } from '../types'
import { resultLine } from './shareText'

const W = 1080
const H = 1350

/** Best locked rarity decides the card's foil frame (rarity IS the frame). */
const RARITY_RANK: Rarity[] = ['Common', 'Rare', 'Elite', 'Legendary']
export function cardRarity(state: GameState): Rarity {
  return Object.values(state.lockedAttributes).reduce<Rarity>(
    (best, lock) =>
      lock && RARITY_RANK.indexOf(lock.rarity) > RARITY_RANK.indexOf(best)
        ? lock.rarity
        : best,
    'Common',
  )
}

// Canvas text ignores CSS font loading — faces must be fetched and ready
// before ctx.font can use them, or the card silently renders in system-ui.
// document.fonts.load() (not just .ready) triggers the fetch for weights
// that haven't been painted in the DOM yet.
let cardFonts: Promise<unknown> | null = null
function ensureCardFonts() {
  cardFonts ??= Promise.all([
    document.fonts.load('400 96px Anton'),
    document.fonts.load('600 30px Geist'),
    document.fonts.load('700 30px Geist'),
  ]).then(() => document.fonts.ready)
  return cardFonts
}

// Display face for hero moments (Anton is 400-only), UI face for everything else.
const displayFont = (size: number) => `400 ${size}px Anton, "Arial Narrow", sans-serif`
const uiFont = (size: number, weight = 600) =>
  `${weight} ${size}px Geist, system-ui, -apple-system, sans-serif`

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * The frame: flat stroke for Common/Rare, diagonal foil gradient for
 * Elite/Legendary plus one frozen sheen band across the upper half —
 * the static twin of the DOM card's .foil-* / .sheen treatment.
 */
function drawFrame(ctx: CanvasRenderingContext2D, rarity: Rarity) {
  const inset = 14
  const r = 36
  const foil = rarity === 'Elite' || rarity === 'Legendary'
  roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, r)
  if (foil) {
    const g = ctx.createLinearGradient(0, 0, W, H)
    const stops = FOIL_STOPS[rarity as 'Elite' | 'Legendary']
    stops.forEach((hex, i) => g.addColorStop(i / (stops.length - 1), hex))
    ctx.strokeStyle = g
    ctx.lineWidth = rarity === 'Legendary' ? 12 : 9
  } else {
    ctx.strokeStyle = rarity === 'Rare' ? RARITY_HEX.Rare : `${RARITY_HEX.Common}66`
    ctx.lineWidth = 4
  }
  ctx.stroke()

  if (foil) {
    // Frozen sheen: one soft diagonal light band clipped to the card.
    ctx.save()
    roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, r)
    ctx.clip()
    const sheen = ctx.createLinearGradient(W * 0.15, 0, W * 0.65, H * 0.5)
    sheen.addColorStop(0, 'rgba(255,255,255,0)')
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.07)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = sheen
    ctx.fillRect(0, 0, W, H * 0.55)
    ctx.restore()
  }
}

/** Hand-drawn PNG player card — zero deps, pixel-identical everywhere. */
export async function generateShareCard(state: GameState): Promise<Blob | null> {
  await ensureCardFonts()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Background: near-black with a soft wash of the landed team's color
  ctx.fillStyle = PALETTE.ink
  ctx.fillRect(0, 0, W, H)
  const glowHex = state.homeTeam?.primaryColor ?? PALETTE.accent
  const glow = ctx.createRadialGradient(W / 2, 260, 60, W / 2, 260, 700)
  glow.addColorStop(0, `${glowHex}24`)
  glow.addColorStop(1, `${glowHex}00`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Rarity frame — the card IS the collectible object
  drawFrame(ctx, cardRarity(state))

  ctx.textAlign = 'center'

  // Wordmark
  ctx.fillStyle = PALETTE.accent
  ctx.font = displayFont(64)
  ctx.fillText('BUILD-A-HOOPER', W / 2, 110)

  ctx.fillStyle = PALETTE.muted
  ctx.font = uiFont(30)
  ctx.fillText(
    state.mode === 'daily' && state.dailyNumber !== null
      ? `Daily Challenge #${state.dailyNumber} · ${state.dailyDateKey}`
      : state.mode === 'budget' && state.budgetTier
        ? `Budget Mode · $${BUDGET_TIER_BY_ID[state.budgetTier].budget}M ${BUDGET_TIER_BY_ID[state.budgetTier].label}`
        : 'Free Play',
    W / 2,
    162,
  )

  // Overall ring
  const cx = W / 2
  const cy = 330
  ctx.beginPath()
  ctx.arc(cx, cy, 110, 0, Math.PI * 2)
  const ring = ctx.createLinearGradient(cx - 110, cy - 110, cx + 110, cy + 110)
  ring.addColorStop(0, PALETTE.accent)
  ring.addColorStop(1, PALETTE.accentDeep)
  ctx.fillStyle = ring
  ctx.fill()
  ctx.fillStyle = PALETTE.ink
  ctx.font = displayFont(96)
  ctx.fillText(`${state.overall ?? ''}`, cx, cy + 24)
  ctx.font = uiFont(22, 700)
  ctx.fillText('OVERALL', cx, cy + 62)

  // Archetype + group + team landing
  ctx.fillStyle = PALETTE.cream
  ctx.font = displayFont(52)
  ctx.fillText((state.archetype ?? '').toUpperCase(), W / 2, 520)
  ctx.fillStyle = PALETTE.muted
  ctx.font = uiFont(30)
  const teamSuffix = state.homeTeam
    ? ` · ${state.homeTeam.name} (${teamTierFor(state.homeTeam.name).label})`
    : ''
  ctx.fillText(`${GROUP_LABELS[state.group!]} Build${teamSuffix}`, W / 2, 566)

  // Fatal Flaw / clean pill
  const flaw = state.flawId ? FLAW_BY_ID[state.flawId] : null
  const pillText = flaw
    ? `FATAL FLAW: ${flaw.name.toUpperCase()}`
    : 'CLEAN BUILD — NO FATAL FLAW'
  const pillColor = flaw ? FLAW_TIER_COLORS[flaw.tier] : PALETTE.win
  ctx.font = uiFont(30, 700)
  const pillW = ctx.measureText(pillText).width + 70
  roundRect(ctx, W / 2 - pillW / 2, 600, pillW, 62, 31)
  ctx.fillStyle = `${pillColor}22`
  ctx.fill()
  ctx.strokeStyle = pillColor
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = pillColor
  ctx.fillText(pillText, W / 2, 642)

  // Attribute grid: 3x3 tiles colored by rarity
  const gridTop = 710
  const tileW = 316
  const tileH = 108
  const gap = 18
  const gridLeft = (W - (tileW * 3 + gap * 2)) / 2
  ATTRIBUTE_KEYS.forEach((key, i) => {
    const locked = state.lockedAttributes[key]
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = gridLeft + col * (tileW + gap)
    const y = gridTop + row * (tileH + gap)
    const color = locked ? RARITY_HEX[locked.rarity] : PALETTE.edge

    roundRect(ctx, x, y, tileW, tileH, 18)
    ctx.fillStyle = PALETTE.panel
    ctx.fill()
    ctx.strokeStyle = `${color}aa`
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = PALETTE.muted
    ctx.font = uiFont(22, 700)
    ctx.fillText(ATTRIBUTE_LABELS[key].toUpperCase(), x + 22, y + 40)
    ctx.fillStyle = PALETTE.cream
    ctx.font = uiFont(24)
    const name = locked?.playerName ?? '—'
    ctx.fillText(
      name.length > 15 ? `${name.slice(0, 14)}…` : name,
      x + 22,
      y + 78,
    )
    ctx.textAlign = 'right'
    ctx.fillStyle = color
    ctx.font = uiFont(40, 700)
    ctx.fillText(locked?.grade ?? '', x + tileW - 22, y + 66)
    ctx.textAlign = 'center'
  })

  // Result + legacy
  const bottomY = gridTop + 3 * tileH + 2 * gap + 90
  ctx.fillStyle = PALETTE.cream
  ctx.font = displayFont(44)
  ctx.fillText(resultLine(state).toUpperCase(), W / 2, bottomY)

  const legacy = `Legacy: ${state.legacyLabel ?? ''}`
  ctx.font = uiFont(34, 700)
  const legW = ctx.measureText(legacy).width + 80
  roundRect(ctx, W / 2 - legW / 2, bottomY + 32, legW, 66, 33)
  ctx.fillStyle = 'rgba(245, 179, 1, 0.15)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(245, 179, 1, 0.6)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = RARITY_HEX.Legendary
  ctx.fillText(legacy, W / 2, bottomY + 78)

  // Budget efficiency line — bold + cream so it reads at thumbnail size
  if (state.mode === 'budget' && state.budgetTier && state.overall !== null) {
    ctx.fillStyle = PALETTE.cream
    ctx.font = uiFont(30, 700)
    ctx.fillText(
      `SPENT $${budgetSpent(state)}M · LEFT $${state.budgetLeft ?? 0}M · ${efficiencyBadge(state.budgetTier, state.overall).toUpperCase()}`,
      W / 2,
      H - 88,
    )
  }

  // Footer
  const season = state.seasonResult
  ctx.fillStyle = PALETTE.muted
  ctx.font = uiFont(26)
  ctx.fillText(
    season ? `Regular season ${season.wins}–${season.losses}` : '',
    W / 2,
    H - 40,
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export type ShareCardOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed'

/** Share the card via the native sheet when possible, else download it. */
export async function shareCard(state: GameState): Promise<ShareCardOutcome> {
  const blob = await generateShareCard(state)
  if (!blob) return 'failed'
  const file = new File([blob], 'build-a-hooper.png', { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Build-a-Hooper' })
      return 'shared'
    } catch (err) {
      // Closing the sheet is a choice — respect it, no surprise download
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
      // Real share failure — fall through to the download path
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'build-a-hooper.png'
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
