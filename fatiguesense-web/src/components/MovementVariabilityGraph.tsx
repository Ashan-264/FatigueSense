"use client";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface Props {
  accData: Array<{ x: number; y: number; z: number; t: number }>;
  movementScore: number;
}

export default function MovementVariabilityGraph({
  accData,
  movementScore,
}: Props) {
  // Calculate STD (standard deviation) in sliding windows
  const windowSize = 10; // samples per window
  const stdData: Array<{ time: number; std: number; smoothness: string }> = [];

  for (let i = 0; i < accData.length - windowSize; i++) {
    const window = accData.slice(i, i + windowSize);

    // Calculate magnitude for each sample
    const magnitudes = window.map((s) =>
      Math.sqrt(s.x ** 2 + s.y ** 2 + s.z ** 2)
    );

    // Calculate standard deviation
    const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    const variance =
      magnitudes.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
      magnitudes.length;
    const std = Math.sqrt(variance);

    stdData.push({
      time: window[0].t / 1000, // Convert to seconds
      std: std,
      smoothness: std < 0.15 ? "Smooth" : std < 0.3 ? "Moderate" : "Irregular",
    });
  }

  const avgStd = stdData.reduce((a, b) => a + b.std, 0) / stdData.length;

  // Detect peaks (likely steps)
  const peaks = stdData.filter((d) => d.std > avgStd * 1.5).length;

  const interpretation =
    avgStd < 0.15
      ? "Excellent gait smoothness - fresh and coordinated"
      : avgStd < 0.25
      ? "Good gait - minor irregularities"
      : avgStd < 0.35
      ? "Moderate variability - signs of fatigue"
      : "High variability - unstable gait detected";

  return (
    <div style={{ marginTop: 40, marginBottom: 30 }}>
      <h2>🚶 Movement Variability Analysis</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Gait smoothness and accelerometer STD during movement
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={stdData}>
          <defs>
            <linearGradient id="colorStd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{
              value: "Time (seconds)",
              position: "insideBottom",
              offset: -5,
            }}
          />
          <YAxis
            label={{
              value: "STD (Variability)",
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
                      Time: {payload[0].payload.time.toFixed(1)}s
                    </p>
                    <p style={{ margin: 0, color: "#82ca9d" }}>
                      STD: {payload[0].payload.std.toFixed(3)}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.9em" }}>
                      {payload[0].payload.smoothness}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="std"
            stroke="#82ca9d"
            fillOpacity={1}
            fill="url(#colorStd)"
            strokeWidth={2}
          />
        </AreaChart>
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
              movementScore >= 70
                ? "#22c55e"
                : movementScore >= 50
                ? "#eab308"
                : "#ef4444"
            }`,
          }}
        >
          <div style={{ fontSize: "0.9em", color: "#666" }}>Movement Score</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {movementScore}/100
          </div>
        </div>

        <div style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Avg STD</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>
            {avgStd.toFixed(3)}
          </div>
        </div>

        <div style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Peak Count</div>
          <div style={{ fontSize: "1.8em", fontWeight: "bold" }}>{peaks}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          backgroundColor: "#f0fdf4",
          borderRadius: 8,
          border: "1px solid #bbf7d0",
        }}
      >
        <strong>💡 Interpretation:</strong> {interpretation}
        <br />
        {avgStd > 0.25 && (
          <span style={{ color: "#ef4444" }}>
            ⚠️ Your gait is unstable → you&apos;re tired.
          </span>
        )}
        {avgStd <= 0.25 && (
          <span style={{ color: "#22c55e" }}>
            ✅ Smooth line = fresh and coordinated.
          </span>
        )}
      </div>
    </div>
  );
}
