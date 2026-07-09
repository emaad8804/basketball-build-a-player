import { teamTierFor } from '../../constants/teamStrength'
import { useGame } from '../../state/GameContext'
import { Crown, Siren, Swords } from 'lucide-react'
import { Button, Card, CountUpValue, StatChip, TeamBadge } from '../shared/atoms'
import { TIER_ICONS } from '../shared/icons'

export function SeasonScreen() {
  const { state, dispatch } = useGame()
  const season = state.seasonResult!
  const homeTeam = state.homeTeam
  const tier = homeTeam ? teamTierFor(homeTeam.name) : null

  const ordinal = (n: number) =>
    n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`

  return (
    <div className="min-h-dvh px-4 py-8 max-w-3xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-muted">
          Regular Season Result
        </div>
        {homeTeam && tier && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <TeamBadge team={homeTeam} />
            <span className="text-lg font-bold text-cream">{homeTeam.name}</span>
            <span
              className="text-[11px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5"
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
          </div>
        )}
        <h2 className="mt-2 font-display font-normal text-5xl text-white tabular-nums">
          <CountUpValue value={season.wins} />–<CountUpValue value={season.losses} />
        </h2>
        <div className="mt-1 text-lg text-cream/80">
          {ordinal(season.seed)} seed in the {season.conference}
          {!season.madePlayoffs &&
            (season.playInEligible ? ' — play-in bound' : ' — missed the playoffs')}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 sm:grid-cols-7 gap-2">
        <StatChip label="PPG" value={<CountUpValue value={season.stats.ppg} decimals={1} />} />
        <StatChip label="RPG" value={<CountUpValue value={season.stats.rpg} decimals={1} />} />
        <StatChip label="APG" value={<CountUpValue value={season.stats.apg} decimals={1} />} />
        <StatChip label="SPG" value={<CountUpValue value={season.stats.spg} decimals={1} />} />
        <StatChip label="BPG" value={<CountUpValue value={season.stats.bpg} decimals={1} />} />
        <StatChip label="FG%" value={<CountUpValue value={season.stats.fgPct} decimals={1} />} />
        <StatChip label="3PT%" value={<CountUpValue value={season.stats.threePct} decimals={1} />} />
      </div>

      <Card className="mt-6 p-5">
        <div className="text-xs uppercase tracking-wider text-muted font-semibold">
          Awards & Honors
        </div>
        {season.awards.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {season.awards.map((award) => (
              <span
                key={award}
                className={`text-sm font-semibold rounded-full px-3 py-1 border ${
                  award === 'MVP'
                    ? 'bg-rarity-legendary/15 text-rarity-legendary border-rarity-legendary/50'
                    : 'bg-raised text-cream/90 border-edge'
                }`}
              >
                {award === 'MVP' ? (
                  <span className="inline-flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" aria-hidden />
                    MVP
                  </span>
                ) : (
                  award
                )}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-muted italic">
            No hardware this season.
          </div>
        )}
        <div className="mt-3 text-sm text-cream/80">
          <span className="text-muted">MVP Voting:</span> {season.mvpVoting}
        </div>
      </Card>

      <div className="mt-8 text-center">
        {season.madePlayoffs ? (
          <Button
            onClick={() => dispatch({ type: 'SIMULATE_PLAYOFFS' })}
            className="text-lg px-8 inline-flex items-center gap-2"
          >
            <Swords className="w-5 h-5" aria-hidden />
            Enter the Playoffs
          </Button>
        ) : season.playInEligible ? (
          <Button
            onClick={() => dispatch({ type: 'SIMULATE_PLAY_IN' })}
            className="text-lg px-8 anim-glow-pulse !bg-red-700 hover:!bg-red-600 !text-cream inline-flex items-center gap-2"
          >
            <Siren className="w-5 h-5" aria-hidden />
            Play-In Tournament — Win or Go Home
          </Button>
        ) : (
          <Button
            onClick={() => dispatch({ type: 'SIMULATE_PLAYOFFS' })}
            className="text-lg px-8"
          >
            See Final Legacy
          </Button>
        )}
      </div>
    </div>
  )
}
