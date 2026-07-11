# Build-a-Hooper — Dream Build ("The One That Got Away")

A result-screen feature for **Free Play and Daily Challenge only** (NOT Budget Mode
in v1) that shows the player the best possible build they *could* have assembled
from the pool of players they actually rolled during their run — recombined across
all 9 attributes — and calls out which real player each best-possible grade came from.

Build only after `hooper-redesign` is merged to main — the new result-screen section
uses the redesigned visual style (dark court, vermilion accent #FF5A1F, Anton/Geist
fonts, foil cards), not the old one. Branch `dream-build` off main.

---

## Core concept

Every spin reveals a full player card (e.g. Tyler Herro, Steph Curry) with all 9
attribute grades visible, but the player can only lock ONE attribute from that card
into the slot they're currently filling. So an S-grade Shooting on a player rolled
while filling the Clutch slot is visible but unclaimable.

The **Dream Build** is the answer to "what if I could have kept the best attribute from
every player I saw?" — for each of the 9 attributes, take the highest grade that ANY
rolled player had for that attribute, across the whole run, regardless of which slot
that player appeared for.

**This is pure recombination of real data.** No grades are invented or simulated. A
player only enters the pool if they were actually rolled — initial spin OR a spent
respin — so the feature is respin-constrained for free: a player never seen simply
isn't in the pool. Someone who spends more respins sees more players and has a richer
(and potentially more painful) Dream Build. That's correct by construction.

---

## Locked decisions

- **Scope:** Free Play + Daily Challenge only. Budget Mode explicitly excluded in v1
  (its pricing/budget layer complicates "could you have afforded it" — revisit later).
- **Pool = every unique player rolled during the build**, across all 9 slots, including
  every respin, not just locked players.
- **Dream grade per attribute = best grade among all pooled players for that attribute**,
  compared via the existing `GRADE_RANK` order. Ties broken by first-seen (stable).
