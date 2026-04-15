// src/app/optimize/page.tsx
"use client";

import { useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

// ── Multi-objective trial ranking ────────────────────────────────────────────
const HIGH_COST_PARAMS      = new Set(["n_estimators", "max_depth", "num_leaves", "max_iter"]);
const REGULARIZATION_PARAMS = new Set(["min_samples_split", "min_samples_leaf", "min_child_samples", "reg_alpha", "reg_lambda"]);

type RankedTrial = {
  id: number; score: number; params: Record<string, any>; n_test_samples?: number;
  rank: number; compositeScore: number; speedScore: number;
  memoryScore: number; simplicityScore: number; badges: string[];
  precision?: number;
  recall?: number;
  f1?: number;
};

function rankTrials(trialList: any[]): RankedTrial[] {
  if (trialList.length === 0) return [];

  // Sort STRICTLY by accuracy (primary) then precision (tiebreaker only).
  // This guarantees a lower-accuracy combination can NEVER rank above a higher-accuracy one.
  const sorted = [...trialList].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (Math.abs(scoreDiff) > 1e-9) return scoreDiff;          // accuracy wins
    return (b.precision ?? b.score ?? 0) - (a.precision ?? a.score ?? 0); // precision tiebreaker
  });

  // Assign ranks and compute lightweight speed score for the MiniBar indicator.
  const scored = sorted.map((t, i) => {
    const costVals = Object.entries(t.params ?? {})
      .filter(([k]) => HIGH_COST_PARAMS.has(k))
      .map(([, v]) => Number(v))
      .filter(v => !isNaN(v));
    const speedScore      = costVals.length > 0
      ? Math.max(0, 1 - costVals.reduce((s, v) => s + v, 0) / (costVals.length * 500))
      : 0.5;
    const memoryScore     = speedScore;
    const simplicityScore = 0.5;
    // compositeScore stored for potential future use, equals accuracy here.
    const compositeScore  = t.score ?? 0;

    return {
      ...t,
      compositeScore,
      speedScore,
      memoryScore,
      simplicityScore,
      badges: [] as string[],
      rank: i + 1,
      n_test_samples: t.n_test_samples as number | undefined,
    };
  });

  // Badge standout entries. "Recommended" = highest-accuracy non-baseline trial.
  const nonBaseline = scored.filter(t => t.id !== -1);
  if (nonBaseline.length > 0) nonBaseline[0].badges.push("Recommended");

  // Best precision badge (only when precision is real)
  const withPrec = scored.filter(t => t.precision != null);
  if (withPrec.length > 0) {
    const topPrec = withPrec.reduce((b, t) => ((t.precision ?? 0) > (b.precision ?? 0) ? t : b));
    if (topPrec.id !== scored[0].id) topPrec.badges.push("Best Precision");
  }

  const topSpeed = scored.reduce((b, t) => (t.speedScore > b.speedScore ? t : b));
  if (topSpeed.id !== scored[0].id) topSpeed.badges.push("Fastest");

  return scored;
}

