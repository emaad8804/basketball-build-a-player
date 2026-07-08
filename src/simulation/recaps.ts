import type { FlawId } from '../constants/flaws'
import type { SeriesGame } from '../types'
import { pickRandom } from './random'

/**
 * Game recap lines (DESIGN.md kill list §2.6): pools are keyed by
 * predicates over the box score so lines react to what actually happened,
 * template lines cite real numbers, and a per-series `used` set guarantees
 * no line repeats within one series. Voice: kinetic, a little cocky (§9).
 */

export interface RecapContext {
  won: boolean
  isGame7: boolean
  clinched: boolean
  eliminationGame: boolean
  gameNumber: number
  /** Absolute final margin. */
  margin: number
  statLine: SeriesGame['statLine']
  flawId: FlawId | null
}

type Line = string | ((c: RecapContext) => string)

/** Resolve a line from a pool, dodging ones this series already used. */
export function pickFrom(lines: readonly Line[], c: RecapContext, used: Set<string>): string {
  let text = ''
  for (let attempt = 0; attempt < 4; attempt++) {
    const line = pickRandom([...lines])
    text = typeof line === 'function' ? line(c) : line
    if (!used.has(text)) break
  }
  used.add(text)
  return text
}

const WIN_GENERIC: Line[] = [
  'Your build controlled the fourth quarter with elite shot creation.',
  'A dominant two-way performance put the opponent on their heels.',
  'Timely stops and ruthless offense carried the night.',
  'Your build caught fire from deep and never looked back.',
  'No answer inside — your build owned the paint all night.',
  'A fast start set the tone and the lead never slipped.',
  'The opponent threw three defenders at your build. None of them worked.',
  'Every run they made, your build answered with a dagger.',
  'Total control from the opening tip — this one never felt close.',
  (c) => `${c.statLine.pts} points, ${c.statLine.reb} boards, and the game on a leash.`,
]

const LOSS_GENERIC: Line[] = [
  'The opponent forced tough shots late and stole one.',
  'Cold shooting in the fourth proved fatal.',
  'The opposing star went supernova and there was no extinguisher.',
  'Turnovers in crunch time flipped a winnable game.',
  'The bench battle went the wrong way in a physical one.',
  'The whistle went quiet and so did the offense.',
  'Forty-six good minutes, two empty ones — that was the ballgame.',
  'They punked your role players and dared your build to do it alone.',
]

// Most specific first — the first matching pool wins.
const POOLS: { when: (c: RecapContext) => boolean; lines: Line[] }[] = [
  {
    when: (c) => c.won && c.statLine.pts >= 40,
    lines: [
      (c) => `${c.statLine.pts} points. The building never sat down.`,
      (c) => `A ${c.statLine.pts}-piece masterpiece — they had no one who could guard your build.`,
      (c) => `${c.statLine.pts} on their heads. Instant classic.`,
    ],
  },
  {
    when: (c) => c.won && c.statLine.ast >= 10,
    lines: [
      (c) => `${c.statLine.ast} assists — your build played the whole team like an orchestra.`,
      (c) => `Death by a thousand dimes: ${c.statLine.ast} assists carved them hollow.`,
    ],
  },
  {
    when: (c) => c.won && c.margin >= 18,
    lines: [
      (c) => `A ${c.margin}-point demolition. They emptied the bench early.`,
      'Over by halftime. The fourth quarter was a formality.',
      (c) => `Up ${c.margin} at the horn — this was a statement, not a game.`,
    ],
  },
  {
    when: (c) => c.won && c.margin <= 3,
    lines: [
      'A one-possession knife fight, and your build made the last cut.',
      (c) => `Escaped by ${c.margin}. Winners find a way; your build found two.`,
      'Ice in the closing seconds — the final possession went exactly as drawn.',
    ],
  },
  {
    when: (c) => !c.won && c.margin <= 3,
    lines: [
      'One possession short. That one will sting all summer.',
      (c) => `Lost by ${c.margin} — a bounce here, a whistle there, and it flips.`,
      'The last shot hung on the rim for a year… and rolled off.',
    ],
  },
  {
    when: (c) => !c.won && c.margin >= 18,
    lines: [
      (c) => `Run out of the gym by ${c.margin}. Burn the tape.`,
      'It was over by the second quarter — everything they threw went in.',
    ],
  },
  {
    when: (c) => !c.won && c.statLine.pts >= 35,
    lines: [
      (c) => `${c.statLine.pts} points wasted — your build did everything but win it.`,
      (c) => `A ${c.statLine.pts}-point masterpiece in a loss. Basketball can be cruel.`,
    ],
  },
  { when: (c) => c.won, lines: WIN_GENERIC },
  { when: (c) => !c.won, lines: LOSS_GENERIC },
]

/** Generic recap: first matching stat-aware pool, deduped per series. */
export function pickRecap(c: RecapContext, used: Set<string>): string {
  const pool = POOLS.find((p) => p.when(c)) ?? POOLS[POOLS.length - 1]
  return pickFrom(pool.lines, c, used)
}

// --- Situation pools consumed by seriesSim's special branches ---

export const CLINCH_RECAPS: Line[] = [
  'Your build delivered a series-clinching performance.',
  'An ice-cold closing stretch slammed the series shut.',
  'Statement win, series over — handshakes and a short flight home for them.',
  (c) => `Closed it with ${c.statLine.pts} — your build does not do Game 7 anxiety.`,
]

export const GAME7_WIN_RECAPS: Line[] = [
  'In a winner-take-all Game 7, your build delivered an all-time clutch performance.',
  'Game 7 legend status: your build took over when it mattered most.',
  (c) => `${c.statLine.pts} in a Game 7. Some nights become folklore.`,
]

export const GAME7_LOSS_RECAPS: Line[] = [
  'Heartbreak in Game 7 — the opponent made one more play.',
  'A legendary duel ended in agony as the final shot rimmed out.',
  (c) => `${c.statLine.pts} in a Game 7 loss — immortality was one stop away.`,
]

export const BRICK_LOSS_RECAPS: Line[] = [
  'Six missed free throws down the stretch handed the game away.',
  'Hack-a-strategy worked to perfection — the line was unkind again.',
  'They fouled on purpose and your build kept paying them for it.',
]

export const SLOW_START_LOSS_RECAPS: Line[] = [
  'A sleepy first half dug a hole the comeback never escaped.',
  'The series opened with your build a step behind everything.',
  'Down 20 before the first timeout — the wake-up call came two quarters late.',
]

export const ICE_COLD_G7_RECAPS: Line[] = [
  'Frozen solid in Game 7 — 2-for-13 with the season on the line.',
  'The moment arrived and your build shrank from it. Ice in the worst way.',
]

/** Clean-build flavor for won elimination games — light touch only. */
export const CLEAN_ELIMINATION_RECAPS: Line[] = [
  'No weakness to attack — your build was pure ice when it mattered.',
  'A flawless closer: no crack in the armor for the opponent to pry open.',
  'Elimination pressure, zero flaws to hunt. Checkmate.',
]
