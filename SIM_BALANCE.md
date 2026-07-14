# Build-a-Hooper — Sim Authenticity & Balance Pass

A rebalance of the playoff/finals simulation so outcomes behave like real playoff
basketball and — critically — so the player can always tell **why** they lost.

**The goal is NOT "make good builds win more."** A 94 OVR losing is authentic; the best
player alive wins a title maybe one year in four. The goal is that the outcome
*distribution* matches the sport and the *reasons* are legible. Right now a sweep is
indistinguishable from noise, and that's the actual bug.

Branch `sim-balance` off main. No UI redesign work here beyond one new recap line —
this is mostly `src/simulation/` and `src/constants/weights.ts`.

---

## 0. The four authenticity breaks (root causes)

1. **The opponent is cosmetic.** `playoffSim.pickOpponent()` pulls a random team from the
   conference; `opponentSeed` is computed independently in `opponentSeedsForPath()`.
   Nothing links them, so you can face "Washington Wizards (2nd seed)" — a tanking team
   wearing a contender's label. Worse, `NBA_TEAMS` carries no strength at all, so the
   Thunder and the Nets are **mathematically identical opponents**. There are no upsets in
   this sim because there is nothing to upset.
2. **No home court.** Every game is the same coin flip. Real series have a spine
   (2-2-1-1-1, home teams win ~60%), which is what makes "hold serve / steal one on the
   road" legible. Cheapest authenticity win available.
3. **Series noise is drawn once and applied to all 7 games.** In `playoffSim.ts`,
   `gaussian(0, PLAYOFF_VARIANCE_STD)` sits in the ROUND loop, not the game loop. A −1.5σ
   draw isn't bad luck — it's a hidden debuff applied to every game of the series with no
   chance to regress. A best-of-7 exists precisely to wash out variance; this defeats it.
4. **`sitting` hard-codes `p = 0.25`, ignoring OVR.** In `seriesSim.ts`, an Injury Prone
   DNP stretch drops a 96 build to the same 25% as a 78 build. Two DNP games early can
   manufacture a sweep out of an elite build. Real teams losing a star drop *relative to*
   what they were, not to a floor.

---

## 1. Target outcome distribution (what "authentic" means numerically)

These are the acceptance criteria for the rebalance. Approximate but the right shape.
Measured for a **94 OVR, no flaw, contender team**, unless stated:

| Metric | Target | Today (fill from baseline) |
|---|---|---|
| Title % | 30–40% | ? |
| Reached Finals % | 55–70% | ? |
| Swept in any series % | < 2% | ? |
| First-round exit % | < 10% | ? |

League-wide shape (across all OVR bands / tiers):

| Metric | Target |
|---|---|
| Sweeps as share of all series | 10–15% |
| Series going 7 games | ~20% |
| 1-seed losing round 1 | single digits |
| Mean series length | ~5.7 games |

A 78 OVR on a tanking team should essentially never win a title. A 96 on a contender
should be a heavy favorite but **not** a lock — if title% > 60%, it's a coronation, not a
season, and that reads as fake.

---

## 2. Phase 0 — MEASURE FIRST (do this before changing any sim code)

Extend `scripts/balance-check.ts` to report playoff outcomes, not just the season. **Run
it and save the output as the baseline BEFORE any balance changes.** Without a baseline,
there is no way to know whether the changes helped.

Keep the existing season table. Add:

**Table 2 — Playoff outcomes**, per (OVR band 78–96) × (team tier):
- Title %
- Reached Finals %
- Eliminated in R1 % / R2 % / CF %
- **Swept %** (lost any series 0–4)
- Mean series length

**Table 3 — Flaw isolation**, at fixed 94 OVR on a contender, one row per flaw
(no-flaw, plus each of the 6 `FlawId`s):
- Title %
- Swept %
- Mean series length

Table 3 is the one that matters most: if Injury Prone's swept% is wildly higher than
no-flaw's, that confirms root cause #4 empirically.

**Table 4 — League-wide series shape** (pooled across all cells):
- Distribution of series lengths (4/5/6/7 games) as % of all series
- Sweep share

2000+ sims per cell for stability. Print as plain text tables in the same style as the
existing season table.

---

## 3. Fix: opponent strength is real (root cause #1)

**This is the highest-value change — it's what makes an upset an upset.**

### `src/constants/teamStrength.ts`
Add a seed→tier mapping so the opponent's name, seed, and strength are consistent:

```ts
/** Which team tiers plausibly occupy each playoff seed. */
export const SEED_TIER_POOL: Record<number, TeamTierId[]> = {
  1: ['contender'],
  2: ['contender'],
  3: ['contender', 'playoff-lock'],
  4: ['playoff-lock'],
  5: ['playoff-lock'],
  6: ['playoff-lock', 'middle'],
  7: ['middle'],
  8: ['middle', 'rebuilding'],
}
```

