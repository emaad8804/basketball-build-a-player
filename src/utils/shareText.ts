import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, GROUP_LABELS } from '../constants/attributes'
import { BUDGET_TIER_BY_ID } from '../constants/budget'
import { FLAW_BY_ID } from '../constants/flaws'
import { budgetSpent, efficiencyBadge } from '../game-logic/budget'
import { biggestMiss, computeDreamBuildResult } from '../game-logic/dreamBuild'
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
  return `${flaw.name}${state.flawRerolled ? ' (rerolled)' : ''}`
}

/** Dream Build hook: the biggest miss, or the Perfect Read flex. Free/Daily only. */
export function dreamLine(state: GameState): string {
  if (state.mode === 'budget' || !state.group || state.overall === null) return ''
  const result = computeDreamBuildResult(
    state.group,
    state.lockedAttributes,
    state.overall,
    state.rolledPlayerNames,
  )
  if (!result) return ''
  if (result.perfectRead) return '🎯 Perfect Read — kept the best of everyone I saw'
  if (result.missedOVR > 0) {
    const top = biggestMiss(state.lockedAttributes, result.dream, result.missed)
    if (!top) return ''
    return `👀 Left ${result.missedOVR} OVR on the table — had ${top.slot.grade} ${
      ATTRIBUTE_LABELS[top.attribute]
    } from ${top.slot.sourcePlayerName}`
  }
  return ''
}

/** One-line run outcome for share text and daily history. */
export function resultLine(state: GameState): string {
  const { seasonResult: season, playoffResult: playoffs, finalsResult: finals } = state
  if (!season) return ''
  if (!season.madePlayoffs && !state.playInResult?.survived) {
    if (state.playInResult?.seasonEndingInjury)
      return '💀 Season-ending injury (Play-In)'
    if (state.playInResult) return '🚨 Lost in the Play-In'
    return '📉 Missed the playoffs'
  }
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
      ? `🏀 Build-a-Hooper #${state.dailyNumber}`
      : '🏀 Build-a-Hooper'
  const respinNote =
    state.respinsLeft > 0 ? ' · respin saved ✅' : ''
  const budgetLine =
    state.mode === 'budget' && state.budgetTier && state.overall !== null
      ? `💰 $${BUDGET_TIER_BY_ID[state.budgetTier].budget}M ${
          BUDGET_TIER_BY_ID[state.budgetTier].label
        } · spent $${budgetSpent(state)}M · ${efficiencyBadge(
          state.budgetTier,
          state.overall,
        )}`
      : ''

  return [
    header,
    `${GROUP_LABELS[state.group!].toUpperCase()} · ${state.overall} OVR${
      state.homeTeam ? ` · ${state.homeTeam.abbr}` : ''
    }`,
    budgetLine,
    rarityRow(state),
    flawLine(state),
    `${resultLine(state)}${respinNote}`,
    dreamLine(state),
    state.legacyLabel ? `Legacy: ${state.legacyLabel}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
