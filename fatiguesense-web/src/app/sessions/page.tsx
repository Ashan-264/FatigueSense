"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import TappingRhythmHistogram from "@/components/TappingRhythmHistogram";
import SwayStabilityGraph from "@/components/SwayStabilityGraph";
import MovementVariabilityGraph from "@/components/MovementVariabilityGraph";

interface TestResult {
  type: string;
  score: number;
  raw?: Record<string, number>;
}

interface IMUDataPoint {
  x: number;
  y: number;
  z: number;
  t: number;
}

interface Session {
  _id: string;
  userId: string;
  timestamp: string;
  results: TestResult[];
  metadata: {
    deviceId: string;
    testType: string;
    durationSeconds: number;
    totalSamples: number;
  };
  imuData?: IMUDataPoint[];
  gyroData?: IMUDataPoint[];
  createdAt: string;
  updatedAt: string;
}

export default function SessionsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (user) {
      fetchSessions();
    }
  }, [isLoaded, user, router]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions");
      
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploading(true);
    setUploadSuccess(false);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const response = await fetch("/api/sessions/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      setUploadSuccess(true);
      
      // Refresh sessions list
      await fetchSessions();

      // Show success message
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadFile(null);
      }, 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload sessions");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      // Refresh sessions list
      await fetchSessions();
      setSelectedSession(null);
      setShowAdvancedAnalysis(false);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete session");
    }
  };

  const handleDeleteAllSessions = async () => {
    if (!confirm(`⚠️ DELETE ALL ${sessions.length} SESSIONS?\n\nThis will permanently delete all sessions and their time-series data from the database.\n\nThis action CANNOT be undone!`)) {
      return;
    }

    // Double confirmation for safety
    if (!confirm("Are you ABSOLUTELY sure? Type 'yes' in your mind and click OK to proceed.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let deletedCount = 0;
      let failedCount = 0;

      // Delete all sessions one by one
      for (const session of sessions) {
        try {
          const response = await fetch(`/api/sessions/${session._id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            deletedCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      // Refresh sessions list
      await fetchSessions();
      setSelectedSession(null);
      setShowAdvancedAnalysis(false);

      if (failedCount > 0) {
        setError(`Deleted ${deletedCount} sessions, ${failedCount} failed`);
      } else {
        alert(`✅ Successfully deleted all ${deletedCount} sessions!`);
      }
    } catch (err) {
      console.error("Delete all error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete all sessions");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-blue-100 dark:bg-blue-900/30";
    if (score >= 40) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-blue-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Sessions
              </h1>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Cloud Storage & History
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/timeseries"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              📊 Time-Series
            </a>
            <ThemeToggle />
            {isLoaded && user && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                    {user.firstName || user.username || "User"}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {sessions.length} Sessions
                  </p>
                </div>
                <UserButton afterSignOutUrl="/sign-in" />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Sessions to Cloud
            </h2>
            <p className="text-blue-600 dark:text-blue-400">
              Upload session data from mobile app (supports single session or bulk upload)
            </p>
          </div>

          <label className="block w-full">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="session-upload"
            />
            <label
              htmlFor="session-upload"
              className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                uploading
                  ? "border-gray-300 bg-gray-50 dark:bg-gray-700 cursor-wait"
                  : uploadSuccess
                  ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                  : "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-gray-700 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-gray-600"
              }`}
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-blue-700 dark:text-blue-400 font-medium">
                    Uploading...
                  </span>
                </>
              ) : uploadSuccess ? (
                <>
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    Uploaded Successfully! ✓
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="h-6 w-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-blue-700 dark:text-blue-400 font-medium">
                    Click to upload JSON file
                  </span>
                </>
              )}
            </label>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-gray-100 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              Your Sessions ({sessions.length})
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Delete All Button */}
              {sessions.length > 0 && (
                <button
                  onClick={handleDeleteAllSessions}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete All
                </button>
              )}
              
              {/* Refresh Button */}
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                No sessions yet
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Upload sessions from your mobile app to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const avgScore =
                  session.results.length > 0
                    ? Math.round(
                        session.results.reduce((sum, r) => sum + r.score, 0) /
                          session.results.length
                      )
                    : 0;

                return (
                  <div
                    key={session._id}
                    className="border border-blue-100 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedSession(session);
                      setShowAdvancedAnalysis(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-2xl font-bold ${getScoreColor(
                              avgScore
                            )}`}
                          >
                            {avgScore}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            /100
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreBgColor(
                              avgScore
                            )} ${getScoreColor(avgScore)}`}
                          >
                            {session.metadata.testType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {new Date(session.timestamp).toLocaleString()} •{" "}
                          {session.metadata.deviceId}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.results.map((result, idx) => (
                            <div
                              key={idx}
                              className="bg-blue-50 dark:bg-gray-700 px-3 py-1 rounded-lg text-sm"
                            >
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {result.type}:
                              </span>{" "}
                              <span className="text-blue-900 dark:text-gray-100">
                                {result.score}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session._id);
                        }}
                        className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Session Detail Modal */}
        {selectedSession && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedSession(null);
              setShowAdvancedAnalysis(false);
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-blue-900 dark:text-gray-100">
                  Session Details
                </h3>
                <button
                  onClick={() => {
                    setSelectedSession(null);
                    setShowAdvancedAnalysis(false);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Metadata */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Date & Time
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                        {new Date(selectedSession.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Test Type
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                        {selectedSession.metadata.testType}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Device
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                        {selectedSession.metadata.deviceId}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Duration
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                        {selectedSession.metadata.durationSeconds}s
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advanced Analysis Button */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-purple-900 dark:text-purple-100 mb-1 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Time-Series Analysis
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        View detailed IMU sensor graphs, movement patterns, and advanced metrics
                      </p>
                    </div>
                    <a
                      href={`/timeseries?session=${selectedSession._id}`}
                      className="ml-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      View Charts
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Test Results */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Test Results
                  </h4>
                  <div className="space-y-3">
                    {selectedSession.results.map((result, idx) => (
                      <div
                        key={idx}
                        className="border border-blue-100 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-blue-900 dark:text-gray-100 capitalize">
                            {result.type}
                          </span>
                          <span
                            className={`text-2xl font-bold ${getScoreColor(
                              result.score
                            )}`}
                          >
                            {result.score}
                          </span>
                        </div>
                        {result.raw && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(result.raw).map(([key, value]) => (
                              <div
                                key={key}
                                className="bg-gray-50 dark:bg-gray-700 rounded p-2"
                              >
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {key}
                                </p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {typeof value === "number"
                                    ? value.toFixed(3)
                                    : String(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Analysis Toggle */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <button
                    onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>{showAdvancedAnalysis ? 'Hide' : 'Show'} Advanced Analysis</span>
                    </div>
                    <svg 
                      className={`w-6 h-6 transition-transform ${showAdvancedAnalysis ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Advanced Analysis Charts */}
                {showAdvancedAnalysis && (
                  <div className="space-y-6 animate-fade-in">
                    {selectedSession.results.map((result, idx) => {
                      const resultType = result.type.toLowerCase();
                      
                      // Check if we have the necessary data for charts
                      if (!result.raw) return null;

                      if (resultType.includes('tap')) {
                        // Tapping test detailed chart
                        const tappingData = {
                          taps: (result.raw.taps as number) || 0,
                          avgInterval: (result.raw.avgInterval as number) || 0,
                          jitter: (result.raw.jitter as number) || 0,
                          tapsPerSec: (result.raw.tapsPerSec as number) || 0,
                        };
                        
                        return (
                          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-6">
                            <h4 className="text-lg font-semibold text-blue-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              </svg>
                              Tapping Rhythm Analysis
                            </h4>
                            <TappingRhythmHistogram tappingData={tappingData} tappingScore={result.score} />
                          </div>
                        );
                      } else if (resultType.includes('sway')) {
                        // Sway test detailed chart - use session's imuData or generate from stats
                        let accData = selectedSession.imuData || [];
                        
                        if (accData.length === 0 && result.raw.variance) {
                          // Generate representative data from variance
                          const variance = result.raw.variance as number;
                          const duration = 20000; // 20 seconds
                          const sampleRate = 50; // 50ms between samples
                          const numSamples = duration / sampleRate;
                          
                          accData = [];
                          for (let i = 0; i < numSamples; i++) {
                            const t = i * sampleRate;
                            const wobble = Math.sqrt(variance) * (Math.random() - 0.5) * 2;
                            accData.push({
                              x: 0.03 + wobble * 0.1,
                              y: 0.06 + wobble * 0.15,
                              z: 0.99 + wobble * 0.05,
                              t: t
                            });
                          }
                        }
                        
                        if (accData.length === 0) return null;
                        
                        return (
                          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-gray-700 p-6">
                            <h4 className="text-lg font-semibold text-green-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              Sway Stability Analysis
                            </h4>
                            <SwayStabilityGraph accData={accData} swayScore={result.score} />
                          </div>
                        );
                      } else if (resultType.includes('move') || resultType.includes('gait')) {
                        // Movement test detailed chart - use session's imuData or generate from stats
                        let accData = selectedSession.imuData || [];
                        
                        if (accData.length === 0 && result.raw.std) {
                          // Generate representative data from standard deviation
                          const std = result.raw.std as number;
                          const duration = 30000; // 30 seconds
                          const sampleRate = 50; // 50ms between samples
                          const numSamples = duration / sampleRate;
                          
                          accData = [];
                          for (let i = 0; i < numSamples; i++) {
                            const t = i * sampleRate;
                            const phase = (t / 500) * Math.PI; // Walking cycle
                            const stepPattern = Math.sin(phase) * std * 3;
                            const noise = (Math.random() - 0.5) * std * 0.5;
                            
                            accData.push({
                              x: 0.05 + stepPattern + noise,
                              y: 0.08 + stepPattern * 0.7 + noise,
                              z: 0.95 + Math.abs(stepPattern) * 0.3 + noise,
                              t: t
                            });
                          }
                        }
                        
                        if (accData.length === 0) return null;
                        
                        return (
                          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-gray-700 p-6">
                            <h4 className="text-lg font-semibold text-purple-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                              Movement Variability Analysis
                            </h4>
                            <MovementVariabilityGraph accData={accData} movementScore={result.score} />
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

