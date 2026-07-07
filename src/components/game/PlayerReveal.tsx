import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../../constants/attributes'
import { TEAM_BY_NAME } from '../../constants/teams'
import { convertGradeToRating } from '../../game-logic/grades'
import { getPlayersByTeamAndGroup } from '../../game-logic/spin'
import { useGame } from '../../state/GameContext'
import type { AttributeKey, Player, Rarity } from '../../types'
import { Dices, RotateCw } from 'lucide-react'
import { Button, GradeBadge, RarityBadge, RARITY_TEXT, TeamBadge } from '../shared/atoms'
import { CollectibleFrame } from '../shared/CollectibleFrame'

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Elite', 'Legendary']

export function PlayerReveal({ player }: { player: Player }) {
  const { state, dispatch } = useGame()
  const team = TEAM_BY_NAME[player.team]
  const available = ATTRIBUTE_KEYS.filter(
    (k) => !(k in state.lockedAttributes),
  )
  const canRespin = state.respinsLeft > 0

  // Risk It odds preview: who else is in this team's pool if you reroll
  const riskPool = state.group
    ? getPlayersByTeamAndGroup(player.team, state.group).filter(
        (p) => p.name !== player.name,
      )
    : []
  const riskCounts = RARITY_ORDER.map(
    (r) => [r, riskPool.filter((p) => p.rarity === r).length] as const,
  ).filter(([, n]) => n > 0)

  // Reveal flair: the foil frame carries rarity; Legendary/Elite add their
  // glow burst on top of the shared flip + settle.
  const flairClass =
    player.rarity === 'Legendary'
      ? 'anim-legendary'
      : player.rarity === 'Elite'
        ? 'anim-elite'
        : 'anim-card-flip'

  return (
    <CollectibleFrame
      rarity={player.rarity}
      className={flairClass}
      contentClassName="p-4 sm:p-5"
      // The dealt team's color washes the card head — team presence without
      // fighting the rarity frame.
      contentStyle={
        team
          ? {
              backgroundImage: `linear-gradient(160deg, ${team.primaryColor}2e, transparent 38%)`,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        {team && <TeamBadge team={team} size="lg" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display font-normal uppercase text-2xl sm:text-3xl leading-none text-cream">
              {player.name}
            </h3>
            <RarityBadge rarity={player.rarity} />
          </div>
          <div className="mt-1 text-sm text-muted">
            {player.team} · {player.primaryPosition}
            {player.secondaryPositions.length > 0 &&
              ` / ${player.secondaryPositions.join(' / ')}`}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {player.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-[0.08em] bg-raised text-muted rounded-full px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Full grade list */}
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {ATTRIBUTE_KEYS.map((key) => (
          <div
            key={key}
            className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
              key in state.lockedAttributes
                ? 'bg-ink/60 opacity-40'
                : 'bg-raised'
            }`}
          >
            <span className="text-muted truncate mr-1">
              {ATTRIBUTE_LABELS[key]}
            </span>
            <GradeBadge grade={player.grades[key]} size="sm" />
          </div>
        ))}
      </div>

      {/* Lock buttons — available attributes only */}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
          Lock an attribute ({available.length} open)
        </div>
        <div className="flex flex-wrap gap-2">
          {available.map((key: AttributeKey) => (
            <button
              key={key}
              onClick={() => dispatch({ type: 'LOCK_ATTRIBUTE', attribute: key })}
              className="group flex items-center gap-2 bg-raised border border-edge hover:border-accent rounded-xl px-3 py-2 transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-sm font-semibold text-cream/90 group-hover:text-cream">
                {ATTRIBUTE_LABELS[key]}
              </span>
              <GradeBadge grade={player.grades[key]} size="sm" />
              <span className="text-[10px] text-muted">
                {convertGradeToRating(player.grades[key])}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Respin / Risk It */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <Button
          variant="secondary"
          className="inline-flex items-center gap-2"
          disabled={!canRespin}
          onClick={() => dispatch({ type: 'RESPIN' })}
        >
          <RotateCw className="w-4 h-4" aria-hidden />
          Respin Team
        </Button>
        <Button
          variant="danger"
          className="inline-flex items-center gap-2"
          disabled={!canRespin || riskPool.length === 0}
          onClick={() => dispatch({ type: 'RISK_IT' })}
        >
          <Dices className="w-4 h-4" aria-hidden />
          Risk It
        </Button>
        {canRespin && riskPool.length > 0 && (
          <span className="text-xs text-muted">
            Risk It pool — {riskPool.length} other{riskPool.length === 1 ? '' : 's'}:{' '}
            {riskCounts.map(([rarity, n], i) => (
              <span key={rarity}>
                {i > 0 && ' · '}
                <span className={`font-semibold ${RARITY_TEXT[rarity]}`}>
                  {n} {rarity}
                </span>
              </span>
            ))}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs text-muted">
        {canRespin
          ? `${state.respinsLeft} respin${state.respinsLeft === 1 ? '' : 's'} banked — both cost 1, and unused respins can reroll the Fatal Flaw wheel`
          : 'No respins left — the Fatal Flaw wheel will be final'}
      </div>
    </CollectibleFrame>
  )
}
