'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MovementSmoothnessChartProps {
  data: {
    labels: string[];
    accStd: number[];
  };
}

export default function MovementSmoothnessChart({ data }: MovementSmoothnessChartProps) {
  const chartData = data.labels.map((label, idx) => ({
    time: new Date(label).toLocaleTimeString(),
    std: data.accStd[idx],
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
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Std Deviation', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => [value.toFixed(4), 'Std Dev']}
          />
          <Legend />
          
          {/* Reference lines */}
          <ReferenceLine y={0.01} stroke="#10b981" strokeDasharray="3 3" label="Very Smooth" />
          <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="3 3" label="Unsteady" />
          <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="3 3" label="Jerky" />
          
          <Line 
            type="monotone" 
            dataKey="std" 
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            name="Movement Std"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

