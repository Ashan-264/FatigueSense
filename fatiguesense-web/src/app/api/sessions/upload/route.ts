import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import TimeSeriesIMU from '@/models/TimeSeriesIMU';

/**
 * POST /api/sessions/upload - Bulk upload sessions from mobile app
 * 
 * Accepts either:
 * 1. Array of session objects
 * 2. Single session object
 * 3. Mobile app export format
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Determine data format and extract sessions
    let sessions = [];

    if (Array.isArray(body)) {
      // Direct array of sessions
      sessions = body;
    } else if (body.sessions && Array.isArray(body.sessions)) {
      // Wrapped in sessions property
      sessions = body.sessions;
    } else if (body.results || (body.acc && body.testResults)) {
      // Single session format (mobile app export)
      sessions = [{
        timestamp: body.timestamp || new Date().toISOString(),
        results: body.testResults || body.results || [],
        metadata: body.metadata || {
          deviceId: 'mobile-app',
          testType: 'imported',
          durationSeconds: 0,
          totalSamples: body.acc?.length || 0,
        }
      }];
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid data format',
          message: 'Expected array of sessions, session object, or mobile app export format' 
        },
        { status: 400 }
      );
    }

    // Validate sessions
    const validSessions = sessions.filter(s => 
      s.results && Array.isArray(s.results) && s.results.length > 0
    );

    if (validSessions.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid sessions found',
          message: 'All sessions must have a results array with at least one test result' 
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Bulk insert sessions
    const uploadedSessions = [];
    const errors = [];
    let totalTimeSeriesSamples = 0;

    for (let i = 0; i < validSessions.length; i++) {
      try {
        const sessionData = validSessions[i];
        
        const session = await Session.create({
          userId,
          timestamp: sessionData.timestamp || new Date(),
          results: sessionData.results,
          metadata: sessionData.metadata || {
            deviceId: 'mobile-app',
            testType: 'imported',
            durationSeconds: 0,
            totalSamples: 0,
          }
        });

        uploadedSessions.push(session);

        // Extract and save time-series IMU data if present
        if (sessionData.imuData && sessionData.gyroData && 
            sessionData.imuData.length > 0 && sessionData.gyroData.length > 0) {
          
          console.log(`[UPLOAD] Session ${i}: Found IMU data - ${sessionData.imuData.length} samples`);
          
          try {
            // Determine test type from results or metadata
            let testType = 'movement'; // default
            if (sessionData.results && sessionData.results.length > 0) {
              testType = sessionData.results[0].type || sessionData.metadata?.testType || 'movement';
            }

            // Map to valid test types
            const validTypes = ['tapping', 'sway', 'movement'];
            if (!validTypes.includes(testType)) {
              testType = 'movement';
            }

            console.log(`[UPLOAD] Test type: ${testType}`);

            // Prepare time-series samples
            // Get base timestamp from session
            const baseTimestamp = new Date(sessionData.timestamp || session.timestamp).getTime();
            console.log(`[UPLOAD] Base timestamp: ${new Date(baseTimestamp).toISOString()}`);
            
            const timeSeriesSamples = sessionData.imuData.map((acc: any, idx: number) => {
              const gyro = sessionData.gyroData[idx] || { x: 0, y: 0, z: 0 };
              
              // Handle both absolute and relative timestamps
              let absoluteTimestamp: number;
              if (acc.timestamp && acc.timestamp > 1000000000000) {
                // Already absolute timestamp (Unix epoch ms)
                absoluteTimestamp = acc.timestamp;
              } else if (acc.t !== undefined) {
                // Relative timestamp (ms from test start) - add to base
                absoluteTimestamp = baseTimestamp + acc.t;
              } else {
                // Fallback: sequential timestamps
                absoluteTimestamp = baseTimestamp + (idx * 10);
              }

              return {
                sessionId: session._id.toString(),
                timestamp: new Date(absoluteTimestamp),
                acc: {
                  x: acc.x || 0,
                  y: acc.y || 0,
                  z: acc.z || 0,
                },
                gyro: {
                  x: gyro.x || 0,
                  y: gyro.y || 0,
                  z: gyro.z || 0,
                },
                type: testType,
              };
            });

            // Insert into time-series collection
            if (timeSeriesSamples.length > 0) {
              console.log(`[UPLOAD] Inserting ${timeSeriesSamples.length} samples for session ${session._id}`);
              console.log(`[UPLOAD] First sample:`, JSON.stringify(timeSeriesSamples[0], null, 2));
              
              const inserted = await TimeSeriesIMU.insertMany(timeSeriesSamples, { ordered: false });
              console.log(`[UPLOAD] ✅ insertMany returned ${inserted.length} documents`);
              
              // Verify the insert actually worked
              const verifyCount = await TimeSeriesIMU.countDocuments({ sessionId: session._id.toString() });
              console.log(`[UPLOAD] 🔍 Verification via Mongoose: ${verifyCount} documents found for session ${session._id}`);
              
              // Also check via direct MongoDB driver
              const db = mongoose.connection.db;
              const directCount = await db.collection('fatigue_imu').countDocuments({ sessionId: session._id.toString() });
              console.log(`[UPLOAD] 🔍 Verification via direct driver: ${directCount} documents in 'fatigue_imu'`);
              
              // Check what collection the model is actually using
              const modelCollectionName = TimeSeriesIMU.collection.name;
              console.log(`[UPLOAD] 📂 Model collection name: ${modelCollectionName}`);
              
              if (verifyCount === 0 && directCount === 0) {
                console.error(`[UPLOAD] ⚠️ WARNING: No documents found after insert!`);
                // Check what collection it went to
                const collections = await db.listCollections().toArray();
                console.log(`[UPLOAD] Available collections:`, collections.map(c => c.name));
                
                // Check all collections for this sessionId
                for (const coll of collections) {
                  const count = await db.collection(coll.name).countDocuments({ sessionId: session._id.toString() });
                  if (count > 0) {
                    console.log(`[UPLOAD] ✅ Found ${count} documents in collection: ${coll.name}`);
                  }
                }
              }
              
              totalTimeSeriesSamples += inserted.length;
            }
          } catch (tsError: any) {
            console.error(`[UPLOAD] ❌ Failed to insert time-series data for session ${i}:`, tsError.message);
            console.error(`[UPLOAD] Error details:`, tsError);
            // Non-blocking: continue even if time-series insert fails
          }
        } else {
          console.log(`[UPLOAD] Session ${i}: No IMU data found (imuData: ${sessionData.imuData?.length || 0}, gyroData: ${sessionData.gyroData?.length || 0})`);
        }
      } catch (error: any) {
        errors.push({
          index: i,
          error: error.message,
        });
      }
    }

    console.log(`[UPLOAD] ====== UPLOAD COMPLETE ======`);
    console.log(`[UPLOAD] Sessions uploaded: ${uploadedSessions.length}`);
    console.log(`[UPLOAD] Time-series samples: ${totalTimeSeriesSamples}`);
    console.log(`[UPLOAD] =============================`);

    return NextResponse.json(
      {
        success: true,
        uploaded: uploadedSessions.length,
        failed: errors.length,
        total: validSessions.length,
        timeSeriesSamples: totalTimeSeriesSamples,
        sessions: uploadedSessions,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error uploading sessions:', error);
    return NextResponse.json(
      { error: 'Failed to upload sessions', details: error.message },
      { status: 500 }
    );
  }
}

