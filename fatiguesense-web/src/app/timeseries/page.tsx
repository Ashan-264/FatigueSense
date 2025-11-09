'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import SwayStabilityChart from '@/components/charts/SwayStabilityChart';
import MovementSmoothnessChart from '@/components/charts/MovementSmoothnessChart';
import TappingRhythmChart from '@/components/charts/TappingRhythmChart';
import DailySummaryChart from '@/components/charts/DailySummaryChart';

interface Session {
  _id: string;
  timestamp: string;
  metadata?: {
    testType?: string;
  };
}

interface TimeSeriesData {
  labels: string[];
  accStd: number[];
  type?: string;
}

interface TappingData {
  labels: string[];
  tapsPerSecond: number[];
  jitter: number[];
  avgTapsPerSecond?: number;
  avgJitter?: number;
}

interface DailyData {
  labels: string[];
  swayVariance: number[];
  movementStd: number[];
  tappingAvg: number[];
}

export default function TimeSeriesPage() {
  const { isLoaded, userId } = useAuth();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart data states
  const [sessionData, setSessionData] = useState<TimeSeriesData | null>(null);
  const [tappingData, setTappingData] = useState<TappingData | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Fetch user sessions
  useEffect(() => {
    if (isLoaded && userId) {
      fetchSessions();
      fetchDailyData();
    }
  }, [isLoaded, userId]);

  // Fetch session time-series when selected
  useEffect(() => {
    if (selectedSession) {
      fetchSessionData(selectedSession);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
      
      // Check if there's a session ID in the URL query params
      const sessionFromUrl = searchParams.get('session');
      
      if (sessionFromUrl && data.sessions.some((s: Session) => s._id === sessionFromUrl)) {
        // If the session exists in the list, select it
        setSelectedSession(sessionFromUrl);
      } else if (data.sessions && data.sessions.length > 0) {
        // Otherwise, select the first session
        setSelectedSession(data.sessions[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionData = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch general session data
      const res = await fetch(`/api/timeseries/session/${sessionId}`);
      const data = await res.json();

      if (data.success) {
        setSessionData(data);

        // If it's a tapping session, also fetch tapping rhythm
        if (data.type === 'tapping') {
          const tappingRes = await fetch(`/api/timeseries/tapping-rhythm/${sessionId}`);
          const tappingData = await tappingRes.json();
          if (tappingData.success) {
            setTappingData(tappingData);
          }
        } else {
          setTappingData(null);
        }
      } else {
        setError(data.message || 'No time-series data found');
        setSessionData(null);
        setTappingData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSessionData(null);
      setTappingData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyData = async () => {
    try {
      const res = await fetch('/api/timeseries/daily-summary');
      const data = await res.json();
      if (data.success) {
        setDailyData(data);
      }
    } catch (err) {
      console.error('Failed to fetch daily data:', err);
    }
  };

  const handleTimeSeriesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const response = await fetch('/api/timeseries/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadSuccess(`✅ Uploaded ${result.inserted} time-series samples! Skipped: ${result.skipped}`);
      
      // Refresh sessions and data
      await fetchSessions();
      if (selectedSession) {
        await fetchSessionData(selectedSession);
      }

      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload time-series data');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading time-series data...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to view time-series data.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Navigation */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-blue-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </a>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Time-Series
              </h1>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                IMU Sensor Visualization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="/sessions"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Sessions
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Direct Time-Series Upload */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg p-6 border border-purple-200 dark:border-purple-800">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Time-Series Data Directly
            </h2>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Upload JSON with IMU samples (bypasses session upload)
            </p>
          </div>

          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleTimeSeriesUpload}
              disabled={uploading}
              className="hidden"
              id="timeseries-upload"
            />
            <label
              htmlFor="timeseries-upload"
              className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                uploading
                  ? 'border-gray-300 bg-gray-50 dark:bg-gray-700 cursor-wait'
                  : uploadSuccess
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-gray-700 hover:border-purple-500 hover:bg-purple-100 dark:hover:bg-gray-600'
              }`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Uploading...</span>
                </>
              ) : uploadSuccess ? (
                <>
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 dark:text-green-300 font-medium">{uploadSuccess}</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-purple-700 dark:text-purple-400 font-medium">
                    Click to upload JSON file
                  </span>
                </>
              )}
            </label>
          </label>

          <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">
            Expected format: Mobile app export with imuData and gyroData arrays
          </p>
        </div>

        {/* Session Selector */}
        {sessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Session
            </label>
            <select
              value={selectedSession || ''}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {new Date(session.timestamp).toLocaleString()} - {session.metadata?.testType || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        {/* Session Charts */}
        {sessionData && sessionData.labels.length > 0 && (
          <>
            {/* Sway Stability Chart */}
            {sessionData.type === 'sway' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  🎯 Sway Stability
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Lower variance = better balance and stability
                </p>
                <SwayStabilityChart data={sessionData} />
              </div>
            )}

            {/* Movement Smoothness Chart */}
            {sessionData.type === 'movement' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  🚶 Movement Smoothness
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Lower std = smoother, more controlled movement
                </p>
                <MovementSmoothnessChart data={sessionData} />
              </div>
            )}

            {/* Tapping Rhythm Chart */}
            {tappingData && tappingData.labels.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  ⚡ Tapping Rhythm
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Avg: {tappingData.avgTapsPerSecond?.toFixed(2)} taps/sec | 
                  Jitter: {tappingData.avgJitter?.toFixed(2)}
                </p>
                <TappingRhythmChart data={tappingData} />
              </div>
            )}
          </>
        )}

        {/* Daily Summary Chart */}
        {dailyData && dailyData.labels.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              📅 Daily Summary
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Average metrics across all sessions per day
            </p>
            <DailySummaryChart data={dailyData} />
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Sessions Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Complete some tests in the mobile app and upload IMU data to view time-series charts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

