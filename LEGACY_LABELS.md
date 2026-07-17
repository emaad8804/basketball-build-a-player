# Build-a-Hooper — Legacy Label Expansion

Deepen the legacy-label pool (`src/game-logic/legacy.ts` → wherever `deriveLegacyLabel`
lives) so the end-of-run title reflects both **what you achieved** and **how you built**,
and so a genuinely great build is never insulted with "Solid Starter."

The legacy label is the emotional payoff of a full run and a share-card hero element. Right
now it's thin below the championship tier and blind to build shape. This fixes all three
complaints: great builds getting generic labels, runs feeling same-y, and labels ignoring
*how* you built.

Branch `legacy-labels` off main. Pure logic + content — no UI redesign, no sim changes.
Keep `deriveLegacyLabel` **deterministic** (no RNG) so the same build+result always yields
the same label — the Daily Challenge depends on this.

---

## 1. The real bug (it's not just "too few labels")

The bottom of the current chain is gated almost entirely on `overall` and `champion`:

```ts
if (overall >= 94) return 'Franchise Player'
if (season.allNba !== null) return 'All-NBA Talent'
if (overall >= 90) return 'Regular Season Superstar'
return 'Solid Starter'
```

So an 89 OVR build with 99 defense that reached the Second Round falls straight past every
rung to **"Solid Starter"** — it isn't 90+, didn't make All-NBA, didn't win a ring. The
chain never looks at the *shape* of the build or what it *did* in the playoffs below the
championship tier. Two structural fixes, then the new labels:

- **Add a Conference-Finals and a deep-run tier** — currently a CF exit with no ring has no
  dedicated label and falls to the overall gate.
- **Add a build-identity tier ABOVE the coarse overall floor** — so elite individual
  attributes (a lockdown defender, a pure shooter, a maestro passer) produce a characterful
  label even when the team fell short. This is what rescues "great build → Solid Starter."

---

## 2. Build-shape helpers (new, top of file)

Derived from `profile.ratings` (same raw-threshold style the existing champ-tier labels
already use, e.g. `ratings.defense >= 94`). These feed the identity labels.

```ts
const R = profile.ratings
const eliteShooting   = R.shooting >= 95
const eliteDefense    = R.defense >= 95
const elitePlaymaking = R.playmaking >= 90
const eliteClutch     = R.iqClutch >= 95
const eliteAthleticism= R.athleticism >= 90
const eliteRebounding = R.rebounding >= 90
const eliteFinishing  = R.finishing >= 90
const twoWay          = R.shooting >= 90 && R.defense >= 90
const threeAndD       = R.shooting >= 87 && R.defense >= 87   // lower bar than twoWay
const allAround       = ATTRIBUTE_KEYS.filter(k => R[k] >= 87).length >= 6
// single dominant skill: best attr is much higher than the 2nd best
const sorted = ATTRIBUTE_KEYS.map(k => R[k]).sort((a,b) => b - a)
const oneDimensional  = sorted[0] - sorted[2] >= 12
```

Optional: if an archetype-matcher already exists (see `constants/archetypes.ts`), you may
use the matched archetype name to pick flavor instead of/in addition to these thresholds —
but the thresholds must exist as the fallback so nothing depends on internals.

---

## 3. New label taxonomy (~20 new, layered into the existing chain)

Ordering rule is unchanged: **first match wins, most prestigious/specific first.** Outcome
prestige (ring > finals > CF > deep run) always outranks build identity — a champion who is
also a pure shooter gets a champion label, not "Bucket." Identity labels catch builds that
fell short of a deep run.

### Tier A — Champion (add to existing champ block)
Keep all current champion labels. Add these BEFORE the generic `'Championship Piece'`:

| New label | Trigger (champion === true, plus…) | Voice/intent |
|---|---|---|
| **The Closer** | `finalsMvp && eliteClutch` | won it on clutch DNA |
| **Positionless King** | `allAround` | did everything, won it all |
| **Unicorn** | `group === 'Centers' && eliteShooting && eliteDefense` | a big who broke the position |
| **Iron Throne** | champ with `overall >= 94` and no flaw | flawless dominant title |

### Tier B — Reached Finals, lost (currently only "Almost a Champion")
Insert BEFORE `'Almost a Champion'` (which stays as the tier fallback):

| New label | Trigger (reachedFinals && !champion, plus…) | |
|---|---|---|
| **Heartbreak in June** | `finals.winsFor === 3 && finals.winsAgainst === 4` | lost the Finals in 7 |
| **Conference Crown** | `season.wins >= 55` | won the conference, fell at the last step |

### Tier C — Conference Finals exit (NEW tier — current gap)
Insert after the Finals tier, before any overall-gated rung:

| New label | Trigger (eliminatedIn === 'Conference Finals', plus…) | |
|---|---|---|
| **One Series Away** | default for this tier | |
| **Prime Time Problem** | `eliteClutch` | got there on clutch, ran out of runway |

(`Play-In Warrior` for the via-play-in CF case already exists — keep it, and keep it above
these so the underdog story wins.)

### Tier D — Build identity (NEW tier — the "great build, no deep run" rescue)
This is the key addition. Insert AFTER the CF tier and AFTER the existing MVP / Playoff
Disappointment rungs, but **BEFORE** the coarse `overall >= 96 / >= 91` fallbacks. First
match wins, so order by specificity:

