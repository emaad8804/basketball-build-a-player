// s-tier.js
//
// Curated S-tier override. These are the ONLY players allowed an 'S' letter grade;
// every other computed 'S' is demoted to 'A+' at build time. The same data drives
// each player's `sTierAttributes` field (using the game's 9 attribute keys).
//
// Note: `clutch` and `basketballIQ` both fold into the game's single `iqClutch`
// attribute.

import { normalizeName } from './grade-mapping.js';

// User's curated list, in their taxonomy.
export const S_TIER_RAW = {
  shooting: ['Stephen Curry', 'Luka Dončić', 'Kevin Durant'],
  clutch: ['Jalen Brunson', 'Kawhi Leonard', 'Damian Lillard', 'Shai Gilgeous-Alexander'],
  frame: ['Victor Wembanyama', 'Giannis Antetokounmpo', 'Joel Embiid', 'Zion Williamson'],
  defense: ['Ausar Thompson', 'Victor Wembanyama', 'Rudy Gobert', 'OG Anunoby'],
  athleticism: ['Amen Thompson', 'Ja Morant', 'Anthony Edwards', 'Zion Williamson'],
  finishing: ['LeBron James', 'Giannis Antetokounmpo', 'Zion Williamson', 'Shai Gilgeous-Alexander'],
  playmaking: ['Nikola Jokić', 'Luka Dončić', 'LeBron James', 'Tyrese Haliburton', 'Trae Young'],
  ballHandle: ['Kyrie Irving', 'Trae Young', 'Shai Gilgeous-Alexander'],
  basketballIQ: ['Nikola Jokić', 'LeBron James', 'Kawhi Leonard'],
  rebounding: ['Nikola Jokić', 'Domantas Sabonis', 'Rudy Gobert', 'Giannis Antetokounmpo', 'Anthony Davis', 'Victor Wembanyama'],
};

// Map the user's categories onto the game's AttributeKey values.
const CATEGORY_TO_ATTR = {
  shooting: 'shooting',
  clutch: 'iqClutch',
  frame: 'frame',
  defense: 'defense',
  athleticism: 'athleticism',
  finishing: 'finishing',
  playmaking: 'playmaking',
  ballHandle: 'ballHandling',
  basketballIQ: 'iqClutch',
  rebounding: 'rebounding',
};

/**
 * Build the S-tier lookup.
 * @returns {{ attrToNames: Record<string, Set<string>>, allNames: string[] }}
 *   attrToNames: game attribute -> set of normalized player names granted S there.
 *   allNames: every distinct raw name referenced (for match-flagging).
 */
export function buildSTierIndex() {
  const attrToNames = {};
  const allNames = new Set();
  for (const [category, names] of Object.entries(S_TIER_RAW)) {
    const attr = CATEGORY_TO_ATTR[category];
    if (!attrToNames[attr]) attrToNames[attr] = new Set();
    for (const n of names) {
      allNames.add(n);
      attrToNames[attr].add(normalizeName(n));
    }
  }
  return { attrToNames, allNames: [...allNames] };
}
