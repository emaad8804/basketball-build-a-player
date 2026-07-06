// build-player-data.js
//
// Merges the 2K sheet (authoritative roster + frame/athleticism/ballHandling/
// iqClutch) with real stats (shooting/finishing/playmaking/defense/rebounding)
// and emits src/data/generated/players.generated.ts.
//
// Run: node scripts/build-player-data.js   (after fetch-nbastats.js)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTwoKRatings } from './lib/parse-2k.js';
import {
  normalizeName, computeStatGrades, computeTwoKGrades,
  rarityFromComposite, positionToGroups, deriveTags,
} from './lib/grade-mapping.js';
import { buildSTierIndex } from './lib/s-tier.js';
import { GRADE_OVERRIDES } from './lib/grade-overrides.js';

// AttributeKey order (matches src/types/player.ts).
const ATTR_ORDER = ['frame', 'athleticism', 'shooting', 'finishing', 'ballHandling', 'playmaking', 'defense', 'rebounding', 'iqClutch'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TWOK_DIR = path.join(ROOT, '2K Ratings');
const OUT = path.join(ROOT, 'src', 'data', 'generated', 'players.generated.ts');

const PRIMARY_SEASON = '2025-26';
const FALLBACK_SEASON = '2024-25';

// Neutral fallback for the handful of players absent from both stat seasons.
const NEUTRAL_STAT = {
  shooting: 'C', finishing: 'C', playmaking: 'C', defense: 'C', rebounding: 'C',
  _scores: { shooting: 0.4, finishing: 0.4, playmaking: 0.4, defense: 0.4, rebounding: 0.4 },
};

// A player needs this many games for a season's stats to be trusted; below it, the
// per-possession rates are too noisy (small-sample players were earning bogus S's).
const MIN_GAMES = 25;
const FLOOR_GAMES = 15; // absolute minimum to use stats at all (else neutral)

// Pick the stat line from the season with a real sample: prefer the primary
// (current) season when it qualifies, else the fuller of the two, else neutral.
function pickStat(primary, fallback) {
  if (primary && primary.gp >= MIN_GAMES) return primary;
  if (fallback && fallback.gp >= MIN_GAMES) return fallback;
  const best = [primary, fallback].filter(Boolean).sort((a, b) => b.gp - a.gp)[0];
  return best && best.gp >= FLOOR_GAMES ? best : NEUTRAL_STAT;
}

function loadStatGrades(season) {
  const file = path.join(__dirname, 'cache', `nba-stats-${season}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${path.relative(ROOT, file)} — run: node scripts/fetch-nbastats.js ${season}`);
  }
  return computeStatGrades(JSON.parse(fs.readFileSync(file, 'utf8')).players);
}

function tsPlayer(p) {
  const g = p.grades;
  const grades =
    `{ frame: '${g.frame}', athleticism: '${g.athleticism}', shooting: '${g.shooting}', ` +
    `finishing: '${g.finishing}', ballHandling: '${g.ballHandling}', playmaking: '${g.playmaking}', ` +
    `defense: '${g.defense}', rebounding: '${g.rebounding}', iqClutch: '${g.iqClutch}' }`;
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const sec = `[${p.secondaryPositions.map((s) => `'${s}'`).join(', ')}]`;
  const groups = `[${p.eligibleGroups.map((s) => `'${s}'`).join(', ')}]`;
  const tags = `[${p.tags.map((s) => `'${esc(s)}'`).join(', ')}]`;
  const sTier = `[${p.sTierAttributes.map((s) => `'${s}'`).join(', ')}]`;
  return `  { name: '${esc(p.name)}', team: '${esc(p.team)}', primaryPosition: '${p.primaryPosition}', ` +
    `secondaryPositions: ${sec}, eligibleGroups: ${groups}, rarity: '${p.rarity}', grades: ${grades}, tags: ${tags}, sTierAttributes: ${sTier} },`;
}

