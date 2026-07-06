// parse-2k.js
//
// Reads the user's 2K ratings sheet — one CSV per team in "2K Ratings/" — into
// normalized player records. This sheet is the AUTHORITATIVE roster: a player's
// team is whichever file he appears in, and it supplies positions, height, and
// the 2K attribute columns used for frame/athleticism/ballHandling/iqClutch.

import fs from 'fs';
import path from 'path';

// Filename token ("Player Stats - <Token>.csv") -> canonical NBA_TEAMS name.
export const FILE_TEAM_TO_NAME = {
  '76ers': 'Philadelphia 76ers',
  Blazers: 'Portland Trail Blazers',
  Bucks: 'Milwaukee Bucks',
  Bulls: 'Chicago Bulls',
  Cavs: 'Cleveland Cavaliers',
  Celtics: 'Boston Celtics',
  Clippers: 'LA Clippers',
  Grizzlies: 'Memphis Grizzlies',
  Hawks: 'Atlanta Hawks',
  Heat: 'Miami Heat',
  Hornets: 'Charlotte Hornets',
  Jazz: 'Utah Jazz',
  Kings: 'Sacramento Kings',
  Knicks: 'New York Knicks',
  Lakers: 'Los Angeles Lakers',
  Magic: 'Orlando Magic',
  Mavs: 'Dallas Mavericks',
  Nets: 'Brooklyn Nets',
  Nuggets: 'Denver Nuggets',
  Pacers: 'Indiana Pacers',
  Pelicans: 'New Orleans Pelicans',
  Pistons: 'Detroit Pistons',
  Raptors: 'Toronto Raptors',
  Rockets: 'Houston Rockets',
  Spurs: 'San Antonio Spurs',
  Suns: 'Phoenix Suns',
  Thunder: 'Oklahoma City Thunder',
  Timberwolves: 'Minnesota Timberwolves',
  Warriors: 'Golden State Warriors',
  Wizards: 'Washington Wizards',
};

// Minimal RFC-4180 CSV parser: handles quoted fields, doubled quotes ("") and
// embedded newlines (the "Player name" cell spans multiple lines).
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* ignore */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// The "Player name" cell looks like:
//   "24\nLuka Doncic\n PG / SG | 6'8" | Crafty Offensive Engine"
function parseNameCell(cell) {
  const lines = cell.split('\n').map((l) => l.trim()).filter(Boolean);
  let jersey = null;
  if (/^\d+$/.test(lines[0] ?? '')) jersey = lines.shift();
  const name = lines[0] ?? '';
  const meta = lines.slice(1).join(' ');
  const [posPart = '', heightPart = '', archetypePart = ''] = meta.split('|').map((s) => s.trim());
  const positions = posPart.split('/').map((s) => s.trim().toUpperCase()).filter(Boolean);
  const hm = heightPart.match(/(\d+)'\s*(\d+)/);
  const heightInches = hm ? Number(hm[1]) * 12 + Number(hm[2]) : null;
  return { jersey, name, positions, heightInches, archetype: archetypePart };
}

const num = (v) => {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

/**
 * Parse every team CSV in `dir` into normalized 2K player records.
 * @returns {Array<{team,name,jersey,positions,heightInches,archetype,
 *   shotIQ,passIQ,ballHandling,speed,strength,agility,vertical,hustle,stamina,offenseDurability}>}
 */
export function parseTwoKRatings(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.csv'));
  const players = [];
  for (const file of files) {
    const token = file.replace(/^Player Stats - /, '').replace(/\.csv$/, '');
    const team = FILE_TEAM_TO_NAME[token];
    if (!team) throw new Error(`Unmapped team file: "${file}" (token "${token}")`);

    const rows = parseCsv(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const r of rows.slice(1)) {
      if (!r[1] || !r[1].trim()) continue; // skip blank/index rows
      const info = parseNameCell(r[1]);
      if (!info.name) continue;
      players.push({
        team,
        ...info,
        shotIQ: num(r[2]),
        passIQ: num(r[3]),
        ballHandling: num(r[4]),
        speed: num(r[5]),
        strength: num(r[6]),
        agility: num(r[7]),
        vertical: num(r[8]),
        hustle: num(r[9]),
        stamina: num(r[10]),
        offenseDurability: num(r[11]),
      });
    }
  }
  return players;
}
