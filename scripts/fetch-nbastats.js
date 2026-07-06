// fetch-nbastats.js
//
// Pulls real per-game season stats for every player from the official NBA stats
// backend (stats.nba.com) and writes them to scripts/cache/nba-stats.json.
// Pulls two measure types:
//   - Base:     box-score counting stats (FG3_PCT, AST, STL, BLK, OREB/DREB, ...)
//   - Advanced: rate stats independent of minutes (USG_PCT, AST_PCT, REB_PCT,
//               TS_PCT, DEF_RATING, ...)
// These feed the stat-derived grades (shooting/finishing/playmaking/defense/
// rebounding).
//
// No API key required. Run: node scripts/fetch-nbastats.js [season]
//   season defaults to 2025-26 (format "YYYY-YY").

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchJson, NBA_STATS_HEADERS } from './lib/http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEASON = process.argv[2] || '2025-26';
// Per-season cache so a fallback season doesn't clobber the primary one.
const CACHE = path.join(__dirname, 'cache', `nba-stats-${SEASON}.json`);

function statsUrl(measureType) {
  const p = new URLSearchParams({
    Season: SEASON,
    SeasonType: 'Regular Season',
    PerMode: 'PerGame',
    MeasureType: measureType,
    LastNGames: '0',
    Month: '0',
    OpponentTeamID: '0',
    PaceAdjust: 'N',
    Period: '0',
    PlusMinus: 'N',
    Rank: 'N',
    LeagueID: '00',
  });
  return `https://stats.nba.com/stats/leaguedashplayerstats?${p}`;
}

// Turn a stats.nba.com resultSet (headers[] + rowSet[][]) into keyed objects.
function rowsToObjects(resultSet) {
  const { headers, rowSet } = resultSet;
  return rowSet.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
}

async function fetchMeasure(measureType) {
  console.log(`Fetching ${measureType} stats for ${SEASON}...`);
  const res = await fetchJson(statsUrl(measureType), { headers: NBA_STATS_HEADERS, timeoutMs: 30000 });
  const rows = rowsToObjects(res.resultSets[0]);
  console.log(`  ${rows.length} players.`);
  return rows;
}

async function main() {
  const base = await fetchMeasure('Base');
  const advanced = await fetchMeasure('Advanced');

  // Merge Advanced fields onto Base rows by PLAYER_ID.
  const advById = new Map(advanced.map((r) => [r.PLAYER_ID, r]));
  const players = base.map((b) => {
    const a = advById.get(b.PLAYER_ID) ?? {};
    return {
      playerId: b.PLAYER_ID,
      name: b.PLAYER_NAME,
      teamAbbr: b.TEAM_ABBREVIATION,
      age: b.AGE,
      gp: b.GP,
      min: b.MIN,
      // Base counting/shooting
      fgPct: b.FG_PCT, fg3m: b.FG3M, fg3a: b.FG3A, fg3Pct: b.FG3_PCT,
      ftm: b.FTM, fta: b.FTA, ftPct: b.FT_PCT,
      fgm: b.FGM, fga: b.FGA,
      oreb: b.OREB, dreb: b.DREB, reb: b.REB,
      ast: b.AST, tov: b.TOV, stl: b.STL, blk: b.BLK, pf: b.PF, pts: b.PTS,
      // Advanced rate stats
      usgPct: a.USG_PCT ?? null, astPct: a.AST_PCT ?? null, astTo: a.AST_TO ?? null,
      tsPct: a.TS_PCT ?? null, efgPct: a.EFG_PCT ?? null,
      orebPct: a.OREB_PCT ?? null, drebPct: a.DREB_PCT ?? null, rebPct: a.REB_PCT ?? null,
      defRating: a.DEF_RATING ?? null, pie: a.PIE ?? null,
    };
  });

  const out = { fetchedAt: new Date().toISOString(), season: SEASON, players };
  fs.writeFileSync(CACHE, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${players.length} player stat lines -> ${path.relative(process.cwd(), CACHE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
