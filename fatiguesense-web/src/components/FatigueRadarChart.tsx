"use client";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  tappingScore: number;
  swayScore: number;
  movementScore: number;
  overallScore: number;
}

export default function FatigueRadarChart({
  tappingScore,
  swayScore,
  movementScore,
  overallScore,
}: Props) {
  const data = [
    {
      metric: "Tapping (CNS)",
      score: tappingScore,
      fullMark: 100,
    },
    {
      metric: "Balance/Sway",
      score: swayScore,
      fullMark: 100,
    },
    {
      metric: "Movement/Gait",
      score: movementScore,
      fullMark: 100,
    },
    {
      metric: "Overall Fatigue",
      score: overallScore,
      fullMark: 100,
    },
  ];

  const getScoreInterpretation = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Moderate Fatigue";
    if (score >= 20) return "High Fatigue";
    return "Severe Fatigue";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e"; // green
    if (score >= 60) return "#84cc16"; // lime
    if (score >= 40) return "#eab308"; // yellow
    if (score >= 20) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <div style={{ marginTop: 30, marginBottom: 30 }}>
      <h2 style={{ marginBottom: 20 }}>Multi-Test Fatigue Breakdown</h2>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Fatigue Score"
            dataKey="score"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
          marginTop: 30,
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            borderLeft: `4px solid ${getScoreColor(tappingScore)}`,
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>
            🖐️ Tapping (CNS)
          </h3>
          <div
            style={{
              fontSize: "2em",
              fontWeight: "bold",
              margin: "10px 0",
              color: "#111827",
            }}
          >
            {tappingScore}/100
          </div>
          <p style={{ margin: 0, color: "#374151", fontWeight: 600 }}>
            {getScoreInterpretation(tappingScore)}
          </p>
          <p
            style={{
              margin: "10px 0 0 0",
              fontSize: "0.9em",
              color: "#6b7280",
            }}
          >
            {tappingScore >= 60
              ? "Your central nervous system response is good."
              : "Your CNS tapping is slow today."}
          </p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            borderLeft: `4px solid ${getScoreColor(swayScore)}`,
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>
            ⚖️ Balance/Sway
          </h3>
          <div
            style={{
              fontSize: "2em",
              fontWeight: "bold",
              margin: "10px 0",
              color: "#111827",
            }}
          >
            {swayScore}/100
          </div>
          <p style={{ margin: 0, color: "#374151", fontWeight: 600 }}>
            {getScoreInterpretation(swayScore)}
          </p>
          <p
            style={{
              margin: "10px 0 0 0",
              fontSize: "0.9em",
              color: "#6b7280",
            }}
          >
            {swayScore >= 60
              ? "Your balance is stable."
              : "Your balance is weak today."}
          </p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            borderLeft: `4px solid ${getScoreColor(movementScore)}`,
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>
            🚶 Movement/Gait
          </h3>
          <div
            style={{
              fontSize: "2em",
              fontWeight: "bold",
              margin: "10px 0",
              color: "#111827",
            }}
          >
            {movementScore}/100
          </div>
          <p style={{ margin: 0, color: "#374151", fontWeight: 600 }}>
            {getScoreInterpretation(movementScore)}
          </p>
          <p
            style={{
              margin: "10px 0 0 0",
              fontSize: "0.9em",
              color: "#6b7280",
            }}
          >
            {movementScore >= 60
              ? "Your movement patterns are normal."
              : "Your gait is unstable today."}
          </p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            borderLeft: `4px solid ${getScoreColor(overallScore)}`,
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>
            📊 Overall Fatigue
          </h3>
          <div
            style={{
              fontSize: "2em",
              fontWeight: "bold",
              margin: "10px 0",
              color: "#111827",
            }}
          >
            {overallScore}/100
          </div>
          <p style={{ margin: 0, color: "#374151", fontWeight: 600 }}>
            {getScoreInterpretation(overallScore)}
          </p>
          <p
            style={{
              margin: "10px 0 0 0",
              fontSize: "0.9em",
              color: "#6b7280",
            }}
          >
            {overallScore >= 80
              ? "Your overall fatigue is minimal."
              : overallScore >= 60
              ? "Your overall fatigue is low."
              : overallScore >= 40
              ? "Your overall fatigue is moderate."
              : "Your overall fatigue is high."}
          </p>
        </div>
      </div>
    </div>
  );
}