function main() {
  const twoK = parseTwoKRatings(TWOK_DIR);
  console.log(`Parsed ${twoK.length} players from 2K sheet.`);

  const statPrimary = loadStatGrades(PRIMARY_SEASON);
  const statFallback = loadStatGrades(FALLBACK_SEASON);
  const twoKGrades = computeTwoKGrades(twoK);

  // Curated S-tier override: only listed players may hold an 'S'.
  const { attrToNames, allNames } = buildSTierIndex();
  const rosterNorm = new Set(twoK.map((p) => normalizeName(p.name)));

  // Consensus/eye-test grade overrides, keyed by normalized name.
  const overrideByNorm = new Map(
    Object.entries(GRADE_OVERRIDES).map(([name, grades]) => [normalizeName(name), { name, grades }]),
  );

  const players = [];
  const noStats = [];
  for (const p of twoK) {
    const key = normalizeName(p.name);
    const stat = pickStat(statPrimary.get(key), statFallback.get(key));
    if (stat === NEUTRAL_STAT) noStats.push(p.name);
    const tk = twoKGrades.get(key);

    const grades = {
      frame: tk.frame, athleticism: tk.athleticism, ballHandling: tk.ballHandling, iqClutch: tk.iqClutch,
      shooting: stat.shooting, finishing: stat.finishing, playmaking: stat.playmaking,
      defense: stat.defense, rebounding: stat.rebounding,
    };

    // Consensus/eye-test overrides — applied BEFORE the S-tier pass so 'S' stays
    // exclusive to s-tier.js (an override 'S' would be demoted).
    const override = overrideByNorm.get(key);
    if (override) {
      for (const [attr, letter] of Object.entries(override.grades)) grades[attr] = letter;
    }

    // Apply the S-tier override: grant S where curated, demote every other S to A+.
    const sTierAttributes = ATTR_ORDER.filter((a) => attrToNames[a]?.has(key));
    for (const a of ATTR_ORDER) {
      if (sTierAttributes.includes(a)) grades[a] = 'S';
      else if (grades[a] === 'S') grades[a] = 'A+';
    }

    const composite = (
      stat._scores.shooting + stat._scores.finishing + stat._scores.playmaking +
      stat._scores.defense + stat._scores.rebounding +
      tk._scores.frame + tk._scores.athleticism + tk._scores.ballHandling + tk._scores.iqClutch
    ) / 9;

    players.push({
      name: p.name,
      team: p.team,
      primaryPosition: p.positions[0] ?? 'F',
      secondaryPositions: p.positions.slice(1),
      eligibleGroups: positionToGroups(p.positions.join('/')),
      rarity: rarityFromComposite(composite),
      grades,
      tags: deriveTags(grades),
      sTierAttributes,
    });
  }

  // Flag curated names that don't match any rostered player.
  const unmatched = allNames.filter((n) => !rosterNorm.has(normalizeName(n)));
  const unmatchedOverrides = [...overrideByNorm.values()]
    .filter((v) => !rosterNorm.has(normalizeName(v.name)))
    .map((v) => v.name);

  players.sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));

  const header =
    `// AUTO-GENERATED by scripts/build-player-data.js — do not edit by hand.\n` +
    `// Sources: 2K Ratings/*.csv (roster, positions, frame/athleticism/ballHandling/iqClutch)\n` +
    `//          + stats.nba.com ${PRIMARY_SEASON} (fallback ${FALLBACK_SEASON}) for the 5 stat grades.\n` +
    `// Regenerate: npm run data:build\n\n` +
    `import type { Player } from '../../types'\n\n` +
    `export const ALL_GENERATED_PLAYERS: Player[] = [\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, header + players.map(tsPlayer).join('\n') + '\n]\n');

  // Summary
  const byTeam = {};
  for (const p of players) byTeam[p.team] = (byTeam[p.team] ?? 0) + 1;
  const rarity = {};
  for (const p of players) rarity[p.rarity] = (rarity[p.rarity] ?? 0) + 1;
  const sTierCount = players.filter((p) => p.sTierAttributes.length).length;
  console.log(`Wrote ${players.length} players -> ${path.relative(ROOT, OUT)}`);
  console.log('Teams:', Object.keys(byTeam).length, '| rarity:', JSON.stringify(rarity));
  console.log(`S-tier players: ${sTierCount}`);
  console.log(`No-stat players (neutral C for 5 stat attrs): ${noStats.length}`, noStats.length ? `-> ${noStats.join(', ')}` : '');
  if (unmatched.length) {
    console.log(`\n⚠️  S-tier names NOT found in roster (skipped): ${unmatched.length}`);
    for (const n of unmatched) console.log(`   - ${n}`);
  } else {
    console.log('All S-tier names matched the roster ✓');
  }
  if (unmatchedOverrides.length) {
    console.log(`\n⚠️  Grade-override names NOT found in roster (skipped): ${unmatchedOverrides.length}`);
    for (const n of unmatchedOverrides) console.log(`   - ${n}`);
  } else {
    console.log(`Grade overrides applied: ${overrideByNorm.size} (all matched) ✓`);
  }
}

main();
