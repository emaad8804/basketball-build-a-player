import { useEffect, useMemo, useState } from 'react'
import { Check, Clover, Copy, ImageDown, RotateCw, Share2, Trophy } from 'lucide-react'
import { ATTRIBUTE_KEYS, GROUP_LABELS } from '../../constants/attributes'
import { ATTRIBUTE_LABELS } from '../../constants/attributes'
import { RARITY_HEX } from '../../constants/designTokens'
import { FLAW_BY_ID, FLAW_TIER_COLORS } from '../../constants/flaws'
import { teamTierFor } from '../../constants/teamStrength'
import { saveDailyRecord } from '../../game-logic/dailyStore'
import { useGame } from '../../state/GameContext'
import { saveIfBest } from '../../utils/bestBuild'
import { buildShareText, resultLine } from '../../utils/shareText'
import { cardRarity, shareCard } from '../../utils/shareCard'
import { Button } from '../shared/atoms'
import { CollectibleFrame } from '../shared/CollectibleFrame'
import { FLAW_ICONS } from '../shared/icons'

export function ShareScreen() {
  const { state, dispatch } = useGame()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [cardState, setCardState] = useState<'idle' | 'making' | 'saved' | 'failed'>('idle')
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
        teamAbbr: state.homeTeam?.abbr,
        teamTierLabel: state.homeTeam
          ? teamTierFor(state.homeTeam.name).label
          : undefined,
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
    : !season.madePlayoffs && !state.playInResult?.survived
      ? state.playInResult
        ? state.playInResult.seasonEndingInjury
          ? 'Injured on play-in night'
          : 'Lost in the Play-In'
        : 'Missed the playoffs'
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
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      // Clipboard API unavailable (non-secure context, permissions) —
      // surface the text for manual copy instead of failing silently.
      setCopyState('failed')
    }
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Build-a-Hooper', text: shareText })
      } catch {
        // User cancelled share sheet
      }
    } else {
      copy()
    }
  }

  // The download path is otherwise silent — confirm it on the button itself
  const downloadCard = async () => {
    if (cardState === 'making') return
    setCardState('making')
    const outcome = await shareCard(state)
    if (outcome === 'downloaded') {
      setCardState('saved')
      setTimeout(() => setCardState('idle'), 2000)
    } else if (outcome === 'failed') {
      setCardState('failed')
      setTimeout(() => setCardState('idle'), 2500)
    } else {
      // Native sheet shown (shared/cancelled) — it was its own feedback
      setCardState('idle')
    }
  }

  const FlawIcon = flaw ? FLAW_ICONS[flaw.id] : Clover

  return (
    <div className="min-h-dvh px-4 py-8 max-w-2xl mx-auto flex flex-col items-center justify-center">
      <CollectibleFrame
        rarity={cardRarity(state)}
        className="w-full anim-card-flip"
        contentClassName="p-6 sm:p-8"
      >
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-muted">
            {state.mode === 'daily'
              ? `Daily Challenge #${state.dailyNumber} Complete`
              : 'Career Complete'}
          </div>
          <div className="mt-3 font-display font-normal text-6xl text-cream">
            {state.overall}{' '}
            <span className="text-lg font-sans font-bold text-muted">OVR</span>
          </div>
          <div className="mt-1 font-display font-normal uppercase text-2xl text-accent">
            {state.archetype}
          </div>
          <div className="mt-0.5 text-sm text-muted">
            {GROUP_LABELS[group]} Build
            {state.homeTeam && ` · ${state.homeTeam.name}`}
          </div>

          {/* Fatal Flaw verdict */}
          {state.flawSpun && (
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold rounded-full border px-3 py-1"
                style={
                  flaw
                    ? {
                        color: FLAW_TIER_COLORS[flaw.tier],
                        borderColor: `${FLAW_TIER_COLORS[flaw.tier]}88`,
                        backgroundColor: `${FLAW_TIER_COLORS[flaw.tier]}14`,
                      }
                    : undefined
                }
              >
                <FlawIcon className={`w-3.5 h-3.5 ${flaw ? '' : 'text-win'}`} aria-hidden />
                {flaw ? (
                  flaw.name
                ) : (
                  <span className="text-win">CLEAN BUILD</span>
                )}
              </span>
            </div>
          )}

          <div className="mt-4 inline-block bg-rarity-legendary/15 border border-rarity-legendary/50 rounded-full px-6 py-2">
            <span className="text-lg font-bold text-rarity-legendary">
              {state.legacyLabel}
            </span>
          </div>
          {newBest && (
            <div className="mt-2 anim-pop-in text-xs font-bold uppercase tracking-wider text-win">
              New personal best
            </div>
          )}

          {/* Rarity pips — one per locked attribute, in board order */}
          <div className="mt-4 flex justify-center gap-1.5">
            {ATTRIBUTE_KEYS.map((k) => {
              const rarity = state.lockedAttributes[k]?.rarity ?? 'Common'
              return (
                <span
                  key={k}
                  title={`${ATTRIBUTE_LABELS[k]}: ${rarity}`}
                  className="w-4 h-4 rounded-[4px]"
                  style={{ backgroundColor: RARITY_HEX[rarity] }}
                />
              )
            })}
          </div>
          <div className="text-[10px] text-muted mt-1.5 flex justify-center gap-3">
            {(['Common', 'Rare', 'Elite', 'Legendary'] as const).map((r) => (
              <span key={r} className="inline-flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-[2px] inline-block"
                  style={{ backgroundColor: RARITY_HEX[r] }}
                />
                {r.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-edge pt-4 space-y-2 text-sm">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold">
            Top Picks
          </div>
          {topPicks.map((pick) => (
            <div key={pick.attribute} className="flex justify-between">
              <span className="text-cream/90">{pick.playerName}</span>
              <span className="text-muted">
                {ATTRIBUTE_LABELS[pick.attribute]} · {pick.grade}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-edge pt-4 grid grid-cols-2 gap-3 text-sm">
          {season && (
            <div>
              <div className="text-xs text-muted">Regular Season</div>
              <div className="font-bold text-cream">
                {season.wins}–{season.losses}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted">Postseason</div>
            <div className="font-bold text-cream">{playoffSummary || '—'}</div>
          </div>
          {finals?.won && finals.finalsMvp && (
            <div>
              <div className="text-xs text-muted">Finals MVP</div>
              <div className="font-bold text-rarity-legendary inline-flex items-center gap-1">
                Yes <Trophy className="w-3.5 h-3.5" aria-hidden />
              </div>
            </div>
          )}
        </div>
      </CollectibleFrame>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button className="inline-flex items-center gap-2" onClick={share}>
          <Share2 className="w-4 h-4" aria-hidden />
          Share Build
        </Button>
        <Button
          variant="secondary"
          className="inline-flex items-center gap-2"
          onClick={downloadCard}
        >
          {cardState === 'saved' ? (
            <Check className="w-4 h-4 text-win" aria-hidden />
          ) : (
            <ImageDown className="w-4 h-4" aria-hidden />
          )}
          {cardState === 'making'
            ? 'Printing…'
            : cardState === 'saved'
              ? 'Card saved!'
              : cardState === 'failed'
                ? 'Card failed — retry'
                : 'Share Card'}
        </Button>
        <Button
          variant="secondary"
          className="inline-flex items-center gap-2"
          onClick={copy}
        >
          {copyState === 'copied' ? (
            <Check className="w-4 h-4 text-win" aria-hidden />
          ) : (
            <Copy className="w-4 h-4" aria-hidden />
          )}
          {copyState === 'copied' ? 'Copied!' : 'Copy Result'}
        </Button>
        <Button
          variant="secondary"
          className="inline-flex items-center gap-2"
          onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
        >
          <RotateCw className="w-4 h-4" aria-hidden />
          Play Again
        </Button>
        {state.mode === 'free' && (
          <Button variant="ghost" onClick={() => dispatch({ type: 'RESET_BUILD' })}>
            Reset Build
          </Button>
        )}
      </div>

      {/* Clipboard blocked (non-secure context / permissions): manual copy */}
      {copyState === 'failed' && (
        <div className="mt-4 w-full anim-rise-in">
          <div className="text-xs text-muted mb-1.5 text-center">
            Couldn't reach the clipboard — select and copy your result below.
          </div>
          <textarea
            readOnly
            value={shareText}
            rows={6}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full text-sm bg-panel border border-edge rounded-xl p-3 text-cream/90 font-sans resize-none"
            aria-label="Share text for manual copying"
          />
        </div>
      )}
    </div>
  )
}
