# Product

## Register

product

## Users

Casual NBA fans on their phones — group-chat basketball people, 2K players, box-score
readers. They play in short sessions (a commute, a couch minute): one Daily Challenge
run or a couple of free-play builds, then screenshot or share the result card into a
group chat to flex or commiserate. Desktop is secondary but must look intentional.

## Product Purpose

Build-a-Hooper is a fan-made daily basketball builder: spin NBA teams, steal one skill
from each player you land on, assemble a 9-attribute superstar, survive the Fatal Flaw
wheel, then simulate a season and chase a ring. Success = the daily habit sticks and
the share card travels — the shareable result card is the growth loop, so the card is
the hero object of the whole app.

## Brand Personality

Kinetic, cocky, collectible. Broadcast-night energy (ESPN score bugs) meets premium
card-pack tactility (NBA 2K MyPlayer reveals, Panini Prizm foil). Copy is short and
punchy with swagger — never corporate, never canned-repetitive.

## Anti-references

- Generic SaaS dashboards, hero-metric templates.
- Default Tailwind orange (#f97316) with soft glow on everything.
- Inter-for-everything / system-font anonymity.
- Emoji used as icons.
- Empty editorial whitespace; everything centered-stacked.

## Design Principles

1. **The card is the hero.** Every design decision serves the reveal moment and the
   share asset; screens frame the card, not the other way around.
2. **One accent action per screen.** Restraint in color and type; the vermilion accent
   marks exactly one primary action.
3. **Juice is concentrated, not smeared.** Tactile feedback on interactions and a
   signature card reveal — motion carries the delight; palette and type stay disciplined.
4. **Protect the mechanics' identities.** The flaw wheel's green→amber→red, the
   rarity/lock mechanic, the projection ring, and the dark base are assets, not debts.
5. **Broadcast, don't decorate.** Playoff and season data reads like a score bug:
   dense, scannable, W/L-legible at a glance.

## Accessibility & Inclusion

- WCAG AA contrast: body text ≥4.5:1 on #0A0A0B / #141416 surfaces.
- Every animation has a `prefers-reduced-motion: reduce` fallback (crossfade or
  instant); spins and reveals must still resolve to content.
- Outcomes never color-only: W/L always paired with letters, flaws with names.
