// grade-mapping.js
//
// Core logic that turns raw data into the game's Player shape:
//   - Name normalization / matching across ESPN, stats.nba.com, and the 2K sheet.
//   - Stat-derived grades: shooting, finishing, playmaking, defense, rebounding
//     (league-wide percentiles of minute-independent rate stats).
//   - 2K-derived grades: frame, athleticism, ballHandling, iqClutch
//     (mapped from the user's 2K ratings).
//   - Derived meta: rarity, eligibleGroups, positions, tags.
//
// All thresholds/weights are named constants so grades are easy to tune.

// ---------------------------------------------------------------------------
// Name matching
// ---------------------------------------------------------------------------

// Manual fixes for players whose name differs across sources. Keyed normalized
// ESPN name -> normalized canonical (stats/2K) name. Populate as mismatches surface.
export const NAME_OVERRIDES = {
  // 'nicolas claxton': 'nic claxton',
};

export function normalizeName(name) {
  if (!name) return '';
  let n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[.'`]/g, '')
    .replace(/[’]/g, '') // curly apostrophe
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ (jr|sr|ii|iii|iv|v)$/, '');
  if (NAME_OVERRIDES[n]) n = NAME_OVERRIDES[n];
  return n;
}

// ---------------------------------------------------------------------------
// Letter-grade scale
// ---------------------------------------------------------------------------

// Ordered best -> worst; must match the Grade union in src/types/player.ts.
const LETTERS = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D'];

// Score in [0,1] -> letter. Lower bounds, checked high to low. Tuned so S/A+ are
// rare and the bulk sits around B/C (a realistic league distribution).
const SCORE_BANDS = [
  [0.97, 'S'],
  [0.92, 'A+'],
  [0.85, 'A'],
  [0.75, 'A-'],
  [0.62, 'B+'],
  [0.48, 'B'],
  [0.35, 'B-'],
  [0.22, 'C+'],
  [0.1, 'C'],
];

export function scoreToLetter(score) {
  for (const [floor, letter] of SCORE_BANDS) {
    if (score >= floor) return letter;
  }
  return 'D';
}

// Map a raw 2K sub-rating (roughly 40-99) to a [0,1] score. 2K attributes cluster
// high, so the floor of 40 keeps the low end from all collapsing to D.
const TWOK_FLOOR = 40;
export function twoKScore(rating) {
  if (rating == null || Number.isNaN(rating)) return null;
  return clamp01((rating - TWOK_FLOOR) / (99 - TWOK_FLOOR));
}
export function twoKToLetter(rating) {
  const s = twoKScore(rating);
  return s == null ? null : scoreToLetter(s);
}

// ---------------------------------------------------------------------------
// Percentile engine
// ---------------------------------------------------------------------------

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// Build a percentile function from a sample of numbers (empirical CDF via
// binary search over the sorted sample).
function percentiler(values) {
  const sorted = values.filter((v) => v != null && !Number.isNaN(v)).sort((a, b) => a - b);
  const n = sorted.length;
  return (v) => {
    if (v == null || Number.isNaN(v) || n === 0) return 0;
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return clamp01(lo / n);
  };
}

const per36 = (perGame, min) => (min && min > 0 ? (perGame / min) * 36 : 0);

// ---------------------------------------------------------------------------
// Stat-derived grades
// ---------------------------------------------------------------------------

// A player must clear this to be part of the percentile baseline (keeps deep-bench
// noise from skewing the distribution). Everyone is still *scored* against it.
const QUAL_MIN = 12;
const QUAL_GP = 10;

// Component weights per attribute (sum ~1).
const WEIGHTS = {
  shooting: { fg3mPer36: 0.45, fg3Pct: 0.35, ftPct: 0.2 },
  finishing: { twoPct: 0.55, ptsPer36: 0.25, ftPct: 0.2 },
  playmaking: { astPct: 0.6, astPer36: 0.25, astTo: 0.15 },
  rebounding: { rebPct: 0.6, orebPer36: 0.2, drebPer36: 0.2 },
  defense: { stocksPer36: 0.4, defRatingInv: 0.35, drebPct: 0.25 },
};

