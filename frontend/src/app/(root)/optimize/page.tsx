// src/app/optimize/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = "http://localhost:8000/api";

export default function OptimizePage() {
  const { trainingResult, optimizationResult, setJobStatus, setOptimizationResult } = useDataset();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(() => (optimizationResult ? "done" : "idle"));
  const [progress, setProgress] = useState(() => (optimizationResult ? 100 : 0));
  const [currentPhase, setCurrentPhase] = useState(() => (optimizationResult ? "Optimization complete!" : "Ready to optimize"));
  const [trials, setTrials] = useState<any[]>(() => optimizationResult?.trials ?? []);
  const [bestScore, setBestScore] = useState<number | null>(() => optimizationResult?.best_score ?? null);
  const [bestParams, setBestParams] = useState<any>(() => optimizationResult?.best_params ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const N_TRIALS = 20;

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

    try {
      const res = await fetch(`${API_BASE}/optimize/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: trainingResult.job_id, n_trials: N_TRIALS }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Optimization failed");

      const result = data.result ?? data;
      const trialList: any[] = result.trials ?? [];
      const best: number = result.best_score ?? 0;
      const params: any = result.best_params ?? {};

      // Animate trials appearing
      setCurrentPhase("Processing results…");
      for (let i = 0; i < trialList.length; i++) {
        await new Promise<void>(r => setTimeout(r, 60));
        setTrials(prev => [...prev, trialList[i]]);
        setProgress(Math.round(((i + 1) / trialList.length) * 100));
        if (trialList[i].score > (bestScore ?? -Infinity)) {
          setBestScore(trialList[i].score);
        }
      }

      setBestScore(best);
      setBestParams(params);
      setStatus("done");
      setProgress(100);
      setCurrentPhase("Optimization complete!");
      setJobStatus("ready");

      const optimResult = { best_score: best, best_params: params, n_trials: result.n_trials ?? trialList.length, trials: trialList };
      setOptimizationResult(optimResult);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message ?? "Unknown error");
      setJobStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400 mb-4">
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
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full"
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
              <div className="text-5xl font-bold text-emerald-400">{bestScore.toFixed(4)}</div>
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
        {trials.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Trial Results  <span className="text-gray-400 font-normal text-sm">({trials.length} / {N_TRIALS})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 pr-4">Trial</th>
                    <th className="text-left py-2 pr-4">Score</th>
                    <th className="text-left py-2">Key Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  {[...trials].reverse().slice(0, 15).map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="py-2 pr-4 text-gray-300">#{t.id}</td>
                      <td className={`py-2 pr-4 font-mono font-bold ${t.score === bestScore ? "text-emerald-400" : "text-amber-300"}`}>
                        {typeof t.score === "number" ? t.score.toFixed(4) : t.score}
                      </td>
                      <td className="py-2 text-gray-400 font-mono text-xs">
                        {t.params ? Object.entries(t.params).slice(0, 3).map(([k, v]) => `${k}=${v}`).join("  ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

          {status !== "done" && (
            <motion.button
              whileHover={{ scale: status === "running" ? 1 : 1.02 }}
              whileTap={{ scale: status === "running" ? 1 : 0.98 }}
              onClick={runOptimization}
              disabled={status === "running" || !trainingResult || trainingResult.job_id === 0}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                status === "running" || !trainingResult || trainingResult.job_id === 0
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-lg"
              }`}
            >
              {status === "running" ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3" />
                  Optimizing…
                </>
              ) : (
                "Start Optimization"
              )}
            </motion.button>
          )}

          {status === "done" && (
            <Link href="/results" className="flex-1">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-cyan-700 transition-all shadow-lg flex items-center justify-center">
                View Results →
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
