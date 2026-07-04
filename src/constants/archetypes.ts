import type { AttributeKey, Group } from '../types'

export interface ArchetypeDef {
  name: string
  /** Signature attributes with relative weights; the best-fitting archetype wins. */
  signature: Partial<Record<AttributeKey, number>>
}

export const ARCHETYPES: Record<Group, ArchetypeDef[]> = {
  Guards: [
    { name: 'Shot-Creating Guard', signature: { shooting: 3, ballHandling: 3 } },
    { name: 'Floor General', signature: { playmaking: 3, iqClutch: 3 } },
    { name: 'Deep-Range Sniper', signature: { shooting: 5 } },
    { name: 'Slashing Playmaker', signature: { finishing: 3, playmaking: 3 } },
    { name: 'Two-Way Combo Guard', signature: { defense: 3, ballHandling: 2, playmaking: 2 } },
    { name: 'Offensive Engine', signature: { shooting: 2, playmaking: 2, ballHandling: 2 } },
    { name: 'Three-Level Scorer', signature: { shooting: 2, finishing: 2, athleticism: 2 } },
    { name: 'Clutch Shot Maker', signature: { iqClutch: 4, shooting: 2 } },
  ],
  Forwards: [
    { name: 'Two-Way Wing', signature: { defense: 3, shooting: 3 } },
    { name: 'Point Forward', signature: { playmaking: 4, ballHandling: 2 } },
    { name: 'Slashing Forward', signature: { finishing: 3, athleticism: 3 } },
    { name: 'Three-Level Scorer', signature: { shooting: 2, finishing: 2, iqClutch: 2 } },
    { name: 'Defensive Menace', signature: { defense: 5, frame: 2 } },
    { name: 'All-Around Superstar', signature: { shooting: 2, playmaking: 2, defense: 2, finishing: 2 } },
    { name: 'Athletic Scoring Forward', signature: { athleticism: 3, finishing: 3 } },
    { name: 'Versatile Superstar', signature: { iqClutch: 2, playmaking: 2, rebounding: 2, defense: 2 } },
  ],
  Centers: [
    { name: 'Defensive Anchor', signature: { defense: 4, rebounding: 2 } },
    { name: 'Point Center', signature: { playmaking: 4, iqClutch: 2 } },
    { name: 'Stretch Big', signature: { shooting: 4, frame: 2 } },
    { name: 'Interior Force', signature: { finishing: 3, frame: 3 } },
    { name: 'Rim-Running Big', signature: { athleticism: 3, finishing: 3 } },
    { name: 'Modern Unicorn', signature: { shooting: 2, defense: 2, athleticism: 2 } },
    { name: 'Paint Beast', signature: { rebounding: 3, frame: 3 } },
    { name: 'Two-Way Big', signature: { defense: 3, finishing: 2, shooting: 2 } },
  ],
}
