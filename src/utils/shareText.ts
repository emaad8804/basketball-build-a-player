import { ATTRIBUTE_KEYS, GROUP_LABELS } from '../constants/attributes'
import { FLAW_BY_ID } from '../constants/flaws'
import type { GameState, Rarity } from '../types'

const RARITY_SQUARES: Record<Rarity, string> = {
  Common: '⬜',
  Rare: '🟦',
  Elite: '🟪',
  Legendary: '🟨',
}

export function rarityRow(state: GameState): string {
  return ATTRIBUTE_KEYS.map((k) => {
    const locked = state.lockedAttributes[k]
    return locked ? RARITY_SQUARES[locked.rarity] : '⬛'
  }).join('')
}

export function flawLine(state: GameState): string {
  if (!state.flawSpun) return ''
  if (state.flawId === null) {
    return `🍀 No Flaw${state.flawRerolled ? ' (rerolled 🔄)' : ''}`
  }
  const flaw = FLAW_BY_ID[state.flawId]
  return `${flaw.emoji} ${flaw.name}${state.flawRerolled ? ' (rerolled 🔄)' : ''}`
}

/** One-line run outcome for share text and daily history. */
export function resultLine(state: GameState): string {
  const { seasonResult: season, playoffResult: playoffs, finalsResult: finals } = state
  if (!season) return ''
  if (!season.madePlayoffs) return '📉 Missed the playoffs'
  if (playoffs?.seasonEndingInjury)
    return `💀 Season-ending injury (${playoffs.seasonEndingInjury})`
  if (finals) {
    return finals.won
      ? '🏆 NBA CHAMPION'
      : `🥈 Lost the Finals ${finals.winsFor}–${finals.winsAgainst}`
  }
  if (playoffs && !playoffs.reachedFinals) return `❌ Out in the ${playoffs.eliminatedIn}`
  return ''
}

/**
 * Wordle-style emoji share. Daily runs lead with the challenge number;
 * free-play runs share the same shape without one.
 */
export function buildShareText(state: GameState): string {
  const header =
    state.mode === 'daily' && state.dailyNumber !== null
      ? `🏀 Build-a-Player #${state.dailyNumber}`
      : '🏀 Build-a-Player'
  const respinNote =
    state.respinsLeft > 0 ? ' · respin saved ✅' : ''

  return [
    header,
    `${GROUP_LABELS[state.group!].toUpperCase()} · ${state.overall} OVR${
      state.homeTeam ? ` · ${state.homeTeam.abbr}` : ''
    }`,
    rarityRow(state),
    flawLine(state),
    `${resultLine(state)}${respinNote}`,
    state.legacyLabel ? `Legacy: ${state.legacyLabel}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
