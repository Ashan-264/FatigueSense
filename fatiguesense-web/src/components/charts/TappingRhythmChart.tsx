'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TappingRhythmChartProps {
  data: {
    labels: string[];
    tapsPerSecond: number[];
    jitter: number[];
  };
}

export default function TappingRhythmChart({ data }: TappingRhythmChartProps) {
  const chartData = data.labels.map((label, idx) => ({
    time: new Date(label).toLocaleTimeString(),
    taps: data.tapsPerSecond[idx],
    jitter: data.jitter[idx],
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Taps/sec', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Jitter', angle: 90, position: 'insideRight', fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number, name: string) => [
              value.toFixed(2), 
              name === 'taps' ? 'Taps/sec' : 'Jitter'
            ]}
          />
          <Legend />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="taps" 
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            name="Taps/sec"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="jitter" 
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
            name="Jitter"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

