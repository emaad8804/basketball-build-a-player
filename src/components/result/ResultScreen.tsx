import { useMemo } from 'react'
import { GROUP_LABELS } from '../../constants/attributes'
import { BUDGET_TIER_BY_ID } from '../../constants/budget'
import { FLAW_BY_ID, FLAW_TIER_COLORS } from '../../constants/flaws'
import { teamTierFor } from '../../constants/teamStrength'
import { budgetSpent, efficiencyBadge, efficiencyLine } from '../../game-logic/budget'
import { analyzeBuild } from '../../game-logic/report'
import { useGame } from '../../state/GameContext'
import { Clover, Trophy, Zap } from 'lucide-react'
import { Button, Card, CountUpValue } from '../shared/atoms'
import { FLAW_ICONS, TIER_ICONS } from '../shared/icons'
import { AttributeBoard } from '../game/AttributeBoard'

export function ResultScreen() {
  const { state, dispatch } = useGame()
  const group = state.group!
  const report = useMemo(
    () => analyzeBuild(group, state.lockedAttributes, state.archetype ?? ''),
    [group, state.lockedAttributes, state.archetype],
  )
  const budgetTier = state.budgetTier ? BUDGET_TIER_BY_ID[state.budgetTier] : null
  const spent = budgetSpent(state)

  return (
    <div className="min-h-dvh px-4 py-8 max-w-4xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-muted">
          Build Complete — {GROUP_LABELS[group]}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="anim-glow-pulse bg-accent text-ink rounded-2xl w-24 h-24 flex flex-col items-center justify-center">
            <span className="font-display font-normal text-4xl tabular-nums">
              <CountUpValue value={state.overall ?? 0} />
            </span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              Overall
            </span>
          </div>
        </div>
        <h2 className="mt-4 font-display font-normal uppercase text-3xl text-white">{state.archetype}</h2>
        {budgetTier && (
          <div className="mt-2">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5 tabular-nums"
              style={{
                color: budgetTier.color,
                borderColor: `${budgetTier.color}88`,
                backgroundColor: `${budgetTier.color}14`,
              }}
            >
              ${budgetTier.budget}M {budgetTier.label}
            </span>
          </div>
        )}
        {/* Team Destiny landing */}
        {state.homeTeam && (
          <div className="mt-2 text-sm text-cream/80">
            {state.homeTeam.name}
            {(() => {
              const tier = teamTierFor(state.homeTeam!.name)
              return (
                <span
                  className="ml-2 text-[11px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5"
                  style={{
                    color: tier.color,
                    borderColor: `${tier.color}88`,
                    backgroundColor: `${tier.color}14`,
                  }}
                >
                  {(() => {
                    const Icon = TIER_ICONS[tier.id]
                    return <Icon className="inline w-3 h-3 mr-1 align-[-1px]" aria-hidden />
                  })()}
                  {tier.label}
                </span>
              )
            })()}
          </div>
        )}
        {/* Fatal Flaw verdict */}
        {state.flawSpun && (
          <div className="mt-3">
            {state.flawId ? (
              (() => {
                const flaw = FLAW_BY_ID[state.flawId]
                return (
                  <span
                    className="inline-block text-sm font-bold rounded-full border px-4 py-1.5"
                    style={{
                      color: FLAW_TIER_COLORS[flaw.tier],
                      borderColor: `${FLAW_TIER_COLORS[flaw.tier]}88`,
                      backgroundColor: `${FLAW_TIER_COLORS[flaw.tier]}14`,
                    }}
                    title={flaw.description}
                  >
                    {(() => {
                      const Icon = FLAW_ICONS[flaw.id]
                      return <Icon className="inline w-4 h-4 mr-1 align-[-2px]" aria-hidden />
                    })()}
                    Fatal Flaw: {flaw.name}
                  </span>
                )
              })()
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-win bg-win/10 border border-win/50 rounded-full px-4 py-1.5">
                <Clover className="w-4 h-4" aria-hidden />
                CLEAN BUILD — no fatal flaw
              </span>
            )}
          </div>
        )}
        {state.chemistryBonuses.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {state.chemistryBonuses.map((b) => (
              <span
                key={b.name}
                title={b.description}
                className="inline-flex items-center gap-1 text-xs font-semibold bg-win/15 text-win border border-win/40 rounded-full px-3 py-1"
              >
                <Zap className="w-3 h-3" aria-hidden />
                {b.name} +{b.bonus}
              </span>
            ))}
            <span className="text-xs text-muted self-center">
              (base {state.baseOverall})
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold">
            Best Attributes
          </div>
          <div className="mt-2 space-y-1.5">
            {report.best.map((b) => (
              <div key={b.attribute} className="flex justify-between text-sm">
                <span className="text-cream/90">{b.label}</span>
                <span className="font-bold text-accent tabular-nums">{b.rating}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs uppercase tracking-wider text-muted font-semibold">
            Weakest
          </div>
          <div className="mt-1 space-y-1.5">
            {report.weakest.map((w) => (
              <div key={w.attribute} className="flex justify-between text-sm">
                <span className="text-muted">{w.label}</span>
                <span className="font-semibold text-muted tabular-nums">{w.rating}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold">
            Player Comparison
          </div>
          <div className="mt-1 text-xl font-bold text-cream">
            {report.comparison.name}
          </div>
          <div className="text-xs text-muted">{report.comparison.team}</div>
          <div className="mt-3 text-xs uppercase tracking-wider text-muted font-semibold">
            Scouting Report
          </div>
          <p className="mt-1 text-sm text-cream/80 leading-relaxed">
            {report.scoutingReport}
          </p>
        </Card>

        {budgetTier && state.budgetLeft !== null && state.overall !== null && (
          <Card className="p-4 sm:col-span-2">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">
              Budget
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted">Spent</div>
                <div className="text-lg font-bold text-cream tabular-nums">
                  ${spent}M
                </div>
              </div>
              <div>
                <div className="text-xs text-muted">Left on the table</div>
                <div className="text-lg font-bold text-cream tabular-nums">
                  ${state.budgetLeft}M
                </div>
              </div>
              <div>
                <div className="text-xs text-muted">Efficiency</div>
                <div
                  className="text-lg font-bold"
                  style={{ color: budgetTier.color }}
                >
                  {efficiencyBadge(budgetTier.id, state.overall)}
                </div>
                <div className="text-xs text-muted tabular-nums">
                  {efficiencyLine(state.overall, spent)}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
          Completed Board
        </div>
        <AttributeBoard locked={state.lockedAttributes} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => dispatch({ type: 'SIMULATE_SEASON' })}
          className="text-lg px-8 inline-flex items-center gap-2"
        >
          <Trophy className="w-5 h-5" aria-hidden />
          Simulate Season
        </Button>
        {state.mode !== 'daily' && (
          <Button variant="ghost" onClick={() => dispatch({ type: 'RESET_BUILD' })}>
            Reset Build
          </Button>
        )}
      </div>
    </div>
  )
}
