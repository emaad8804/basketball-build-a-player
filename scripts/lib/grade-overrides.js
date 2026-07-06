// grade-overrides.js
//
// Consensus / eye-test grade corrections applied on top of the computed grades.
// Box-score stats systematically undervalue defense (steals+blocks can't capture
// on-ball pressure, positioning, or scheme), so these fix well-known cases.
//
// Keyed by player name (matched via normalizeName). Each entry maps game
// AttributeKey -> letter grade. NOTE: 'S' is reserved for scripts/lib/s-tier.js —
// overrides here are applied BEFORE the S-tier pass, so an 'S' set here would be
// demoted. Use A+ or below; add S-tier players in s-tier.js.
//
// Extend this table freely for future eye-test passes.

export const GRADE_OVERRIDES = {
  // Elite defenders (A+)
  'Dyson Daniels': { defense: 'A+' },
  'Draymond Green': { defense: 'A+', playmaking: 'A' },
  'Bam Adebayo': { defense: 'A+' },
  'Evan Mobley': { defense: 'A+' },
  'Jaren Jackson Jr.': { defense: 'A+' },
  'Amen Thompson': { defense: 'A+' },
  'Toumani Camara': { defense: 'A+' },
  'Herbert Jones': { defense: 'A+' },
  'Walker Kessler': { defense: 'A+' },
  'Matisse Thybulle': { defense: 'A+' },

  // Strong defenders (A)
  'Jaden McDaniels': { defense: 'A' },
  'Luguentz Dort': { defense: 'A' },
  'Jrue Holiday': { defense: 'A' },
  'Marcus Smart': { defense: 'A' },
  'Kris Dunn': { defense: 'A' },
  'Alex Caruso': { defense: 'A' },
  'Derrick White': { defense: 'A' },
  'Nic Claxton': { defense: 'A' },
  'Brook Lopez': { defense: 'A' },

  // Good defenders (A-)
  'Jarrett Allen': { defense: 'A-' },
  'Keon Ellis': { defense: 'A-' },
};