const BADGE_STYLES: Record<string, string> = {
  "AI Suggestion":  "bg-blue-900/60 text-blue-300 border border-blue-700/50",
  "Recommended":    "bg-amber-900/60 text-amber-300 border border-amber-700/50",
  "Best Score":     "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50",
  "Best Precision": "bg-violet-900/60 text-violet-300 border border-violet-700/50",
  "Fastest":        "bg-cyan-900/60 text-cyan-300 border border-cyan-700/50",
};
const BADGE_ICONS: Record<string, string> = {
  "AI Suggestion": "🤖", "Recommended": "🏆", "Best Score": "🎯", "Best Precision": "🎯", "Fastest": "⚡",
};
const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function MiniBar({ value, color }: { value: number; color: string }) {
  const bars = value >= 0.67 ? 3 : value >= 0.34 ? 2 : 1;
  return (
    <div className="flex gap-0.5 items-end h-3.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`w-1.5 rounded-sm ${i <= bars ? color : "bg-gray-700"}`}
          style={{ height: `${i * 4}px` }} />
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

/** Extract the primary metric from training metrics for score comparison. */
function getPrimaryScore(metrics: Record<string, any>): number | null {
  if ('accuracy' in metrics) return metrics.accuracy ?? null;
  if ('r2' in metrics) return metrics.r2 != null ? Math.max(0, metrics.r2) : null;
  if ('silhouette_score' in metrics) return metrics.silhouette_score ?? null;
  return null;
}

export default function OptimizePage() {
  const {
    trainingResult, optimizationResult,
    setJobStatus, setOptimizationResult, setTrainingResult,
    datasetId, pipelineConfig, selectedColumns, taskType, imageZipPath,
  } = useDataset();

  const isImageClustering = taskType === "clustering" && !!imageZipPath;

  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(() => (optimizationResult ? "done" : "idle"));
  const [progress, setProgress] = useState(() => (optimizationResult ? 100 : 0));
  const [currentPhase, setCurrentPhase] = useState(() => (optimizationResult ? "Optimization complete!" : "Ready to optimize"));
  const [trials, setTrials] = useState<any[]>(() => optimizationResult?.trials ?? []);
  const [bestScore, setBestScore] = useState<number | null>(() => optimizationResult?.best_score ?? null);
  const [bestParams, setBestParams] = useState<any>(() => optimizationResult?.best_params ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trial selection state
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [sortMode, setSortMode] = useState<"recommended" | "score" | "speed" | "memory">("recommended");

  const N_TRIALS = 20;

  // Build a synthetic "baseline" trial from the original training result so the
  // AI-suggested model is always visible alongside Optuna trials in the table.
  const baselineMetrics = trainingResult?.metrics ?? {};
  const baselineScore_ = getPrimaryScore(baselineMetrics);
  const baselineTrial = baselineScore_ !== null
    ? { id: -1, score: baselineScore_, params: {}, badges: [] as string[], rank: 0, compositeScore: 0, speedScore: 0.5, memoryScore: 0.5, simplicityScore: 0.5, n_test_samples: baselineMetrics.n_samples as number | undefined, precision: baselineMetrics.precision ?? undefined, recall: baselineMetrics.recall ?? undefined, f1: baselineMetrics.f1 ?? undefined }
    : null;

  const trialsForRanking = baselineTrial ? [...trials, baselineTrial] : trials;
  const rankedTrials = rankTrials(trialsForRanking);
  // Always tag the baseline row with "AI Suggestion" badge.
  const baselineRanked = rankedTrials.find(t => t.id === -1);
  if (baselineRanked && !baselineRanked.badges.includes("AI Suggestion")) {
    baselineRanked.badges.push("AI Suggestion");
  }

  const displayTrials =
    sortMode === "score"  ? [...rankedTrials].sort((a, b) => b.score       - a.score)       :
    sortMode === "speed"  ? [...rankedTrials].sort((a, b) => b.speedScore  - a.speedScore)  :
    sortMode === "memory" ? [...rankedTrials].sort((a, b) => b.memoryScore - a.memoryScore) :
    rankedTrials;

  const selectedTrial = rankedTrials.find((t) => t.id === selectedTrialId) ?? null;

  const runOptimization = async () => {
    if (!trainingResult || trainingResult.job_id === 0) {
      setErrorMsg("No real training job found. Please upload a dataset and train first.");
      return;
    }
    setStatus("running");
    setJobStatus("optimizing");
    setTrials([]);
    setBestScore(null);
    setBestParams(null);
    setErrorMsg(null);
    setProgress(0);
    setCurrentPhase("Submitting optimization job…");
    setSelectedTrialId(null);
    setApplySuccess(false);
    setApplyError(null);
    let progressTick: ReturnType<typeof setInterval> | null = null;    try {
      const res = await fetch(`${API_BASE}/optimize/`, { credentials: 'include', method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: trainingResult.job_id, n_trials: N_TRIALS }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Optimization failed");

      // Celery async: poll /api/result/<job_id>/ until the worker finishes
      const jobId = data.job_id;
      setCurrentPhase("Optuna is searching for the best hyperparameters…");

      // Slowly advance the progress bar while waiting
      let fakeProgress = 5;
      progressTick = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + 1.5, 88);
        setProgress(Math.round(fakeProgress));
      }, 2000);

      const pollResult = await new Promise<any>((resolve, reject) => {
        const poll = async () => {
          try {
            const pollRes = await fetch(`${API_BASE}/result/${jobId}/`);
            if (!pollRes.ok) { setTimeout(poll, 3000); return; }
            const pollData = await pollRes.json();
            if (pollData.status === "completed") resolve(pollData);
            else if (pollData.status === "failed") reject(new Error(pollData.error_message ?? "Optimization failed in worker"));
            else setTimeout(poll, 3000);
          } catch { setTimeout(poll, 4000); }
        };
        setTimeout(poll, 3000);
      });

      clearInterval(progressTick);

      const optResult = pollResult.optimization_metrics ?? {};
      const trialList: any[] = optResult.trials ?? [];
      const best: number = optResult.best_score ?? 0;
      const params: any = optResult.best_params ?? {};

      // Animate the trial cards appearing one by one
      setCurrentPhase("Processing results…");
      for (let i = 0; i < trialList.length; i++) {
        await new Promise<void>(r => setTimeout(r, 40));
        setTrials(prev => [...prev, trialList[i]]);
        setProgress(Math.round(88 + ((i + 1) / Math.max(trialList.length, 1)) * 12));
      }

      setBestScore(best);
      setBestParams(params);
      setStatus("done");
      setProgress(100);
      setCurrentPhase("Optimization complete!");
      setJobStatus("ready");

      const optimResult = { best_score: best, best_params: params, n_trials: optResult.n_trials ?? trialList.length, trials: trialList, n_test_samples: optResult.n_test_samples ?? null };
      setOptimizationResult(optimResult);
    } catch (err: any) {
      if (progressTick !== null) clearInterval(progressTick);
      setStatus("error");
      setErrorMsg(err.message ?? "Unknown error");
      setJobStatus("error");
    }
  };

  /** Retrain the model with the params from the selected trial (or best). */
  const applyTrial = async (params: Record<string, any>, score: number) => {
    if ((!datasetId && !isImageClustering) || !pipelineConfig || !trainingResult) {
      setApplyError("Cannot retrain: missing dataset or pipeline configuration.");
      return;
    }
    setApplying(true);
    setApplyError(null);
    setApplySuccess(false);
    setJobStatus("training");

    try {
      const res = await fetch(
        isImageClustering ? `${API_BASE}/image-cluster/` : `${API_BASE}/train/`,
        { credentials: 'include', method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isImageClustering
              ? {
                  zip_path: imageZipPath,
                  algorithm: pipelineConfig.algorithm,
                  n_clusters: (trainingResult?.metrics?.n_clusters ?? 3) as number,
                  algo_params: params,
                }
              : {
                  dataset_id: parseInt(datasetId!),
                  pipeline: pipelineConfig,
                  feature_columns: selectedColumns.length > 0 ? selectedColumns : undefined,
                  hyperparams: params,
                  test_size: 0.2,
                }
          ),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Retraining failed");
      }
      const data = await res.json();

      // Celery async: poll until the retrain job finishes
      const jobId = data.job_id;
      const pollResult = await new Promise<any>((resolve, reject) => {
        const poll = async () => {
          try {
            const pollRes = await fetch(`${API_BASE}/result/${jobId}/`);
            if (!pollRes.ok) { setTimeout(poll, 2500); return; }
            const pollData = await pollRes.json();
            if (pollData.status === "completed") resolve(pollData);
            else if (pollData.status === "failed") reject(new Error(pollData.error_message ?? "Retraining failed"));
            else setTimeout(poll, 2500);
          } catch { setTimeout(poll, 3000); }
        };
        setTimeout(poll, 2000);
      });

      // Only keep the new result if it is at least as good as the current model.
      const newPrimary = getPrimaryScore(pollResult.metrics ?? {});
      const oldPrimary = getPrimaryScore(trainingResult?.metrics ?? {});
      if (newPrimary !== null && oldPrimary !== null && newPrimary < oldPrimary - 0.0001) {
        setApplyError(
          `Retraining score (${(newPrimary * 100).toFixed(2)}%) is lower than your current model (${(oldPrimary * 100).toFixed(2)}%). Original model kept.`
        );
        setJobStatus("ready");
        return;
      }
      setTrainingResult({ ...data, metrics: pollResult.metrics });
      // Also update the optimizationResult so sidebar/context reflects the chosen params
      setOptimizationResult({
        best_score: score,
        best_params: params,
        n_trials: optimizationResult?.n_trials ?? N_TRIALS,
        trials: optimizationResult?.trials ?? trials,
      });
      setJobStatus("ready");
      setApplySuccess(true);
    } catch (err: any) {
      setApplyError(err.message ?? "Unknown error during retraining");
      setJobStatus("error");
    } finally {
      setApplying(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-amber-400 to-orange-400 mb-4">
            Hyperparameter Optimization
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Use Optuna to find the best hyperparameters for your trained model.
          </p>
        </motion.div>

        {/* Status card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Job</div>
              <div className="text-white font-mono text-lg">
                {trainingResult == null
                  ? "No trained model"
                  : trainingResult.job_id > 0
                  ? `#${trainingResult.job_id}`
                  : "Demo run"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Algorithm</div>
              <div className="text-indigo-300 font-medium">{trainingResult?.algorithm ?? "—"}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Trials</div>
              <div className="text-amber-300 font-medium">{N_TRIALS} trials</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Status</div>
              <div className={`font-bold ${
                status === "done" ? "text-emerald-400" :
                status === "running" ? "text-amber-400 animate-pulse" :
                status === "error" ? "text-red-400" : "text-gray-400"
              }`}>
                {status === "done" ? "✓ Complete" :
                 status === "running" ? "Running…" :
                 status === "error" ? "Error" : "Idle"}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {(status === "running" || status === "done") && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{currentPhase}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  className="bg-linear-to-r from-amber-500 to-orange-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && errorMsg && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-xl text-red-400 text-sm">{errorMsg}</div>
          )}

          {/* Demo-run notice */}
          {trainingResult != null && trainingResult.job_id === 0 && status !== "running" && status !== "done" && (
            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl text-amber-300 text-sm">
              ⚠️ Optimization requires a real uploaded dataset. The current result is from a demo run — please upload a CSV on the Upload page and re-train.
            </div>
          )}
        </motion.div>

        {/* Best result summary */}
        {status === "done" && bestScore !== null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-6 text-center">
              <div className="text-gray-400 text-sm mb-2">Best Score</div>
              <div className="text-5xl font-bold text-emerald-400">{(bestScore * 100).toFixed(2)}%</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="text-gray-400 text-sm mb-3">Best Parameters</div>
              {bestParams && Object.keys(bestParams).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(bestParams).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-gray-300 font-mono">{k}</span>
                      <span className="text-amber-300 font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No parameters found.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Trials table */}
        {(trials.length > 0 || !!baselineTrial) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">

            {/* Header + sort controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-white">
                Trial Results <span className="text-gray-400 font-normal text-sm">({trials.length} / {N_TRIALS}{baselineTrial ? " + AI" : ""})</span>
              </h3>
              <div className="flex items-center gap-1 bg-gray-900/60 rounded-xl p-1 text-xs font-semibold">
                {(["recommended", "score", "speed", "memory"] as const).map((mode) => (
                  <button key={mode} onClick={() => setSortMode(mode)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      sortMode === mode ? "bg-amber-600/80 text-white shadow" : "text-gray-400 hover:text-gray-200"
                    }`}>
                    {mode === "recommended" ? "🏆 Best" : mode === "score" ? "🎯 Score" : mode === "speed" ? "⚡ Speed" : "💾 Memory"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500">
                {sortMode === "recommended"
                  ? "Ranked strictly by accuracy — higher accuracy always ranks above lower accuracy. Precision is tiebreaker only."
                  : sortMode === "score" ? "Sorted by raw accuracy score — highest first"
                  : sortMode === "speed" ? "Sorted by training speed — fewest/shallowest estimators first"
                  : "Sorted by memory efficiency — smallest model footprint first"}
              </p>
              {selectedTrialId !== null && (
                <button onClick={() => setSelectedTrialId(null)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0 ml-4">
                  Clear ✕
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-3">Rank</th>
                    <th className="text-left py-2 pr-3">Trial</th>
                    <th className="text-left py-2 pr-3">Accuracy</th>
                    <th className="text-left py-2 pr-3">Precision</th>
                    <th className="text-left py-2 pr-3">Recall</th>
                    <th className="text-left py-2 pr-3">F1</th>
                    <th className="text-left py-2 pr-4">Tags</th>
                    <th className="text-left py-2 pr-3">Key Params</th>
                    <th className="text-center py-2 pr-3">Cases</th>
                    <th className="text-center py-2 pr-3">Speed</th>
                    <th className="text-right py-2">Select</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTrials.map((t) => {
                    const isSelected = selectedTrialId === t.id;
                    return (
                      <tr key={t.id}
                        onClick={() => setSelectedTrialId(isSelected ? null : t.id)}
                        className={`border-b cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "bg-amber-900/25 border-amber-700/50"
                            : t.rank === 1
                            ? "border-gray-700/50 bg-amber-950/10 hover:bg-amber-900/15"
                            : "border-gray-700/50 hover:bg-gray-700/20"
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-2.5 pr-3 font-bold text-base leading-none">
                          {t.id === -1
                            ? <span title="Original AI Suggestion">🤖</span>
                            : t.rank <= 3
                            ? <span title={`Rank #${t.rank}`}>{RANK_MEDALS[t.rank - 1]}</span>
                            : <span className="text-gray-500 text-xs font-mono">#{t.rank}</span>}
                        </td>
                        {/* Trial ID */}
                        <td className="py-2.5 pr-3 font-mono text-xs">
                          {t.id === -1
                            ? <span className="text-blue-400 font-semibold">AI</span>
                            : <span className="text-gray-500">#{t.id}</span>}
                        </td>
                        {/* Score (Accuracy) */}
                        <td className="py-2.5 pr-3">
                          <span className={`font-mono font-bold ${Math.abs(t.score - (bestScore ?? 0)) < 1e-9 ? "text-emerald-400" : "text-amber-300"}`}>
                            {typeof t.score === "number" ? (t.score * 100).toFixed(2) + "%" : t.score}
                          </span>
                        </td>
                        {/* Precision */}
                        <td className="py-2.5 pr-3">
                          <span className="font-mono text-violet-300">
                            {typeof t.precision === "number" ? (t.precision * 100).toFixed(2) + "%" : "—"}
                          </span>
                        </td>
                        {/* Recall */}
                        <td className="py-2.5 pr-3">
                          <span className="font-mono text-cyan-300">
                            {typeof t.recall === "number" ? (t.recall * 100).toFixed(2) + "%" : "—"}
                          </span>
                        </td>
                        {/* F1 */}
                        <td className="py-2.5 pr-3">
                          <span className="font-mono text-indigo-300">
                            {typeof t.f1 === "number" ? (t.f1 * 100).toFixed(2) + "%" : "—"}
                          </span>
                        </td>
                        {/* Badges */}
                        <td className="py-2.5 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {t.badges.map((badge) => (
                              <span key={badge}
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${BADGE_STYLES[badge] ?? "bg-gray-700 text-gray-300"}`}>
                                {BADGE_ICONS[badge]} {badge}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* Key Params */}
                        <td className="py-2.5 pr-3 text-gray-500 font-mono text-xs max-w-55 truncate">
                          {t.params ? Object.entries(t.params).slice(0, 3).map(([k, v]) => `${k}=${v}`).join("  ") : "—"}
                        </td>
                        {/* Cases tested */}
                        <td className="py-2.5 pr-3 text-center">
                          <span className="text-xs font-mono text-gray-400" title="Number of test samples used to score this trial">
                            {t.n_test_samples != null ? t.n_test_samples.toLocaleString() : "—"}
                          </span>
                        </td>
                        {/* Speed indicator */}
                        <td className="py-2.5 pr-3">
                          <div className="flex justify-center" title={`Speed: ${(t.speedScore * 100).toFixed(0)}%`}>
                            <MiniBar value={t.speedScore} color="bg-cyan-500" />
                          </div>
                        </td>
                        {/* Radio select */}
                        <td className="py-2.5 text-right">
                          <span className={`inline-block w-4 h-4 rounded-full border-2 transition-all ${
                            isSelected ? "bg-amber-500 border-amber-500" : "border-gray-600"
                          }`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
              {Object.entries(BADGE_STYLES).map(([label, cls]) => (
                <span key={label} className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
                  {BADGE_ICONS[label]} {label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
                <MiniBar value={1} color="bg-cyan-500" /> Speed &nbsp;
                <MiniBar value={1} color="bg-purple-500" /> Memory
              </span>
            </div>

            {/* Selection detail panel */}
            <AnimatePresence>
              {selectedTrial && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 border border-amber-700/40 bg-amber-900/10 rounded-xl p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-1">
                      {/* Trial header + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <h4 className="text-sm font-semibold text-amber-300">
                          {selectedTrial.id === -1 ? "🤖 " : selectedTrial.rank <= 3 ? RANK_MEDALS[selectedTrial.rank - 1] + " " : ""}
                          {selectedTrial.id === -1 ? "AI Suggestion (Original)" : `Trial #${selectedTrial.id}`} &mdash; Accuracy:&nbsp;
                          <span className="font-mono text-amber-200">{(selectedTrial.score * 100).toFixed(2)}%</span>
                          {typeof selectedTrial.precision === "number" && (
                            <> &nbsp;·&nbsp; Precision:&nbsp;<span className="font-mono text-violet-300">{(selectedTrial.precision * 100).toFixed(2)}%</span></>
                          )}
                          {typeof selectedTrial.recall === "number" && (
                            <> &nbsp;·&nbsp; Recall:&nbsp;<span className="font-mono text-cyan-300">{(selectedTrial.recall * 100).toFixed(2)}%</span></>
                          )}
                          {typeof selectedTrial.f1 === "number" && (
                            <> &nbsp;·&nbsp; F1:&nbsp;<span className="font-mono text-indigo-300">{(selectedTrial.f1 * 100).toFixed(2)}%</span></>
                          )}
                        </h4>
                        {selectedTrial.badges.map((badge) => (
                          <span key={badge}
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${BADGE_STYLES[badge] ?? "bg-gray-700 text-gray-300"}`}>
                            {BADGE_ICONS[badge]} {badge}
                          </span>
                        ))}
                      </div>
                      {/* Efficiency scores */}
                      <div className="flex gap-5 mb-4">
                        {[
                          { label: "Speed",      value: selectedTrial.speedScore,      color: "text-cyan-400" },
                          { label: "Memory",     value: selectedTrial.memoryScore,     color: "text-purple-400" },
                          { label: "Simplicity", value: selectedTrial.simplicityScore, color: "text-indigo-400" },
                          ...(selectedTrial.n_test_samples != null ? [{ label: "Test Cases", value: -1, color: "text-gray-300" }] : []),
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <div className="text-gray-500 text-xs mb-1">{label}</div>
                            <div className={`font-bold font-mono text-sm ${color}`}>
                              {label === "Test Cases"
                                ? selectedTrial.n_test_samples!.toLocaleString()
                                : `${(value * 100).toFixed(0)}%`}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* All params */}
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTrial.params && Object.entries(selectedTrial.params).length > 0
                          ? Object.entries(selectedTrial.params).map(([k, v]: [string, any]) => (
                              <div key={k} className="flex justify-between text-sm bg-gray-800/60 rounded-lg px-3 py-2">
                                <span className="text-gray-400 font-mono truncate mr-2">{k}</span>
                                <span className="text-amber-300 font-mono font-bold shrink-0">{String(v)}</span>
                              </div>
                            ))
                          : <p className="text-gray-500 text-sm col-span-2 italic">
                              {selectedTrial.id === -1 ? "Default parameters from AI pipeline." : "No parameters recorded."}
                            </p>
                        }
                      </div>
                    </div>

                    {/* Apply button + feedback */}
                    <div className="flex flex-col gap-3 md:w-56">
                      {selectedTrial.id === -1 ? (
                        <Link href="/results">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                          >
                            🤖 View AI Results →
                          </motion.button>
                        </Link>
                      ) : (
                        <motion.button
                          whileHover={{ scale: applying ? 1 : 1.02 }}
                          whileTap={{ scale: applying ? 1 : 0.97 }}
                          onClick={() => applyTrial(selectedTrial.params, selectedTrial.score)}
                          disabled={applying}
                          className={`w-full px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            applying
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-linear-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg"
                          }`}
                        >
                          {applying ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                              Retraining…
                            </>
                          ) : (
                            <>✦ Apply &amp; Retrain</>
                          )}
                        </motion.button>
                      )}

                      <AnimatePresence>
                        {applySuccess && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-center"
                          >
                            <p className="text-xs text-emerald-300 font-semibold mb-2">Retrained successfully!</p>
                            <Link href="/results"
                              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors">
                              View Results →
                            </Link>
                          </motion.div>
                        )}
                        {applyError && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl"
                          >
                            <p className="text-xs text-red-300">{applyError}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/train" className="flex-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all border border-gray-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Train
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: status === "running" ? 1 : 1.02 }}
            whileTap={{ scale: status === "running" ? 1 : 0.98 }}
            onClick={runOptimization}
            disabled={status === "running" || !trainingResult || trainingResult.job_id === 0}
            className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
              status === "running" || !trainingResult || trainingResult.job_id === 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : status === "done"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                : "bg-linear-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-lg"
            }`}
          >
            {status === "running" ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3" />
                Optimizing…
              </>
            ) : status === "done" ? (
              "Re-run Optimization"
            ) : (
              "Start Optimization"
            )}
          </motion.button>

          {status === "done" && (
            <Link href="/results" className="flex-1">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-linear-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-cyan-700 transition-all shadow-lg flex items-center justify-center">
                View Results →
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </main>
    </ProtectedRoute>
  );
}
