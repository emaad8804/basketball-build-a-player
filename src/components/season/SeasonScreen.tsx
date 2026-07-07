import { teamTierFor } from '../../constants/teamStrength'
import { useGame } from '../../state/GameContext'
import { Button, Card, StatChip, TeamBadge } from '../shared/atoms'

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
        <div className="text-xs uppercase tracking-widest text-gray-400">
          Regular Season Result
        </div>
        {homeTeam && tier && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <TeamBadge team={homeTeam} />
            <span className="text-lg font-bold text-white">{homeTeam.name}</span>
            <span
              className="text-[11px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5"
              style={{
                color: tier.color,
                borderColor: `${tier.color}88`,
                backgroundColor: `${tier.color}14`,
              }}
            >
              {tier.emoji} {tier.label}
            </span>
          </div>
        )}
        <h2 className="mt-2 font-display font-normal text-5xl text-white">
          {season.wins}–{season.losses}
        </h2>
        <div className="mt-1 text-lg text-gray-300">
          {ordinal(season.seed)} seed in the {season.conference}
          {!season.madePlayoffs &&
            (season.playInEligible ? ' — play-in bound' : ' — missed the playoffs')}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 sm:grid-cols-7 gap-2">
        <StatChip label="PPG" value={season.stats.ppg} />
        <StatChip label="RPG" value={season.stats.rpg} />
        <StatChip label="APG" value={season.stats.apg} />
        <StatChip label="SPG" value={season.stats.spg} />
        <StatChip label="BPG" value={season.stats.bpg} />
        <StatChip label="FG%" value={`${season.stats.fgPct}`} />
        <StatChip label="3PT%" value={`${season.stats.threePct}`} />
      </div>

      <Card className="mt-6 p-5">
        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
          Awards & Honors
        </div>
        {season.awards.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {season.awards.map((award) => (
              <span
                key={award}
                className={`text-sm font-semibold rounded-full px-3 py-1 border ${
                  award === 'MVP'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                    : 'bg-court-raised text-gray-200 border-court-border'
                }`}
              >
                {award === 'MVP' ? '👑 MVP' : award}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500 italic">
            No hardware this season.
          </div>
        )}
        <div className="mt-3 text-sm text-gray-300">
          <span className="text-gray-500">MVP Voting:</span> {season.mvpVoting}
        </div>
      </Card>

      <div className="mt-8 text-center">
        {season.madePlayoffs ? (
          <Button
            onClick={() => dispatch({ type: 'SIMULATE_PLAYOFFS' })}
            className="text-lg px-8"
          >
            ⚔️ Enter the Playoffs
          </Button>
        ) : season.playInEligible ? (
          <Button
            onClick={() => dispatch({ type: 'SIMULATE_PLAY_IN' })}
            className="text-lg px-8 anim-glow-pulse !bg-red-700 hover:!bg-red-600 !shadow-red-900/40"
          >
            🚨 Play-In Tournament — Win or Go Home
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
