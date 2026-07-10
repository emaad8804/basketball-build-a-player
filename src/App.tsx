import { GameProvider, useGame } from './state/GameContext'
import { LandingScreen } from './components/landing/LandingScreen'
import { GameScreen } from './components/game/GameScreen'
import { FlawScreen } from './components/flaw/FlawScreen'
import { TeamSpinScreen } from './components/team/TeamSpinScreen'
import { ResultScreen } from './components/result/ResultScreen'
import { SeasonScreen } from './components/season/SeasonScreen'
import { PlayInScreen } from './components/playin/PlayInScreen'
import { PlayoffsScreen } from './components/playoffs/PlayoffsScreen'
import { FinalsScreen } from './components/finals/FinalsScreen'
import { ShareScreen } from './components/share/ShareScreen'
import { Analytics } from '@vercel/analytics/react'

function Screens() {
  const { state } = useGame()
  switch (state.screen) {
    case 'landing':
      return <LandingScreen />
    case 'game':
      return <GameScreen />
    case 'flaw':
      return <FlawScreen />
    case 'team':
      return <TeamSpinScreen />
    case 'result':
      return <ResultScreen />
    case 'season':
      return <SeasonScreen />
    case 'playin':
      return <PlayInScreen />
    case 'playoffs':
      return <PlayoffsScreen />
    case 'finals':
      return <FinalsScreen />
    case 'share':
      return <ShareScreen />
  }
}

export default function App() {
  return (
    <GameProvider>
      <Screens />
      <footer className="py-6 text-center text-xs text-white/40">
        Fan-Made
        <span className="mx-1.5 text-white/25">•</span>
        Not Affiliated with the NBA
      </footer>
      <Analytics />
    </GameProvider>
  )
}
