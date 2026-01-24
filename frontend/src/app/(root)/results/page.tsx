// src/app/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ResultsPage() {
  const { datasetId, taskType, setJobStatus } = useDataset();
  const [finalMetrics, setFinalMetrics] = useState<any>({});

  useEffect(() => {
    setJobStatus('ready');
    // Mock final metrics
    setFinalMetrics({
      accuracy: 0.91,
      precision: 0.90,
      recall: 0.92,
      f1: 0.91,
      confusion_matrix: [[85, 5], [3, 7]],
      feature_importance: [
        { feature: 'income', importance: 0.35 },
        { feature: 'age', importance: 0.25 },
        { feature: 'education', importance: 0.20 },
        { feature: 'purchase_history', importance: 0.20 },
      ],
    });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
            Model Performance Report
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your optimized model has achieved excellent results. Here's a detailed performance breakdown.
          </p>
        </motion.div>

        {/* Performance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 p-6 rounded-xl border border-emerald-800/30 text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">{finalMetrics.accuracy?.toFixed(2)}</div>
              <div className="text-gray-400">Accuracy</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-900/10 p-6 rounded-xl border border-cyan-800/30 text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">{finalMetrics.precision?.toFixed(2)}</div>
              <div className="text-gray-400">Precision</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-900/10 p-6 rounded-xl border border-indigo-800/30 text-center">
              <div className="text-4xl font-bold text-indigo-400 mb-2">{finalMetrics.recall?.toFixed(2)}</div>
              <div className="text-gray-400">Recall</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 p-6 rounded-xl border border-purple-800/30 text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">{finalMetrics.f1?.toFixed(2)}</div>
              <div className="text-gray-400">F1-Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Feature Importance */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Feature Importance
              </h3>
              <div className="space-y-4">
                {finalMetrics.feature_importance?.map((fi: any, i: number) => (
                  <div key={i} className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{fi.feature}</span>
                      <span className="text-emerald-400 font-bold">{fi.importance.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                        style={{ width: `${fi.importance * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Confusion Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">Predicted 0</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-cyan-400 uppercase tracking-wider">Predicted 1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-gray-300">Actual 0</td>
                      <td className="px-4 py-2 text-center text-sm font-bold text-emerald-400">{finalMetrics.confusion_matrix?.[0][0]}</td>
                      <td className="px-4 py-2 text-center text-sm font-bold text-amber-400">{finalMetrics.confusion_matrix?.[0][1]}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-gray-300">Actual 1</td>
                      <td className="px-4 py-2 text-center text-sm font-bold text-amber-400">{finalMetrics.confusion_matrix?.[1][0]}</td>
                      <td className="px-4 py-2 text-center text-sm font-bold text-emerald-400">{finalMetrics.confusion_matrix?.[1][1]}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p>True Positives: {finalMetrics.confusion_matrix?.[1][1]} | True Negatives: {finalMetrics.confusion_matrix?.[0][0]}</p>
                <p>False Positives: {finalMetrics.confusion_matrix?.[0][1]} | False Negatives: {finalMetrics.confusion_matrix?.[1][0]}</p>
              </div>
            </div>
          </div>

          {/* Model Performance Rating */}
          <div className="bg-gradient-to-br from-emerald-900/10 to-cyan-900/10 p-6 rounded-xl border border-emerald-800/30 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Model Performance Rating</h3>
                <p className="text-gray-400">Your model performs exceptionally well for production use</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-400">Excellent</div>
                <div className="text-sm text-gray-400">Based on all metrics</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/optimize" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">High Accuracy</h3>
            <p className="text-gray-400 text-sm">Your model achieves 91% accuracy, suitable for production deployment.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Balanced Metrics</h3>
            <p className="text-gray-400 text-sm">Precision and recall are well-balanced, indicating reliable predictions.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Production Ready</h3>
            <p className="text-gray-400 text-sm">Model is ready for deployment with excellent performance metrics.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}