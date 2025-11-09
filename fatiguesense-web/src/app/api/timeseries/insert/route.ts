import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import TimeSeriesIMU from '@/models/TimeSeriesIMU';

/**
 * POST /api/timeseries/insert
 * Inserts IMU samples into MongoDB time-series collection
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { samples } = body;

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'samples array is required' },
        { status: 400 }
      );
    }

    // Validate sample format
    const validSamples = samples.filter(
      (s) =>
        s.sessionId &&
        s.timestamp &&
        s.acc &&
        s.gyro &&
        s.type &&
        ['tapping', 'sway', 'movement'].includes(s.type)
    );

    if (validSamples.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          message: 'No valid samples found. Each sample must have sessionId, timestamp, acc, gyro, and type.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Insert samples into time-series collection
    const result = await TimeSeriesIMU.insertMany(
      validSamples.map((s) => ({
        sessionId: s.sessionId,
        timestamp: new Date(s.timestamp),
        acc: {
          x: s.acc.x,
          y: s.acc.y,
          z: s.acc.z,
        },
        gyro: {
          x: s.gyro.x,
          y: s.gyro.y,
          z: s.gyro.z,
        },
        type: s.type,
      })),
      { ordered: false } // Continue on error
    );

    return NextResponse.json({
      success: true,
      inserted: result.length,
      skipped: samples.length - validSamples.length,
      total: samples.length,
    });
  } catch (error: any) {
    console.error('Time-series insert error:', error);
    return NextResponse.json(
      { error: 'Insert failed', message: error.message },
      { status: 500 }
    );
  }
}

