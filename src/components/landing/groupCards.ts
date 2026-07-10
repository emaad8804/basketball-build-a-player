import type { Group } from '../../types'

/** The three build-group cards, shared by Free Play and Budget setup. */
export const GROUP_CARDS: {
  group: Group
  title: string
  desc: string
}[] = [
  {
    group: 'Guards',
    title: 'Build-A-Guard',
    desc: 'Handles, shooting, and playmaking. Run the offense.',
  },
  {
    group: 'Forwards',
    title: 'Build-A-Forward',
    desc: 'Two-way wings and do-it-all superstars.',
  },
  {
    group: 'Centers',
    title: 'Build-A-Center',
    desc: 'Anchor the paint. True bigs, hybrids, and unicorns.',
  },
]
