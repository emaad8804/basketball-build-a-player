import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../../constants/attributes'
import { GRADE_TO_PRICE, RESPIN_COST } from '../../constants/budget'
import { TEAM_BY_NAME } from '../../constants/teams'
import { isMinimumWageSlate, lockCharge } from '../../game-logic/budget'
import { convertGradeToRating } from '../../game-logic/grades'
import { getPlayersByTeamAndGroup } from '../../game-logic/spin'
import { useGame } from '../../state/GameContext'
import type { AttributeKey, Player, Rarity } from '../../types'
import { Dices, HandCoins, RotateCw } from 'lucide-react'
import { Button, GradeBadge, RarityBadge, RARITY_TEXT, TeamBadge } from '../shared/atoms'
import { CollectibleFrame } from '../shared/CollectibleFrame'

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Elite', 'Legendary']

export function PlayerReveal({ player }: { player: Player }) {
  const { state, dispatch } = useGame()
  const team = TEAM_BY_NAME[player.team]
  const available = ATTRIBUTE_KEYS.filter(
    (k) => !(k in state.lockedAttributes),
  )

  // Budget mode: same helpers as the reducer guard, so the buttons can
  // never promise a lock the reducer would reject.
  const budgetLeft = state.mode === 'budget' ? state.budgetLeft : null
  const minWage =
    budgetLeft !== null &&
    isMinimumWageSlate(player, state.lockedAttributes, budgetLeft)
  const chargeFor = (key: AttributeKey): number | null =>
    budgetLeft === null
      ? null
      : lockCharge(player, state.lockedAttributes, budgetLeft, key)

  // Budget mode: the second respin carries the $1M tax — wherever spent
  const paidRespin = state.mode === 'budget' && state.respinsLeft === 1
  const canAffordRespin = !paidRespin || (budgetLeft ?? 0) >= RESPIN_COST
  const canRespin = state.respinsLeft > 0 && canAffordRespin

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
            <span className="flex items-center gap-1">
              <GradeBadge grade={player.grades[key]} size="sm" />
              {budgetLeft !== null && (
                <span className="text-[10px] text-muted tabular-nums">
                  ${GRADE_TO_PRICE[player.grades[key]]}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Lock buttons — available attributes only */}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
          Lock an attribute ({available.length} open)
        </div>
        {minWage && (
          <div className="mb-2 flex items-start gap-1.5 text-xs text-win">
            <HandCoins className="w-4 h-4 shrink-0" aria-hidden />
            <span>
              Minimum-wage signing — you can't afford anything on this card.
              The cheapest skill is free.
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {available.map((key: AttributeKey) => {
            const charge = chargeFor(key)
            const blocked = budgetLeft !== null && charge === null
            return (
              <button
                key={key}
                disabled={blocked}
                onClick={() => dispatch({ type: 'LOCK_ATTRIBUTE', attribute: key })}
                className={`group flex items-center gap-2 bg-raised border border-edge rounded-xl px-3 py-2 transition-all cursor-pointer ${
                  blocked
                    ? 'opacity-40 pointer-events-none'
                    : 'hover:border-accent active:scale-95'
                }`}
              >
                <span className="text-sm font-semibold text-cream/90 group-hover:text-cream">
                  {ATTRIBUTE_LABELS[key]}
                </span>
                <GradeBadge grade={player.grades[key]} size="sm" />
                {budgetLeft === null ? (
                  <span className="text-[10px] text-muted">
                    {convertGradeToRating(player.grades[key])}
                  </span>
                ) : charge === 0 ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-win bg-win/15 border border-win/40 rounded-full px-1.5 py-0.5">
                    Free
                  </span>
                ) : (
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      blocked ? 'text-loss' : 'text-cream/70'
                    }`}
                  >
                    ${GRADE_TO_PRICE[player.grades[key]]}M
                  </span>
                )}
              </button>
            )
          })}
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
          Respin Team{paidRespin && ' — $1M'}
        </Button>
        <Button
          variant="danger"
          className="inline-flex items-center gap-2"
          disabled={!canRespin || riskPool.length === 0}
          onClick={() => dispatch({ type: 'RISK_IT' })}
        >
          <Dices className="w-4 h-4" aria-hidden />
          Risk It{paidRespin && ' — $1M'}
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
        {state.mode === 'budget'
          ? state.respinsLeft <= 0
            ? 'No respins left — the Fatal Flaw wheel will be final'
            : !canAffordRespin
              ? "Can't afford the $1M respin — lock a skill"
              : paidRespin
                ? 'Last respin banked — it costs $1M, wherever you spend it'
                : '2 respins banked — the first is free, the second costs $1M'
          : canRespin
            ? `${state.respinsLeft} respin${state.respinsLeft === 1 ? '' : 's'} banked — both cost 1, and unused respins can reroll the Fatal Flaw wheel`
            : 'No respins left — the Fatal Flaw wheel will be final'}
      </div>
    </CollectibleFrame>
  )
}