function playerMetrics(p) {
  const twoA = (p.fga ?? 0) - (p.fg3a ?? 0);
  const twoM = (p.fgm ?? 0) - (p.fg3m ?? 0);
  return {
    fg3mPer36: per36(p.fg3m ?? 0, p.min),
    fg3Pct: p.fg3Pct ?? 0,
    ftPct: p.ftPct ?? 0,
    twoPct: twoA > 0 ? twoM / twoA : 0,
    ptsPer36: per36(p.pts ?? 0, p.min),
    astPct: p.astPct ?? 0,
    astPer36: per36(p.ast ?? 0, p.min),
    astTo: p.astTo ?? (p.tov > 0 ? p.ast / p.tov : p.ast ?? 0),
    rebPct: p.rebPct ?? 0,
    orebPer36: per36(p.oreb ?? 0, p.min),
    drebPer36: per36(p.dreb ?? 0, p.min),
    drebPct: p.drebPct ?? 0,
    stocksPer36: per36((p.stl ?? 0) + (p.blk ?? 0), p.min),
    defRatingInv: p.defRating != null ? -p.defRating : null,
  };
}

/**
 * Compute stat-derived letter grades for every player, keyed by normalized name.
 * @param {Array} statsPlayers  rows from scripts/cache/nba-stats.json
 * @returns {Map<string, {shooting,finishing,playmaking,defense,rebounding}>}
 */
export function computeStatGrades(statsPlayers) {
  const metrics = statsPlayers.map(playerMetrics);
  const qualifiedIdx = statsPlayers
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => (p.min ?? 0) >= QUAL_MIN && (p.gp ?? 0) >= QUAL_GP)
    .map(({ i }) => i);

  // Build one percentiler per metric field from the qualified sample.
  const fields = [
    'fg3mPer36', 'fg3Pct', 'ftPct', 'twoPct', 'ptsPer36', 'astPct', 'astPer36',
    'astTo', 'rebPct', 'orebPer36', 'drebPer36', 'drebPct', 'stocksPer36', 'defRatingInv',
  ];
  const pct = {};
  for (const f of fields) pct[f] = percentiler(qualifiedIdx.map((i) => metrics[i][f]));

  const grades = new Map();
  statsPlayers.forEach((p, i) => {
    const m = metrics[i];
    const P = (f) => pct[f](m[f]);
    const w = WEIGHTS;
    const shooting = w.shooting.fg3mPer36 * P('fg3mPer36') + w.shooting.fg3Pct * P('fg3Pct') + w.shooting.ftPct * P('ftPct');
    const finishing = w.finishing.twoPct * P('twoPct') + w.finishing.ptsPer36 * P('ptsPer36') + w.finishing.ftPct * P('ftPct');
    const playmaking = w.playmaking.astPct * P('astPct') + w.playmaking.astPer36 * P('astPer36') + w.playmaking.astTo * P('astTo');
    const rebounding = w.rebounding.rebPct * P('rebPct') + w.rebounding.orebPer36 * P('orebPer36') + w.rebounding.drebPer36 * P('drebPer36');
    const defense = w.defense.stocksPer36 * P('stocksPer36') + w.defense.defRatingInv * P('defRatingInv') + w.defense.drebPct * P('drebPct');

    grades.set(normalizeName(p.name), {
      shooting: scoreToLetter(shooting),
      finishing: scoreToLetter(finishing),
      playmaking: scoreToLetter(playmaking),
      rebounding: scoreToLetter(rebounding),
      defense: scoreToLetter(defense),
      _scores: { shooting, finishing, playmaking, rebounding, defense }, // for debugging/tuning
    });
  });
  return grades;
}

// ---------------------------------------------------------------------------
// 2K-derived grades: frame, athleticism, ballHandling, iqClutch
// ---------------------------------------------------------------------------

// Athleticism = judgment-weighted blend of the seven physical columns (sums to 1).
const ATH_WEIGHTS = {
  speed: 0.25, agility: 0.2, vertical: 0.2, stamina: 0.1,
  strength: 0.1, hustle: 0.1, offenseDurability: 0.05,
};

