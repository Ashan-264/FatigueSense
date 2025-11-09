import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * GET /api/timeseries/tapping-rhythm/[id]
 * Returns tapping rhythm analysis (taps per second, jitter)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: sessionId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Aggregation pipeline for tapping rhythm
    const pipeline = [
      { $match: { sessionId, type: 'tapping' } },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$timestamp',
              unit: 'second',
            },
          },
          tapsPerSecond: { $sum: 1 },
          accMagnitudes: {
            $push: {
              $sqrt: {
                $add: [
                  { $multiply: ['$acc.x', '$acc.x'] },
                  { $multiply: ['$acc.y', '$acc.y'] },
                  { $multiply: ['$acc.z', '$acc.z'] },
                ],
              },
            },
          },
          timestamps: { $push: '$timestamp' },
        },
      },
      {
        $addFields: {
          timestamp: '$_id',
          // Calculate jitter (variance of tap intervals)
          jitter: { $stdDevPop: '$accMagnitudes' },
        },
      },
      {
        $project: {
          _id: 0,
          timestamp: 1,
          tapsPerSecond: 1,
          jitter: 1,
        },
      },
      { $sort: { timestamp: 1 } },
    ];

    const data = await db.collection('fatigue_imu').aggregate(pipeline).toArray();

    if (data.length === 0) {
      return NextResponse.json({
        message: 'No time-series data found.',
        sessionId,
        data: [],
      });
    }

    // Format for charting
    const chartData = {
      labels: data.map((d) => new Date(d.timestamp).toISOString()),
      tapsPerSecond: data.map((d) => d.tapsPerSecond),
      jitter: data.map((d) => d.jitter || 0),
      avgTapsPerSecond: data.reduce((sum, d) => sum + d.tapsPerSecond, 0) / data.length,
      avgJitter: data.reduce((sum, d) => sum + (d.jitter || 0), 0) / data.length,
    };

    return NextResponse.json({
      success: true,
      sessionId,
      ...chartData,
    });
  } catch (error) {
    console.error('Tapping rhythm query error:', error);
    return NextResponse.json(
      { error: 'Query failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

