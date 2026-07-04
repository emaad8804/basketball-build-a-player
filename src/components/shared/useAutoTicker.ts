import { useEffect } from 'react'

/**
 * Auto-advances a game reveal feed once it has started: ordinary games
 * tick quickly, drama games (Game 7s, elimination games, flaw moments)
 * hold longer so the tension frame can land. The player can always
 * fast-forward by tapping — this only schedules the next reveal.
 */
export function useAutoTicker({
  running,
  revealedCount,
  nextIsDrama,
  advance,
}: {
  running: boolean
  revealedCount: number
  nextIsDrama: boolean
  advance: () => void
}) {
  useEffect(() => {
    if (!running) return
    const t = setTimeout(advance, nextIsDrama ? 3200 : 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, revealedCount, nextIsDrama])
}