Add a helper: `teamsForSeed(seed, conference, excluded)` → the teams in that conference
whose tier is in `SEED_TIER_POOL[seed]` and aren't already used. Fall back to any unused
team in the conference if the pool is empty (never crash, never draw your own team).

### `src/simulation/playoffSim.ts`
- `pickOpponent(conf)` becomes `pickOpponent(conf, seed)` and draws from `teamsForSeed`.
  **The opponent's name must now match its seed.** No more 2-seed Wizards.
- Add an **opposing-strength term** to `pGame`. The opponent's tier
  (`teamTierFor(opponentName).strengthDelta`) is subtracted from the build's edge:

```ts
const oppStrength = teamTierFor(opponent).strengthDelta  // -5 .. +4
```
  Feed it into the win-prob calc as a differential, NOT as a flat penalty — see §6.
- **Delete `seedAdjustment()`.** It was a ±1%/seed-step proxy for exactly this, and it's
  now doing the job badly and double-counting. Opponent tier replaces it entirely.

Same treatment in `finalsSim.ts`: the Finals opponent should be drawn from the contender /
playoff-lock pool of the other conference (it's the Finals — it should essentially always
be a strong team), and its `strengthDelta` feeds the differential.

---

## 4. Fix: home court (root cause #2)

### `src/constants/weights.ts`
```ts
/** Per-game win-prob swing for playing at home. Real NBA playoff home teams win ~60%. */
export const HOME_COURT_EDGE = 0.035
```

### `src/simulation/seriesSim.ts`
- `simulateDetailedSeries` takes a new param: `hasHomeCourt: boolean` (the build's team has
  HCA if its seed is better than the opponent's — i.e. lower number; in the Finals, if its
  regular-season win total is higher).
- Standard 2-2-1-1-1 pattern. Games 1, 2, 5, 7 at home for the HCA team; games 3, 4, 6 away.
  (If `!hasHomeCourt`, invert.)
- Apply `+HOME_COURT_EDGE` when home, `−HOME_COURT_EDGE` when away, inside the per-game
  win-prob calc.
- **Surface it:** `SeriesGame` gains `home: boolean`. The playoff screen should be able to
  show @ / vs — that's a broadcast detail (PRODUCT.md §"Broadcast, don't decorate") and it
  makes "stole one on the road" legible.

---

## 5. Fix: per-game noise, not per-series (root cause #3)

### `src/simulation/playoffSim.ts` / `finalsSim.ts`
- **Remove** `gaussian(0, PLAYOFF_VARIANCE_STD)` / `gaussian(0, FINALS_VARIANCE_STD)` from
  the per-round `pGame` computation. Pass a clean, deterministic `pGame` into
  `simulateDetailedSeries`.

### `src/simulation/seriesSim.ts`
- Inside the per-game loop, add the noise draw: `gaussian(0, GAME_VARIANCE_STD)`.
- A *small* per-series component may stay (matchups genuinely do have a character —
  a bad stylistic matchup is real). Split it:

### `src/constants/weights.ts`
```ts
/** Noise on the SERIES (stylistic matchup) — small, applies to every game in that series. */
export const SERIES_MATCHUP_STD = 0.02
/** Noise on each GAME — the coin's own wobble. This is what a best-of-7 washes out. */
export const GAME_VARIANCE_STD = 0.06
```
Delete `PLAYOFF_VARIANCE_STD` and `FINALS_VARIANCE_STD` once callers are migrated (or keep
`FINALS_VARIANCE_STD` if the Finals should be marginally swingier — but it must move to the
game loop either way).

The net effect: a bad break can cost you a game, but it can no longer silently cost you a
whole series.

---

## 6. Fix: win-prob curve + differential (touches root causes #1 and the top-end squeeze)

Today: `strengthToWinProb(s) = clamp(0.5 + (s - 82) * 0.02, 0.2, 0.82)` — an absolute scale
that ignores who's across the floor, then `ROUND_DIFFICULTY` subtracts from it afterward.

Change to a **differential**: win prob is a function of (your strength − opponent strength),
which is what actually determines a basketball game.

```ts
/** Opponent's composite strength on the same 60-99 scale as playoffStrength(). */
export function opponentStrength(opponentName: string, seed: number): number {
  // Base by seed (a 1-seed is genuinely a better team than an 8-seed) plus tier delta.
  return SEED_BASE_STRENGTH[seed] + teamTierFor(opponentName).strengthDelta
}

/** Differential → per-game win probability. */
export function matchupWinProb(mine: number, theirs: number): number {
  return clamp(0.5 + (mine - theirs) * 0.022, 0.15, 0.85)
}
```

