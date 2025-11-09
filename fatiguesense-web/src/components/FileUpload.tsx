"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function FileUpload({
  onFileSelect,
  isLoading,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === "application/json") {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative cursor-pointer transition-all duration-300 rounded-2xl p-10 text-center ${
        isDragging
          ? "border-2 border-dashed border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "border-2 border-dashed border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50"
      }`}
    >
      <input
        type="file"
        accept="application/json"
        onChange={handleFileInput}
        disabled={isLoading}
        className="absolute w-full h-full top-0 left-0 opacity-0 cursor-pointer"
      />

      <div className="pointer-events-none">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`mx-auto mb-4 ${
            isDragging
              ? "text-blue-500 dark:text-blue-400"
              : "text-slate-400 dark:text-gray-500"
          }`}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-gray-100">
          {isLoading ? "Processing..." : "Upload IMU Data"}
        </h3>

        <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
          Drag and drop your JSON file here, or click to browse
        </p>

        <p className="text-xs text-slate-400 dark:text-gray-500">
          Supported format: JSON (from FatigueSense mobile app)
        </p>
      </div>
    </div>
  );
}
