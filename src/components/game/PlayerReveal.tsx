import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../../constants/attributes'
import { TEAM_BY_NAME } from '../../constants/teams'
import { convertGradeToRating } from '../../game-logic/grades'
import { getPlayersByTeamAndGroup } from '../../game-logic/spin'
import { useGame } from '../../state/GameContext'
import type { AttributeKey, Player, Rarity } from '../../types'
import { Button, GradeBadge, RarityBadge, TeamBadge } from '../shared/atoms'

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Elite', 'Legendary']
const RARITY_CHIP_COLORS: Record<Rarity, string> = {
  Common: 'text-slate-300',
  Rare: 'text-sky-300',
  Elite: 'text-purple-300',
  Legendary: 'text-amber-300',
}

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

  // Rarity flair: gold burst for Legendary, purple shimmer for Elite;
  // card border/glow picks up the dealt team's color
  const flairClass =
    player.rarity === 'Legendary'
      ? 'anim-legendary border-amber-400/70'
      : player.rarity === 'Elite'
        ? 'anim-elite border-purple-400/60'
        : 'anim-card-flip'

  return (
    <div
      className={`${flairClass} bg-court-card border rounded-2xl p-4 sm:p-5 shadow-xl`}
      style={
        player.rarity === 'Legendary' || player.rarity === 'Elite'
          ? undefined
          : {
              borderColor: team ? `${team.primaryColor}99` : undefined,
              boxShadow: team ? `0 0 22px ${team.primaryColor}33` : undefined,
            }
      }
    >
      <div className="flex items-start gap-3">
        {team && <TeamBadge team={team} size="lg" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              {player.name}
            </h3>
            <RarityBadge rarity={player.rarity} />
          </div>
          <div className="mt-0.5 text-sm text-gray-400">
            {player.team} · {player.primaryPosition}
            {player.secondaryPositions.length > 0 &&
              ` / ${player.secondaryPositions.join(' / ')}`}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {player.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wide bg-court-raised text-gray-400 rounded-full px-2 py-0.5"
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
                ? 'bg-court/60 opacity-40'
                : 'bg-court-raised'
            }`}
          >
            <span className="text-gray-400 truncate mr-1">
              {ATTRIBUTE_LABELS[key]}
            </span>
            <GradeBadge grade={player.grades[key]} size="sm" />
          </div>
        ))}
      </div>

      {/* Lock buttons — available attributes only */}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Lock an attribute ({available.length} open)
        </div>
        <div className="flex flex-wrap gap-2">
          {available.map((key: AttributeKey) => (
            <button
              key={key}
              onClick={() => dispatch({ type: 'LOCK_ATTRIBUTE', attribute: key })}
              className="group flex items-center gap-2 bg-court-raised border border-court-border hover:border-ball rounded-xl px-3 py-2 transition-all hover:shadow-lg hover:shadow-ball/20 active:scale-95 cursor-pointer"
            >
              <span className="text-sm font-semibold text-gray-200 group-hover:text-white">
                {ATTRIBUTE_LABELS[key]}
              </span>
              <GradeBadge grade={player.grades[key]} size="sm" />
              <span className="text-[10px] text-gray-500">
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
          disabled={!canRespin}
          onClick={() => dispatch({ type: 'RESPIN' })}
        >
          🔄 Respin Team
        </Button>
        <Button
          variant="danger"
          disabled={!canRespin || riskPool.length === 0}
          onClick={() => dispatch({ type: 'RISK_IT' })}
        >
          🎲 Risk It
        </Button>
        {canRespin && riskPool.length > 0 && (
          <span className="text-xs text-gray-400">
            Risk It pool — {riskPool.length} other{riskPool.length === 1 ? '' : 's'}:{' '}
            {riskCounts.map(([rarity, n], i) => (
              <span key={rarity}>
                {i > 0 && ' · '}
                <span className={`font-semibold ${RARITY_CHIP_COLORS[rarity]}`}>
                  {n} {rarity}
                </span>
              </span>
            ))}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {canRespin
          ? `${state.respinsLeft} respin${state.respinsLeft === 1 ? '' : 's'} banked — both cost 1, and unused respins can reroll the Fatal Flaw wheel`
          : 'No respins left — the Fatal Flaw wheel will be final'}
      </div>
    </div>
  )
}
