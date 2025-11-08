"use client";

import { useState } from "react";
import AccChart from "@/components/AccChart";

export default function Page() {
  const [score, setScore] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<{
    rms: number;
    jerk: number;
    sway: number;
    entropy: number;
  } | null>(null);
  const [acc, setAcc] = useState<{ x: number }[]>([]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const json = JSON.parse(text);

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify(json),
    });

    const data = await res.json();
    setScore(data.fatigue_score);
    setMetrics(data.metrics);
    setAcc(json.acc);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>FatigueSense Dashboard</h1>
      <p>Upload IMU JSON data from the mobile app.</p>

      <input type="file" accept="application/json" onChange={handleUpload} />

      {score !== null && metrics !== null && (
        <div style={{ marginTop: 20 }}>
          <h2>Fatigue Score: {score}/100</h2>

          <h3>Metrics</h3>
          <ul>
            <li>RMS: {metrics.rms.toFixed(4)}</li>
            <li>Jerk: {metrics.jerk.toFixed(4)}</li>
            <li>Sway: {metrics.sway.toFixed(4)}</li>
            <li>Entropy: {metrics.entropy.toFixed(4)}</li>
          </ul>

          <h3>Accelerometer X Chart</h3>
          <AccChart data={acc} />
        </div>
      )}
    </div>
  );
}
