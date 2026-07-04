/** Gaussian noise via Box-Muller. */
export function gaussian(mean = 0, std = 1): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Piecewise-linear interpolation over sorted [x, y] anchor pairs. */
export function lerpAnchors(anchors: [number, number][], x: number): number {
  if (x <= anchors[0][0]) return anchors[0][1]
  const last = anchors[anchors.length - 1]
  if (x >= last[0]) return last[1]
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i - 1]
    const [x2, y2] = anchors[i]
    if (x <= x2) {
      const t = (x - x1) / (x2 - x1)
      return y1 + t * (y2 - y1)
    }
  }
  return last[1]
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/** Round to one decimal place (stat lines). */
export function round1(value: number): number {
  return Math.round(value * 10) / 10
}
