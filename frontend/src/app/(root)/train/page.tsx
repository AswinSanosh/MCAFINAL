// src/app/(root)/train/page.tsx
"use client";

import { useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = "http://localhost:8000/api";

// ─── Hyperparameter type definitions ─────────────────────────────────────────
type SliderDef = { type: "slider"; label: string; min: number; max: number; step: number; default: number; description?: string };
type SelectDef = { type: "select"; label: string; options: string[]; default: string; description?: string };
type ToggleDef = { type: "toggle"; label: string; default: boolean; description?: string };
type ParamDef = SliderDef | SelectDef | ToggleDef;

const ALGO_PARAMS: Record<string, Record<string, ParamDef>> = {
  /* ── Classification ──────────────────────────────────────────────── */
  RandomForestClassifier: {
    n_estimators: { type: "slider", label: "Number of Trees", min: 10, max: 500, step: 10, default: 100, description: "More trees = higher accuracy but slower training" },
    max_depth: { type: "slider", label: "Max Tree Depth", min: 2, max: 30, step: 1, default: 10, description: "Lower = simpler model, less overfitting" },
    min_samples_split: { type: "slider", label: "Min Samples to Split", min: 2, max: 20, step: 1, default: 2 },
    min_samples_leaf: { type: "slider", label: "Min Samples per Leaf", min: 1, max: 10, step: 1, default: 1 },
  },
  ExtraTreesClassifier: {
    n_estimators: { type: "slider", label: "Number of Trees", min: 10, max: 500, step: 10, default: 100 },
    max_depth: { type: "slider", label: "Max Tree Depth", min: 2, max: 30, step: 1, default: 10 },
    min_samples_split: { type: "slider", label: "Min Samples to Split", min: 2, max: 20, step: 1, default: 2 },
  },
  LogisticRegression: {
    C: { type: "slider", label: "Regularization (C)", min: 0.01, max: 10, step: 0.01, default: 1.0, description: "Smaller = stronger regularization" },
    max_iter: { type: "slider", label: "Max Iterations", min: 100, max: 2000, step: 100, default: 1000 },
    solver: { type: "select", label: "Solver", options: ["lbfgs", "liblinear", "saga", "sag"], default: "lbfgs" },
  },
  SVC: {
    C: { type: "slider", label: "Regularization (C)", min: 0.01, max: 20, step: 0.01, default: 1.0 },
    kernel: { type: "select", label: "Kernel", options: ["rbf", "linear", "poly", "sigmoid"], default: "rbf" },
    gamma: { type: "select", label: "Gamma", options: ["scale", "auto"], default: "scale" },
  },
  KNeighborsClassifier: {
    n_neighbors: { type: "slider", label: "Neighbors (K)", min: 1, max: 30, step: 1, default: 5, description: "Number of nearest neighbors" },
    weights: { type: "select", label: "Weight Function", options: ["uniform", "distance"], default: "uniform" },
    metric: { type: "select", label: "Distance Metric", options: ["euclidean", "manhattan", "minkowski"], default: "euclidean" },
  },
  DecisionTreeClassifier: {
    max_depth: { type: "slider", label: "Max Depth", min: 1, max: 30, step: 1, default: 10 },
    min_samples_split: { type: "slider", label: "Min Samples to Split", min: 2, max: 20, step: 1, default: 2 },
    criterion: { type: "select", label: "Split Criterion", options: ["gini", "entropy"], default: "gini" },
  },
  GradientBoostingClassifier: {
    n_estimators: { type: "slider", label: "Boosting Stages", min: 50, max: 500, step: 10, default: 100 },
    learning_rate: { type: "slider", label: "Learning Rate", min: 0.01, max: 1.0, step: 0.01, default: 0.1, description: "Shrinks each tree's contribution" },
    max_depth: { type: "slider", label: "Max Tree Depth", min: 1, max: 10, step: 1, default: 3 },
    subsample: { type: "slider", label: "Subsample Ratio", min: 0.5, max: 1.0, step: 0.05, default: 1.0 },
  },
  AdaBoostClassifier: {
    n_estimators: { type: "slider", label: "Number of Estimators", min: 10, max: 500, step: 10, default: 100 },
    learning_rate: { type: "slider", label: "Learning Rate", min: 0.01, max: 2.0, step: 0.01, default: 1.0 },
  },
  XGBClassifier: {
    n_estimators: { type: "slider", label: "Number of Trees", min: 50, max: 500, step: 10, default: 100 },
    learning_rate: { type: "slider", label: "Learning Rate", min: 0.01, max: 0.5, step: 0.01, default: 0.1 },
    max_depth: { type: "slider", label: "Max Depth", min: 2, max: 12, step: 1, default: 6 },
    subsample: { type: "slider", label: "Row Subsample", min: 0.5, max: 1.0, step: 0.05, default: 1.0 },
    colsample_bytree: { type: "slider", label: "Column Subsample", min: 0.3, max: 1.0, step: 0.05, default: 1.0 },
    gamma: { type: "slider", label: "Min Split Loss (gamma)", min: 0, max: 5, step: 0.1, default: 0 },
  },
  MLPClassifier: {
    hidden_layer_sizes: { type: "select", label: "Hidden Layers", options: ["(64,)", "(128,)", "(64, 32)", "(128, 64)", "(256, 128)", "(128, 64, 32)"], default: "(128, 64)" },
    max_iter: { type: "slider", label: "Max Epochs", min: 100, max: 1000, step: 50, default: 300 },
    learning_rate_init: { type: "slider", label: "Learning Rate", min: 0.0001, max: 0.01, step: 0.0001, default: 0.001 },
    alpha: { type: "slider", label: "L2 Penalty (alpha)", min: 0.0001, max: 0.1, step: 0.0001, default: 0.0001 },
  },
  GaussianNB: {
    var_smoothing: { type: "slider", label: "Variance Smoothing (x10^-9)", min: 1, max: 1000, step: 1, default: 1, description: "Prevents division by zero" },
  },
  /* ── Regression ──────────────────────────────────────────────────── */
  RandomForestRegressor: {
    n_estimators: { type: "slider", label: "Number of Trees", min: 10, max: 500, step: 10, default: 100 },
    max_depth: { type: "slider", label: "Max Tree Depth", min: 2, max: 30, step: 1, default: 10 },
    min_samples_split: { type: "slider", label: "Min Samples to Split", min: 2, max: 20, step: 1, default: 2 },
  },
  ExtraTreesRegressor: {
    n_estimators: { type: "slider", label: "Number of Trees", min: 10, max: 500, step: 10, default: 100 },
    max_depth: { type: "slider", label: "Max Tree Depth", min: 2, max: 30, step: 1, default: 10 },
    min_samples_split: { type: "slider", label: "Min Samples to Split", min: 2, max: 20, step: 1, default: 2 },
  },
  LinearRegression: {
    fit_intercept: { type: "toggle", label: "Fit Intercept", default: true, description: "Whether to calculate the intercept term" },
  },
  Ridge: {
    alpha: { type: "slider", label: "Regularization (alpha)", min: 0.001, max: 100, step: 0.001, default: 1.0, description: "Higher = stronger regularization" },
    solver: { type: "select", label: "Solver", options: ["auto", "svd", "cholesky", "lsqr", "saga"], default: "auto" },
  },
  Lasso: {
    alpha: { type: "slider", label: "Regularization (alpha)", min: 0.001, max: 10, step: 0.001, default: 1.0 },
    max_iter: { type: "slider", label: "Max Iterations", min: 100, max: 5000, step: 100, default: 1000 },
  },
  ElasticNet: {
    alpha: { type: "slider", label: "Regularization (alpha)", min: 0.001, max: 10, step: 0.001, default: 1.0 },
    l1_ratio: { type: "slider", label: "L1/L2 Mix Ratio", min: 0.0, max: 1.0, step: 0.05, default: 0.5, description: "0 = Ridge, 1 = Lasso" },
    max_iter: { type: "slider", label: "Max Iterations", min: 100, max: 5000, step: 100, default: 1000 },
  },
  SVR: {
    C: { type: "slider", label: "Regularization (C)", min: 0.01, max: 20, step: 0.01, default: 1.0 },
    kernel: { type: "select", label: "Kernel", options: ["rbf", "linear", "poly"], default: "rbf" },
    epsilon: { type: "slider", label: "Epsilon", min: 0.01, max: 1.0, step: 0.01, default: 0.1, description: "Width of the insensitive tube" },
  },
  KNeighborsRegressor: {
    n_neighbors: { type: "slider", label: "Neighbors (K)", min: 1, max: 30, step: 1, default: 5 },
    weights: { type: "select", label: "Weight Function", options: ["uniform", "distance"], default: "uniform" },
    metric: { type: "select", label: "Distance Metric", options: ["euclidean", "manhattan", "minkowski"], default: "euclidean" },
  },
  GradientBoostingRegressor: {
    n_estimators: { type: "slider", label: "Boosting Stages", min: 50, max: 500, step: 10, default: 100 },
    learning_rate: { type: "slider", label: "Learning Rate", min: 0.01, max: 1.0, step: 0.01, default: 0.1 },
    max_depth: { type: "slider", label: "Max Tree Depth", min: 1, max: 10, step: 1, default: 3 },
    subsample: { type: "slider", label: "Subsample Ratio", min: 0.5, max: 1.0, step: 0.05, default: 1.0 },
  },
  XGBRegressor: {
    n_estimators: { type: "slider", label: "Number of Trees", min: 50, max: 500, step: 10, default: 100 },
    learning_rate: { type: "slider", label: "Learning Rate", min: 0.01, max: 0.5, step: 0.01, default: 0.1 },
    max_depth: { type: "slider", label: "Max Depth", min: 2, max: 12, step: 1, default: 6 },
    subsample: { type: "slider", label: "Row Subsample", min: 0.5, max: 1.0, step: 0.05, default: 1.0 },
    colsample_bytree: { type: "slider", label: "Column Subsample", min: 0.3, max: 1.0, step: 0.05, default: 1.0 },
  },
  MLPRegressor: {
    hidden_layer_sizes: { type: "select", label: "Hidden Layers", options: ["(64,)", "(128,)", "(64, 32)", "(128, 64)", "(256, 128)", "(128, 64, 32)"], default: "(128, 64)" },
    max_iter: { type: "slider", label: "Max Epochs", min: 100, max: 1000, step: 50, default: 300 },
    learning_rate_init: { type: "slider", label: "Learning Rate", min: 0.0001, max: 0.01, step: 0.0001, default: 0.001 },
    alpha: { type: "slider", label: "L2 Penalty (alpha)", min: 0.0001, max: 0.1, step: 0.0001, default: 0.0001 },
  },
  /* ── Clustering ──────────────────────────────────────────────────── */
  KMeans: {
    n_clusters: { type: "slider", label: "Number of Clusters (K)", min: 2, max: 20, step: 1, default: 3 },
    n_init: { type: "slider", label: "Initializations", min: 5, max: 50, step: 5, default: 10, description: "Runs with different random seeds, picks the best" },
    max_iter: { type: "slider", label: "Max Iterations", min: 100, max: 1000, step: 50, default: 300 },
  },
  DBSCAN: {
    eps: { type: "slider", label: "Epsilon (neighborhood radius)", min: 0.05, max: 5.0, step: 0.05, default: 0.5, description: "Max distance between two samples to be considered neighbors" },
    min_samples: { type: "slider", label: "Min Samples per Core", min: 2, max: 30, step: 1, default: 5 },
  },
  AgglomerativeClustering: {
    n_clusters: { type: "slider", label: "Number of Clusters", min: 2, max: 20, step: 1, default: 3 },
    linkage: { type: "select", label: "Linkage Criterion", options: ["ward", "complete", "average", "single"], default: "ward" },
  },
  GaussianMixture: {
    n_components: { type: "slider", label: "Number of Components", min: 2, max: 20, step: 1, default: 3 },
    covariance_type: { type: "select", label: "Covariance Type", options: ["full", "tied", "diag", "spherical"], default: "full" },
    max_iter: { type: "slider", label: "Max EM Iterations", min: 50, max: 500, step: 10, default: 100 },
  },
  OPTICS: {
    min_samples: { type: "slider", label: "Min Samples", min: 2, max: 50, step: 1, default: 5 },
    xi: { type: "slider", label: "Steepness Threshold (xi)", min: 0.01, max: 0.5, step: 0.01, default: 0.05 },
  },
  MeanShift: {
    bandwidth: { type: "slider", label: "Bandwidth", min: 0.1, max: 5.0, step: 0.1, default: 1.0, description: "Search radius — higher = fewer, larger clusters" },
  },
  SpectralClustering: {
    n_clusters: { type: "slider", label: "Number of Clusters", min: 2, max: 20, step: 1, default: 3 },
    n_neighbors: { type: "slider", label: "Affinity Neighbors", min: 3, max: 30, step: 1, default: 10 },
  },
  Birch: {
    n_clusters: { type: "slider", label: "Number of Clusters", min: 2, max: 20, step: 1, default: 3 },
    threshold: { type: "slider", label: "Merge Threshold", min: 0.1, max: 2.0, step: 0.05, default: 0.5, description: "Smaller = more fine-grained subclusters" },
  },
};

const PHASES = [
  { name: "Initializing...", target: 10 },
  { name: "Loading dataset...", target: 25 },
  { name: "Preprocessing features...", target: 45 },
  { name: "Training model...", target: 80 },
  { name: "Validating results...", target: 90 },
];

function initHyperparams(algo: string): Record<string, any> {
  return Object.fromEntries(
    Object.entries(ALGO_PARAMS[algo] ?? {}).map(([k, d]) => [k, d.default])
  );
}

function fmtValue(value: number, step: number): string {
  if (step < 0.001) return value.toFixed(4);
  if (step < 0.1) return value.toFixed(2);
  return String(value);
}

export default function TrainPage() {
  const {
    datasetId, taskType, pipelineConfig,
    setJobStatus, setTrainingResult, trainingResult,
    selectedColumns, targetColumn, datasetFilename,
  } = useDataset();

  const algorithm = pipelineConfig?.algorithm ?? "RandomForestClassifier";
  const paramDefs = ALGO_PARAMS[algorithm] ?? {};
  const isClustering = taskType === "clustering";

  const [phase, setPhase] = useState<"config" | "training" | "done">(
    () => (trainingResult ? "done" : "config")
  );
  const [hyperparams, setHyperparams] = useState<Record<string, any>>(
    () => initHyperparams(algorithm)
  );
  const [testSize, setTestSize] = useState(0.2);
  const [progress, setProgress] = useState(() => (trainingResult ? 100 : 0));
  const [metrics, setMetrics] = useState<Record<string, any>>(
    () => trainingResult?.metrics ?? {}
  );
  const [currentPhase, setCurrentPhase] = useState(() =>
    trainingResult ? "Training Complete!" : ""
  );
  const [trainError, setTrainError] = useState<string | null>(null);

  const setParam = (key: string, value: any) =>
    setHyperparams((prev) => ({ ...prev, [key]: value }));

  const handleStartTraining = async () => {
    setPhase("training");
    setTrainError(null);
    setProgress(0);

    let phaseIdx = 0;
    const phaseTimer = setInterval(() => {
      if (phaseIdx < PHASES.length) {
        setCurrentPhase(PHASES[phaseIdx].name);
        setProgress(PHASES[phaseIdx].target);
        phaseIdx++;
      }
    }, 800);

    if (!datasetId || !pipelineConfig) {
      setTimeout(() => {
        clearInterval(phaseTimer);
        const mockMetrics = getMockMetrics(taskType ?? "classification", algorithm);
        setProgress(100);
        setCurrentPhase("Training Complete!");
        setMetrics(mockMetrics);
        setTrainingResult({
          job_id: 0,
          task_type: taskType ?? "classification",
          algorithm,
          pipeline_type: pipelineConfig?.type ?? "ai",
          metrics: mockMetrics,
        });
        setJobStatus("ready");
        setPhase("done");
      }, PHASES.length * 800 + 500);
      return;
    }

    setJobStatus("training");
    try {
      const res = await fetch(`${API_BASE}/train/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: parseInt(datasetId),
          pipeline: pipelineConfig,
          feature_columns: selectedColumns.length > 0 ? selectedColumns : undefined,
          hyperparams,
          test_size: testSize,
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
      setJobStatus("ready");
      setPhase("done");
    } catch (err: any) {
      clearInterval(phaseTimer);
      setProgress(100);
      setCurrentPhase("Training failed.");
      setTrainError(err.message ?? "Unexpected error");
      setJobStatus("error");
    }
  };

  const handleRetrain = () => {
    setTrainingResult(null);
    setMetrics({});
    setTrainError(null);
    setProgress(0);
    setHyperparams(initHyperparams(algorithm));
    setPhase("config");
  };

  function getMockMetrics(task: string, algo: string): Record<string, any> {
    if (task === "classification")
      return { accuracy: 0.88, precision: 0.87, recall: 0.89, f1: 0.88, confusion_matrix: [[42, 3], [5, 50]], feature_importance: [] };
    if (task === "regression")
      return { mse: 0.023, rmse: 0.152, mae: 0.118, r2: 0.91, feature_importance: [] };
    return { n_clusters: 3, silhouette_score: 0.62, n_samples: 0, n_features: 0, cluster_distribution: {} };
  }

  const isClassification = taskType === "classification" || !!metrics.accuracy;
  const isRegression = taskType === "regression" || (!!metrics.r2 && !metrics.accuracy);

  const pipelineLabel =
    pipelineConfig?.type === "ai"
      ? `AI Pipeline #${pipelineConfig.ai_pipeline_id ?? 1}`
      : `Custom — ${pipelineConfig?.algorithm ?? "Unknown"}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-3">
            {phase === "config"
              ? "Configure Training"
              : phase === "training"
              ? "Training Your Model"
              : "Training Complete"}
          </h1>
          <p className="text-gray-400">
            {phase === "config"
              ? "Tune hyperparameters and data split, then start training."
              : phase === "training"
              ? datasetId
                ? "Running your pipeline on the uploaded dataset."
                : "No dataset uploaded — running a demo session."
              : "Your model has been trained. Review the results below."}
          </p>
        </motion.div>

        {/* Pipeline badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div
            className={`px-5 py-2 rounded-full text-sm font-semibold ${
              pipelineConfig?.type === "ai"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {pipelineConfig?.type === "ai" ? "AI" : "Custom"} — {algorithm}
            {pipelineConfig?.preprocessing && ` • ${pipelineConfig.preprocessing}`}
            {pipelineConfig?.feature_engineering &&
              pipelineConfig.feature_engineering !== "None" &&
              ` • ${pipelineConfig.feature_engineering}`}
          </div>
        </motion.div>

        {/* ══════════════════ CONFIG PHASE ══════════════════ */}
        {phase === "config" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* No dataset warning */}
            {!datasetId && (
              <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl text-amber-300 text-sm">
                No real dataset detected — training will use demo data. Upload a CSV on the Upload page for real results.
              </div>
            )}

            {/* Row 1: Dataset Overview + Train/Test Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Dataset Overview */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-indigo-600/30 flex items-center justify-center text-indigo-400 text-xs font-bold">D</span>
                  Dataset Overview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-400 shrink-0">File</span>
                    <span className="text-gray-200 font-mono truncate">{datasetFilename || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Task</span>
                    <span className="text-purple-300 capitalize">{taskType ?? "classification"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Feature columns</span>
                    <span className="text-indigo-300 font-mono">{selectedColumns.length > 0 ? selectedColumns.length : "all"}</span>
                  </div>
                  {!isClustering && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">Target column</span>
                      <span className="text-emerald-300 font-mono truncate">
                        {targetColumn ?? pipelineConfig?.target_column ?? "auto"}
                      </span>
                    </div>
                  )}
                </div>
                {selectedColumns.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500 mb-2">Using features:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedColumns.slice(0, 8).map((col) => (
                        <span
                          key={col}
                          className="px-2 py-0.5 bg-indigo-900/30 border border-indigo-700/30 rounded text-indigo-300 text-xs font-mono"
                        >
                          {col}
                        </span>
                      ))}
                      {selectedColumns.length > 8 && (
                        <span className="px-2 py-0.5 bg-gray-700/50 rounded text-gray-400 text-xs">
                          +{selectedColumns.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Train/Test Split (supervised) or Clustering note */}
              {!isClustering ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-600/30 flex items-center justify-center text-purple-400 text-xs font-bold">S</span>
                    Train / Test Split
                  </h3>
                  {/* Visual split bar */}
                  <div className="flex rounded-lg overflow-hidden h-9 mb-4 text-xs font-bold select-none">
                    <div
                      className="flex items-center justify-center bg-indigo-600/40 border border-indigo-500/30 text-indigo-200 transition-all duration-200"
                      style={{ width: `${(1 - testSize) * 100}%` }}
                    >
                      Train {Math.round((1 - testSize) * 100)}%
                    </div>
                    <div
                      className="flex items-center justify-center bg-purple-600/30 border border-purple-500/30 text-purple-200 transition-all duration-200"
                      style={{ width: `${testSize * 100}%` }}
                    >
                      Test {Math.round(testSize * 100)}%
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.4}
                    step={0.05}
                    value={testSize}
                    onChange={(e) => setTestSize(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 mb-3"
                  />
                  <p className="text-xs text-gray-500">
                    Drag to adjust: <strong className="text-gray-400">{Math.round(testSize * 100)}%</strong> held out for evaluation. More test data gives a more reliable estimate.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex flex-col justify-center">
                  <h3 className="text-base font-semibold text-white mb-2">Clustering Mode</h3>
                  <p className="text-sm text-gray-400">
                    Clustering is unsupervised — the entire dataset is used for fitting. There is no separate train/test split. Adjust the cluster count and algorithm parameters below.
                  </p>
                </div>
              )}
            </div>

            {/* Algorithm Hyperparameters */}
            {Object.keys(paramDefs).length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-white">
                    {algorithm} — Hyperparameters
                  </h3>
                  <button
                    onClick={() => setHyperparams(initHyperparams(algorithm))}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Reset to defaults
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-6">
                  Hover the <span className="text-gray-400">ⓘ</span> icon on each parameter for guidance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
                  {Object.entries(paramDefs).map(([key, def]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                          {def.label}
                          {def.description && (
                            <span title={def.description} className="text-gray-500 cursor-help text-xs leading-none">
                              ⓘ
                            </span>
                          )}
                        </label>
                        {def.type === "slider" && (
                          <span className="text-sm font-mono font-semibold text-indigo-300 min-w-[48px] text-right">
                            {fmtValue(hyperparams[key] ?? def.default, def.step)}
                          </span>
                        )}
                      </div>

                      {def.type === "slider" && (
                        <input
                          type="range"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={hyperparams[key] ?? def.default}
                          onChange={(e) =>
                            setParam(key, def.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))
                          }
                          className="w-full accent-indigo-500"
                        />
                      )}

                      {def.type === "select" && (
                        <select
                          value={hyperparams[key] ?? def.default}
                          onChange={(e) => setParam(key, e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none"
                        >
                          {def.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {def.type === "toggle" && (
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            onClick={() => setParam(key, !hyperparams[key])}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                              hyperparams[key] ? "bg-indigo-600" : "bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                hyperparams[key] ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span className="text-sm text-gray-400">
                            {hyperparams[key] ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      )}

                      {/* Slider min/max labels */}
                      {def.type === "slider" && (
                        <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                          <span>{fmtValue(def.min, def.step)}</span>
                          <span>{fmtValue(def.max, def.step)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Training */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartTraining}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 transition-all mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Training
            </motion.button>

            <Link href="/select-pipeline">
              <button className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Pipeline Selection
              </button>
            </Link>
          </motion.div>
        )}

        {/* ══════════════════ TRAINING PHASE ══════════════════ */}
        {phase === "training" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8"
          >
            <div className="mb-10">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-indigo-400">Training Progress</span>
                <span className="text-sm font-medium text-gray-400">{Math.round(progress)}%</span>
              </div>
              <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                </div>
              </div>
              <div className="text-center text-lg font-medium text-gray-300">{currentPhase}</div>
            </div>

            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-4 border-indigo-900/30 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-purple-900/30 flex items-center justify-center">
                    <motion.div
                      className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-indigo-500"
                    style={{ top: "50%", left: "50%", marginTop: -6, marginLeft: -6 }}
                    animate={{
                      x: Math.sin((i * 72 * Math.PI) / 180) * 70,
                      y: Math.cos((i * 72 * Math.PI) / 180) * 70,
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm">
              Training in progress — this may take a moment depending on dataset size and algorithm complexity.
            </p>
          </motion.div>
        )}

        {/* ══════════════════ DONE PHASE ══════════════════ */}
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Re-train button */}
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetrain}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium border border-gray-600 flex items-center gap-2 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-train with Different Settings
              </motion.button>
            </div>

            {/* Metrics panel */}
            {Object.keys(metrics).length > 0 && (
              <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border border-emerald-800/30 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-emerald-400">Training Complete!</h3>
                </div>

                {isClassification && metrics.accuracy !== undefined && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Accuracy", value: metrics.accuracy, color: "text-indigo-400", pct: true },
                      { label: "Precision", value: metrics.precision, color: "text-purple-400", pct: true },
                      { label: "Recall", value: metrics.recall, color: "text-amber-400", pct: true },
                      { label: "F1-Score", value: metrics.f1, color: "text-emerald-400", pct: true },
                    ].map(({ label, value, color, pct }) => (
                      <div key={label} className="bg-gray-800/50 p-4 rounded-xl text-center">
                        <div className={`text-3xl font-bold ${color}`}>
                          {value !== undefined ? (pct ? `${(value * 100).toFixed(1)}%` : value.toFixed(4)) : "—"}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {isRegression && metrics.r2 !== undefined && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "R² Score", value: metrics.r2, color: "text-emerald-400" },
                      { label: "RMSE", value: metrics.rmse, color: "text-indigo-400" },
                      { label: "MAE", value: metrics.mae, color: "text-amber-400" },
                      { label: "MSE", value: metrics.mse, color: "text-purple-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-800/50 p-4 rounded-xl text-center">
                        <div className={`text-3xl font-bold ${color}`}>{value?.toFixed(4) ?? "—"}</div>
                        <div className="text-sm text-gray-400 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!isClassification && !isRegression && metrics.n_clusters !== undefined && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {[
                      { label: "Clusters Found", value: metrics.n_clusters, color: "text-indigo-400", fmt: (v: number) => String(v) },
                      { label: "Silhouette Score", value: metrics.silhouette_score, color: "text-emerald-400", fmt: (v: number) => v?.toFixed(4) ?? "N/A" },
                      {
                        label: metrics.inertia !== undefined ? "Inertia" : metrics.bic !== undefined ? "BIC" : "Samples",
                        value: metrics.inertia ?? metrics.bic ?? metrics.n_samples,
                        color: "text-amber-400",
                        fmt: (v: number) => v?.toFixed(2) ?? "—",
                      },
                    ].map(({ label, value, color, fmt }) => (
                      <div key={label} className="bg-gray-800/50 p-4 rounded-xl text-center">
                        <div className={`text-3xl font-bold ${color}`}>{value !== undefined ? fmt(value as number) : "—"}</div>
                        <div className="text-sm text-gray-400 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Parameters used */}
                <div className="pt-4 border-t border-emerald-800/30">
                  <div className="text-xs text-gray-500 mb-2">Trained with:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(hyperparams).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 font-mono">
                        {k}: {String(v)}
                      </span>
                    ))}
                    {!isClustering && (
                      <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 font-mono">
                        test_size: {testSize}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {trainError && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-300 text-sm">
                <strong>Training Error:</strong> {trainError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/select-pipeline" className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all border border-gray-700 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Pipelines
                </motion.button>
              </Link>
              <Link href="/optimize" className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg flex items-center justify-center transition-all"
                >
                  Optimize Hyperparameters
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.button>
              </Link>
              <Link href="/results" className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg flex items-center justify-center transition-all"
                >
                  View Results
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}