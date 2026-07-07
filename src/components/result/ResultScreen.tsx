import { useMemo } from 'react'
import { GROUP_LABELS } from '../../constants/attributes'
import { FLAW_BY_ID, FLAW_TIER_COLORS } from '../../constants/flaws'
import { teamTierFor } from '../../constants/teamStrength'
import { analyzeBuild } from '../../game-logic/report'
import { useGame } from '../../state/GameContext'
import { Button, Card } from '../shared/atoms'
import { AttributeBoard } from '../game/AttributeBoard'

export function ResultScreen() {
  const { state, dispatch } = useGame()
  const group = state.group!
  const report = useMemo(
    () => analyzeBuild(group, state.lockedAttributes, state.archetype ?? ''),
    [group, state.lockedAttributes, state.archetype],
  )

  return (
    <div className="min-h-dvh px-4 py-8 max-w-4xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-gray-400">
          Build Complete — {GROUP_LABELS[group]}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="anim-glow-pulse bg-gradient-to-br from-ball-bright to-ball-deep text-white rounded-2xl w-24 h-24 flex flex-col items-center justify-center">
            <span className="font-display font-normal text-4xl">{state.overall}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              Overall
            </span>
          </div>
        </div>
        <h2 className="mt-4 font-display font-normal uppercase text-3xl text-white">{state.archetype}</h2>
        {/* Team Destiny landing */}
        {state.homeTeam && (
          <div className="mt-2 text-sm text-gray-300">
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
                  {tier.emoji} {tier.label}
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
                    {flaw.emoji} Fatal Flaw: {flaw.name}
                  </span>
                )
              })()
            ) : (
              <span className="inline-block text-sm font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/50 rounded-full px-4 py-1.5">
                🍀 CLEAN BUILD — no fatal flaw
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
                className="text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 rounded-full px-3 py-1"
              >
                ⚡ {b.name} +{b.bonus}
              </span>
            ))}
            <span className="text-xs text-gray-500 self-center">
              (base {state.baseOverall})
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Best Attributes
          </div>
          <div className="mt-2 space-y-1.5">
            {report.best.map((b) => (
              <div key={b.attribute} className="flex justify-between text-sm">
                <span className="text-gray-200">{b.label}</span>
                <span className="font-bold text-ball-bright">{b.rating}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Weakest
          </div>
          <div className="mt-1 space-y-1.5">
            {report.weakest.map((w) => (
              <div key={w.attribute} className="flex justify-between text-sm">
                <span className="text-gray-400">{w.label}</span>
                <span className="font-semibold text-gray-500">{w.rating}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Player Comparison
          </div>
          <div className="mt-1 text-xl font-bold text-white">
            {report.comparison.name}
          </div>
          <div className="text-xs text-gray-500">{report.comparison.team}</div>
          <div className="mt-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Scouting Report
          </div>
          <p className="mt-1 text-sm text-gray-300 leading-relaxed">
            {report.scoutingReport}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Completed Board
        </div>
        <AttributeBoard locked={state.lockedAttributes} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => dispatch({ type: 'SIMULATE_SEASON' })} className="text-lg px-8">
          🏆 Simulate Season
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
