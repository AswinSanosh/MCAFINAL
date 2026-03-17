// src/app/analyze/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = "http://localhost:8000/api";

export default function AnalyzePage() {
  const { datasetId, taskType, setJobStatus, selectedColumns, targetColumn } = useDataset();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) {
      setLoading(false);
      return;
    }
    setJobStatus("analyzing");
    fetch(`${API_BASE}/analyze/${datasetId}/`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setAnalysis(data);
        setJobStatus("ready");
      })
      .catch(err => {
        setError(err.message ?? "Analysis failed");
        setJobStatus("error");
      })
      .finally(() => setLoading(false));
  }, [datasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-indigo-500 mx-auto mb-6" />
          <p className="text-2xl text-indigo-400 font-medium">Analysing your dataset…</p>
          <p className="text-gray-400 mt-2">This takes a few moments</p>
        </motion.div>
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-2xl font-bold mb-2">Analysis failed</p>
          <p className="text-gray-400">{error ?? "No dataset found. Please upload a dataset first."}</p>
          <Link href="/upload" className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
            Go to Upload
          </Link>
        </div>
      </main>
    );
  }

  const allDtypes = analysis.dtypes ?? {};
  const effectiveTarget = targetColumn ?? analysis.target_column ?? null;
  const shownColumns = new Set([...selectedColumns, ...(effectiveTarget ? [effectiveTarget] : [])]);
  const dtypeEntries = (Object.entries(allDtypes) as [string, string][]).filter(
    ([col]) => shownColumns.size === 0 || shownColumns.has(col)
  );
  const allFeatureStats = analysis.feature_stats ?? {};
  const featureStats = Object.fromEntries(
    Object.entries(allFeatureStats).filter(([col]) => shownColumns.size === 0 || shownColumns.has(col))
  );
  const classBalance = analysis.class_balance ?? null;
  const shownCount = dtypeEntries.length;
  const completeness = analysis.n_samples && analysis.missing_values !== undefined
    ? Math.round(((analysis.n_samples * shownCount - analysis.missing_values) /
        (analysis.n_samples * shownCount)) * 100)
    : 100;

  return (
    <main className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Dataset Analysis
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Key characteristics of your uploaded dataset.
          </p>
        </motion.div>

        {/* Summary tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Samples", value: analysis.n_samples?.toLocaleString() ?? "—", color: "indigo" },
            { label: "Features", value: selectedColumns.length > 0 ? selectedColumns.length : (analysis.n_features ?? "—"), color: "purple" },
            { label: "Missing Values", value: analysis.missing_values ?? 0, color: "amber" },
            { label: "Completeness", value: `${completeness}%`, color: "emerald" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-900/20 border border-${color}-800/30 p-5 rounded-xl text-center`}>
              <div className={`text-3xl font-bold text-${color}-400 mb-1`}>{value}</div>
              <div className="text-gray-400 text-sm">{label}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Columns / dtypes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Columns &amp; Data Types
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {dtypeEntries.map(([col, dtype]) => (
                <div key={col} className={`flex justify-between items-center px-3 py-2 rounded-lg ${col === effectiveTarget ? "bg-indigo-900/30 border border-indigo-700/40" : "bg-gray-800/50"}`}>
                  <span className="text-gray-200 text-sm font-mono truncate mr-2">{col}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {col === effectiveTarget && <span className="text-xs text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded-full">target</span>}
                    <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded-full">{dtype}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Class balance / feature stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
          >
            {classBalance && Object.keys(classBalance).length > 0 ? (
              <>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Class Distribution
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {Object.entries(classBalance).map(([cls, ratio]: [string, any]) => (
                    <div key={cls}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 truncate">{cls}</span>
                        <span className="text-amber-400 ml-2">{Math.round(Number(ratio) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full" style={{ width: `${Math.round(Number(ratio) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Feature Statistics
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(featureStats).slice(0, 8).map(([col, stats]: [string, any]) => (
                    <div key={col} className="bg-gray-800/50 rounded-lg px-3 py-2">
                      <div className="text-sm font-mono text-gray-200 mb-1">{col}</div>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>μ {stats.mean}</span>
                        <span>σ {stats.std}</span>
                        <span>[{stats.min}, {stats.max}]</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(featureStats).length === 0 && (
                    <p className="text-gray-400 text-sm">No numeric features found.</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Data Quality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4">Data Quality</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-800/30 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{completeness}%</div>
              <div className="text-gray-400 text-sm">Completeness</div>
            </div>
            <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-800/30 text-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{analysis.task_type ?? taskType ?? "—"}</div>
              <div className="text-gray-400 text-sm">Task Type</div>
            </div>
            <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-800/30 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{analysis.target_column ?? "None"}</div>
              <div className="text-gray-400 text-sm">Target Column</div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/describe" className="flex-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all border border-gray-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </motion.button>
          </Link>
          <Link href="/select-pipeline" className="flex-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center">
              Select Pipeline
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </Link>
        </div>
      </div>
    </main>
  );
}
