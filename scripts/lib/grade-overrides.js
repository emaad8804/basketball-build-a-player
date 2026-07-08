// grade-overrides.js
//
// Consensus / eye-test grade corrections layered on top of the computed grades.
// Covers the 5 STAT-derived attributes (shooting, finishing, playmaking,
// rebounding, defense) for ~stars + rotation players, where box-score math
// disagrees with consensus. The 2K-sheet attributes (frame, athleticism,
// ballHandling, iqClutch) are left as authored, with rare eye-test
// exceptions (e.g. frame, where the height-anchored formula misreads a
// player's build).
//
// Keyed by player name (matched via normalizeName). NOTE: 'S' is reserved for
// scripts/lib/s-tier.js — overrides run BEFORE the S-tier pass, so an 'S' here
// would be demoted. Use A+ or below; attributes a player is already S-tier in are
// left alone (the S-tier pass sets them).
//
// Extend freely; grouped by team for maintainability.

export const GRADE_OVERRIDES = {
  // Atlanta
  'Jalen Johnson': { finishing: 'A-', defense: 'B+' },
  'Buddy Hield': { shooting: 'A' },
  'CJ McCollum': { shooting: 'A-' },
  'Nickeil Alexander-Walker': { shooting: 'B+', defense: 'B+' },
  'Dyson Daniels': { defense: 'A+' },
  'Gabe Vincent': { defense: 'B' },

  // Boston
  'Jayson Tatum': { shooting: 'A-', finishing: 'A-', rebounding: 'A-', defense: 'B+' },
  'Derrick White': { shooting: 'A-', defense: 'A' },
  'Paul George': { defense: 'A-' },

  // Brooklyn
  'Julius Randle': { finishing: 'B+', rebounding: 'A-' },
  'Michael Porter Jr.': { rebounding: 'A-' },
  'Keon Ellis': { defense: 'A-' },

  // Charlotte
  'Coby White': { shooting: 'A-' },
  'Dorian Finney-Smith': { defense: 'B+' },

  // Chicago
  'Nic Claxton': { defense: 'A', finishing: 'B+' },
  'Isaac Okoro': { defense: 'B+' },

  // Cleveland
  'Donovan Mitchell': { defense: 'B+' },
  'Evan Mobley': { defense: 'A+' },
  'Jarrett Allen': { defense: 'A-', finishing: 'A-' },

  // Dallas
  'Kyrie Irving': { playmaking: 'A-', finishing: 'B+' },
  'Daniel Gafford': { finishing: 'A-' },
  'Dereck Lively II': { finishing: 'A-' },
  'Max Christie': { defense: 'B' },
  'Naji Marshall': { defense: 'B+' },

  // Denver
  'Jamal Murray': { shooting: 'A-' },
  'Aaron Gordon': { finishing: 'A-', defense: 'B+', shooting: 'B+' },
  'Christian Braun': { defense: 'B+' },

  // Detroit
  'Cade Cunningham': { finishing: 'B+' },
  'Jalen Duren': { finishing: 'A-' },

  // Golden State
  'Jimmy Butler': { finishing: 'A-', defense: 'A-' },
  'Draymond Green': { defense: 'A+', playmaking: 'A' },
  'Kristaps Porzingis': { shooting: 'B+' },
  'Al Horford': { defense: 'A-' },
  'Gary Payton II': { defense: 'A-' },

  // Houston
  'Kevin Durant': { defense: 'B+' },
  'Alperen Sengun': { finishing: 'B+' },
  'Amen Thompson': { defense: 'A+' },
  'Fred VanVleet': { defense: 'B+' },
  'Jabari Smith Jr.': { defense: 'B+' },
  'Marcus Smart': { defense: 'A' },

  // Indiana
  'Pascal Siakam': { finishing: 'A-', defense: 'B' },
  'Aaron Nesmith': { defense: 'B+' },
  'Ivica Zubac': { defense: 'B+', finishing: 'B+' },
  // Backup stretch big — hot small-role rates graded him like a starter.
  'Micah Potter': { shooting: 'B', finishing: 'B-', playmaking: 'C+', rebounding: 'B-', defense: 'C+' },

  // LA Clippers
  'Brandon Ingram': { shooting: 'B+' },
  'Bradley Beal': { shooting: 'A-' },
  'Brook Lopez': { defense: 'A' },
  'Kris Dunn': { defense: 'A' },
  'Nicolas Batum': { defense: 'B+' },
  'Derrick Jones Jr.': { defense: 'B+' },
  'Bennedict Mathurin': { finishing: 'B+' },

  // LA Lakers
  'LeBron James': { defense: 'B+' },
  'Luka Doncic': { finishing: 'A-' },
  'Walker Kessler': { defense: 'A+', finishing: 'A-' },
  'Quentin Grimes': { defense: 'B+' },
  'Jarred Vanderbilt': { defense: 'A-' },

  // Memphis
  'Jerami Grant': { defense: 'B' },
  'Kentavious Caldwell-Pope': { defense: 'B+', shooting: 'B+' },

  // Miami
  'Giannis Antetokounmpo': { defense: 'A-' },
  'Bam Adebayo': { defense: 'A+', finishing: 'B+' },
  'Andrew Wiggins': { defense: 'B+' },
  'Davion Mitchell': { defense: 'A-' },

  // Milwaukee
  'Myles Turner': { defense: 'A-' },
  'Kevin Porter Jr.': { playmaking: 'A-' },
  'Gary Trent Jr.': { defense: 'B-' },
  'Gary Harris': { defense: 'B+' },

  // Minnesota
  // frame: the height-anchored formula punishes 6'4" guards, but Ant's
  // 225lb build is elite for his position — eye-test correction.
  'Anthony Edwards': { finishing: 'A-', defense: 'B+', frame: 'B+' },
  'Jaden McDaniels': { defense: 'A' },
  'LaMelo Ball': { defense: 'C+' },

  // New Orleans
  'Trey Murphy III': { defense: 'B+' },
  'Dejounte Murray': { defense: 'B+' },
  'Herbert Jones': { defense: 'A+' },

  // New York
  'Jalen Brunson': { finishing: 'B+' },
  'Karl-Anthony Towns': { shooting: 'A-' },
  'Mikal Bridges': { defense: 'A-' },
  'Josh Hart': { defense: 'B+' },
  'Miles McBride': { defense: 'B+' },

  // Oklahoma City
  'Shai Gilgeous-Alexander': { shooting: 'A-' },
  'Jalen Williams': { finishing: 'B+', shooting: 'B' },
  'Alex Caruso': { defense: 'A' },
  'Luguentz Dort': { defense: 'A' },
  'Cason Wallace': { defense: 'A-' },

  // Orlando
  'Paolo Banchero': { finishing: 'B+', shooting: 'B' },
  'Franz Wagner': { defense: 'B+' },
  'Desmond Bane': { shooting: 'A-' },

  // Philadelphia
  'Joel Embiid': { finishing: 'A-', defense: 'A-' },
  'Jaylen Brown': { finishing: 'A-', defense: 'B+' },

  // Phoenix
  'Devin Booker': { shooting: 'A-' },
  'Jalen Green': { finishing: 'B+' },
  'Dillon Brooks': { defense: 'B+' },

  // Portland
  'Ja Morant': { finishing: 'A-' },
  'Jrue Holiday': { defense: 'A' },
  'Deni Avdija': { defense: 'B+' },
  'Toumani Camara': { defense: 'A+' },
  'Matisse Thybulle': { defense: 'A+', shooting: 'C+' },

  // Sacramento
  'DeMar DeRozan': { finishing: 'B+' },
  'Zach LaVine': { finishing: 'A-', defense: 'C+' },
  'Keegan Murray': { defense: 'B+' },

  // San Antonio
  'De\'Aaron Fox': { defense: 'B+' },
  'Devin Vassell': { defense: 'B+' },

  // Toronto
  'Kawhi Leonard': { defense: 'A-' },
  'Jakob Poeltl': { defense: 'A-' },

  // Utah
  'Lauri Markkanen': { shooting: 'A-' },
  'Jaren Jackson Jr.': { defense: 'A+' },

  // Washington
  'Trae Young': { shooting: 'A-' },
  'Anthony Davis': { defense: 'A+', finishing: 'A-' },
  'Alex Sarr': { defense: 'B+' },
  'Bilal Coulibaly': { defense: 'B+' },

  // --- Deeper sweep: trim small-sample playmaking inflation (backup guards
  //     graded A/A+ off high AST% in few minutes) ---
  'Cam Spencer': { playmaking: 'B+' },
  'Ryan Nembhard': { playmaking: 'B+' },
  'Tyler Kolek': { playmaking: 'B+' },
  'Jamal Shead': { playmaking: 'A-' },
  'Yuki Kawamura': { playmaking: 'B+' },
  'Keaton Wallace': { playmaking: 'B' },
  'Walter Clayton Jr.': { playmaking: 'B+' },
  'Javon Small': { playmaking: 'B+' },
  'Pat Spencer': { playmaking: 'B+' },
  'TyTy Washington Jr.': { playmaking: 'B' },
  'Killian Hayes': { playmaking: 'B+' },
  'Daniss Jenkins': { playmaking: 'B' },
  'RayJ Dennis': { playmaking: 'B' },
  'Craig Porter Jr.': { playmaking: 'B' },
  'Quenton Jackson': { playmaking: 'B' },
  'Blake Wesley': { playmaking: 'B' },
  'Sharife Cooper': { playmaking: 'B+' },

  // --- Deeper sweep: more defense fixes ---
  'Andrew Nembhard': { defense: 'B+' },
  'De\'Anthony Melton': { defense: 'A-' },
  'Jose Alvarado': { defense: 'B+' },

  // --- Deeper sweep: lob-finisher bigs undervalued by 2P%/volume ---
  'Mark Williams': { finishing: 'A-' },
  'Clint Capela': { finishing: 'B+' },
  'Isaiah Jackson': { finishing: 'B+' },

  // --- Elite players whose flat grades left them with no A (give the deserved
  //     peak so the Elite badge is legitimate; Siakam handled above) ---
  'RJ Barrett': { finishing: 'A-' },
  'Cooper Flagg': { defense: 'A-' },
};
