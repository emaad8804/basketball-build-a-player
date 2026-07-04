import { useMemo, useState } from 'react'
import { GROUP_LABELS } from '../../constants/attributes'
import { ATTRIBUTE_LABELS } from '../../constants/attributes'
import { useGame } from '../../state/GameContext'
import { Button, Card } from '../shared/atoms'

export function ShareScreen() {
  const { state, dispatch } = useGame()
  const [copied, setCopied] = useState(false)
  const group = state.group!
  const season = state.seasonResult
  const playoffs = state.playoffResult
  const finals = state.finalsResult

  // Top 3 locked attributes by rating
  const topPicks = useMemo(
    () =>
      Object.values(state.lockedAttributes)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3),
    [state.lockedAttributes],
  )

  const playoffSummary = !season
    ? ''
    : !season.madePlayoffs
      ? 'Missed the playoffs'
      : playoffs === null
        ? ''
        : finals
          ? finals.won
            ? `NBA Champion (beat ${finals.opponent} ${finals.winsFor}–${finals.winsAgainst})`
            : `Lost NBA Finals to ${finals.opponent} ${finals.winsFor}–${finals.winsAgainst}`
          : `Eliminated in ${playoffs.eliminatedIn}`

  const shareText = [
    `🏀 BUILD-A-PLAYER — ${GROUP_LABELS[group]}`,
    `${state.overall} OVR ${state.archetype}`,
    `Top picks: ${topPicks.map((p) => `${p.playerName} (${ATTRIBUTE_LABELS[p.attribute]} ${p.grade})`).join(', ')}`,
    season ? `Season: ${season.wins}–${season.losses}` : '',
    playoffSummary,
    finals?.won && finals.finalsMvp ? 'Finals MVP 🏆' : '',
    `Legacy: ${state.legacyLabel}`,
  ]
    .filter(Boolean)
    .join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — no-op
    }
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Build-A-Player', text: shareText })
      } catch {
        // User cancelled share sheet
      }
    } else {
      copy()
    }
  }

  return (
    <div className="min-h-dvh px-4 py-8 max-w-2xl mx-auto flex flex-col items-center justify-center">
      <Card glow className="w-full p-6 sm:p-8 anim-card-flip">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-gray-400">
            Career Complete
          </div>
          <div className="mt-3 text-5xl font-black text-white">
            {state.overall}{' '}
            <span className="text-lg font-bold text-gray-400">OVR</span>
          </div>
          <div className="mt-1 text-xl font-bold text-ball-bright">
            {state.archetype}
          </div>
          <div className="text-sm text-gray-400">{GROUP_LABELS[group]} Build</div>

          <div className="mt-5 inline-block bg-gradient-to-r from-amber-400/20 via-amber-300/30 to-amber-400/20 border border-amber-400/50 rounded-full px-6 py-2">
            <span className="text-lg font-black text-amber-300">
              {state.legacyLabel}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-court-border pt-4 space-y-2 text-sm">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Top Picks
          </div>
          {topPicks.map((pick) => (
            <div key={pick.attribute} className="flex justify-between">
              <span className="text-gray-200">{pick.playerName}</span>
              <span className="text-gray-400">
                {ATTRIBUTE_LABELS[pick.attribute]} · {pick.grade}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-court-border pt-4 grid grid-cols-2 gap-3 text-sm">
          {season && (
            <div>
              <div className="text-xs text-gray-500">Regular Season</div>
              <div className="font-bold text-white">
                {season.wins}–{season.losses}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500">Postseason</div>
            <div className="font-bold text-white">{playoffSummary || '—'}</div>
          </div>
          {finals?.won && finals.finalsMvp && (
            <div>
              <div className="text-xs text-gray-500">Finals MVP</div>
              <div className="font-bold text-amber-300">Yes 🏆</div>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={share}>📤 Share Build</Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? '✅ Copied!' : '📋 Copy Result'}
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'PLAY_AGAIN' })}>
          🔁 Play Again
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: 'RESET_BUILD' })}>
          Reset Build
        </Button>
      </div>
    </div>
  )
}
