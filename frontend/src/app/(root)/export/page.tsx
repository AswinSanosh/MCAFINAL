// src/app/export/page.tsx
"use client";

import { useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000/api";

export default function ExportPage() {
  const { trainingResult, optimizationResult } = useDataset();
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);

  const jobId = trainingResult?.job_id;

  const downloadModel = (format: "pkl" | "py") => {
    if (!jobId) {
      setDownloadStatus("No trained model found. Please train a model first.");
      return;
    }
    setActiveFormat(format);
    setDownloadStatus(`Preparing ${format} download…`);
    // Trigger browser download via direct link
    const url = `${API_BASE}/export/${jobId}/${format}/`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `model_${jobId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadStatus(`✓ ${format.toUpperCase()} download started!`), 400);
  };

  const formats = [
    {
      id: "pkl" as const,
      name: ".pkl — Python Pickle",
      description: "Serialised scikit-learn/XGBoost model file. Load with joblib.load().",
      icon: "📦",
      gradient: "from-indigo-600 to-purple-600",
      border: "border-indigo-700/40",
      bg: "bg-indigo-900/20",
    },
    {
      id: "py" as const,
      name: ".py — Inference Script",
      description: "Ready-to-run Python inference script with the model embedded.",
      icon: "🐍",
      gradient: "from-emerald-600 to-cyan-600",
      border: "border-emerald-700/40",
      bg: "bg-emerald-900/20",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 mb-4">
            Export Your Model
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Download your trained and optimised model in the format that suits your deployment.
          </p>
        </motion.div>

        {/* Model summary */}
        {trainingResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Job ID</div>
              <div className="text-white font-mono font-bold">#{trainingResult.job_id}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Algorithm</div>
              <div className="text-indigo-300 font-medium text-sm">{trainingResult.algorithm ?? "—"}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Score</div>
              <div className="text-emerald-400 font-bold">
                {optimizationResult?.best_score?.toFixed(4) ?? trainingResult.metrics?.accuracy?.toFixed(4) ?? "—"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Optimised</div>
              <div className={`font-bold ${optimizationResult ? "text-emerald-400" : "text-gray-500"}`}>
                {optimizationResult ? "Yes" : "No"}
              </div>
            </div>
          </motion.div>
        )}

        {!jobId && (
          <div className="text-center py-10 mb-8 text-red-400">
            <p className="text-xl font-bold mb-2">No trained model found</p>
            <p className="text-gray-400 mb-4">Please train a model before exporting.</p>
            <Link href="/train" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 inline-block">
              Go to Train
            </Link>
          </div>
        )}

        {/* Format cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {formats.map(fmt => (
            <motion.div
              key={fmt.id}
              whileHover={{ scale: jobId ? 1.02 : 1, y: jobId ? -4 : 0 }}
              className={`rounded-2xl border p-6 ${fmt.bg} ${fmt.border} ${!jobId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => jobId && downloadModel(fmt.id)}
            >
              <div className="text-4xl mb-4">{fmt.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{fmt.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{fmt.description}</p>
              <motion.button
                whileHover={{ scale: jobId ? 1.02 : 1 }}
                whileTap={{ scale: jobId ? 0.98 : 1 }}
                disabled={!jobId}
                onClick={(e) => { e.stopPropagation(); jobId && downloadModel(fmt.id); }}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all bg-gradient-to-r ${fmt.gradient} ${
                  activeFormat === fmt.id ? "opacity-75" : "hover:opacity-90"
                } ${!jobId ? "cursor-not-allowed" : ""}`}
              >
                {activeFormat === fmt.id && downloadStatus?.startsWith("Preparing")
                  ? "Downloading…"
                  : `Download ${fmt.id.toUpperCase()}`}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Status message */}
        {downloadStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border mb-6 text-center font-medium ${
              downloadStatus.startsWith("✓")
                ? "bg-emerald-900/20 border-emerald-700/40 text-emerald-400"
                : downloadStatus.includes("No trained")
                ? "bg-red-900/20 border-red-700/40 text-red-400"
                : "bg-amber-900/20 border-amber-700/40 text-amber-400"
            }`}
          >
            {downloadStatus}
          </motion.div>
        )}

        {/* Quick usage hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-white font-bold mb-3">Quick Start — Python</h3>
          <pre className="text-sm font-mono text-green-300 whitespace-pre-wrap">{`import joblib, numpy as np

bundle = joblib.load("model_${jobId ?? "<job_id>"}.pkl")
model   = bundle["model"]
scaler  = bundle["scaler"]

X_new = np.array([[...]])          # your features
X_scaled = scaler.transform(X_new)
predictions = model.predict(X_scaled)`}</pre>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/results" className="flex-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all border border-gray-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Results
            </motion.button>
          </Link>
          <Link href="/model-type" className="flex-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center">
              Start New Model →
            </motion.button>
          </Link>
        </div>
      </div>
    </main>
  );
}
