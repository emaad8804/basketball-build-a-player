import type { AttributeKey, GameMode, GameState, Group } from '../types'
import { BUDGET_TIER_BY_ID, RESPIN_COST } from '../constants/budget'
import type { BudgetTierId } from '../constants/budget'
import { lockCharge } from '../game-logic/budget'
import {
  emptyBuildState,
  isBuildComplete,
  lockAttribute,
} from '../game-logic/build'
import { spinFlaw } from '../game-logic/flaw'
import { eventRng, randomSeed, zeroRngCounters } from '../game-logic/rng'
import type { Rand, RngCounters, RngEventType } from '../game-logic/rng'
import { spinPlayer, spinTeam } from '../game-logic/spin'
import { NBA_TEAMS } from '../constants/teams'
import { evaluateChemistryBonuses } from '../game-logic/chemistry'
import { computeFinalOverall } from '../game-logic/overall'
import { assignArchetype } from '../game-logic/archetype'
import { makeBuildProfile } from '../simulation/profile'
import { rollGlassBones } from '../simulation/flawEffects'
import { simulateSeason } from '../simulation/seasonSim'
import { simulatePlayIn } from '../simulation/playInSim'
import { simulatePlayoffs } from '../simulation/playoffSim'
import { simulateFinals } from '../simulation/finalsSim'
import { deriveLegacyLabel } from '../simulation/legacy'

export type GameAction =
  | {
      type: 'SELECT_GROUP'
      group: Group
      seed?: number
      mode?: GameMode
      dailyNumber?: number
      dailyDateKey?: string
      budgetTier?: BudgetTierId
    }
  | { type: 'OPEN_BUDGET_SETUP' }
  | { type: 'GOTO_LANDING' }
  | { type: 'SPIN_PLAYER' }
  | { type: 'RESPIN' }
  | { type: 'RISK_IT' }
  | { type: 'LOCK_ATTRIBUTE'; attribute: AttributeKey }
  | { type: 'SPIN_FLAW' }
  | { type: 'REROLL_FLAW' }
  | { type: 'ACCEPT_FLAW' }
  | { type: 'SPIN_HOME_TEAM' }
  | { type: 'ACCEPT_TEAM' }
  | { type: 'SIMULATE_SEASON' }
  | { type: 'SIMULATE_PLAY_IN' }
  | { type: 'REVEAL_NEXT_PLAYIN_GAME' }
  | { type: 'SIMULATE_PLAYOFFS' }
  | { type: 'REVEAL_NEXT_PLAYOFF_GAME' }
  | { type: 'REVEAL_ALL_PLAYOFF_GAMES' }
  | { type: 'REVEAL_NEXT_FINALS_GAME' }
  | { type: 'REVEAL_ALL_FINALS_GAMES' }
  | { type: 'GOTO_SHARE' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'RESET_BUILD' }
  | { type: 'RESUME_RUN'; saved: GameState }

export const initialGameState: GameState = {
  screen: 'landing',
  group: null,
  mode: 'free',
  dailyNumber: null,
  dailyDateKey: null,
  budgetTier: null,
  budgetLeft: null,
  runSeed: 0,
  ...emptyBuildState(),
}

/**
 * Consume one counter-keyed RNG event: returns the event's private PRNG
 * and the bumped counters to store back into state. Keying by (seed,
 * type, counter) instead of one sequential stream is what keeps daily
 * runs comparable — the Nth team deal is the same for everyone.
 */
