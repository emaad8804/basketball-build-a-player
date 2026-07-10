import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useGame } from '../../state/GameContext'
import { BUDGET_TIERS } from '../../constants/budget'
import type { BudgetTierId } from '../../constants/budget'
import { Button } from '../shared/atoms'
import { GROUP_ICONS } from '../shared/icons'
import type { Group } from '../../types'
import { GROUP_CARDS } from './groupCards'

export function BudgetSetupScreen() {
  const { dispatch } = useGame()
  const [tierId, setTierId] = useState<BudgetTierId>('starter')
  const [group, setGroup] = useState<Group | null>(null)
  const tier = BUDGET_TIERS.find((t) => t.id === tierId)!

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <button
          onClick={() => dispatch({ type: 'GOTO_LANDING' })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-cream rounded-xl py-2 pr-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back
        </button>

        <div className="mt-4 anim-rise-in sm:flex sm:items-end sm:justify-between sm:gap-8">
          <h1 className="font-display font-normal uppercase text-4xl sm:text-5xl leading-none text-cream">
            Budget Mode
          </h1>
          <p className="mt-3 sm:mt-0 sm:max-w-sm text-cream/80 text-base leading-relaxed sm:text-right">
            Fixed budget. Every skill costs money by grade. Build the most
            efficient hooper you can.
          </p>
        </div>

        {/* Tier = difficulty. Starter is the sweet spot, pre-selected. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {BUDGET_TIERS.map((t, i) => {
            const selected = t.id === tierId
            return (
              <button
                key={t.id}
                onClick={() => setTierId(t.id)}
                aria-pressed={selected}
                className={`anim-rise-in text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                  selected ? '' : 'bg-panel border-edge hover:-translate-y-0.5'
                }`}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  ...(selected
                    ? {
                        borderColor: `${t.color}88`,
                        backgroundColor: `${t.color}14`,
                      }
                    : {}),
                }}
              >
                <div
                  className="font-display font-normal uppercase text-3xl tabular-nums"
                  style={{ color: selected ? t.color : undefined }}
                >
                  ${t.budget}M
                </div>
                <div className="mt-1 text-sm font-bold uppercase tracking-wider text-cream">
                  {t.label}
                </div>
                <div className="mt-1.5 text-sm text-muted">{t.blurb}</div>
              </button>
            )
          })}
        </div>

        {/* Group choice — same three builds as Free Play */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {GROUP_CARDS.map(({ group: g, title, desc }, i) => {
            const Icon = GROUP_ICONS[g]
            const selected = g === group
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                aria-pressed={selected}
                className={`anim-rise-in text-left bg-panel border rounded-2xl p-5 transition-all duration-200 cursor-pointer ${
                  selected
                    ? 'border-cream/40 bg-raised'
                    : 'border-edge hover:-translate-y-0.5 hover:border-muted'
                }`}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <Icon
                  className={`w-6 h-6 ${selected ? 'text-cream' : 'text-muted'}`}
                  aria-hidden
                />
                <div className="mt-3 font-display font-normal uppercase text-lg text-cream">
                  {title}
                </div>
                <div className="mt-1 text-sm text-muted">{desc}</div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted">
            Skills run $2M (D) to $48M (S). First respin free, second costs
            $1M.
          </p>
          <Button
            disabled={!group}
            onClick={() =>
              group &&
              dispatch({
                type: 'SELECT_GROUP',
                group,
                mode: 'budget',
                budgetTier: tierId,
              })
            }
          >
            Start Budget Run — ${tier.budget}M {tier.label}
          </Button>
        </div>
      </div>
    </div>
  )
}
