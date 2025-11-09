"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import FatigueRadarChart from "@/components/FatigueRadarChart";
import SwayStabilityGraph from "@/components/SwayStabilityGraph";
import MovementVariabilityGraph from "@/components/MovementVariabilityGraph";
import TappingRhythmHistogram from "@/components/TappingRhythmHistogram";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = 'force-dynamic';

interface TestResult {
  type: string;
  score: number;
  raw?: Record<string, number>;
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
  createdAt: string;
  updatedAt: string;
}

export default function Page() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI Analysis state
  const [selectedSessionsForAI, setSelectedSessionsForAI] = useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

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

      // Auto-select the most recent session
      if (data.sessions && data.sessions.length > 0) {
        setSelectedSession(data.sessions[0]);
        // Auto-select first 5 sessions for AI analysis
        const defaultSelected = new Set<string>(
          data.sessions.slice(0, Math.min(5, data.sessions.length)).map((s: Session) => s._id)
        );
        setSelectedSessionsForAI(defaultSelected);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionForAI = (sessionId: string) => {
    setSelectedSessionsForAI((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const selectAllForAI = () => {
    setSelectedSessionsForAI(new Set(sessions.map((s) => s._id)));
  };

  const deselectAllForAI = () => {
    setSelectedSessionsForAI(new Set());
  };

  const analyzeWithAI = async () => {
    if (selectedSessionsForAI.size === 0) {
      setError("Please select at least one session to analyze");
      return;
    }

    setAiLoading(true);
    setAiAnalysis("");
    setError(null);

    try {
      const selectedSessions = sessions.filter((s) =>
        selectedSessionsForAI.has(s._id)
      );

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessions: selectedSessions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "AI analysis failed");
      }

      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (err) {
      console.error("AI analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze sessions");
    } finally {
      setAiLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
    if (score >= 60) return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700";
    if (score >= 40) return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700";
    return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700";
  };

  const avgScore = selectedSession
    ? selectedSession.results.length > 0
      ? Math.round(
          selectedSession.results.reduce((sum, r) => sum + r.score, 0) /
            selectedSession.results.length
        )
      : 0
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-blue-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                FatigueSense
              </h1>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Biometric Fatigue Analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/sessions"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
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
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              Upload & Manage
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="animate-spin h-12 w-12 text-blue-500"
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
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-red-600 dark:text-red-400 mb-4"
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
            <p className="text-red-700 dark:text-red-400 text-lg">{error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-blue-100 dark:border-gray-700">
            <svg
              className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-600 mb-6"
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              No Sessions Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Upload sessions from your mobile app to get started with fatigue analysis
            </p>
            <a
              href="/sessions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Sessions
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-blue-900 dark:text-gray-100">
                  Select Session to View
                </h2>
                <button
                  onClick={fetchSessions}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => {
                  const isSelected = selectedSession?._id === session._id;
                  const sessionAvgScore =
                    session.results.length > 0
                      ? Math.round(
                          session.results.reduce((sum, r) => sum + r.score, 0) /
                            session.results.length
                        )
                      : 0;

                  return (
                    <button
                      key={session._id}
                      onClick={() => setSelectedSession(session)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-2xl font-bold ${getScoreColor(
                            sessionAvgScore
                          )}`}
                        >
                          {sessionAvgScore}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(
                            sessionAvgScore
                          )} ${getScoreColor(sessionAvgScore)}`}
                        >
                          {session.metadata.testType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {new Date(session.timestamp).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {session.results.map((result, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                          >
                            {result.type}: {result.score}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Analysis Button */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 border border-purple-300 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      AI Fatigue Analysis
                    </h3>
                    <p className="text-white/90 text-sm">
                      Get personalized insights from Gemini AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {showAIPanel ? "Hide Analysis" : "Analyze Sessions"}
                </button>
              </div>
            </div>

            {/* AI Analysis Panel */}
            {showAIPanel && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-purple-100 dark:border-gray-700 space-y-6">
                {/* Session Selection for AI */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Select Sessions to Analyze ({selectedSessionsForAI.size} selected)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllForAI}
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllForAI}
                        className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sessions.map((session) => {
                      const isSelected = selectedSessionsForAI.has(session._id);
                      const sessionScore =
                        session.results.length > 0
                          ? Math.round(
                              session.results.reduce((sum, r) => sum + r.score, 0) /
                                session.results.length
                            )
                          : 0;

                      return (
                        <button
                          key={session._id}
                          onClick={() => toggleSessionForAI(session._id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-lg font-bold ${getScoreColor(sessionScore)}`}>
                              {sessionScore}
                            </span>
                            {isSelected && (
                              <svg
                                className="w-5 h-5 text-purple-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(session.timestamp).toLocaleDateString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Analyze Button */}
                <button
                  onClick={analyzeWithAI}
                  disabled={aiLoading || selectedSessionsForAI.size === 0}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {aiLoading ? (
                    <>
                      <svg
                        className="animate-spin h-6 w-6"
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
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Analyze {selectedSessionsForAI.size} Session{selectedSessionsForAI.size > 1 ? 's' : ''} with AI
                    </>
                  )}
                </button>

                {/* AI Analysis Results */}
                {aiAnalysis && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
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
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        AI Analysis Results
                      </h4>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {aiAnalysis}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Card */}
                {!aiAnalysis && !aiLoading && (
                  <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">AI-Powered Insights</p>
                        <p>Select sessions and click analyze to get personalized fatigue assessment, readiness evaluation, and recovery recommendations powered by Gemini AI.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Session Display */}
            {selectedSession && (
              <div className="space-y-6">
                {/* Score Card */}
                <div className={`rounded-2xl shadow-xl p-8 text-white ${avgScore >= 60 ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : avgScore >= 40 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-2">
                        Overall Fatigue Score
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold">{avgScore}</span>
                        <span className="text-2xl text-white/80">/100</span>
                      </div>
                      <p className="text-white/90 text-sm mt-2">
                        {new Date(selectedSession.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Advanced Analysis Button */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Advanced Time-Series Analysis
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        View detailed IMU sensor graphs, movement patterns, sway stability charts, and advanced biomechanical metrics
                      </p>
                    </div>
                    <a
                      href={`/timeseries?session=${selectedSession._id}`}
                      className="ml-6 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      View Detailed Charts
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Radar Chart Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-gray-100 mb-6">
                    Performance Breakdown
                  </h3>
                  <FatigueRadarChart
                    tappingScore={
                      selectedSession.results.find((t) =>
                        t.type.toLowerCase().includes("tap")
                      )?.score || 0
                    }
                    swayScore={
                      selectedSession.results.find((t) =>
                        t.type.toLowerCase().includes("sway")
                      )?.score || 0
                    }
                    movementScore={
                      selectedSession.results.find(
                        (t) =>
                          t.type.toLowerCase().includes("move") ||
                          t.type.toLowerCase().includes("gait")
                      )?.score || 0
                    }
                    overallScore={avgScore}
                  />
                </div>

                {/* Session Metadata */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-gray-100 mb-6 flex items-center gap-2">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Session Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Test Type
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100 capitalize">
                        {selectedSession.metadata.testType}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Device
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                        {selectedSession.metadata.deviceId}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Duration
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                        {selectedSession.metadata.durationSeconds} seconds
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Total Samples
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                        {selectedSession.metadata.totalSamples}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Test Results Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-gray-100 mb-6 flex items-center gap-2">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    Test Results
                  </h3>
                  <div className="space-y-4">
                    {selectedSession.results.map((result, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700 rounded-lg p-5 border border-blue-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-blue-900 dark:text-gray-100 capitalize">
                            {result.type}
                          </span>
                          <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                            {result.score}
                          </span>
                        </div>
                        {result.raw && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {Object.entries(result.raw).map(([key, value]) => (
                              <div
                                key={key}
                                className="bg-white dark:bg-gray-700 rounded p-2"
                              >
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  {key}
                                </p>
                                <p className="font-medium text-blue-900 dark:text-gray-100">
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
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
