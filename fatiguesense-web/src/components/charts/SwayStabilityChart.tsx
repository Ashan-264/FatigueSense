'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SwayStabilityChartProps {
  data: {
    labels: string[];
    accStd: number[];
  };
}

export default function SwayStabilityChart({ data }: SwayStabilityChartProps) {
  const chartData = data.labels.map((label, idx) => ({
    time: new Date(label).toLocaleTimeString(),
    variance: Math.pow(data.accStd[idx], 2), // Convert std to variance
  }));

  const getColor = (variance: number) => {
    if (variance < 0.02) return '#10b981'; // green
    if (variance < 0.06) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

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
            label={{ value: 'Variance', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => [value.toFixed(4), 'Variance']}
          />
          <Legend />
          
          {/* Reference lines for zones */}
          <ReferenceLine y={0.02} stroke="#10b981" strokeDasharray="3 3" label="Excellent" />
          <ReferenceLine y={0.06} stroke="#f59e0b" strokeDasharray="3 3" label="Concerning" />
          
          <Line 
            type="monotone" 
            dataKey="variance" 
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            name="Sway Variance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