function drawRng(
  state: GameState,
  type: RngEventType,
): { rand: Rand; rngCounters: RngCounters } {
  const counter = state.rngCounters[type]
  return {
    rand: eventRng(state.runSeed, type, counter),
    rngCounters: { ...state.rngCounters, [type]: counter + 1 },
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_GROUP': {
      // Team is dealt automatically — no free team rerolls
      const runSeed = action.seed ?? randomSeed()
      const rand = eventRng(runSeed, 'team', 0)
      const budgetTier =
        action.mode === 'budget' ? (action.budgetTier ?? 'starter') : null
      return {
        ...initialGameState,
        screen: 'game',
        group: action.group,
        mode: action.mode ?? 'free',
        dailyNumber: action.dailyNumber ?? null,
        dailyDateKey: action.dailyDateKey ?? null,
        budgetTier,
        budgetLeft: budgetTier ? BUDGET_TIER_BY_ID[budgetTier].budget : null,
        runSeed,
        rngCounters: { ...zeroRngCounters(), team: 1 },
        currentTeam: spinTeam(action.group, rand),
      }
    }

    case 'OPEN_BUDGET_SETUP':
      return state.screen === 'landing'
        ? { ...state, screen: 'budget-setup' }
        : state

    // Back out of the budget setup menu — never clears a saved run
    case 'GOTO_LANDING':
      return { ...state, screen: 'landing' }

    case 'SPIN_PLAYER': {
      if (!state.group || !state.currentTeam) return state
      const { rand, rngCounters } = drawRng(state, 'player')
      const player = spinPlayer(state.currentTeam.name, state.group, rand)
      if (!player) {
        // Dead team (shouldn't happen — spinTeam filters); respin team gracefully
        const teamDraw = drawRng(state, 'team')
        const team = spinTeam(state.group, teamDraw.rand, state.currentTeam.name)
        return {
          ...state,
          currentTeam: team,
          currentPlayer: null,
          rngCounters: teamDraw.rngCounters,
        }
      }
      return { ...state, currentPlayer: player, rngCounters }
    }

    case 'RESPIN': {
      // Loses current player, spins a fresh team, costs 1 respin.
      // Budget mode: the second respin costs $1M wherever it's spent.
      if (state.respinsLeft <= 0 || !state.group) return state
      const paid = state.mode === 'budget' && state.respinsLeft === 1
      if (paid && (state.budgetLeft ?? 0) < RESPIN_COST) return state
      const { rand, rngCounters } = drawRng(state, 'team')
      const team = spinTeam(state.group, rand, state.currentTeam?.name)
      return {
        ...state,
        currentTeam: team,
        currentPlayer: null,
        respinsLeft: state.respinsLeft - 1,
        budgetLeft: paid ? state.budgetLeft! - RESPIN_COST : state.budgetLeft,
        rngCounters,
      }
    }

    case 'RISK_IT': {
      // Rerolls the player from the same team, costs 1 respin (shared pool)
      if (
        state.respinsLeft <= 0 ||
        !state.group ||
        !state.currentTeam ||
        !state.currentPlayer
      )
        return state
      const paid = state.mode === 'budget' && state.respinsLeft === 1
      if (paid && (state.budgetLeft ?? 0) < RESPIN_COST) return state
      const { rand, rngCounters } = drawRng(state, 'riskit')
      const player = spinPlayer(
        state.currentTeam.name,
        state.group,
        rand,
        state.currentPlayer.name,
      )
      return {
        ...state,
        currentPlayer: player,
        respinsLeft: state.respinsLeft - 1,
        budgetLeft: paid ? state.budgetLeft! - RESPIN_COST : state.budgetLeft,
        rngCounters,
      }
    }

    case 'LOCK_ATTRIBUTE': {
      if (!state.group || !state.currentPlayer) return state
      if (action.attribute in state.lockedAttributes) return state

      // Budget mode: price the pick; null = illegal (unaffordable, or not
      // the free minimum-wage choice on a broke slate)
      let charge: number | undefined
      if (state.mode === 'budget' && state.budgetLeft !== null) {
        const priced = lockCharge(
          state.currentPlayer,
          state.lockedAttributes,
          state.budgetLeft,
          action.attribute,
        )
        if (priced === null) return state
        charge = priced
      }
      const budgetLeft =
        state.budgetLeft === null ? null : state.budgetLeft - (charge ?? 0)

      const locked = lockAttribute(
        state.lockedAttributes,
        action.attribute,
        state.currentPlayer,
        charge,
      )

      if (!isBuildComplete(locked)) {
        // Next team is auto-dealt immediately after every lock
        const { rand, rngCounters } = drawRng(state, 'team')
        return {
          ...state,
          lockedAttributes: locked,
          currentTeam: spinTeam(state.group, rand, state.currentTeam?.name),
          currentPlayer: null,
          budgetLeft,
          rngCounters,
        }
      }

      // Build complete: compute final overall, chemistry, archetype —
      // then face the Fatal Flaw wheel before the result reveal
      const bonuses = evaluateChemistryBonuses(locked)
      const { baseOverall, overall } = computeFinalOverall(
        state.group,
        locked,
        bonuses,
      )
      const archetype = assignArchetype(state.group, locked)
      return {
        ...state,
        screen: 'flaw',
        lockedAttributes: locked,
        currentTeam: null,
        currentPlayer: null,
        budgetLeft,
        chemistryBonuses: bonuses,
        baseOverall,
        overall,
        archetype,
      }
    }

    case 'SPIN_FLAW': {
      if (state.screen !== 'flaw' || state.flawSpun) return state
      // Dedicated flaw stream, counter 0: in daily mode every player
      // faces the same flaw outcome regardless of earlier choices
      const rand = eventRng(state.runSeed, 'flaw', 0)
      return {
        ...state,
        flawId: spinFlaw(rand),
        flawSpun: true,
        rngCounters: { ...state.rngCounters, flaw: 1 },
      }
    }

    case 'REROLL_FLAW': {
      // Burn a banked Respin for one full-wheel reroll — true insurance.
      // Budget mode: if this is the second respin, the $1M tax still applies.
      if (
        state.screen !== 'flaw' ||
        !state.flawSpun ||
        state.flawId === null ||
        state.flawRerolled ||
        state.respinsLeft <= 0
      )
        return state
      const paid = state.mode === 'budget' && state.respinsLeft === 1
      if (paid && (state.budgetLeft ?? 0) < RESPIN_COST) return state
      const rand = eventRng(state.runSeed, 'flaw', 1)
      return {
        ...state,
        flawId: spinFlaw(rand),
        flawRerolled: true,
        respinsLeft: state.respinsLeft - 1,
        budgetLeft: paid ? state.budgetLeft! - RESPIN_COST : state.budgetLeft,
        rngCounters: { ...state.rngCounters, flaw: 2 },
      }
    }

    case 'ACCEPT_FLAW': {
      if (state.screen !== 'flaw' || !state.flawSpun) return state
      // Fate's last stop: the Team Destiny spin
      return { ...state, screen: 'team' }
    }

    case 'SPIN_HOME_TEAM': {
      if (state.screen !== 'team' || state.homeTeam !== null) return state
      // Dedicated stream, counter 0: in daily mode everyone lands on the
      // same team regardless of earlier choices. Equal 1/30 odds. Final.
      const rand = eventRng(state.runSeed, 'hometeam', 0)
      const homeTeam = NBA_TEAMS[Math.floor(rand() * NBA_TEAMS.length)]
      return {
        ...state,
        homeTeam,
        rngCounters: { ...state.rngCounters, hometeam: 1 },
      }
    }

    case 'ACCEPT_TEAM': {
      if (state.screen !== 'team' || state.homeTeam === null) return state
      return { ...state, screen: 'result' }
    }

    case 'SIMULATE_SEASON': {
      if (!state.group || state.overall === null) return state
      const profile = makeBuildProfile(
        state.group,
        state.overall,
        state.lockedAttributes,
        state.flawId,
        state.homeTeam,
      )
      const seasonResult = simulateSeason(profile)
      return { ...state, screen: 'season', seasonResult }
    }

    case 'SIMULATE_PLAY_IN': {
      if (
        !state.group ||
        state.overall === null ||
        !state.seasonResult?.playInEligible ||
        state.playInResult !== null
      )
        return state
      const profile = makeBuildProfile(
        state.group,
        state.overall,
        state.lockedAttributes,
        state.flawId,
        state.homeTeam,
      )
      const playInResult = simulatePlayIn(profile, state.seasonResult)
      return { ...state, screen: 'playin', playInResult, playInGamesRevealed: 0 }
    }

    case 'REVEAL_NEXT_PLAYIN_GAME': {
      if (!state.playInResult) return state
      return {
        ...state,
        playInGamesRevealed: Math.min(
          state.playInGamesRevealed + 1,
          state.playInResult.games.length,
        ),
      }
    }

    case 'SIMULATE_PLAYOFFS': {
      if (!state.group || state.overall === null || !state.seasonResult)
        return state
      const profile = makeBuildProfile(
        state.group,
        state.overall,
        state.lockedAttributes,
        state.flawId,
        state.homeTeam,
      )
      const viaPlayIn = state.playInResult !== null
      const qualified =
        state.seasonResult.madePlayoffs ||
        state.playInResult?.survived === true

      if (!qualified) {
        // Missed the playoffs (or died on play-in night) — straight to legacy
        const legacyLabel = deriveLegacyLabel(
          profile,
          state.seasonResult,
          null,
          null,
          {
            viaPlayIn,
            playInInjury: state.playInResult?.seasonEndingInjury,
          },
        )
        return { ...state, screen: 'share', legacyLabel }
      }

      // Play-in survivors enter the bracket as the 8 seed
      const seedOverride = state.seasonResult.madePlayoffs ? undefined : 8
      const playoffResult = simulatePlayoffs(
        profile,
        state.seasonResult,
        seedOverride,
      )

      if (!playoffResult.reachedFinals) {
        const legacyLabel = deriveLegacyLabel(
          profile,
          state.seasonResult,
          playoffResult,
          null,
          { viaPlayIn },
        )
        return {
          ...state,
          screen: 'playoffs',
          playoffResult,
          playoffGamesRevealed: 0,
          legacyLabel,
        }
      }

      // Glass Bones rolls once more at the door of the NBA Finals
      if (rollGlassBones(profile.flaw)) {
        const injured = {
          ...playoffResult,
          seasonEndingInjury: 'NBA Finals' as const,
        }
        const legacyLabel = deriveLegacyLabel(
          profile,
          state.seasonResult,
          injured,
          null,
          { viaPlayIn },
        )
        return {
          ...state,
          screen: 'playoffs',
          playoffResult: injured,
          playoffGamesRevealed: 0,
          legacyLabel,
        }
      }

      const finalsResult = simulateFinals(profile, state.seasonResult)
      const legacyLabel = deriveLegacyLabel(
        profile,
        state.seasonResult,
        playoffResult,
        finalsResult,
        { viaPlayIn },
      )
      return {
        ...state,
        screen: 'playoffs',
        playoffResult,
        finalsResult,
        playoffGamesRevealed: 0,
        finalsGamesRevealed: 0,
        legacyLabel,
      }
    }

    case 'REVEAL_NEXT_PLAYOFF_GAME': {
      if (!state.playoffResult) return state
      const totalGames = state.playoffResult.rounds.reduce(
        (sum, r) => sum + r.games.length,
        0,
      )
      return {
        ...state,
        playoffGamesRevealed: Math.min(
          state.playoffGamesRevealed + 1,
          totalGames,
        ),
      }
    }

    case 'REVEAL_ALL_PLAYOFF_GAMES': {
      if (!state.playoffResult) return state
      const totalGames = state.playoffResult.rounds.reduce(
        (sum, r) => sum + r.games.length,
        0,
      )
      return { ...state, playoffGamesRevealed: totalGames }
    }

    case 'REVEAL_ALL_FINALS_GAMES': {
      if (!state.finalsResult) return state
      return {
        ...state,
        screen: 'finals',
        finalsGamesRevealed: state.finalsResult.games.length,
      }
    }

    case 'REVEAL_NEXT_FINALS_GAME': {
      if (!state.finalsResult) return state
      const next = Math.min(
        state.finalsGamesRevealed + 1,
        state.finalsResult.games.length,
      )
      return { ...state, screen: 'finals', finalsGamesRevealed: next }
    }

    case 'GOTO_SHARE':
      return { ...state, screen: 'share' }

    case 'PLAY_AGAIN':
      return { ...initialGameState }

    // Restore a persisted mid-run snapshot (validated in persistence.ts)
    case 'RESUME_RUN':
      return { ...action.saved }

    case 'RESET_BUILD': {
      // Daily runs are one-shot: no mid-run resets, back to landing instead
      if (state.mode === 'daily') return { ...initialGameState }
      if (!state.group) return { ...initialGameState }
      const runSeed = randomSeed()
      const rand = eventRng(runSeed, 'team', 0)
      // Budget runs re-roll with the same tier and a refilled cap
      const budget =
        state.mode === 'budget' && state.budgetTier
          ? {
              mode: 'budget' as const,
              budgetTier: state.budgetTier,
              budgetLeft: BUDGET_TIER_BY_ID[state.budgetTier].budget,
            }
          : {}
      return {
        ...initialGameState,
        screen: 'game',
        group: state.group,
        ...budget,
        runSeed,
        rngCounters: { ...zeroRngCounters(), team: 1 },
        currentTeam: spinTeam(state.group, rand),
      }
    }

    default:
      return state
  }
}
