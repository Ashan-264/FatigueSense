import { normalize } from "./normalize";

export function computeTappingScore(
  taps: number,
  intervals: number[],
  seconds: number
) {
  const tapsPerSec = taps / seconds;
  const avgInterval = intervals.length
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : 0;
  const jitter = intervals.length
    ? Math.sqrt(
        intervals
          .map((i) => (i - avgInterval) ** 2)
          .reduce((a, b) => a + b, 0) / intervals.length
      )
    : 0;

  const speedScore = normalize(tapsPerSec, 2, 10);
  const jitterScore = normalize(jitter, 0, 140, true);

  return {
    score: Math.round(0.65 * speedScore + 0.35 * jitterScore),
    raw: { taps, tapsPerSec, avgInterval, jitter },
  };
}

export function computeSway(buffer: number[]) {
  const mean = buffer.reduce((a, b) => a + b, 0) / buffer.length;
  const variance =
    buffer.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) /
    buffer.length;

  const score = normalize(variance, 0.005, 0.08, true);

  return { score, raw: { variance } };
}

export function computeMovementScore(buffer: number[]) {
  const mean = buffer.reduce((a, b) => a + b, 0) / buffer.length;
  const std = Math.sqrt(
    buffer.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) /
      buffer.length
  );

  const target = 0.15;
  const diff = Math.abs(std - target);

  const score = normalize(diff, 0, 0.18, true);

  return { score, raw: { std } };
}
