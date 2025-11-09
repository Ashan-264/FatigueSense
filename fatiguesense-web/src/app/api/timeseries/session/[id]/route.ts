import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * GET /api/timeseries/session/[id]
 * Returns 1-second aggregated IMU data for a specific session
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

    // Debug: Check if any data exists for this session
    const sampleCount = await db.collection('fatigue_imu').countDocuments({ sessionId });
    console.log(`[DEBUG] Session ID: ${sessionId}, Sample count: ${sampleCount}`);

    // Aggregation pipeline for 1-second buckets
    const pipeline = [
      { $match: { sessionId } },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$timestamp',
              unit: 'second',
            },
          },
          avgAccX: { $avg: '$acc.x' },
          avgAccY: { $avg: '$acc.y' },
          avgAccZ: { $avg: '$acc.z' },
          avgGyroX: { $avg: '$gyro.x' },
          avgGyroY: { $avg: '$gyro.y' },
          avgGyroZ: { $avg: '$gyro.z' },
          type: { $first: '$type' },
          count: { $sum: 1 },
          // Calculate variance for sway
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
        },
      },
      {
        $addFields: {
          timestamp: '$_id',
          accMagnitude: {
            $sqrt: {
              $add: [
                { $multiply: ['$avgAccX', '$avgAccX'] },
                { $multiply: ['$avgAccY', '$avgAccY'] },
                { $multiply: ['$avgAccZ', '$avgAccZ'] },
              ],
            },
          },
          // Calculate std deviation for movement smoothness
          accStd: { $stdDevPop: '$accMagnitudes' },
        },
      },
      {
        $project: {
          _id: 0,
          timestamp: 1,
          avgAccX: 1,
          avgAccY: 1,
          avgAccZ: 1,
          avgGyroX: 1,
          avgGyroY: 1,
          avgGyroZ: 1,
          accMagnitude: 1,
          accStd: 1,
          type: 1,
          count: 1,
        },
      },
      { $sort: { timestamp: 1 } },
    ];

    const data = await db.collection('fatigue_imu').aggregate(pipeline).toArray();

    console.log(`[TS-QUERY] ========== TIME-SERIES QUERY ==========`);
    console.log(`[TS-QUERY] Session ID: ${sessionId}`);
    console.log(`[TS-QUERY] Sample count in DB: ${sampleCount}`);
    console.log(`[TS-QUERY] Query result length: ${data.length}`);

    if (data.length === 0) {
      // Debug: Check what sessionIds exist in the collection
      const totalDocs = await db.collection('fatigue_imu').countDocuments();
      const existingSessions = await db.collection('fatigue_imu').distinct('sessionId');
      
      console.log(`[TS-QUERY] ❌ NO DATA FOUND`);
      console.log(`[TS-QUERY] Total documents in collection: ${totalDocs}`);
      console.log(`[TS-QUERY] Number of unique sessionIds: ${existingSessions.length}`);
      console.log(`[TS-QUERY] Existing sessionIds:`, existingSessions);
      
      // Try to find ANY document with similar sessionId (last 8 chars)
      if (sessionId.length >= 8) {
        const lastChars = sessionId.slice(-8);
        const similarDocs = await db.collection('fatigue_imu')
          .find({ sessionId: { $regex: lastChars } })
          .limit(5)
          .toArray();
        console.log(`[TS-QUERY] Similar sessionIds (ending with ${lastChars}):`, 
          similarDocs.map(d => d.sessionId));
      }
      
      // Check a sample document structure
      const sampleDoc = await db.collection('fatigue_imu').findOne();
      if (sampleDoc) {
        console.log(`[TS-QUERY] Sample document structure:`, {
          sessionId: sampleDoc.sessionId,
          timestamp: sampleDoc.timestamp,
          hasAcc: !!sampleDoc.acc,
          hasGyro: !!sampleDoc.gyro,
          type: sampleDoc.type
        });
      }
      
      console.log(`[TS-QUERY] =====================================`);
      
      return NextResponse.json({
        message: 'No time-series data found.',
        sessionId,
        sampleCount,
        totalDocs,
        existingSessions: existingSessions.slice(0, 5),
        data: [],
      });
    }

    console.log(`[TS-QUERY] ✅ Found ${data.length} aggregated data points`);
    console.log(`[TS-QUERY] First timestamp: ${data[0]?.timestamp}`);
    console.log(`[TS-QUERY] Last timestamp: ${data[data.length - 1]?.timestamp}`);
    console.log(`[TS-QUERY] Test type: ${data[0]?.type}`);
    console.log(`[TS-QUERY] =====================================`);

    // Format for charting
    const chartData = {
      labels: data.map((d) => new Date(d.timestamp).toISOString()),
      avgAccX: data.map((d) => d.avgAccX),
      avgAccY: data.map((d) => d.avgAccY),
      avgAccZ: data.map((d) => d.avgAccZ),
      accMagnitude: data.map((d) => d.accMagnitude),
      accStd: data.map((d) => d.accStd || 0),
      type: data[0].type,
      sampleCount: data.reduce((sum, d) => sum + d.count, 0),
    };

    return NextResponse.json({
      success: true,
      sessionId,
      ...chartData,
    });
  } catch (error) {
    console.error('Time-series query error:', error);
    return NextResponse.json(
      { error: 'Query failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