function athleticismScore(p) {
  let sum = 0;
  let wsum = 0;
  for (const [k, w] of Object.entries(ATH_WEIGHTS)) {
    const s = twoKScore(p[k]);
    if (s != null) { sum += w * s; wsum += w; }
  }
  return wsum > 0 ? sum / wsum : null;
}

/**
 * Compute the four 2K-derived grades for every player, keyed by normalized name.
 * frame is height-anchored (0.7 height + 0.3 strength) as league percentiles;
 * the other three map 2K ratings directly.
 * @param {Array} twoKPlayers  records from parse-2k.js
 */
export function computeTwoKGrades(twoKPlayers) {
  const hPct = percentiler(twoKPlayers.map((p) => p.heightInches).filter(Boolean));
  const sPct = percentiler(twoKPlayers.map((p) => p.strength).filter((v) => v != null));

  const grades = new Map();
  for (const p of twoKPlayers) {
    const frameScore = 0.7 * hPct(p.heightInches) + 0.3 * sPct(p.strength);
    const athScore = athleticismScore(p);
    const handleScore = twoKScore(p.ballHandling);
    const iqAvg = (p.shotIQ != null && p.passIQ != null) ? (p.shotIQ + p.passIQ) / 2 : (p.shotIQ ?? p.passIQ);
    const iqScore = twoKScore(iqAvg);

    grades.set(normalizeName(p.name), {
      frame: scoreToLetter(frameScore),
      athleticism: athScore == null ? 'C' : scoreToLetter(athScore),
      ballHandling: handleScore == null ? 'C' : scoreToLetter(handleScore),
      iqClutch: iqScore == null ? 'C' : scoreToLetter(iqScore),
      _scores: { frame: frameScore, athleticism: athScore ?? 0, ballHandling: handleScore ?? 0, iqClutch: iqScore ?? 0 },
    });
  }
  return grades;
}

// ---------------------------------------------------------------------------
// Position / group / rarity / tags
// ---------------------------------------------------------------------------

const POS_TO_GROUP = { PG: 'Guards', SG: 'Guards', G: 'Guards', SF: 'Forwards', PF: 'Forwards', F: 'Forwards', C: 'Centers' };

export function positionToGroups(position) {
  if (!position) return ['Forwards'];
  const parts = position.toUpperCase().split(/[/\s-]+/).filter(Boolean);
  const groups = [];
  for (const part of parts) {
    const g = POS_TO_GROUP[part];
    if (g && !groups.includes(g)) groups.push(g);
  }
  return groups.length ? groups : ['Forwards'];
}

// Rarity from a computed overall = mean of the 9 attribute [0,1] scores (the
// sheet has no Overall column). Tunable cutoffs.
export function rarityFromComposite(score) {
  if (score == null) return 'Common';
  if (score >= 0.68) return 'Legendary';
  if (score >= 0.57) return 'Elite';
  if (score >= 0.46) return 'Rare';
  return 'Common';
}

const LETTER_RANK = Object.fromEntries(LETTERS.map((l, i) => [l, i]));
const isAtLeast = (grade, floor) => LETTER_RANK[grade] <= LETTER_RANK[floor];

// Heuristic tags from the finished grade sheet.
export function deriveTags(grades) {
  const tags = [];
  if (isAtLeast(grades.shooting, 'A')) tags.push('shooter');
  if (isAtLeast(grades.playmaking, 'A-')) tags.push('playmaker');
  if (isAtLeast(grades.defense, 'A-')) tags.push('lockdown');
  if (isAtLeast(grades.rebounding, 'A-')) tags.push('rebounder');
  if (isAtLeast(grades.finishing, 'A-')) tags.push('finisher');
  if (isAtLeast(grades.athleticism, 'A')) tags.push('athlete');
  if (isAtLeast(grades.ballHandling, 'A-')) tags.push('handles');
  if (isAtLeast(grades.iqClutch, 'A-')) tags.push('clutch');
  return tags;
}
