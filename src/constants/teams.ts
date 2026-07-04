import type { Team } from '../types'

export const NBA_TEAMS: Team[] = [
  { name: 'Atlanta Hawks', abbr: 'ATL', conference: 'East', primaryColor: '#E03A3E', secondaryColor: '#C1D32F' },
  { name: 'Boston Celtics', abbr: 'BOS', conference: 'East', primaryColor: '#007A33', secondaryColor: '#BA9653' },
  { name: 'Brooklyn Nets', abbr: 'BKN', conference: 'East', primaryColor: '#1a1a1a', secondaryColor: '#FFFFFF' },
  { name: 'Charlotte Hornets', abbr: 'CHA', conference: 'East', primaryColor: '#1D1160', secondaryColor: '#00788C' },
  { name: 'Chicago Bulls', abbr: 'CHI', conference: 'East', primaryColor: '#CE1141', secondaryColor: '#1a1a1a' },
  { name: 'Cleveland Cavaliers', abbr: 'CLE', conference: 'East', primaryColor: '#860038', secondaryColor: '#FDBB30' },
  { name: 'Dallas Mavericks', abbr: 'DAL', conference: 'West', primaryColor: '#00538C', secondaryColor: '#002B5E' },
  { name: 'Denver Nuggets', abbr: 'DEN', conference: 'West', primaryColor: '#0E2240', secondaryColor: '#FEC524' },
  { name: 'Detroit Pistons', abbr: 'DET', conference: 'East', primaryColor: '#C8102E', secondaryColor: '#1D42BA' },
  { name: 'Golden State Warriors', abbr: 'GSW', conference: 'West', primaryColor: '#1D428A', secondaryColor: '#FFC72C' },
  { name: 'Houston Rockets', abbr: 'HOU', conference: 'West', primaryColor: '#CE1141', secondaryColor: '#C4CED4' },
  { name: 'Indiana Pacers', abbr: 'IND', conference: 'East', primaryColor: '#002D62', secondaryColor: '#FDBB30' },
  { name: 'LA Clippers', abbr: 'LAC', conference: 'West', primaryColor: '#C8102E', secondaryColor: '#1D428A' },
  { name: 'Los Angeles Lakers', abbr: 'LAL', conference: 'West', primaryColor: '#552583', secondaryColor: '#FDB927' },
  { name: 'Memphis Grizzlies', abbr: 'MEM', conference: 'West', primaryColor: '#5D76A9', secondaryColor: '#12173F' },
  { name: 'Miami Heat', abbr: 'MIA', conference: 'East', primaryColor: '#98002E', secondaryColor: '#F9A01B' },
  { name: 'Milwaukee Bucks', abbr: 'MIL', conference: 'East', primaryColor: '#00471B', secondaryColor: '#EEE1C6' },
  { name: 'Minnesota Timberwolves', abbr: 'MIN', conference: 'West', primaryColor: '#0C2340', secondaryColor: '#236192' },
  { name: 'New Orleans Pelicans', abbr: 'NOP', conference: 'West', primaryColor: '#0C2340', secondaryColor: '#C8102E' },
  { name: 'New York Knicks', abbr: 'NYK', conference: 'East', primaryColor: '#006BB6', secondaryColor: '#F58426' },
  { name: 'Oklahoma City Thunder', abbr: 'OKC', conference: 'West', primaryColor: '#007AC1', secondaryColor: '#EF3B24' },
  { name: 'Orlando Magic', abbr: 'ORL', conference: 'East', primaryColor: '#0077C0', secondaryColor: '#C4CED4' },
  { name: 'Philadelphia 76ers', abbr: 'PHI', conference: 'East', primaryColor: '#006BB6', secondaryColor: '#ED174C' },
  { name: 'Phoenix Suns', abbr: 'PHX', conference: 'West', primaryColor: '#1D1160', secondaryColor: '#E56020' },
  { name: 'Portland Trail Blazers', abbr: 'POR', conference: 'West', primaryColor: '#E03A3E', secondaryColor: '#1a1a1a' },
  { name: 'Sacramento Kings', abbr: 'SAC', conference: 'West', primaryColor: '#5A2D81', secondaryColor: '#63727A' },
  { name: 'San Antonio Spurs', abbr: 'SAS', conference: 'West', primaryColor: '#C4CED4', secondaryColor: '#1a1a1a' },
  { name: 'Toronto Raptors', abbr: 'TOR', conference: 'East', primaryColor: '#CE1141', secondaryColor: '#1a1a1a' },
  { name: 'Utah Jazz', abbr: 'UTA', conference: 'West', primaryColor: '#002B5C', secondaryColor: '#F9A01B' },
  { name: 'Washington Wizards', abbr: 'WAS', conference: 'East', primaryColor: '#002B5C', secondaryColor: '#E31837' },
]

export const TEAM_BY_NAME: Record<string, Team> = Object.fromEntries(
  NBA_TEAMS.map((t) => [t.name, t]),
)
