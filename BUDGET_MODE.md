# Build-a-Hooper — Budget Mode Spec

A third game mode, alongside Daily Challenge and Free Play.

> **BUILD ORDER: build this AFTER the `hooper-redesign` branch is merged to main.**
> Budget Mode adds new screens (the HUD, the efficiency card add-on) — those should be
> built in the new redesigned visual style, not the old one. Branch `budget-mode` off a
> clean, redesigned main. Follow all of DESIGN.md for visual style, palette, type, and
> anti-slop rules.

---

## 1. Concept

The current game is mostly luck — you spin and hope. Budget Mode adds a strategy layer:
you have a fixed budget, every skill costs money based on its grade, and you have to build
the most efficient hooper you can within the budget. Every spin becomes a menu of priced
options you evaluate and choose from, not a gamble.

Core loop is the same as Free Play (spin a team → spin a player → lock skills → flaw wheel
→ tenth spin → team destiny → simulate → playoffs → legacy). The ONLY additions are:
budget, per-skill pricing, the budget HUD, the out-of-money floor, and an efficiency score
on the result card. Everything else is unchanged.

---

## 2. Budget tiers (difficulty)

Player picks a budget tier when entering the mode. These ARE the difficulty setting and the
leaderboard split.

| Tier | Budget | Feel | Avg $/slot (9 slots) |
|------|--------|------|------|
| Superteam | $150M | Forgiving — a couple of stars + fill out | ~16.7 |
| Starter | $90M | The sweet spot — every A forces a C elsewhere | 10 |
| Hard | $60M | Punishing — mostly C/B land, an A is a real sacrifice | ~6.7 |

Default / recommended tier: **$90M (Starter)**.

---

## 3. Skill pricing (grade-based only)

Price is keyed to the skill's grade ONLY. No position premiums, no rarity multiplier —
grade does all the work. All whole numbers for fast mental math. The curve is
deliberately non-linear: jumps get steeper toward the top, so one elite skill costs as much
as several mid ones. This is what creates the "one star vs. balanced build" decision.

| Grade | Rating | Cost ($M) |
|-------|--------|-----------|
| C | 66 | 4 |
| C+ | 70 | 6 |
| B | 78 | 10 |
| B+ | 82 | 14 |
| A- | 86 | 22 |
| A | 90 | 30 |
| A+ | 94 | 38 |
| S | 96+ | 48 |

Design intent to preserve if grades/ratings ever change: each jump should be >= the
previous jump (currently +2, +4, +4, +8, +8, +8, +10), so upgrading is always a
meaningfully bigger spend at the top. One A (30) ≈ three C+'s (18). An S (48) is roughly
half a Starter budget in a single skill.

---

## 4. The spin (what the player sees)

When the player spins a player, ALL NINE of that player's skills show with their price
next to the grade — e.g. `Shooting  A-  $22M`. The player then chooses which skill to lock,
sees it deducted from the budget, and moves on. Prices are visible BEFORE committing to a
lock — this is a pure-strategy mode, not push-your-luck.

---

## 5. Respins

- **First respin: free.**
- **Second respin: costs $1M** (deducted from remaining budget).
- **Hard cap: 2 respins total per build** (one free, one paid).

The $1M is a small tax, not a real deterrent — it just makes the second respin a
conscious choice rather than a reflex.

---

## 6. Budget HUD (must-have — the mode lives on this)

A persistent, always-visible readout so the player always knows where they stand. On mobile,
three boxes in a row (matching the existing SLOTS LEFT / RESPINS box style), with the budget
box getting a bit more room:

```
[ SLOTS LEFT ]   [ RESPINS ]   [ REM. BUDGET     ]
[     9      ]   [    2     ]   [ $XXX M          ]
```

- **Slots left** — attributes still unlocked
- **Respins** — respins remaining (starts at 2)
- **Rem. Budget** — money left, labeled "REM. BUDGET", shown as `$XXXM`

Optional nice-to-have if it fits cleanly: a tiny helper line under Rem. Budget showing
avg $ left per remaining slot, so the player can see if they're on pace without doing math.
Ship the three boxes first; add the helper only if it doesn't crowd mobile.

---

## 7. Out-of-money floor — "Minimum-Wage Signing"

When the player can no longer afford ANY skill on a spun player's slate, they do NOT get
locked out and slots are NOT randomly auto-filled. Instead:

- The player receives that spun player's **lowest-grade skill, for free** (a minimum-wage
  signing).
- Running out still hurts — you're stuck taking whatever the worst skill is on each slate,
  with no choice across slates — but you keep playing to a complete build.
- This continues for each remaining slot until the build is full, then the run proceeds to
  the flaw wheel / sim as normal.

Make the minimum-wage state visually clear (e.g. the HUD budget box reads $0 / "BROKE", and
the free signing is flagged as such) so the player understands why their choices vanished.

---

## 8. Leftover money

Leftover budget is **neutral** — it neither helps nor penalizes the final score. It just
displays on the result card as money left on the table, so under-spending stings (you
could've bought more) without an explicit penalty. No conversion to perks, no OVR bump.

---

## 9. Result card — efficiency add-on

Budget Mode's result card is the standard career-complete card PLUS an efficiency block.
This is the mode's replay hook and its distinct share flex — "82 OVR on $90M" is a very
different brag than "82 OVR on $150M".

Add to the card:
- **Budget tier** played (e.g. "$90M Starter")
- **Spent** — total money spent
- **Left on the table** — leftover budget
- **Efficiency** — OVR per dollar, or a simple lettered/badged efficiency grade derived from
  OVR relative to spend (e.g. high OVR on low spend = an "Efficient" / "Bargain GM" badge)

Keep it legible at thumbnail size per DESIGN.md section 5 — the efficiency line should read
clearly in a shared screenshot.

---

## 10. Teaching the mode

No tutorial needed — the prices teach the economy on the first spin. Seeing a $30M A next to
a $10M B on the very first slate makes the tradeoff obvious immediately. Just make sure the
budget tier picker briefly states the premise ("Fixed budget. Every skill costs money by
grade. Build the most efficient hooper you can.") on entry.

---

## 11. Flaw wheel

Unchanged. A broke build heading into the flaw wheel is now extra tense — that's free drama,
no new mechanics needed.

---

## 12. Explicitly OUT of scope for v1

Do not build these unless revisited later:
- Position-based price premiums
- Rarity-based price multipliers
- Spending money to reduce flaw-wheel odds
- Leftover money converting to perks/boosts
