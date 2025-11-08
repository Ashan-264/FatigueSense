"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  data: { x: number }[];
}

export default function AccChart({ data }: Props) {
  const formatted = data.map((d, i) => ({ index: i, x: d.x }));

  return (
    <LineChart width={800} height={300} data={formatted}>
      <XAxis dataKey="index" />
      <YAxis />
      <CartesianGrid stroke="#ccc" />
      <Tooltip />
      <Line type="monotone" dataKey="x" stroke="#8884d8" dot={false} />
    </LineChart>
  );
}
