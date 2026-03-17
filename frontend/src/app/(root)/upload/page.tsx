// src/app/upload/page.tsx — column selection merged inline
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDataset, DatasetColumn } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000/api";

type ColInfo = DatasetColumn;

const DTYPE_BADGE: Record<string, { label: string; color: string }> = {
  int64:   { label: "int",   color: "text-blue-300 bg-blue-900/30" },
  float64: { label: "float", color: "text-cyan-300 bg-cyan-900/30" },
  object:  { label: "text",  color: "text-amber-300 bg-amber-900/30" },
  bool:    { label: "bool",  color: "text-purple-300 bg-purple-900/30" },
  default: { label: "other", color: "text-gray-400 bg-gray-700/40" },
};

function dtypeBadge(dtype: string) {
  return DTYPE_BADGE[dtype] ?? DTYPE_BADGE["default"];
}

export default function UploadPage() {
  const {
    setDatasetId, setTaskType, setJobStatus,
    selectedColumns, setSelectedColumns,
    targetColumn, setTargetColumn,
    datasetColumns: columns, setDatasetColumns,
    datasetFilename, setDatasetFilename,
  } = useDataset();

  const searchParams = useSearchParams();
  const taskFromUrl = (searchParams.get("task") ?? "classification") as
    | "classification" | "clustering" | "regression";
  const isClustering = taskFromUrl === "clustering";

  // Upload phase state
  const [file, setFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState<string>("");
  const [datasetSource, setDatasetSource] = useState<"upload" | "drive">("upload");
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Column-selection phase state
  const [phase, setPhase] = useState<"upload" | "columns">("upload");
  const [nSamples, setNSamples] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadedId, setUploadedId] = useState<string | null>(null);

  useEffect(() => {
    setTaskType(taskFromUrl);
  }, [taskFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv") && !f.name.endsWith(".xlsx")) {
      setError("Please upload a CSV or Excel file.");
      return;
    }
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPreview(text.split("\n").slice(0, 6));
    };
    reader.readAsText(f);
  };

  // Populate column state from the upload response (no extra network call needed)
  const applyColumnData = (rawColumns: string[], rawDtypes: Record<string, string>, rawTarget: string | null) => {
    const cols: ColInfo[] = rawColumns.map((name) => ({
      name,
      dtype: rawDtypes[name] ?? "object",
    }));
    setDatasetColumns(cols);

    // Default: last column as target (supervised), everything else as features
    const defaultTarget = rawTarget ?? cols[cols.length - 1]?.name ?? null;
    setTargetColumn(defaultTarget);
    setSelectedColumns(cols.map((c) => c.name).filter((n) => n !== defaultTarget));
  };

  const handleUpload = async () => {
    if (datasetSource === "upload" && !file) {
      setError("Please select a file to upload.");
      return;
    }
    if (datasetSource === "drive" && !driveLink) {
      setError("Please provide a Google Drive link.");
      return;
    }
    setUploading(true);
    setJobStatus("uploading");
    setError(null);
    try {
      if (datasetSource === "upload") {
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("task_type", taskFromUrl);
        const res = await fetch(`${API_BASE}/upload/`, { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        const dsId = String(data.dataset_id);
        setDatasetId(dsId);
        setUploadedId(dsId);
        setDatasetFilename(file!.name);
        setTaskType(data.task_type || taskFromUrl);
        setNSamples(data.n_samples ?? null);
        setJobStatus("analyzing");
        // Use the columns returned directly by the upload endpoint — they come
        // straight from pandas reading the file, so every column is present.
        applyColumnData(
          (data.columns as string[]) ?? [],
          (data.dtypes as Record<string, string>) ?? {},
          data.target_column ?? null,
        );
        setPhase("columns");
      } else {
        setError("Google Drive upload is not yet implemented.");
        setJobStatus("error");
      }
    } catch {
      setError("Upload failed. Please try again.");
      setJobStatus("error");
    } finally {
      setUploading(false);
    }
  };

  // Column selection helpers
  const toggleColumn = (name: string) => {
    if (name === targetColumn) return;
    if (selectedColumns.includes(name)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== name));
    } else {
      setSelectedColumns([...selectedColumns, name]);
    }
  };

  const handleSetTarget = (name: string) => {
    const prev = targetColumn;
    setTargetColumn(name);
    let next = selectedColumns.filter((c) => c !== name);
    if (prev && prev !== name && !next.includes(prev)) next = [...next, prev];
    setSelectedColumns(next);
  };

  const selectAll = () =>
    setSelectedColumns(columns.map((c: ColInfo) => c.name).filter((n: string) => n !== targetColumn));

  const selectNone = () => setSelectedColumns([]);

  const featureCount = selectedColumns.length;
  const canContinue = isClustering
    ? selectedColumns.length >= 2
    : selectedColumns.length >= 1 && !!targetColumn;

  const handleContinue = async () => {
    setSaving(true);
    if (!isClustering && targetColumn && uploadedId) {
      try {
        await fetch(`${API_BASE}/columns/${uploadedId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_column: targetColumn }),
        });
      } catch { /* non-critical */ }
    }
    setSaving(false);
    window.location.href = "/describe";
  };

  // ════════════════════════════════════════════
  //  PHASE: COLUMN SELECTION (shown after upload)
  // ════════════════════════════════════════════
  if (phase === "columns") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 mt-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
              Select Columns
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose which columns to use for training
              {!isClustering && " — and which one is your target (output) variable"}.
            </p>
            {nSamples !== null && (
              <div className="mt-4 inline-flex gap-4">
                <span className="px-4 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm">
                  {nSamples.toLocaleString()} rows
                </span>
                <span className="px-4 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm">
                  {columns.length} columns detected
                </span>
              </div>
            )}
          </motion.div>

          {/* Summary bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-800/50 border border-gray-700 rounded-xl p-4"
              >
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-400">
                    Features selected:{" "}
                    <span className="font-bold text-indigo-300">{featureCount}</span>
                  </span>
                  {!isClustering && (
                    <span className="text-gray-400">
                      Target:{" "}
                      <span className="font-bold text-amber-300">{targetColumn ?? "None"}</span>
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={selectAll}
                    className="px-3 py-1.5 text-xs rounded-lg bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 hover:bg-indigo-900/60 transition-all">
                    Select all features
                  </button>
                  <button onClick={selectNone}
                    className="px-3 py-1.5 text-xs rounded-lg bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 transition-all">
                    Deselect all
                  </button>
                </div>
              </motion.div>

              {/* Legend */}
              {!isClustering && (
                <div className="flex gap-4 text-xs text-gray-400 mb-4 ml-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                    Feature (input)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                    Target (output)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-600 inline-block" />
                    Excluded
                  </span>
                </div>
              )}

              {/* Column grid — every column from the CSV */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8"
              >
                {columns.map((col, idx) => {
                  const isTarget = col.name === targetColumn;
                  const isFeature = selectedColumns.includes(col.name);
                  const badge = dtypeBadge(col.dtype);
                  return (
                    <motion.div
                      key={col.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * Math.min(idx, 20) }}
                      className={`relative rounded-xl border-2 p-4 transition-all duration-200 ${
                        isTarget
                          ? "border-amber-500 bg-amber-900/15"
                          : isFeature
                          ? "border-indigo-600 bg-indigo-900/15"
                          : "border-gray-700 bg-gray-800/30 opacity-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="font-mono font-semibold text-white text-sm break-all leading-snug">
                          {col.name}
                        </span>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {!isTarget && (
                          <button
                            onClick={() => toggleColumn(col.name)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isFeature
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                            }`}
                          >
                            {isFeature ? "✓ Feature" : "+ Feature"}
                          </button>
                        )}
                        {!isClustering && (
                          <button
                            onClick={() => handleSetTarget(col.name)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isTarget
                                ? "bg-amber-500 text-gray-900 hover:bg-amber-400"
                                : "bg-gray-700/50 text-gray-500 hover:bg-amber-900/30 hover:text-amber-400"
                            }`}
                          >
                            {isTarget ? "⭐ Target" : "Set target"}
                          </button>
                        )}
                      </div>
                      {isTarget && (
                        <p className="text-xs text-amber-400 mt-2">This is what the model will predict.</p>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Validation warning */}
              {!canContinue && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-red-400 text-sm text-center">
                  {isClustering
                    ? "Select at least 2 columns to use for clustering."
                    : !targetColumn
                    ? "Please set a target column."
                    : "Select at least 1 feature column."}
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPhase("upload")}
                  className="flex-1 px-6 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all border border-gray-600 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Upload
                </motion.button>
                <motion.button
                  whileHover={{ scale: canContinue && !saving ? 1.02 : 1 }}
                  whileTap={{ scale: canContinue && !saving ? 0.98 : 1 }}
                  onClick={handleContinue}
                  disabled={!canContinue || saving}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                    canContinue && !saving
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {saving ? "Saving…" : `Continue with ${featureCount} feature${featureCount !== 1 ? "s" : ""}`}
                  {!saving && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </motion.button>
              </div>
        </div>
      </main>
    );
  }

  // ════════════════════════════════════════════
  //  PHASE: FILE UPLOAD
  // ════════════════════════════════════════════

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Upload Your Dataset
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get started by uploading your data file or providing a Google Drive link
          </p>
        </motion.div>

        {/* Dataset Source Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Dataset Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setDatasetSource('upload')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                datasetSource === 'upload'
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : 'border-[var(--color-border)] hover:border-indigo-500'
              }`}
            >
              <div className="text-3xl mb-3">📁</div>
              <h3 className="text-lg font-bold text-white">Upload File</h3>
              <p className="text-gray-400 text-sm">Upload a CSV or Excel file directly</p>
            </button>
            <button
              onClick={() => setDatasetSource('drive')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                datasetSource === 'drive'
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : 'border-[var(--color-border)] hover:border-indigo-500'
              }`}
            >
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="text-lg font-bold text-white">Google Drive Link</h3>
              <p className="text-gray-400 text-sm">Provide a shareable Google Drive link</p>
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)]"
        >
          {/* Upload Section */}
          {datasetSource === 'upload' && (
            <>
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-indigo-500 bg-indigo-900/10'
                    : 'border-[var(--color-border)] hover:border-indigo-500 hover:bg-indigo-900/5'
                }`}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-900/20 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Drag & drop your file here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <p className="text-sm text-gray-500">Supports CSV and Excel files</p>

                  <input
                    id="fileInput"
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* File Info */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-indigo-900/30 flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview([]);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Preview Section */}
              {preview.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8"
                >
                  <h3 className="font-semibold text-lg text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Data Preview
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-800">
                        <tr>
                          {preview[0]?.split(',').map((header, idx) => (
                            <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                              {header.trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {preview.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/30'}>
                            {row.split(',').map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-sm text-gray-300">
                                {cell.trim()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Google Drive Section */}
          {datasetSource === 'drive' && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                </svg>
                Google Drive Link
              </h3>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Shareable Link</label>
                <input
                  type="text"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)]"
                />
                <p className="text-sm text-gray-500 mt-2">Make sure the link is publicly accessible or shared with anyone who has the link</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-900/30 text-red-300 rounded-lg border border-red-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpload}
              disabled={uploading || (datasetSource === "upload" && !file)}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                !uploading && ((datasetSource === "upload" && file) || (datasetSource === "drive" && driveLink))
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer"
                  : "bg-gray-700 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-center">
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading &amp; Analyzing…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {datasetSource === "upload" ? "Upload & Select Columns" : "Process Drive Link"}
                  </>
                )}
              </div>
            </button>

            <button
              onClick={() => window.history.back()}
              className="px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700"
            >
              Cancel
            </button>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Supported Formats</h3>
            <p className="text-gray-400 text-sm">CSV and Excel files are supported. Files should be under 100MB.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Data Preparation</h3>
            <p className="text-gray-400 text-sm">Ensure your data is clean with meaningful column headers.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Privacy Assured</h3>
            <p className="text-gray-400 text-sm">Your data is processed securely and never shared with third parties.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}