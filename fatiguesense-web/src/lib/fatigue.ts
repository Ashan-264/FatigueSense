export interface IMUSample {
  x: number;
  y: number;
  z: number;
}

export const magnitude = (d: IMUSample) =>
  Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);

// ----- RMS -----
export const computeRMS = (acc: IMUSample[]) => {
  const mags = acc.map(magnitude);
  const meanSq = mags.reduce((sum, v) => sum + v * v, 0) / mags.length;
  return Math.sqrt(meanSq);
};

// ----- Jerk -----
export const computeJerk = (acc: IMUSample[]) => {
  const mags = acc.map(magnitude);
  const diffs = mags.slice(1).map((m, i) => Math.abs(m - mags[i]));
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
};

// ----- Sway -----
const variance = (vals: number[]) => {
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;
};

export const computeSway = (acc: IMUSample[]) => {
  const xs = acc.map((d) => d.x);
  const ys = acc.map((d) => d.y);
  return variance(xs) + variance(ys);
};

// ----- Entropy -----
export const computeEntropy = (acc: IMUSample[]) => {
  const mags = acc.map(magnitude);
  const min = Math.min(...mags);
  const max = Math.max(...mags);
  const bins = Array(20).fill(0);

  mags.forEach((m) => {
    const idx = Math.floor(((m - min) / (max - min + 1e-6)) * 19);
    bins[idx]++;
  });

  const total = mags.length;
  const probs = bins.map((b) => b / total).filter((p) => p > 0);

  return -probs.reduce((s, p) => s + p * Math.log(p), 0);
};

// ----- Composite Score -----
export const computeFatigueScore = (acc: IMUSample[]) => {
  const rms = computeRMS(acc);
  const jerk = computeJerk(acc);
  const sway = computeSway(acc);
  const entropy = computeEntropy(acc);

  const raw = rms * 25 + jerk * 350 + sway * 12 + entropy * 2;
  const scaled = Math.max(0, 100 - raw);

  return {
    fatigue_score: Number(scaled.toFixed(1)),
    metrics: { rms, jerk, sway, entropy },
  };
};
