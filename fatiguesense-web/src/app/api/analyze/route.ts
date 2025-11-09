import { NextResponse } from "next/server";
import {
  computeFatigueScore,
  IMUSample,
  GyroSample,
  TestMetadata,
} from "@/lib/fatigue";

interface TestResult {
  type: string;
  score: number;
  raw: Record<string, number>;
  at: number;
}

interface IMURequest {
  acc: IMUSample[];
  gyro: GyroSample[];
  timestamp?: string;
  testResults?: TestResult[];
  metadata?: TestMetadata;
}

export async function POST(req: Request) {
  const data: IMURequest = await req.json();

  if (!data.acc || data.acc.length < 10) {
    return NextResponse.json({ error: "Not enough IMU data" }, { status: 400 });
  }

  const results = computeFatigueScore(data.acc);

  // Add metadata and gyro info to response
  return NextResponse.json({
    ...results,
    metadata: data.metadata,
    gyroSamples: data.gyro?.length || 0,
    testResults: data.testResults,
  });
}
