'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailySummaryChartProps {
  data: {
    labels: string[];
    swayVariance: number[];
    movementStd: number[];
    tappingAvg: number[];
  };
}

export default function DailySummaryChart({ data }: DailySummaryChartProps) {
  const chartData = data.labels.map((label, idx) => ({
    date: label,
    sway: data.swayVariance[idx],
    movement: data.movementStd[idx],
    tapping: data.tappingAvg[idx],
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Metric Value', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => value.toFixed(4)}
          />
          <Legend />
          
          <Bar dataKey="sway" fill="#3b82f6" name="Sway Variance" />
          <Bar dataKey="movement" fill="#8b5cf6" name="Movement Std" />
          <Bar dataKey="tapping" fill="#22c55e" name="Tapping Avg" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

