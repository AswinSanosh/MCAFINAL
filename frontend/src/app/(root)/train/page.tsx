// src/app/train/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = "http://localhost:8000/api";

const PHASES = [
  { name: "Initializing...", target: 10 },
  { name: "Loading dataset...", target: 25 },
  { name: "Preprocessing features...", target: 45 },
  { name: "Training model...", target: 80 },
  { name: "Validating results...", target: 90 },
];

export default function TrainPage() {
  const { datasetId, taskType, pipelineConfig, setJobStatus, setTrainingResult, trainingResult, selectedColumns } = useDataset();
  const [progress, setProgress] = useState(() => (trainingResult ? 100 : 0));
  const [metrics, setMetrics] = useState<Record<string, any>>(() => trainingResult?.metrics ?? {});
  const [currentPhase, setCurrentPhase] = useState(() => (trainingResult ? "Training Complete!" : "Initializing..."));
  const [trainError, setTrainError] = useState<string | null>(null);
  const [pipelineLabel, setPipelineLabel] = useState<string>("AI-Recommended Pipeline");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (pipelineConfig) {
      setPipelineLabel(
        pipelineConfig.type === 'ai'
          ? `AI Pipeline #${pipelineConfig.ai_pipeline_id ?? 1}`
          : `Custom â€” ${pipelineConfig.algorithm ?? 'Unknown'}`
      );
    }

    // If we already have a training result (user navigated back), show it — don't retrain.
    if (trainingResult) {
      setJobStatus('ready');
      return;
    }

    setJobStatus('training');
    startTraining();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startTraining = async () => {
    // Drive phases forward while the API call runs
    let phaseIdx = 0;
    const phaseTimer = setInterval(() => {
      if (phaseIdx < PHASES.length) {
        setCurrentPhase(PHASES[phaseIdx].name);
        setProgress(PHASES[phaseIdx].target);
        phaseIdx++;
      }
    }, 800);

    // No dataset uploaded â€” run a mock demo
    if (!datasetId || !pipelineConfig) {
      setTimeout(() => {
        clearInterval(phaseTimer);
        const mockMetrics = getMockMetrics(taskType ?? 'classification', pipelineConfig?.algorithm ?? 'RandomForestClassifier');
        setProgress(100);
        setCurrentPhase("Training Complete!");
        setMetrics(mockMetrics);
        setTrainingResult({ job_id: 0, task_type: taskType ?? 'classification', algorithm: pipelineConfig?.algorithm ?? 'RandomForestClassifier', pipeline_type: pipelineConfig?.type ?? 'ai', metrics: mockMetrics });
        setJobStatus('ready');
      }, PHASES.length * 800 + 500);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/train/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: parseInt(datasetId),
          pipeline: pipelineConfig,
          ...(selectedColumns.length > 0 ? { feature_columns: selectedColumns } : {}),
        }),
      });

      clearInterval(phaseTimer);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Training failed");
      }

      const data = await res.json();
      setProgress(100);
      setCurrentPhase("Training Complete!");
      setMetrics(data.metrics ?? {});
      setTrainingResult(data);
      setJobStatus('ready');
    } catch (err: any) {
      clearInterval(phaseTimer);
      setProgress(100);
      setCurrentPhase("Training failed.");
      setTrainError(err.message ?? "Unexpected error");
      setJobStatus('error');
    }
  };

  // Fallback mock metrics used when no real dataset is uploaded
  function getMockMetrics(task: string, algo: string): Record<string, any> {
    if (task === 'classification') {
      return { accuracy: 0.88, precision: 0.87, recall: 0.89, f1: 0.88, algorithm: algo,
        confusion_matrix: [[42, 3], [5, 50]], feature_importance: [] };
    }
    if (task === 'regression') {
      return { mse: 0.023, rmse: 0.152, mae: 0.118, r2: 0.91, algorithm: algo, feature_importance: [] };
    }
    return { n_clusters: 3, silhouette_score: 0.62, algorithm: algo, n_samples: 0, n_features: 0, cluster_distribution: {} };
  }

  const isClassification = (taskType ?? '') === 'classification' || !!metrics.accuracy;
  const isRegression = (taskType ?? '') === 'regression' || (!!metrics.r2 && !metrics.accuracy);
  const isClustering = (taskType ?? '') === 'clustering' || !!metrics.n_clusters;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Training Your Model
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {datasetId
              ? "Running your pipeline on the uploaded dataset."
              : "No dataset uploaded â€” running a demo training session."}
          </p>
        </motion.div>

        {/* Pipeline badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className={`px-6 py-3 rounded-full text-sm font-bold ${
            pipelineConfig?.type === 'ai'
              ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {pipelineConfig?.type === 'ai' ? 'ðŸ¤–' : 'âš™ï¸'} {pipelineLabel}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          {/* Progress bar */}
          <div className="mb-10">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-indigo-400">Training Progress</span>
              <span className="text-sm font-medium text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden mb-6">
              <motion.div
                className={`absolute top-0 left-0 h-full ${trainError ? 'bg-red-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="text-center text-lg font-medium text-gray-300 mb-8">{currentPhase}</div>
          </div>

          {/* Spinning visualization */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-48 h-48 rounded-full border-4 border-indigo-900/30 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-4 border-purple-900/30 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-indigo-700/30 flex items-center justify-center">
                    <motion.div
                      className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"
                      animate={{ rotate: progress < 100 ? 360 : 0 }}
                      transition={{ duration: 5, repeat: progress < 100 ? Infinity : 0, ease: "linear" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full bg-indigo-500"
                  style={{ top: '50%', left: '50%', marginTop: -8, marginLeft: -8 }}
                  animate={{
                    x: Math.sin(i * 72 * Math.PI / 180) * 80,
                    y: Math.cos(i * 72 * Math.PI / 180) * 80,
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>

          {/* Error banner */}
          {trainError && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 mb-6 text-red-300 text-sm"
            >
              <strong>Training Error:</strong> {trainError}
            </motion.div>
          )}

          {/* Metrics â€” shown when training complete */}
          {progress === 100 && !trainError && Object.keys(metrics).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 p-6 rounded-2xl border border-emerald-800/30 mb-8"
            >
              <div className="flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-emerald-400">Training Complete!</h3>
              </div>

              {/* Classification metrics */}
              {isClassification && metrics.accuracy !== undefined && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Accuracy',  value: metrics.accuracy,  color: 'text-indigo-400' },
                    { label: 'Precision', value: metrics.precision, color: 'text-purple-400' },
                    { label: 'Recall',    value: metrics.recall,    color: 'text-amber-400' },
                    { label: 'F1-Score',  value: metrics.f1,        color: 'text-emerald-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-800/50 p-4 rounded-lg text-center">
                      <div className={`text-3xl font-bold ${color}`}>{value?.toFixed(2) ?? 'â€”'}</div>
                      <div className="text-sm text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Regression metrics */}
              {isRegression && metrics.r2 !== undefined && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'RÂ² Score', value: metrics.r2,   color: 'text-emerald-400' },
                    { label: 'RMSE',     value: metrics.rmse, color: 'text-indigo-400' },
                    { label: 'MAE',      value: metrics.mae,  color: 'text-amber-400' },
                    { label: 'MSE',      value: metrics.mse,  color: 'text-purple-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-800/50 p-4 rounded-lg text-center">
                      <div className={`text-3xl font-bold ${color}`}>{value?.toFixed(4) ?? 'â€”'}</div>
                      <div className="text-sm text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Clustering metrics */}
              {isClustering && metrics.n_clusters !== undefined && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Clusters Found',    value: metrics.n_clusters,     fmt: (v: number) => String(v), color: 'text-indigo-400' },
                    { label: 'Silhouette Score',  value: metrics.silhouette_score, fmt: (v: number) => v?.toFixed(4) ?? 'N/A', color: 'text-emerald-400' },
                    { label: metrics.inertia !== undefined ? 'Inertia' : (metrics.bic !== undefined ? 'BIC' : 'Samples'),
                      value: metrics.inertia ?? metrics.bic ?? metrics.n_samples,
                      fmt: (v: number) => v?.toFixed(2) ?? 'â€”', color: 'text-amber-400' },
                  ].map(({ label, value, fmt, color }) => (
                    <div key={label} className="bg-gray-800/50 p-4 rounded-lg text-center">
                      <div className={`text-3xl font-bold ${color}`}>{value !== undefined ? fmt(value as number) : 'â€”'}</div>
                      <div className="text-sm text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/select-pipeline" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Pipelines
              </motion.button>
            </Link>
            <Link href="/optimize">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={progress < 100 || !!trainError}
                className={`w-full flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                  progress === 100 && !trainError
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 cursor-pointer'
                    : 'bg-gray-700 cursor-not-allowed'
                } flex items-center justify-center`}
              >
                Optimize Hyperparameters
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.button>
            </Link>
            <Link href="/results">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={progress < 100 || !!trainError}
                className={`w-full flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                  progress === 100 && !trainError
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer'
                    : 'bg-gray-700 cursor-not-allowed'
                } flex items-center justify-center`}
              >
                View Results
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Insight cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { title: pipelineConfig?.type === 'ai' ? 'AI-Powered Training' : 'Custom Pipeline Training',
              body: pipelineConfig?.type === 'ai'
                ? 'Using an AI-recommended pipeline optimised for your dataset and task type.'
                : `Custom pipeline with ${pipelineConfig?.algorithm ?? 'selected algorithm'} and ${pipelineConfig?.preprocessing ?? 'default'} preprocessing.`,
              icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            { title: 'Real-Time Metrics',
              body: 'Accuracy, precision, recall, F1, RÂ², silhouette scores â€” computed on a held-out test set.',
              icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { title: 'Secure Processing',
              body: 'Your data is processed locally on the Django backend and never sent to a third party.',
              icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
          ].map(({ title, body, icon }) => (
            <div key={title} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{body}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
