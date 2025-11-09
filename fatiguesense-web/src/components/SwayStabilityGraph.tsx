"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  accData: Array<{ x: number; y: number; z: number; t: number }>;
  swayScore: number;
}

export default function SwayStabilityGraph({ accData, swayScore }: Props) {
  // Calculate variance per second (20 seconds)
  const variancePerSecond: Array<{
    second: number;
    variance: number;
    wobbles: number;
  }> = [];

  const maxTime = Math.max(...accData.map((d) => d.t));
  const duration = Math.ceil(maxTime / 1000); // Convert to seconds

  for (let sec = 0; sec < duration; sec++) {
    const startTime = sec * 1000;
    const endTime = (sec + 1) * 1000;

    const samples = accData.filter((d) => d.t >= startTime && d.t < endTime);

    if (samples.length > 0) {
      // Calculate variance (measure of wobble)
      const magnitudes = samples.map((s) =>
        Math.sqrt(s.x ** 2 + s.y ** 2 + s.z ** 2)
      );
      const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      const variance =
        magnitudes.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
        magnitudes.length;

      // Count micro-wobbles (rapid changes)
      let wobbleCount = 0;
      for (let i = 1; i < magnitudes.length; i++) {
        if (Math.abs(magnitudes[i] - magnitudes[i - 1]) > 0.1) {
          wobbleCount++;
        }
      }

      variancePerSecond.push({
        second: sec + 1,
        variance: variance * 1000, // Scale for visibility
        wobbles: wobbleCount,
      });
    }
  }

  const avgVariance =
    variancePerSecond.reduce((a, b) => a + b.variance, 0) /
    variancePerSecond.length;
  const maxVariance = Math.max(...variancePerSecond.map((v) => v.variance));

  const interpretation =
    avgVariance < 0.5
      ? "Excellent stability - very minimal wobble"
      : avgVariance < 1.0
      ? "Good stability - slight wobble"
      : avgVariance < 2.0
      ? "Moderate stability - noticeable wobble"
      : "Poor stability - significant wobble detected";

  return (
    <div style={{ marginTop: 40, marginBottom: 30 }}>
      <h2>⚖️ Sway Stability Analysis</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Balance variation and micro-wobbles during the sway test
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={variancePerSecond}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="second"
            label={{
              value: "Time (seconds)",
              position: "insideBottom",
              offset: -5,
            }}
          />
          <YAxis
            label={{
              value: "Wobble Intensity",
              angle: -90,
              position: "insideLeft",
            }}
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
                      Second: {payload[0].payload.second}
                    </p>
                    <p style={{ margin: 0, color: "#8884d8" }}>
                      Wobble: {payload[0].payload.variance.toFixed(3)}
                    </p>
                    <p style={{ margin: 0, color: "#82ca9d" }}>
                      Micro-wobbles: {payload[0].payload.wobbles}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={avgVariance}
            stroke="#ff7300"
            strokeDasharray="3 3"
            label="Average"
          />
          <Line
            type="monotone"
            dataKey="variance"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Wobble Intensity"
          />
        </LineChart>
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
              swayScore >= 70
                ? "#22c55e"
                : swayScore >= 50
                ? "#eab308"
                : "#ef4444"
            }`,
          }}
        >
          <div style={{ fontSize: "0.9em", color: "#666" }}>Sway Score</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {swayScore}/100
          </div>
        </div>

        <div style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Avg Wobble</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {avgVariance.toFixed(2)}
          </div>
        </div>

        <div style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Max Wobble</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {maxVariance.toFixed(2)}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          backgroundColor: "#f0f9ff",
          borderRadius: 8,
          border: "1px solid #bae6fd",
        }}
      >
        <strong>💡 Interpretation:</strong> {interpretation}
        <br />
        {avgVariance > 1.5 && (
          <span style={{ color: "#ef4444" }}>
            ⚠️ High wobble spikes indicate more fatigue.
          </span>
        )}
        {avgVariance <= 1.5 && (
          <span style={{ color: "#22c55e" }}>
            ✅ Your balance was {avgVariance < 0.5 ? "excellent" : "stable"}{" "}
            today.
          </span>
        )}
      </div>
    </div>
  );
}