### `src/constants/weights.ts`
```ts
/** Baseline composite strength of a playoff team by seed (60-99 scale). */
export const SEED_BASE_STRENGTH: Record<number, number> = {
  1: 92, 2: 90, 3: 88, 4: 86, 5: 85, 6: 83, 7: 81, 8: 79,
}
```

- **`ROUND_DIFFICULTY` becomes redundant and should be deleted.** Deeper rounds are now
  harder *because you face better-seeded, better-tiered opponents* — which is the authentic
  reason, not a magic constant. This removes the double-count where a good build got
  penalized both by facing a 1-seed AND by an abstract "Conference Finals is hard" term.
- Keep `GAME7_WEIGHTS` / the separate Game 7 clutch profile — that's a good, characterful
  mechanic. But it too should become a differential against the opponent, not an absolute.

**Calibration note:** the `0.022` coefficient and `SEED_BASE_STRENGTH` values are starting
points, not gospel. Tune them against §1's targets using the Phase 0 tables. Expect 2–3
rounds of tuning. Do NOT hand-tune anything else until the differential is in — it changes
every number downstream.

---

## 7. Fix: injury `sitting` scales with the build (root cause #4)

### `src/simulation/seriesSim.ts`
Replace the hard-coded `const p = sitting ? 0.25 : ...` with a *relative* drop:

```ts
/** Without its star, the team's edge collapses toward — but not to — a floor. */
export const STAR_ABSENCE_MULT = 0.55
```
`p_sitting = clamp(p_normal * STAR_ABSENCE_MULT, 0.12, 0.5)`

A 96 build's team without him is still better than a 78 build's team without him. Losing
your star should be devastating, not deterministic — and it should still respect who you
built.

---

## 8. Make the "why" legible (the real bug)

Losing must never feel like unexplained noise. The per-game recap system already exists and
is good; what's missing is a **series-level verdict**.

### `src/types` + `src/simulation/playoffSim.ts`
`PlayoffRound` gains `verdict: string` — one line explaining the series outcome, derived
from what actually happened. Priority order (first match wins):

1. **Flaw was decisive** — e.g. DNP games ≥ 2 in a series lost:
   "Injury Prone cost you Games 2 and 3 — the series was gone before you got back."
2. **Swept by a stronger team** — "The {opponent} were the better team, and it showed."
3. **Upset** (you were the better team by strength and lost) — "You were the favorite. That's
   what makes it hurt."
4. **Went the distance** — "Seven games. One possession. That's the playoffs."
5. Generic win/loss pools (existing `SERIES_*_RECAPS`).

Same for the Finals. Render it on the playoff/series screen under the score-bug rows — it
answers "what happened to me" without the player having to guess.

---

## 9. Implementation order (commit per phase)

0. **Extend `balance-check.ts` (§2). Run it. SAVE THE BASELINE OUTPUT.** Do not skip.
1. Opponent strength + seed-matched opponents (§3). Delete `seedAdjustment()`.
2. Differential win prob + `SEED_BASE_STRENGTH` (§6). Delete `ROUND_DIFFICULTY`.
3. Home court (§4).
4. Per-game noise (§5).
5. `sitting` scaling (§7).
6. Series verdict lines (§8).
7. **Re-run `balance:check`. Diff against baseline. Tune the §6 coefficient against §1's
   targets.** Expect a few iterations — report the tables each round, don't just tweak
   silently.

---

## 10. Explicitly out of scope

- Simulating the rest of the bracket (other teams' series). The opponent is a strength
  number, not a simulated entity.
- Per-player opponent rosters / opposing star matchups.
- Changing the regular season (`seasonSim.ts`) — the balance table shows it behaves
  sensibly. **Exception:** if playoff seeding stops varying (everything 88+ is a 1-seed
  today), revisit — but only after the playoff side is fixed.
- Rebalancing the flaw wheel weights themselves. Fix how flaws *apply* (§7) before touching
  how often they *land*.
- Budget Mode / Dream Build interactions. Neither touches the sim.

---

## Design intent

- **A great build should be a heavy favorite, never a lock.** If a 96 wins 60%+ of titles,
  the sim has become a coronation and the playoffs stop being drama.
- **Every loss must have a nameable cause** — a better opponent, a flaw that bit, a Game 7
  that went the other way. "The dice said no" is the one outcome that reads as fake.
- **The opponent is the biggest missing character in the sim.** Getting bounced by the
  Nuggets should feel different from getting bounced by the Hornets. Today it doesn't,
  because mechanically it isn't.
