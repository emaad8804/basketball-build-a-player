import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, GROUP_LABELS } from '../constants/attributes'
import { FLAW_BY_ID, FLAW_TIER_COLORS } from '../constants/flaws'
import { teamTierFor } from '../constants/teamStrength'
import type { GameState, Rarity } from '../types'
import { resultLine } from './shareText'

const W = 1080
const H = 1350

const RARITY_COLORS: Record<Rarity, string> = {
  Common: '#94a3b8',
  Rare: '#38bdf8',
  Elite: '#c084fc',
  Legendary: '#fbbf24',
}

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

/** Hand-drawn PNG player card — zero deps, pixel-identical everywhere. */
export async function generateShareCard(state: GameState): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const font = (size: number, weight = 800) =>
    `${weight} ${size}px Inter, system-ui, -apple-system, sans-serif`

  // Background
  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 260, 60, W / 2, 260, 700)
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.16)')
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'

  // Header
  const title = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0)
  title.addColorStop(0, '#fb923c')
  title.addColorStop(1, '#ea580c')
  ctx.fillStyle = title
  ctx.font = font(64, 900)
  ctx.fillText('🏀 BUILD-A-PLAYER', W / 2, 110)

  ctx.fillStyle = '#9ca3af'
  ctx.font = font(30, 600)
  ctx.fillText(
    state.mode === 'daily' && state.dailyNumber !== null
      ? `Daily Challenge #${state.dailyNumber} · ${state.dailyDateKey}`
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
  ring.addColorStop(0, '#fb923c')
  ring.addColorStop(1, '#ea580c')
  ctx.fillStyle = ring
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = font(96, 900)
  ctx.fillText(`${state.overall ?? ''}`, cx, cy + 24)
  ctx.font = font(22, 700)
  ctx.fillText('OVERALL', cx, cy + 62)

  // Archetype + group + team landing
  ctx.fillStyle = '#ffffff'
  ctx.font = font(52, 900)
  ctx.fillText(state.archetype ?? '', W / 2, 520)
  ctx.fillStyle = '#9ca3af'
  ctx.font = font(30, 600)
  const teamSuffix = state.homeTeam
    ? ` · ${state.homeTeam.name} (${teamTierFor(state.homeTeam.name).label})`
    : ''
  ctx.fillText(`${GROUP_LABELS[state.group!]} Build${teamSuffix}`, W / 2, 566)

  // Fatal Flaw / clean pill
  const flaw = state.flawId ? FLAW_BY_ID[state.flawId] : null
  const pillText = flaw
    ? `${flaw.emoji} FATAL FLAW: ${flaw.name.toUpperCase()}`
    : '🍀 CLEAN BUILD — NO FATAL FLAW'
  const pillColor = flaw ? FLAW_TIER_COLORS[flaw.tier] : '#34d399'
  ctx.font = font(30, 800)
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
    const color = locked ? RARITY_COLORS[locked.rarity] : '#334155'

    roundRect(ctx, x, y, tileW, tileH, 18)
    ctx.fillStyle = '#141922'
    ctx.fill()
    ctx.strokeStyle = `${color}aa`
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = '#9ca3af'
    ctx.font = font(22, 700)
    ctx.fillText(ATTRIBUTE_LABELS[key].toUpperCase(), x + 22, y + 40)
    ctx.fillStyle = '#e5e9f0'
    ctx.font = font(26, 600)
    const name = locked?.playerName ?? '—'
    ctx.fillText(
      name.length > 18 ? `${name.slice(0, 17)}…` : name,
      x + 22,
      y + 78,
    )
    ctx.textAlign = 'right'
    ctx.fillStyle = color
    ctx.font = font(40, 900)
    ctx.fillText(locked?.grade ?? '', x + tileW - 22, y + 66)
    ctx.textAlign = 'center'
  })

  // Result + legacy
  const bottomY = gridTop + 3 * tileH + 2 * gap + 90
  ctx.fillStyle = '#ffffff'
  ctx.font = font(44, 900)
  ctx.fillText(resultLine(state), W / 2, bottomY)

  const legacy = `Legacy: ${state.legacyLabel ?? ''}`
  ctx.font = font(34, 800)
  const legW = ctx.measureText(legacy).width + 80
  roundRect(ctx, W / 2 - legW / 2, bottomY + 32, legW, 66, 33)
  ctx.fillStyle = 'rgba(251, 191, 36, 0.15)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = '#fcd34d'
  ctx.fillText(legacy, W / 2, bottomY + 78)

  // Footer
  const season = state.seasonResult
  ctx.fillStyle = '#6b7280'
  ctx.font = font(26, 600)
  ctx.fillText(
    season ? `Regular season ${season.wins}–${season.losses}` : '',
    W / 2,
    H - 40,
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/** Share the card via the native sheet when possible, else download it. */
export async function shareCard(state: GameState): Promise<void> {
  const blob = await generateShareCard(state)
  if (!blob) return
  const file = new File([blob], 'build-a-player.png', { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Build-A-Player' })
      return
    } catch {
      // fall through to download (user may have cancelled — harmless)
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'build-a-player.png'
  a.click()
  URL.revokeObjectURL(url)
}
