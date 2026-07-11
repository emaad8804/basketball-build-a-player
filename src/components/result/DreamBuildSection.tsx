import { MoveRight, Target } from 'lucide-react'
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../../constants/attributes'
import type { DreamBuildResult, DreamSlot } from '../../game-logic/dreamBuild'
import type { AttributeKey, LockedAttribute, Rarity } from '../../types'
import { Card, GradeBadge } from '../shared/atoms'

const chipColors: Record<Rarity, string> = {
  Common: 'text-rarity-common border-rarity-common/50 bg-rarity-common/10',
  Rare: 'text-rarity-rare border-rarity-rare/50 bg-rarity-rare/10',
  Elite: 'text-rarity-elite border-rarity-elite/50 bg-rarity-elite/10',
  Legendary: 'text-rarity-legendary border-rarity-legendary/60 bg-rarity-legendary/10',
}

function surname(name: string): string {
  return name.split(' ').slice(1).join(' ') || name
}

/** "S · Curry" — the source player behind a dream grade. */
function PlayerChip({ slot }: { slot: DreamSlot }) {
  return (
    <span
      className={`inline-block max-w-24 truncate text-[10px] font-semibold rounded-full border px-1.5 py-px ${
        chipColors[slot.sourcePlayerRarity]
      }`}
      title={slot.sourcePlayerName}
    >
      {slot.grade} · {surname(slot.sourcePlayerName)}
    </span>
  )
}

function ComparisonRow({
  attribute,
  actual,
  slot,
  missed,
}: {
  attribute: AttributeKey
  actual: LockedAttribute | undefined
  slot: DreamSlot
  missed: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 py-1.5 ${
        missed ? 'border-l-2 border-accent pl-2' : 'opacity-55'
      }`}
    >
      <span className="flex-1 text-sm text-cream/90">
        {ATTRIBUTE_LABELS[attribute]}
      </span>
      <span className={`w-9 text-center ${missed ? 'opacity-40 saturate-50' : ''}`}>
        {actual && <GradeBadge grade={actual.grade} size="sm" />}
      </span>
      <MoveRight
        className={`w-3.5 h-3.5 shrink-0 ${missed ? 'text-accent' : 'text-muted'}`}
        aria-hidden
      />
      <span className="w-24 flex flex-col items-center gap-0.5">
        <GradeBadge grade={slot.grade} size="sm" />
        <PlayerChip slot={slot} />
      </span>
    </div>
  )
}

export function DreamBuildSection({
  result,
  locked,
}: {
  result: DreamBuildResult
  locked: Partial<Record<AttributeKey, LockedAttribute>>
}) {
  const { dream, dreamOVR, missed, missedOVR, perfectRead } = result
  const missedSet = new Set(missed)

  return (
    <div className="mt-6">
      <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
        Dream Build
      </div>
      {perfectRead ? (
        <Card glow className="p-6 text-center">
          <Target className="w-8 h-8 text-accent mx-auto" aria-hidden />
          <h3 className="mt-2 font-display font-normal uppercase text-3xl text-accent">
            Perfect Read
          </h3>
          <p className="mt-2 text-sm text-cream/80">
            You locked the best grade from every player you saw. Nothing got
            away.
          </p>
        </Card>
      ) : (
        <Card className="p-4">
          <h3 className="font-display font-normal uppercase text-2xl text-white">
            The One That Got Away
          </h3>
          <p className="mt-1 text-xs text-muted">
            The best build hiding in the players you rolled — every grade from
            someone you actually saw.
          </p>
          <div className="mt-3 divide-y divide-edge">
            {ATTRIBUTE_KEYS.map((key) => (
              <ComparisonRow
                key={key}
                attribute={key}
                actual={locked[key]}
                slot={dream[key]}
                missed={missedSet.has(key)}
              />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-edge flex items-center justify-between gap-3 text-sm">
            {missedOVR > 0 ? (
              <span className="text-cream/90">
                You left{' '}
                <span className="font-bold text-accent tabular-nums">
                  {missedOVR} OVR
                </span>{' '}
                on the table.
              </span>
            ) : (
              <span className="text-muted">
                The misses didn&apos;t cost you a single OVR point.
              </span>
            )}
            <span className="text-muted tabular-nums shrink-0">
              Dream: {dreamOVR} OVR
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
