/** Collapse an FFT byte spectrum (0..255) into `count` bars in 0..1, focusing on the voice range. */
export function spectrumToBars(data: ArrayLike<number>, count: number): number[] {
  const usable = Math.max(count, Math.floor(data.length * 0.6));
  const perBar = Math.max(1, Math.floor(usable / count));
  return Array.from({ length: count }, (_, bar) => {
    let sum = 0;
    for (let i = 0; i < perBar; i++) sum += data[bar * perBar + i] ?? 0;
    return Math.min(1, sum / perBar / 170);
  });
}

/** Overall loudness 0..1, weighted so quiet room noise stays near zero. */
export function overallLevel(bars: number[]): number {
  if (bars.length === 0) return 0;
  const mean = bars.reduce((total, value) => total + value, 0) / bars.length;
  return Math.max(0, Math.min(1, (mean - 0.06) * 1.8));
}
