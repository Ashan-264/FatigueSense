import { NextResponse } from "next/server";
import { computeFatigueScore, IMUSample } from "@/lib/fatigue";

interface IMURequest {
  acc: IMUSample[];
  gyro: IMUSample[];
}

export async function POST(req: Request) {
  const data: IMURequest = await req.json();

  if (!data.acc || data.acc.length < 10) {
    return NextResponse.json({ error: "Not enough IMU data" }, { status: 400 });
  }

  const results = computeFatigueScore(data.acc);
  return NextResponse.json(results);
}
