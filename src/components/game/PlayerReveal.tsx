import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../../constants/attributes'
import { TEAM_BY_NAME } from '../../constants/teams'
import { convertGradeToRating } from '../../game-logic/grades'
import { useGame } from '../../state/GameContext'
import type { AttributeKey, Player } from '../../types'
import { Button, GradeBadge, RarityBadge, TeamBadge } from '../shared/atoms'

export function PlayerReveal({ player }: { player: Player }) {
  const { state, dispatch } = useGame()
  const team = TEAM_BY_NAME[player.team]
  const available = ATTRIBUTE_KEYS.filter(
    (k) => !(k in state.lockedAttributes),
  )
  const canRespin = state.respinsLeft > 0

  return (
    <div className="anim-card-flip bg-court-card border border-ball/50 rounded-2xl p-4 sm:p-5 shadow-xl shadow-ball/10">
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
          disabled={!canRespin}
          onClick={() => dispatch({ type: 'RISK_IT' })}
        >
          🎲 Risk It
        </Button>
        <span className="text-xs text-gray-500">
          {canRespin
            ? `${state.respinsLeft} respin${state.respinsLeft === 1 ? '' : 's'} left — both cost 1`
            : 'No respins left'}
        </span>
      </div>
    </div>
  )
}
