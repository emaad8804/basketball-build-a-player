// rarity-overrides.js
//
// Consensus rarity re-badging, layered on top of the computed rarity
// (rarityFromComposite). The composite over-badges role players / rookies /
// athletic bigs and under-badges some Rare stars, so these pin the badge to
// consensus. Keyed by player name (matched via normalizeName).
//
// Tiers: Legendary = ~top-15 superstar; Elite = All-Star / clear star starter;
// Rare = solid starter / rotation; Common = deep bench / unproven.
//
// Extend freely.

export const RARITY_OVERRIDES = {
  // --- Promote to Legendary (top stars the composite left at Elite) ---
  'Stephen Curry': 'Legendary',
  'Anthony Edwards': 'Legendary',
  'Devin Booker': 'Legendary',
  'Jalen Brunson': 'Legendary',
  'Anthony Davis': 'Legendary',

  // --- Demote Legendary -> Elite (very good, not top-15) ---
  'Jalen Johnson': 'Elite',
  'Scottie Barnes': 'Elite',

  // --- Promote Rare -> Elite (underrated stars) ---
  'Brandon Ingram': 'Elite',
  'Bradley Beal': 'Elite',
  'Darius Garland': 'Elite',
  'Myles Turner': 'Elite',
  'DeMar DeRozan': 'Elite',
  'Zach LaVine': 'Elite',
  'Norman Powell': 'Elite',
  'Dejounte Murray': 'Elite',
  'Coby White': 'Elite',
  'Jalen Green': 'Elite',
  'Desmond Bane': 'Elite',
  'Anfernee Simons': 'Elite',

  // --- Demote Elite -> Rare (role players / rookies / declining vets) ---
  'Sandro Mamukelashvili': 'Rare',
  'Marvin Bagley III': 'Rare',
  'Jaylin Williams': 'Rare',
  'Collin Gillespie': 'Rare',
  'Jonathan Mogbo': 'Rare',
  'Joe Ingles': 'Rare',
  'Day\'Ron Sharpe': 'Rare',
  'Kyle Filipowski': 'Rare',
  'KyShawn George': 'Rare',
  'Santi Aldama': 'Rare',
  'Cedric Coward': 'Rare',
  'Scotty Pippen Jr.': 'Rare',
  'Al Horford': 'Rare',
  'Brandin Podziemski': 'Rare',
  'Matas Buzelis': 'Rare',
  'Kon Knueppel': 'Rare',
  'Tobias Harris': 'Rare',
  'Russell Westbrook': 'Rare',
  'Collin Murray-Boyles': 'Rare',
  'Miles Bridges': 'Rare',
  'Ty Jerome': 'Rare',
  'Keldon Johnson': 'Rare',
  'Dylan Harper': 'Rare',
  'Alex Sarr': 'Rare',
  'Isaiah Hartenstein': 'Rare',
  'Josh Hart': 'Rare',
  'Onyeka Okongwu': 'Rare',
  'Immanuel Quickley': 'Rare',
  'Dereck Lively II': 'Rare',
  'Michael Porter Jr.': 'Rare',

  // --- Demote Elite -> Common (unproven / two-way) ---
  'Myron Gardner': 'Common',
};
