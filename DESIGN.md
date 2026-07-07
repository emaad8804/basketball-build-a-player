# Build-a-Hooper — Design Direction & Rework Brief

This file is the design source of truth for the redesign. Read it before any UI work.
Goal: strip the AI-generic look, land on a distinctive "juicy collectible-card game"
identity that works on phone and desktop, and make the shareable result card the
centerpiece (it's the growth loop).

---

## 0. Project rename (do this first, whole project)

The project is being renamed from **Build-a-Player** to **Build-a-Hooper**.

- Wordmark / brand name in UI: **Hooper** (short form). Use "Build-a-Hooper" only where a
  full title is needed (e.g. page `<title>`, share-card footer, meta tags).
- Replace every user-facing string, title, meta tag, share-card label, and code
  identifier referencing "Build-a-Player" / "Build A Player" / "BuildAPlayer" / "BAP"
  with the Hooper equivalent.
- Old monogram "BAP" → wordmark **HOOPER** (no monogram). If a compact mark is needed,
  use "HOOPER" set in the display face, not initials.
- **Do NOT rename the build modes.** Guard / Forward / Center stay exactly as they are.
- Update: `package.json` name, `<title>`, meta/OG tags, README, any header/logo
  component, share-card text, and the daily-challenge copy.

Rename map:
| Old | New |
|-----|-----|
| Build-a-Player (full title) | Build-a-Hooper |
| Build A Player / BuildAPlayer (identifiers) | BuildAHooper |
| BAP (monogram/short) | HOOPER (wordmark) |
| "Build-a-Guard / Forward / Center" | unchanged |

---

## 1. Direction (one line)

Juicy collectible-card game — tactile feedback throughout, the player card as the hero
object, restraint held in the palette and typography. Broadcast edge for energy.

**Reference worlds (named):** NBA 2K MyPlayer card reveals, Panini Prizm holographic
cards, ESPN broadcast score bugs, Topps Finest refractors.

**Anti-references (named):** generic SaaS dashboards, default Tailwind orange,
Inter-for-everything, emoji-as-icons, empty editorial whitespace.

**Platforms:** phone-first but must look intentional on desktop too. Same design; desktop
gets more air around the same components, not a different layout.

---

## 2. Kill list — the AI tells to remove

1. **Emoji used as icons** (⚡🔥🏔️🎰🎲🏆🍀🏟️💀📋🖼️). Replace ALL with a real icon set
   (Lucide, since it fits React/Vite). This is the single biggest AI tell.
2. **Default Tailwind orange (`#f97316`) + soft glow on everything.** Move to the
   considered accent below; use ONE accent action per screen.
3. **No type personality** (system/Inter doing all the work). Install the type system in
   section 4 — this is the highest-leverage change.
4. **Cards nested in cards**, everything on the same radius, flat gray-on-dark secondary
   text.
5. **Everything centered-stacked.** Vary rhythm — the playoff/series and build screens
   especially should not be one vertical center column.
6. **Repeated canned flavor strings** (e.g. "A hot night from the opposing star evened
   things up." appears on 3 playoff games). Expand the pool; make lines react to the box
   score.

Protect these existing assets: the rarity/lock mechanic, the flaw wheel, the projection
ring, the dark base.

---

## 3. Color spec

Dark court base. Warm but specific accent — NOT default orange.

| Role | Hex | Notes |
|------|-----|-------|
| Background base | `#0A0A0B` | warm near-black |
| Panel / card bg | `#141416` | |
| Hot accent (primary CTA / hero) | `#FF5A1F` | vermilion-orange, used sparingly — one primary action per screen |
| Accent deep (hover/pressed) | `#D8410E` | |
| Text primary | `#FAFAF7` | warm white, not pure #FFF |
| Text secondary | `#8A8A94` | replaces flat gray |
| Win | `#3FB950` | standardize existing |
| Loss | `#F04438` | standardize existing |

**Rarity tiers** (move off stock gray/blue/purple/gold):
| Tier | Hex | Treatment |
|------|-----|-----------|
| Common | `#9BA1A6` | flat |
| Rare | `#3B82F6` | flat |
| Elite | `#C026D3` | magenta-purple; subtle foil edge |
| Legendary | `#F5B301` | rich gold; animated foil/sheen |

The flaw wheel keeps its own green→amber→red identity — that's its emotional job, don't
recolor it to the accent.

---

## 4. Type spec (highest-leverage change — do first)

Two-face system. This is what separates "intentional" from "AI default."

- **Display** (big moments — OVR numbers, team names, wordmark, "THE FATAL FLAW", card
  names): **Anton** (Google Fonts). Tight, condensed, broadcast punch.
- **Body / UI** (labels, stats, descriptions): **Geist** or **Space Grotesk** — anything
  with more character than Inter. Avoids the Inter fingerprint.

Default pairing: **Anton (display) + Geist (body).**

---

## 5. The hero: player card + share card

The player card is both the reveal moment AND the share asset (people screenshot the
result and post it in group chats — this is the growth loop). Treat it as a designed
collectible object, not an app screen:

- Rarity IS the frame — foil edge + sheen scale with tier (plain gray edge for common,
  gold animated foil for legendary).
- OVR number and player name are the hero, set in the display face.
- Team colors present. Attribute grades as compact pills.
- Must render well at thumbnail size in a chat and on both phone + desktop.
- The dedicated **Share Card** screen gets its own polish pass — it's the most important
  screen in the app for growth.

---

## 6. Where the "playful" goes

Not everywhere — concentrated so it reads premium, not cluttered:
- **Tactile tap feedback** on every interaction (spin feels like a spin, lock snaps,
  wheel ticks, numbers count up on sim stats). This belongs throughout on mobile.
- **The card reveal** — flip + settle + foil sheen. The signature moment.

Restraint lives in color and type, NOT in removing motion.

---

## 7. Interaction fixes (bugs)

**Spin spoiler — the result flashes before the spin.** When you click any Spin button
(Spin Player, Spin the Flaw Wheel, Spin for Your Team), the final result is briefly
visible for a fraction of a second before the spin animation plays. This spoils the
reveal. Cause is almost certainly that state updates to the final value at the *start*
of the animation (or the target element renders the result immediately) instead of at
the *end*. Fix: pick/commit the result up front internally, but only reveal it after the
spin animation completes — the spinning UI should show blur/cycling placeholder frames
during the animation, and the actual landed team/player/flaw should render only on
animation end. Verify with Playwright that no frame between click and settle shows the
final value. This is part of the `/impeccable animate` pass.

## 8. Screen-by-screen priority

1. Type system installed (Anton + Geist)
2. Color moved off default orange to the palette above
3. Player card / reveal reworked as collectible object
4. Share card polished as a screenshot-ready object
5. Landing: replace emoji with icons, wordmark in Anton, vary layout
6. Flaw wheel: keep wheel, upgrade type + legend, clean CTA
7. Playoff series screen: broadcast scoreboard — W/L series dot-tracker, compact
   score-bug rows, count-up on final stat averages; fix repeated flavor strings
8. Build screen, team destiny, career/season-result: consistent with the above,
   break up the center-stack rhythm

---

## 9. Voice / copy

Kinetic and a little cocky. Short, punchy. No corporate filler. The daily-challenge and
flavor copy can have swagger — just don't repeat canned lines.
