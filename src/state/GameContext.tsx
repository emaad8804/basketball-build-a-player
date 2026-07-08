import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
import type { Dispatch, ReactNode } from 'react'
import type { GameState, Screen } from '../types'
import { gameReducer, initialGameState } from './gameReducer'
import type { GameAction } from './gameReducer'
import { clearRun, saveRun } from './persistence'

interface GameContextValue {
  state: GameState
  dispatch: Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(gameReducer, initialGameState)

  // Run-ending actions clear the save *synchronously*, before the landing
  // screen renders and reads it — an effect-based clear would race the
  // landing screen's render-phase loadRun() and show a stale resume card.
  const dispatch = useCallback<Dispatch<GameAction>>((action) => {
    if (action.type === 'PLAY_AGAIN' || action.type === 'RESET_BUILD') clearRun()
    rawDispatch(action)
  }, [])

  // Snapshot every in-run state change; the landing transition also clears
  // as a backstop (never on initial mount — the landing screen needs the
  // save alive to offer a resume).
  const prevScreen = useRef<Screen | null>(null)
  useEffect(() => {
    if (state.screen !== 'landing') {
      saveRun(state)
    } else if (prevScreen.current && prevScreen.current !== 'landing') {
      clearRun()
    }
    prevScreen.current = state.screen
  }, [state])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
