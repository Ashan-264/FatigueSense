"use client";

import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import FileUpload from "@/components/FileUpload";
import AccChart from "@/components/AccChart";
import FatigueRadarChart from "@/components/FatigueRadarChart";
import SwayStabilityGraph from "@/components/SwayStabilityGraph";
import MovementVariabilityGraph from "@/components/MovementVariabilityGraph";
import TappingRhythmHistogram from "@/components/TappingRhythmHistogram";
import ThemeToggle from "@/components/ThemeToggle";

export default function Page() {
  const { user, isLoaded } = useUser();
  const [viewMode, setViewMode] = useState<"basic" | "advanced">("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<{
    rms: number;
    jerk: number;
    sway: number;
    entropy: number;
  } | null>(null);
  const [acc, setAcc] = useState<
    Array<{ x: number; y: number; z: number; t: number }>
  >([]);
  const [metadata, setMetadata] = useState<{
    testType?: string;
    deviceInfo?: {
      manufacturer?: string;
      modelName?: string;
      platform?: string;
      osVersion?: string;
    };
    totalSamples?: number;
    sensorConfig?: { accelerometerInterval?: number };
    startTime?: string;
  } | null>(null);
  const [gyroSamples, setGyroSamples] = useState<number>(0);
  const [testResults, setTestResults] = useState<
    Array<{
      type: string;
      score: number;
      raw?: Record<string, number>;
    }>
  >([]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify(json),
      });

      const data = await res.json();
      setScore(data.fatigue_score);
      setMetrics(data.metrics);
      setAcc(json.acc);
      setMetadata(data.metadata);
      setGyroSamples(data.gyroSamples || 0);
      setTestResults(data.testResults || []);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please check the format.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <ThemeToggle />
            {isLoaded && user && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                    {user.firstName || user.username || "User"}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Active Session
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
        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-gray-100 mb-2">
              Upload Session Data
            </h2>
            <p className="text-blue-600 dark:text-blue-400">
              Import IMU sensor data from the FatigueSense mobile app for
              analysis
            </p>
          </div>
          <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
        </div>

        {/* View Mode Toggle */}
        {score !== null && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-blue-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                View Mode:
              </span>
              <div className="flex gap-2 bg-blue-50 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("basic")}
                  className={`px-6 py-2.5 rounded-md font-medium transition-all duration-200 ${
                    viewMode === "basic"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md"
                      : "text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                  }`}
                >
                  📊 Basic View
                </button>
                <button
                  onClick={() => setViewMode("advanced")}
                  className={`px-6 py-2.5 rounded-md font-medium transition-all duration-200 ${
                    viewMode === "advanced"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md"
                      : "text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                  }`}
                >
                  🔬 Advanced View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {score !== null && metrics !== null && (
          <div className="space-y-6">
            {/* Basic View */}
            {viewMode === "basic" && (
              <>
                {/* Score Card */}
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-2">
                        Overall Fatigue Score
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold">{score}</span>
                        <span className="text-2xl text-blue-100">/100</span>
                      </div>
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

                {/* Radar Chart Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-gray-100 mb-6">
                    Performance Breakdown
                  </h3>
                  <FatigueRadarChart
                    tappingScore={
                      testResults.find((t) =>
                        t.type.toLowerCase().includes("tap")
                      )?.score || 0
                    }
                    swayScore={
                      testResults.find((t) =>
                        t.type.toLowerCase().includes("sway")
                      )?.score || 0
                    }
                    movementScore={
                      testResults.find(
                        (t) =>
                          t.type.toLowerCase().includes("move") ||
                          t.type.toLowerCase().includes("gait")
                      )?.score || 0
                    }
                    overallScore={score}
                  />
                </div>
              </>
            )}

            {/* Advanced View */}
            {viewMode === "advanced" && (
              <>
                {/* Score Card */}
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-2">
                        Overall Fatigue Score
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold">{score}</span>
                        <span className="text-2xl text-blue-100">/100</span>
                      </div>
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

                {/* Radar Chart Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-gray-100 mb-6">
                    Performance Breakdown
                  </h3>
                  <FatigueRadarChart
                    tappingScore={
                      testResults.find((t) =>
                        t.type.toLowerCase().includes("tap")
                      )?.score || 0
                    }
                    swayScore={
                      testResults.find((t) =>
                        t.type.toLowerCase().includes("sway")
                      )?.score || 0
                    }
                    movementScore={
                      testResults.find(
                        (t) =>
                          t.type.toLowerCase().includes("move") ||
                          t.type.toLowerCase().includes("gait")
                      )?.score || 0
                    }
                    overallScore={score}
                  />
                </div>

                {/* Metadata Card */}
                {metadata && (
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
                      Test Metadata
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          Test Type
                        </p>
                        <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                          {metadata.testType || "Unknown"}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          Device
                        </p>
                        <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                          {metadata.deviceInfo?.manufacturer}{" "}
                          {metadata.deviceInfo?.modelName} (
                          {metadata.deviceInfo?.platform})
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          OS Version
                        </p>
                        <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                          {metadata.deviceInfo?.osVersion}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          Total Samples
                        </p>
                        <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                          {metadata.totalSamples} accelerometer, {gyroSamples}{" "}
                          gyroscope
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          Sample Rate
                        </p>
                        <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                          {metadata.sensorConfig?.accelerometerInterval}ms
                          interval
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          Start Time
                        </p>
                        <p className="text-sm font-medium text-blue-900 dark:text-gray-100">
                          {metadata.startTime
                            ? new Date(metadata.startTime).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Results Card */}
                {testResults && testResults.length > 0 && (
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
                      Mobile Test Results
                    </h3>
                    <div className="space-y-4">
                      {testResults.map((result, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700 rounded-lg p-5 border border-blue-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-blue-900 dark:text-gray-100">
                              {result.type}
                            </span>
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                              Score: {result.score}/100
                            </span>
                          </div>
                          {result.raw && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              {Object.entries(result.raw).map(
                                ([key, value]) => (
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
                                )
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sway Stability Analysis */}
                {testResults.find((t) =>
                  t.type.toLowerCase().includes("sway")
                ) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                    <SwayStabilityGraph
                      accData={acc}
                      swayScore={
                        testResults.find((t) =>
                          t.type.toLowerCase().includes("sway")
                        )?.score || 0
                      }
                    />
                  </div>
                )}

                {/* Movement Variability Analysis */}
                {testResults.find((t) =>
                  t.type.toLowerCase().includes("move")
                ) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                    <MovementVariabilityGraph
                      accData={acc}
                      movementScore={
                        testResults.find((t) =>
                          t.type.toLowerCase().includes("move")
                        )?.score || 0
                      }
                    />
                  </div>
                )}

                {/* Tapping Rhythm Analysis */}
                {testResults.find((t) =>
                  t.type.toLowerCase().includes("tap")
                ) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-blue-100 dark:border-gray-700">
                    <TappingRhythmHistogram
                      tappingData={
                        testResults.find((t) =>
                          t.type.toLowerCase().includes("tap")
                        )?.raw as {
                          taps: number;
                          avgInterval: number;
                          jitter: number;
                          tapsPerSec: number;
                        }
                      }
                      tappingScore={
                        testResults.find((t) =>
                          t.type.toLowerCase().includes("tap")
                        )?.score || 0
                      }
                    />
                  </div>
                )}

                {/* Advanced Metrics Card */}
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Advanced Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-blue-100 dark:border-gray-600">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        RMS
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-gray-100">
                        {metrics.rms.toFixed(4)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-sky-100 dark:border-gray-600">
                      <p className="text-xs text-sky-600 dark:text-sky-400 mb-1">
                        Jerk
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-gray-100">
                        {metrics.jerk.toFixed(4)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-cyan-100 dark:border-gray-600">
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-1">
                        Sway
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-gray-100">
                        {metrics.sway.toFixed(4)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-indigo-100 dark:border-gray-600">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                        Entropy
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-gray-100">
                        {metrics.entropy.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accelerometer Chart Card */}
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
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                    Accelerometer X-Axis
                  </h3>
                  <AccChart data={acc} />
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