- **Show the source player** for each dream grade — the emotional payoff ("you had Curry
  the whole time"). This is a locked design decision, not optional.
- **Two result states**, both designed for, not just the negative one:
  - **Missed something** → "left X OVR on the table" framing + share hook.
  - **Nailed every best pick** → distinct "Perfect Read" celebration state, NOT a bummer.
- **Flaw wheel:** unchanged, not part of this feature.
- **No new randomness anywhere** — this feature only reads history that already happened.

## Out of scope for v1

- Budget Mode support (the affordability dimension).
- Cross-slot respin reallocation ("what if you'd respun slot 7 instead of slot 3") —
  that requires simulating rolls that never happened; not this feature.
- Any "dream build" that includes players never rolled.
- Sharing the dream build as its own standalone card (v1 folds it into the existing
  result card + share text; a dedicated dream share-card is a v2 idea).

---

## New files

### `src/game-logic/dreamBuild.ts` — single source of truth for reducer AND UI

The 9 attribute keys, per the existing rating system:
`Shooting, Clutch, Frame, Defense, Athleticism, Finishing, Playmaking, Ball Handle, Rebounding`.

- `type DreamSlot = { attribute: AttributeKey; grade: Grade; sourcePlayerId: string; sourcePlayerName: string }`
- `dreamBuild(rolledPlayers: Player[]): Record<AttributeKey, DreamSlot>`
  For each of the 9 attributes, scan every pooled player's grade for that attribute,
  keep the best by `GRADE_RANK`; record the winning player's id + name. Stable tie-break
  (first player seen with that grade wins, so the ordering of `rolledPlayers` matters —
  preserve roll order when building the pool).
- `dreamOVR(dream: Record<AttributeKey, DreamSlot>): number`
  OVR of the dream build using the same OVR formula the real build uses (import/reuse
  the existing OVR calc — do NOT duplicate it, so the two can't drift).
- `missedSlots(actual: LockedBuild, dream: Record<AttributeKey, DreamSlot>): AttributeKey[]`
  Slots where the actual locked grade rank < dream grade rank.
- `missedOVR(actualOVR: number, dreamOVR: number): number` → `max(0, dreamOVR - actualOVR)`.
- `isPerfectRead(missed: AttributeKey[]): boolean` → `missed.length === 0`.

All functions pure, no state access — same discipline as `game-logic/budget.ts` so the
result screen and any share logic derive identically and can't drift from each other.

### `src/components/result/DreamBuildSection.tsx`

New section rendered inside the existing ResultScreen (see modified files). Redesign
style only. Two variants driven by `isPerfectRead`:

- **Comparison variant** (missed ≥ 1): a compact 9-row layout. Each row: attribute name,
  your locked grade, an arrow/gap indicator, the dream grade with a small foil-style
  player chip beneath it ("S · Curry"). Missed rows get the vermilion accent + a subtle
  strike/dim on the actual grade; matched rows stay muted so the misses pop. Header uses
  Anton: "THE ONE THAT GOT AWAY" (or "DREAM BUILD" — see copy note). Footer line:
  "You left **{missedOVR} OVR** on the table."
- **Perfect Read variant** (missed = 0): celebratory single card, NOT the comparison grid.
  Anton header "PERFECT READ", vermilion accent, copy along the lines of "You locked the
  best grade from every player you saw. Nothing got away." This must feel like a flex,
  not the absence of one.

Uses the existing GradeBadge and card/chip components from the redesign — no new visual
primitives unless one's genuinely missing; if a small "player chip" is needed, keep it
consistent with existing foil-card styling.

---

## Modified files

### `src/types/build.ts`

- `GameState` (run-identity section) gains `rolledPlayerIds: string[]` — ordered, unique,
  every player rolled this run across all slots + respins. Defaults to `[]` in
  `initialGameState`. Spread from `initialGameState` on every reset.
  (Array, not Set, so it stays serializable for persistence and preserves roll order for
  stable tie-breaking. Enforce uniqueness on insert.)

### `src/state/gameReducer.ts`

- `initialGameState`: `rolledPlayerIds: []`.
- On the action(s) that roll a player — the initial **SPIN** and every **RESPIN** /
  reroll that surfaces a new player — append the rolled player's id to `rolledPlayerIds`
  if not already present. This is the ONLY new tracking; do it wherever the rolled player
  is first known in the reducer, for BOTH spin and respin branches.
- `RESET_BUILD`: `rolledPlayerIds: []` (mirror the existing per-run reset — same place the
  other run-identity fields get cleared).
- No new randomness, no seed changes — this is pure bookkeeping of what already rolled.

### `src/state/persistence.ts`

- `rolledPlayerIds` rides along in the saved run automatically once it's on `GameState`.
  Add a sanity check in `loadRun`: `Array.isArray(parsed.rolledPlayerIds)` — if an old
  save predates the field, default to `[]` rather than rejecting the save (old Free Play /
  Daily runs must still load; they just won't have a Dream Build until the next run, which
  is fine). Do NOT gate the whole save on this field.

### `src/components/result/ResultScreen.tsx`

- After the existing result content, render `<DreamBuildSection />` — but ONLY for Free
  Play and Daily modes. Guard on `mode !== 'budget'` so Budget Mode result cards are
  unchanged in v1.
- Derive `rolledPlayers` by mapping `state.rolledPlayerIds` → player objects from the
  existing player database, preserving order. Pass the derived `dreamBuild`, the actual
  locked build, and the OVRs into the section (compute via `game-logic/dreamBuild.ts`, UI
  never recomputes).
- Edge case: if `rolledPlayerIds` has only the players that were actually locked (i.e. the
  player never respun and every slot's own player was the only source), the Dream Build
  may legitimately equal the actual build → Perfect Read state. That's correct, not a bug.

### `src/utils/shareText.ts`

- Free Play / Daily only: if `missedOVR > 0`, append a hook line, e.g.
  `👀 Left {missedOVR} OVR on the table — had {topMissedGrade} {topMissedAttr} from {sourcePlayerName}`
  (pick the single biggest miss for the line so it stays short). If Perfect Read, append a
  flex line instead, e.g. `🎯 Perfect Read — kept the best of everyone I saw`.
- Budget Mode share text unchanged (feature not active there in v1).

---

## Copy / naming note

Two candidate section titles: **"THE ONE THAT GOT AWAY"** (evocative, leans into regret,
great for the miss state) vs **"DREAM BUILD"** (neutral, works for both states). Suggest:
use "DREAM BUILD" as the neutral section label and "THE ONE THAT GOT AWAY" only as the
miss-state subheader, so the Perfect Read state doesn't inherit a regretful frame. Critique
should flag if the copy makes nailing every pick feel like a loss.

---

## Implementation order (suggested phases, commit per phase)

1. `types/build.ts` + `gameReducer.ts` + `persistence.ts` — track `rolledPlayerIds`, no UI.
   Verify via a run that the array fills correctly on spin + respin and clears on reset.
2. `game-logic/dreamBuild.ts` — pure logic + a quick unit sanity check (feed a known
   pool, assert the recombined grades and OVR).
3. `DreamBuildSection.tsx` + wire into `ResultScreen.tsx` behind the `mode !== 'budget'`
   guard — comparison variant first, then Perfect Read variant.
4. `shareText.ts` hook.
5. Playwright pass: play a Free Play run, respin at least once, confirm the section shows,
   the source player chips are correct, and the miss math matches.

---

## Design intent notes

- The feature's whole emotional payload is "you had it and didn't know" — which is why
  showing the **source player** is non-negotiable. A bare grade delta is a stat; "S
  Shooting, from Curry" is a story.
- Do not let this always read as a bummer. The Perfect Read state is what keeps the feature
  from punishing good play. A player who reads every card well should feel rewarded, not
  told they merely avoided regret.
- Respin-constrained by construction: more respins = more players seen = richer dream pool.
  This is a nice implicit incentive to engage with the respin mechanic, at no design cost.
