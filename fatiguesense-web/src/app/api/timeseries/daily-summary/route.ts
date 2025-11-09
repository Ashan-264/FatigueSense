import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import Session from '@/models/Session';

/**
 * GET /api/timeseries/daily-summary
 * Returns daily aggregated metrics across all user sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get all session IDs for this user
    const userSessions = await Session.find({ userId }).select('_id').lean();
    const sessionIds = userSessions.map((s) => s._id.toString());

    if (sessionIds.length === 0) {
      return NextResponse.json({
        message: 'No sessions found.',
        data: [],
      });
    }

    const db = mongoose.connection.db;

    // Aggregation pipeline for daily summary
    const pipeline = [
      { $match: { sessionId: { $in: sessionIds } } },
      {
        $addFields: {
          day: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp',
            },
          },
          accMagnitude: {
            $sqrt: {
              $add: [
                { $multiply: ['$acc.x', '$acc.x'] },
                { $multiply: ['$acc.y', '$acc.y'] },
                { $multiply: ['$acc.z', '$acc.z'] },
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: { day: '$day', type: '$type' },
          avgAccMagnitude: { $avg: '$accMagnitude' },
          stdAccMagnitude: { $stdDevPop: '$accMagnitude' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.day',
          swayVariance: {
            $max: {
              $cond: [
                { $eq: ['$_id.type', 'sway'] },
                { $pow: ['$stdAccMagnitude', 2] },
                0,
              ],
            },
          },
          movementStd: {
            $max: {
              $cond: [{ $eq: ['$_id.type', 'movement'] }, '$stdAccMagnitude', 0],
            },
          },
          tappingAvg: {
            $max: {
              $cond: [{ $eq: ['$_id.type', 'tapping'] }, '$avgAccMagnitude', 0],
            },
          },
          totalSamples: { $sum: '$count' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const data = await db.collection('fatigue_imu').aggregate(pipeline).toArray();

    if (data.length === 0) {
      return NextResponse.json({
        message: 'No time-series data found.',
        data: [],
      });
    }

    // Format for charting
    const chartData = {
      labels: data.map((d) => d._id),
      swayVariance: data.map((d) => d.swayVariance || 0),
      movementStd: data.map((d) => d.movementStd || 0),
      tappingAvg: data.map((d) => d.tappingAvg || 0),
      totalSamples: data.map((d) => d.totalSamples || 0),
    };

    return NextResponse.json({
      success: true,
      ...chartData,
    });
  } catch (error) {
    console.error('Daily summary query error:', error);
    return NextResponse.json(
      { error: 'Query failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

