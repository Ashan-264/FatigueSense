import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';

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
      } catch (error: any) {
        errors.push({
          index: i,
          error: error.message,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        uploaded: uploadedSessions.length,
        failed: errors.length,
        total: validSessions.length,
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