| New label | Trigger | Voice/intent |
|---|---|---|
| **Lockdown** | `eliteDefense && R.defense >= 97` | signature stopper |
| **The Wall** | `eliteDefense` | elite defender, team fell short |
| **Walking Bucket** | `eliteShooting && (season.stats.ppg >= 28 \|\| playoffs?.playoffStats.ppg >= 28)` | pure scorer, big numbers |
| **Sniper** | `eliteShooting` | elite shooter |
| **The Maestro** | `elitePlaymaking && eliteClutch` | floor-general brain |
| **Highlight Reel** | `eliteAthleticism && eliteFinishing` | above-the-rim finisher |
| **Glass Cleaner** | `eliteRebounding` | owns the boards |
| **Two-Way Terror** | `twoWay` | elite both ends, no ring |
| **Stat Sheet Stuffer** | `allAround` | filled every column |

### Tier E — Regular season vs playoffs (extend existing)
Keep `Playoff Disappointment`. Add:

| New label | Trigger | |
|---|---|---|
| **Regular Season Hero** | `season.wins >= 55 && (eliminatedIn === 'First Round' \|\| eliminatedIn === 'Second Round')` | 55-win team, early flameout |
| **Empty Numbers** | `season.stats.ppg >= 27 && !season.madePlayoffs` | big stats, no January meaning |

### Tier F — Made playoffs, early/quiet exit
| New label | Trigger | |
|---|---|---|
| **First-Round Casualty** | `eliminatedIn === 'First Round'` (and nothing above matched) | |
| **Playoff Regular** | `season.madePlayoffs` (tier fallback) | got there, didn't stay |

### Tier G — Missed playoffs
| New label | Trigger | |
|---|---|---|
| **Building Block** | `!season.madePlayoffs && overall >= 91` | promising piece on a bad team |
| **Lottery Bound** | `!season.madePlayoffs` (tier fallback) | |

### Tier H — Raised floor (replaces bare "Solid Starter")
The final rungs now consult shape before defaulting, so a shaped-but-modest build still
gets an identity:

```ts
if (threeAndD) return '3-and-D Specialist'
if (oneDimensional) return 'Specialist'
if (allAround) return 'Glue Guy'
if (overall >= 85) return 'Solid Starter'   // now a genuine mid-tier, not a catch-all
return 'Rotation Piece'                       // true floor
```

---

## 4. Priority ordering (the whole chain, top → bottom)

1. Injury what-if (existing: What Could Have Been / Star-Crossed)
2. Ultimate Underdog (existing)
3. **Champion tier** — existing HOF/All-Time/Playoff Legend/Two-Way/Defensive Anchor/
   Offensive Engine + new **The Closer, Positionless King, Unicorn, Iron Throne** → Finals
   MVP → Championship Piece
4. **Finals-lost tier** — new **Heartbreak in June, Conference Crown** → Almost a Champion
5. Play-In Warrior (existing)
6. **Conference Finals tier** — new **One Series Away, Prime Time Problem**
7. MVP-Caliber Superstar (existing)
8. Playoff Disappointment (existing) + new **Regular Season Hero**
9. **Build-identity tier** — new **Lockdown, The Wall, Walking Bucket, Sniper, The Maestro,
   Highlight Reel, Glass Cleaner, Two-Way Terror, Stat Sheet Stuffer**
10. **Empty Numbers**, then Franchise Player (existing, keep as a high-overall catch)
11. All-NBA Talent (existing)
12. **First-Round Casualty / Playoff Regular**
13. **Building Block / Lottery Bound**
14. **Raised floor** (3-and-D Specialist / Specialist / Glue Guy / Solid Starter / Rotation Piece)

The one judgment call: the build-identity tier (9) sits below the individual-honors rungs
but above the coarse overall fallbacks — that's deliberate, it's what converts "89 OVR,
99 defense, lost R2" from "Solid Starter" into "The Wall."

---

## 5. Implementation notes

- Add every new string to whatever the label type/union is, plus any label→color or
  label→description map the result card uses. Missing map entries are the likely footgun —
  grep for where `'Solid Starter'` is consumed and mirror it for each new label.
- Keep the function pure/deterministic. No `Math.random()`. Same inputs → same label.
- If a `legacy.test.ts` exists, add cases: (a) 89 OVR / 99 defense / R2 exit → "The Wall"
  not "Solid Starter"; (b) champion + all-around → "Positionless King"; (c) lost Finals in 7
  → "Heartbreak in June"; (d) missed playoffs / 90 OVR → "Building Block".
- Sanity sweep: run a few hundred random builds through `deriveLegacyLabel` and print the
  label distribution — confirm "Solid Starter"/"Rotation Piece" is now a small slice, not
  the mode, and that no tier is unreachable (dead code from a too-greedy rung above it).

---

## 6. Out of scope
- No new attributes, sim changes, or flaw changes.
- No per-label art/foil treatment beyond reusing the existing result-card label styling.
- Rarity/tier coloring of labels (e.g. legendary labels glowing) — nice v2, not now.
- Copy tone: keep it kinetic/cocky per PRODUCT.md, but these are labels not paragraphs —
  short, culturally legible basketball vernacular ("Bucket," "The Wall," "Glue Guy").
