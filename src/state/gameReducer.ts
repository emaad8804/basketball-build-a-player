import type { AttributeKey, GameState, Group } from '../types'
import {
  emptyBuildState,
  isBuildComplete,
  lockAttribute,
} from '../game-logic/build'
import { spinPlayer, spinTeam } from '../game-logic/spin'
import { evaluateChemistryBonuses } from '../game-logic/chemistry'
import { computeFinalOverall } from '../game-logic/overall'
import { assignArchetype } from '../game-logic/archetype'
import { makeBuildProfile } from '../simulation/profile'
import { simulateSeason } from '../simulation/seasonSim'
import { simulatePlayoffs } from '../simulation/playoffSim'
import { simulateFinals } from '../simulation/finalsSim'
import { deriveLegacyLabel } from '../simulation/legacy'

export type GameAction =
  | { type: 'SELECT_GROUP'; group: Group }
  | { type: 'SPIN_TEAM' }
  | { type: 'SPIN_PLAYER' }
  | { type: 'RESPIN' }
  | { type: 'RISK_IT' }
  | { type: 'LOCK_ATTRIBUTE'; attribute: AttributeKey }
  | { type: 'SIMULATE_SEASON' }
  | { type: 'SIMULATE_PLAYOFFS' }
  | { type: 'REVEAL_NEXT_FINALS_GAME' }
  | { type: 'GOTO_SHARE' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'RESET_BUILD' }

export const initialGameState: GameState = {
  screen: 'landing',
  group: null,
  ...emptyBuildState(),
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_GROUP':
      return {
        ...initialGameState,
        screen: 'game',
        group: action.group,
      }

    case 'SPIN_TEAM': {
      if (!state.group) return state
      const team = spinTeam(state.group)
      return { ...state, currentTeam: team, currentPlayer: null }
    }

    case 'SPIN_PLAYER': {
      if (!state.group || !state.currentTeam) return state
      const player = spinPlayer(state.currentTeam.name, state.group)
      if (!player) {
        // Dead team (shouldn't happen — spinTeam filters); respin team gracefully
        const team = spinTeam(state.group, state.currentTeam.name)
        return { ...state, currentTeam: team, currentPlayer: null }
      }
      return { ...state, currentPlayer: player }
    }

    case 'RESPIN': {
      // Loses current player, spins a fresh team, costs 1 respin
      if (state.respinsLeft <= 0 || !state.group) return state
      const team = spinTeam(state.group, state.currentTeam?.name)
      return {
        ...state,
        currentTeam: team,
        currentPlayer: null,
        respinsLeft: state.respinsLeft - 1,
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
      const player = spinPlayer(
        state.currentTeam.name,
        state.group,
        state.currentPlayer.name,
      )
      return {
        ...state,
        currentPlayer: player,
        respinsLeft: state.respinsLeft - 1,
      }
    }

    case 'LOCK_ATTRIBUTE': {
      if (!state.group || !state.currentPlayer) return state
      if (action.attribute in state.lockedAttributes) return state

      const locked = lockAttribute(
        state.lockedAttributes,
        action.attribute,
        state.currentPlayer,
      )

      if (!isBuildComplete(locked)) {
        return {
          ...state,
          lockedAttributes: locked,
          currentTeam: null,
          currentPlayer: null,
        }
      }

      // Build complete: compute final overall, chemistry, archetype
      const bonuses = evaluateChemistryBonuses(locked)
      const { baseOverall, overall } = computeFinalOverall(
        state.group,
        locked,
        bonuses,
      )
      const archetype = assignArchetype(state.group, locked)
      return {
        ...state,
        screen: 'result',
        lockedAttributes: locked,
        currentTeam: null,
        currentPlayer: null,
        chemistryBonuses: bonuses,
        baseOverall,
        overall,
        archetype,
      }
    }

    case 'SIMULATE_SEASON': {
      if (!state.group || state.overall === null) return state
      const profile = makeBuildProfile(
        state.group,
        state.overall,
        state.lockedAttributes,
      )
      const seasonResult = simulateSeason(profile)
      return { ...state, screen: 'season', seasonResult }
    }

    case 'SIMULATE_PLAYOFFS': {
      if (!state.group || state.overall === null || !state.seasonResult)
        return state
      const profile = makeBuildProfile(
        state.group,
        state.overall,
        state.lockedAttributes,
      )

      if (!state.seasonResult.madePlayoffs) {
        // Missed the playoffs entirely — straight to legacy
        const legacyLabel = deriveLegacyLabel(
          profile,
          state.seasonResult,
          null,
          null,
        )
        return { ...state, screen: 'share', legacyLabel }
      }

      const playoffResult = simulatePlayoffs(profile, state.seasonResult)

      if (!playoffResult.reachedFinals) {
        const legacyLabel = deriveLegacyLabel(
          profile,
          state.seasonResult,
          playoffResult,
          null,
        )
        return { ...state, screen: 'playoffs', playoffResult, legacyLabel }
      }

      const finalsResult = simulateFinals(profile, state.seasonResult)
      const legacyLabel = deriveLegacyLabel(
        profile,
        state.seasonResult,
        playoffResult,
        finalsResult,
      )
      return {
        ...state,
        screen: 'playoffs',
        playoffResult,
        finalsResult,
        finalsGamesRevealed: 0,
        legacyLabel,
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

    case 'RESET_BUILD': {
      if (!state.group) return { ...initialGameState }
      return {
        ...initialGameState,
        screen: 'game',
        group: state.group,
      }
    }

    default:
      return state
  }
}
