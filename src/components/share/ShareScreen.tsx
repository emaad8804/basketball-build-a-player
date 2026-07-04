import { useEffect, useMemo, useState } from 'react'
import { ATTRIBUTE_KEYS, GROUP_LABELS } from '../../constants/attributes'
import { ATTRIBUTE_LABELS } from '../../constants/attributes'
import { FLAW_BY_ID, FLAW_TIER_COLORS } from '../../constants/flaws'
import { saveDailyRecord } from '../../game-logic/dailyStore'
import { useGame } from '../../state/GameContext'
import { saveIfBest } from '../../utils/bestBuild'
import { buildShareText, rarityRow, resultLine } from '../../utils/shareText'
import { shareCard } from '../../utils/shareCard'
import { Button, Card } from '../shared/atoms'

export function ShareScreen() {
  const { state, dispatch } = useGame()
  const [copied, setCopied] = useState(false)
  const [newBest, setNewBest] = useState(false)
  const group = state.group!
  const season = state.seasonResult
  const playoffs = state.playoffResult
  const finals = state.finalsResult
  const flaw = state.flawId ? FLAW_BY_ID[state.flawId] : null

  useEffect(() => {
    if (state.overall === null || !state.legacyLabel || !state.archetype) return
    const becameBest = saveIfBest({
      overall: state.overall,
      archetype: state.archetype,
      legacyLabel: state.legacyLabel,
      group,
      champion: finals?.won ?? false,
      date: new Date().toISOString().slice(0, 10),
    })
    setNewBest(becameBest)

    // Lock the official daily run into history (first finish wins)
    if (
      state.mode === 'daily' &&
      state.dailyDateKey !== null &&
      state.dailyNumber !== null
    ) {
      saveDailyRecord({
        dateKey: state.dailyDateKey,
        dayNumber: state.dailyNumber,
        group,
        overall: state.overall,
        archetype: state.archetype,
        legacyLabel: state.legacyLabel,
        raritySquares: ATTRIBUTE_KEYS.map(
          (k) => state.lockedAttributes[k]?.rarity ?? 'Common',
        ),
        flawId: state.flawId,
        flawRerolled: state.flawRerolled,
        respinSaved: state.respinsLeft > 0,
        champion: finals?.won ?? false,
        resultLine: resultLine(state),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      : playoffs?.seasonEndingInjury
        ? `Season-ending injury (${playoffs.seasonEndingInjury})`
        : playoffs === null
          ? ''
          : finals
            ? finals.won
              ? `NBA Champion (beat ${finals.opponent} ${finals.winsFor}–${finals.winsAgainst})`
              : `Lost NBA Finals to ${finals.opponent} ${finals.winsFor}–${finals.winsAgainst}`
            : `Eliminated in ${playoffs.eliminatedIn}`

  const shareText = buildShareText(state)

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
            {state.mode === 'daily'
              ? `Daily Challenge #${state.dailyNumber} Complete`
              : 'Career Complete'}
          </div>
          <div className="mt-3 text-5xl font-black text-white">
            {state.overall}{' '}
            <span className="text-lg font-bold text-gray-400">OVR</span>
          </div>
          <div className="mt-1 text-xl font-bold text-ball-bright">
            {state.archetype}
          </div>
          <div className="text-sm text-gray-400">{GROUP_LABELS[group]} Build</div>

          {/* Fatal Flaw verdict */}
          {state.flawSpun && (
            <div className="mt-3">
              {flaw ? (
                <span
                  className="inline-block text-xs font-bold rounded-full border px-3 py-1"
                  style={{
                    color: FLAW_TIER_COLORS[flaw.tier],
                    borderColor: `${FLAW_TIER_COLORS[flaw.tier]}88`,
                    backgroundColor: `${FLAW_TIER_COLORS[flaw.tier]}14`,
                  }}
                >
                  {flaw.emoji} {flaw.name}
                </span>
              ) : (
                <span className="inline-block text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/50 rounded-full px-3 py-1">
                  🍀 CLEAN BUILD
                </span>
              )}
            </div>
          )}

          <div className="mt-4 inline-block bg-gradient-to-r from-amber-400/20 via-amber-300/30 to-amber-400/20 border border-amber-400/50 rounded-full px-6 py-2">
            <span className="text-lg font-black text-amber-300">
              {state.legacyLabel}
            </span>
          </div>
          {newBest && (
            <div className="mt-2 anim-pop-in text-xs font-bold uppercase tracking-wider text-emerald-300">
              ★ New personal best!
            </div>
          )}

          {/* Emoji share preview */}
          <div className="mt-4 text-2xl tracking-widest">{rarityRow(state)}</div>
          <div className="text-[10px] text-gray-500 mt-1">
            ⬜ common · 🟦 rare · 🟪 elite · 🟨 legendary
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
        <Button variant="secondary" onClick={() => shareCard(state)}>
          🖼️ Share Card
        </Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? '✅ Copied!' : '📋 Copy Result'}
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'PLAY_AGAIN' })}>
          🔁 Play Again
        </Button>
        {state.mode === 'free' && (
          <Button variant="ghost" onClick={() => dispatch({ type: 'RESET_BUILD' })}>
            Reset Build
          </Button>
        )}
      </div>
    </div>
  )
}
