export function normalize(
  value: number,
  min: number,
  max: number,
  invert = false
): number {
  const clamped = Math.max(min, Math.min(max, value));
  let n = (clamped - min) / Math.max(max - min, 1e-6);
  if (invert) n = 1 - n;
  return Math.round(n * 100);
}
