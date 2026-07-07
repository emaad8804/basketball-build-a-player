import type { CSSProperties, ReactNode } from 'react'
import type { Rarity } from '../../types'

/**
 * Rarity IS the frame (DESIGN.md §5). A padded wrapper whose background is
 * the foil — the content sits on bg-panel inside, so the gradient shows only
 * as the card's edge. Tiering: Common flat gray, Rare flat blue, Elite static
 * foil + one-shot sheen on reveal, Legendary rotating foil + looping sheen.
 */
export function CollectibleFrame({
  rarity,
  children,
  className = '',
  contentClassName = '',
  contentStyle,
}: {
  rarity: Rarity
  children: ReactNode
  className?: string
  contentClassName?: string
  contentStyle?: CSSProperties
}) {
  const frame = {
    Common: 'bg-rarity-common/40',
    Rare: 'bg-rarity-rare',
    Elite: 'foil-elite',
    Legendary: 'foil-legendary',
  }[rarity]
  const sheen = {
    Common: '',
    Rare: '',
    Elite: 'sheen sheen-once',
    Legendary: 'sheen sheen-loop',
  }[rarity]

  return (
    <div className={`relative rounded-2xl p-[2.5px] ${frame} ${className}`}>
      <div
        className={`relative overflow-hidden rounded-[14px] bg-panel ${sheen} ${contentClassName}`}
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  )
}
