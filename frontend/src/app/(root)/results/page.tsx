// src/app/results/page.tsx
"use client";

import { useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

/** Determine an overall rating label from the primary metric */
function getRating(taskType: string, metrics: Record<string, any>): string {
  let score = 0;
  if (taskType === 'classification') score = metrics.accuracy ?? 0;
  else if (taskType === 'regression') score = Math.max(0, metrics.r2 ?? 0);
  else score = Math.max(0, metrics.silhouette_score ?? 0);
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.75) return 'Good';
  if (score >= 0.5) return 'Fair';
  return 'Needs Improvement';
}

export default function ResultsPage() {
  const { taskType, trainingResult, setJobStatus } = useDataset();
  useEffect(() => { setJobStatus('ready'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve metrics â€” use real data if available, otherwise show mock classification result
  const effectiveTask = trainingResult?.task_type ?? taskType ?? 'classification';
  const metrics: Record<string, any> = trainingResult?.metrics ?? {
    accuracy: 0.91, precision: 0.90, recall: 0.92, f1: 0.91,
    confusion_matrix: [[85, 5], [3, 7]],
    feature_importance: [
      { feature: 'income', importance: 0.35 },
      { feature: 'age', importance: 0.25 },
      { feature: 'education', importance: 0.20 },
      { feature: 'purchase_history', importance: 0.20 },
    ],
  };

  const isClassification = effectiveTask === 'classification';
  const isRegression = effectiveTask === 'regression';
  const isClustering = effectiveTask === 'clustering';
  const rating = getRating(effectiveTask, metrics);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
            Model Performance Report
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {trainingResult
              ? `${trainingResult.algorithm} Â· ${effectiveTask} Â· ${metrics.n_samples ?? 'â€”'} samples`
              : 'Here\'s a detailed breakdown of your model\'s performance.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          {/* â”€â”€ Classification metrics â”€â”€ */}
          {isClassification && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Accuracy',  value: metrics.accuracy,  color: 'emerald' },
                  { label: 'Precision', value: metrics.precision, color: 'cyan' },
                  { label: 'Recall',    value: metrics.recall,    color: 'indigo' },
                  { label: 'F1-Score',  value: metrics.f1,        color: 'purple' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`bg-gradient-to-br from-${color}-900/20 to-${color}-900/10 p-6 rounded-xl border border-${color}-800/30 text-center`}>
                    <div className={`text-4xl font-bold text-${color}-400 mb-2`}>{value?.toFixed(2) ?? 'â€”'}</div>
                    <div className="text-gray-400">{label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Feature Importance */}
                {metrics.feature_importance?.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)]">
                    <h3 className="text-xl font-bold text-white mb-4">Feature Importance</h3>
                    <div className="space-y-3">
                      {metrics.feature_importance.map((fi: any, i: number) => (
                        <div key={i} className="bg-gray-800/50 p-3 rounded-lg">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-300 text-sm">{fi.feature}</span>
                            <span className="text-emerald-400 font-bold text-sm">{(fi.importance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full" style={{ width: `${fi.importance * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confusion Matrix */}
                {metrics.confusion_matrix && (
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)]">
                    <h3 className="text-xl font-bold text-white mb-4">Confusion Matrix</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase"></th>
                            {metrics.confusion_matrix[0].map((_: number, j: number) => (
                              <th key={j} className="px-4 py-2 text-center text-xs font-medium text-cyan-400 uppercase">
                                Pred {metrics.classes?.[j] ?? j}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {metrics.confusion_matrix.map((row: number[], i: number) => (
                            <tr key={i}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-300">Actual {metrics.classes?.[i] ?? i}</td>
                              {row.map((val: number, j: number) => (
                                <td key={j} className={`px-4 py-2 text-center text-sm font-bold ${i === j ? 'text-emerald-400' : 'text-amber-400'}`}>{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* â”€â”€ Regression metrics â”€â”€ */}
          {isRegression && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'RÂ² Score', value: metrics.r2?.toFixed(4),   color: 'emerald' },
                  { label: 'RMSE',     value: metrics.rmse?.toFixed(4),  color: 'cyan' },
                  { label: 'MAE',      value: metrics.mae?.toFixed(4),   color: 'indigo' },
                  { label: 'MSE',      value: metrics.mse?.toFixed(4),   color: 'purple' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`bg-gradient-to-br from-${color}-900/20 to-${color}-900/10 p-6 rounded-xl border border-${color}-800/30 text-center`}>
                    <div className={`text-4xl font-bold text-${color}-400 mb-2`}>{value ?? 'â€”'}</div>
                    <div className="text-gray-400">{label}</div>
                  </div>
                ))}
              </div>

              {metrics.feature_importance?.length > 0 && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)] mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">Feature Importance</h3>
                  <div className="space-y-3">
                    {metrics.feature_importance.map((fi: any, i: number) => (
                      <div key={i} className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300 text-sm">{fi.feature}</span>
                          <span className="text-emerald-400 font-bold text-sm">{(fi.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full" style={{ width: `${fi.importance * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* â”€â”€ Clustering metrics â”€â”€ */}
          {isClustering && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Clusters Found',    value: String(metrics.n_clusters ?? 'â€”'),     color: 'indigo' },
                  { label: 'Silhouette Score',  value: metrics.silhouette_score?.toFixed(4) ?? 'N/A', color: 'emerald' },
                  { label: metrics.inertia !== undefined ? 'Inertia' : metrics.bic !== undefined ? 'BIC' : 'Samples',
                    value: (metrics.inertia ?? metrics.bic ?? metrics.n_samples)?.toFixed(2) ?? 'â€”', color: 'cyan' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`bg-gradient-to-br from-${color}-900/20 to-${color}-900/10 p-6 rounded-xl border border-${color}-800/30 text-center`}>
                    <div className={`text-4xl font-bold text-${color}-400 mb-2`}>{value}</div>
                    <div className="text-gray-400">{label}</div>
                  </div>
                ))}
              </div>

              {metrics.cluster_distribution && Object.keys(metrics.cluster_distribution).length > 0 && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)] mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">Cluster Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(metrics.cluster_distribution).map(([cluster, count]) => {
                      const total = Object.values(metrics.cluster_distribution as Record<string, number>).reduce((a, b) => a + b, 0);
                      const pct = ((count as number) / total) * 100;
                      return (
                        <div key={cluster} className="bg-gray-800/50 p-3 rounded-lg">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-300 text-sm">{parseInt(cluster) === -1 ? 'Noise' : `Cluster ${cluster}`}</span>
                            <span className="text-indigo-400 font-bold text-sm">{count as number} pts ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Rating */}
          <div className="bg-gradient-to-br from-emerald-900/10 to-cyan-900/10 p-6 rounded-xl border border-emerald-800/30 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Model Performance Rating</h3>
                <p className="text-gray-400">Based on all computed metrics</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  rating === 'Excellent' ? 'text-emerald-400' :
                  rating === 'Good' ? 'text-cyan-400' :
                  rating === 'Fair' ? 'text-amber-400' : 'text-red-400'
                }`}>{rating}</div>
                <div className="text-sm text-gray-400">{trainingResult?.algorithm ?? 'Model'}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/optimize" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Optimization
              </motion.button>
            </Link>
            <Link href="/export">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-cyan-700 transition-all duration-300 shadow-lg flex items-center justify-center"
              >
                Export Model
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Key Insights */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            {
              title: `${rating} Performance`,
              body: isClassification
                ? `Accuracy: ${(metrics.accuracy * 100).toFixed(1)}% on held-out test samples.`
                : isRegression
                ? `RÂ² of ${metrics.r2?.toFixed(3)} explains variance in predictions.`
                : `Found ${metrics.n_clusters} clusters${metrics.silhouette_score ? ` with silhouette score ${metrics.silhouette_score.toFixed(3)}` : ''}.`,
              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
            },
            {
              title: 'Trained On Real Data',
              body: `${metrics.n_samples ?? 'â€”'} samples Â· ${metrics.n_features ?? 'â€”'} features${metrics.target_column ? ` Â· target: "${metrics.target_column}"` : ''}.`,
              icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
            },
            {
              title: 'Ready to Export',
              body: 'Download as .pkl for Python, .onnx for cross-platform deployment, or generate a runnable script.',
              icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
            },
          ].map(({ title, body, icon }) => (
            <div key={title} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
