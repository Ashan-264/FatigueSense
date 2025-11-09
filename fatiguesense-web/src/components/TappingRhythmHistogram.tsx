"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  tappingData: {
    taps: number;
    avgInterval: number;
    jitter: number;
    tapsPerSec: number;
  };
  tappingScore: number;
}

export default function TappingRhythmHistogram({
  tappingData,
  tappingScore,
}: Props) {
  // Simulate tap interval distribution based on avg and jitter
  // In a real scenario, you'd have actual tap timestamps
  const avgInterval = tappingData.avgInterval;
  const jitter = tappingData.jitter;

  // Generate histogram bins
  const bins: Array<{ interval: string; count: number; color: string }> = [];
  const binSize = 20; // ms
  const numBins = 15;

  // Create distribution around average with jitter
  for (let i = 0; i < numBins; i++) {
    const binStart = avgInterval - (numBins / 2) * binSize + i * binSize;
    const binCenter = binStart + binSize / 2;

    // Gaussian-like distribution
    const distance = Math.abs(binCenter - avgInterval);
    const count = Math.round(
      tappingData.taps * Math.exp(-((distance / jitter) ** 2) / 2) * 0.15
    );

    // Detect outliers/hesitations
    const isOutlier = distance > jitter * 2;

    bins.push({
      interval: `${Math.round(binStart)}-${Math.round(binStart + binSize)}`,
      count: count,
      color: isOutlier ? "#ef4444" : "#8884d8",
    });
  }

  const consistency =
    jitter < 20
      ? "Excellent"
      : jitter < 30
      ? "Good"
      : jitter < 40
      ? "Moderate"
      : "Poor";
  const hasHesitation = jitter > 35;

  const interpretation =
    jitter < 20
      ? "Highly consistent rhythm - excellent CNS function"
      : jitter < 30
      ? "Good rhythm consistency - minor variations"
      : jitter < 40
      ? "Moderate inconsistency - signs of cognitive fatigue"
      : "Poor rhythm - significant hesitation detected";

  return (
    <div style={{ marginTop: 40, marginBottom: 30 }}>
      <h2>🖐️ Tapping Rhythm Analysis</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Distribution of tap intervals and rhythm consistency
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bins}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="interval"
            angle={-45}
            textAnchor="end"
            height={80}
            label={{
              value: "Tap Interval (ms)",
              position: "insideBottom",
              offset: -10,
            }}
          />
          <YAxis
            label={{ value: "Frequency", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      Interval: {payload[0].payload.interval}ms
                    </p>
                    <p style={{ margin: 0, color: payload[0].payload.color }}>
                      Count: {payload[0].payload.count}
                    </p>
                    {payload[0].payload.color === "#ef4444" && (
                      <p
                        style={{
                          margin: "5px 0 0 0",
                          fontSize: "0.85em",
                          color: "#ef4444",
                        }}
                      >
                        ⚠️ Outlier/Hesitation
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count">
            {bins.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 15,
          marginTop: 20,
        }}
      >
        <div
          style={{
            padding: 15,
            border: "1px solid #ddd",
            borderRadius: 8,
            borderLeft: `4px solid ${
              tappingScore >= 70
                ? "#22c55e"
                : tappingScore >= 50
                ? "#eab308"
                : "#ef4444"
            }`,
          }}
        >
          <div style={{ fontSize: "0.9em", color: "#666" }}>Tapping Score</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {tappingScore}/100
          </div>
        </div>

        <div style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Avg Interval</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {avgInterval}ms
          </div>
        </div>

        <div style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Jitter (STD)</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {jitter.toFixed(1)}ms
          </div>
        </div>

        <div style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Consistency</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {consistency}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          backgroundColor: "#fef3c7",
          borderRadius: 8,
          border: "1px solid #fde047",
        }}
      >
        <strong>💡 Interpretation:</strong> {interpretation}
        <br />
        {hasHesitation && (
          <span style={{ color: "#ef4444" }}>
            ⚠️ Red bars = hesitation spikes indicating CNS fatigue.
          </span>
        )}
        {!hasHesitation && (
          <span style={{ color: "#22c55e" }}>
            ✅ Your taps were {jitter < 25 ? "very even" : "consistent"} today.
          </span>
        )}
      </div>
    </div>
  );
}
