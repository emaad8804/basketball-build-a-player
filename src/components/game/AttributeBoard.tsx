import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../../constants/attributes'
import type { AttributeKey, LockedAttribute } from '../../types'
import { GradeBadge } from '../shared/atoms'

export function AttributeBoard({
  locked,
  justLocked,
}: {
  locked: Partial<Record<AttributeKey, LockedAttribute>>
  justLocked?: AttributeKey | null
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {ATTRIBUTE_KEYS.map((key) => {
        const entry = locked[key]
        const isNew = justLocked === key
        return (
          <div
            key={key}
            className={`rounded-xl border p-2.5 sm:p-3 min-h-[76px] transition-all ${
              entry
                ? `bg-court-raised border-ball/40 ${isNew ? 'anim-pop-in anim-glow-pulse' : ''}`
                : 'bg-court-card/60 border-dashed border-court-border'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-400 font-semibold">
                {ATTRIBUTE_LABELS[key]}
              </span>
              {entry && <span className="text-ball text-xs">🔒</span>}
            </div>
            {entry ? (
              <div className="mt-1.5 flex items-center gap-2">
                <GradeBadge grade={entry.grade} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white truncate">
                    {entry.playerName}
                  </div>
                  <div className="text-[10px] text-gray-500">{entry.rating} OVR</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-600 italic">Empty</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
