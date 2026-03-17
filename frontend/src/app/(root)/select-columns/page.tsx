// src/app/select-columns/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = "http://localhost:8000/api";

type ColInfo = { name: string; dtype: string };

const DTYPE_BADGE: Record<string, { label: string; color: string }> = {
  int64:   { label: "int",     color: "text-blue-300 bg-blue-900/30" },
  float64: { label: "float",   color: "text-cyan-300 bg-cyan-900/30" },
  object:  { label: "text",    color: "text-amber-300 bg-amber-900/30" },
  bool:    { label: "bool",    color: "text-purple-300 bg-purple-900/30" },
  default: { label: "other",   color: "text-gray-400 bg-gray-700/40" },
};

function dtypeBadge(dtype: string) {
  return DTYPE_BADGE[dtype] ?? DTYPE_BADGE["default"];
}

export default function SelectColumnsPage() {
  const {
    datasetId, taskType,
    selectedColumns, setSelectedColumns,
    targetColumn, setTargetColumn,
    setJobStatus,
  } = useDataset();

  const [columns, setColumns] = useState<ColInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nSamples, setNSamples] = useState<number | null>(null);

  // Load columns from DB (fast — no file read)
  useEffect(() => {
    if (!datasetId) { setLoading(false); return; }
    fetch(`${API_BASE}/columns/${datasetId}/`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const cols: ColInfo[] = (data.columns as string[]).map(name => ({
          name,
          dtype: (data.dtypes ?? {})[name] ?? "object",
        }));
        setColumns(cols);
        setNSamples(data.n_samples ?? null);

        // Defaults: select all cols as features, last col as target (supervised)
        const defaultTarget = data.target_column ?? cols[cols.length - 1]?.name ?? null;
        const current_target = targetColumn ?? defaultTarget;
        setTargetColumn(current_target);
        if (selectedColumns.length === 0) {
          const featureCols = cols.map(c => c.name).filter(n => n !== current_target);
          setSelectedColumns(featureCols);
        }
      })
      .catch(err => setError(err.message ?? "Failed to load columns"))
      .finally(() => setLoading(false));
    setJobStatus("ready");
  }, [datasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isClustering = taskType === "clustering";

  // Toggle a feature column on/off
  const toggleColumn = (name: string) => {
    if (name === targetColumn) return; // can't deselect the target via this
    setSelectedColumns(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  // Set or clear target column
  const handleSetTarget = (name: string) => {
    const prev = targetColumn;
    setTargetColumn(name);
    // Add old target back to features, remove new target from features
    setSelectedColumns(fc => {
      let next = fc.filter(c => c !== name);
      if (prev && prev !== name && !next.includes(prev)) next = [...next, prev];
      return next;
    });
  };

  const selectAll = () =>
    setSelectedColumns(columns.map(c => c.name).filter(n => n !== targetColumn));

  const selectNone = () => setSelectedColumns([]);

  const handleContinue = async () => {
    if (!datasetId) { window.location.href = "/describe"; return; }
    setSaving(true);
    // Save target_column to backend (PATCH)
    if (!isClustering && targetColumn) {
      try {
        await fetch(`${API_BASE}/columns/${datasetId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_column: targetColumn }),
        });
      } catch { /* non-critical */ }
    }
    setSaving(false);
    window.location.href = "/describe";
  };

  const featureCount = isClustering ? selectedColumns.length : selectedColumns.length;
  const canContinue = isClustering
    ? selectedColumns.length >= 2
    : (selectedColumns.length >= 1 && !!targetColumn);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 mx-auto mb-4" />
          <p className="text-indigo-400 text-lg">Loading columns…</p>
        </div>
      </main>
    );
  }

  if (error || columns.length === 0) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-2xl font-bold mb-2">Could not load dataset columns</p>
          <p className="text-gray-400 mb-6">{error ?? "Please upload a dataset first."}</p>
          <Link href="/upload" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
            Go to Upload
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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
          {nSamples && (
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
              Features selected: <span className="font-bold text-indigo-300">{featureCount}</span>
            </span>
            {!isClustering && (
              <span className="text-gray-400">
                Target: <span className="font-bold text-amber-300">{targetColumn ?? "None"}</span>
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

        {/* Column grid */}
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
                transition={{ delay: 0.05 * Math.min(idx, 10) }}
                className={`relative rounded-xl border-2 p-4 transition-all duration-200 ${
                  isTarget
                    ? "border-amber-500 bg-amber-900/15"
                    : isFeature
                    ? "border-indigo-600 bg-indigo-900/15"
                    : "border-gray-700 bg-gray-800/30 opacity-50"
                }`}
              >
                {/* Column name + dtype */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono font-semibold text-white text-sm break-all leading-snug">
                    {col.name}
                  </span>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {/* Feature toggle */}
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

                  {/* Target radio (supervised only) */}
                  {!isClustering && (
                    <button
                      onClick={() => handleSetTarget(col.name)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isTarget
                          ? "bg-amber-500 text-gray-900 hover:bg-amber-400"
                          : "bg-gray-700/50 text-gray-500 hover:bg-amber-900/30 hover:text-amber-400 hover:border-amber-600"
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
          <Link href="/upload" className="flex-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all border border-gray-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </motion.button>
          </Link>
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
