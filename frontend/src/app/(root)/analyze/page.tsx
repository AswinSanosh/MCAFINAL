// src/app/analyze/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AnalyzePage() {
  const { datasetId, taskType, setJobStatus } = useDataset();
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching analysis from Django
    const mockAnalysis = {
      columns: ["age", "income", "education", "churn"],
      dtypes: ["int64", "float64", "object", "bool"],
      n_samples: 1000,
      n_features: 4,
      target_column: "churn",
      class_balance: 0.7,
      missing_values: 2,
    };

    setAnalysis(mockAnalysis);
    setJobStatus('analyzing');

    // Simulate completion
    setTimeout(() => {
      setJobStatus('ready');
    }, 2000);

  }, []);

  if (!analysis) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-[var(--color-accent)] border-opacity-50 rounded-full mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl text-[var(--color-accent)] font-medium">Analyzing your dataset...</p>
          <p className="text-gray-400 mt-2">This usually takes a few moments</p>
        </motion.div>
      </main>
    );
  }

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
            Dataset Analysis
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We’ve analyzed your dataset and extracted key characteristics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-900/10 p-6 rounded-xl border border-indigo-900/30">
              <div className="text-3xl font-bold text-indigo-400 mb-2">{analysis.n_samples.toLocaleString()}</div>
              <div className="text-gray-400">Total Records</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 p-6 rounded-xl border border-purple-900/30">
              <div className="text-3xl font-bold text-purple-400 mb-2">{analysis.n_features}</div>
              <div className="text-gray-400">Features</div>
            </div>
            <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/10 p-6 rounded-xl border border-amber-900/30">
              <div className="text-3xl font-bold text-amber-400 mb-2">{analysis.missing_values}</div>
              <div className="text-gray-400">Missing Values</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 p-6 rounded-xl border border-emerald-900/30">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{analysis.target_column}</div>
              <div className="text-gray-400">Target Variable</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Data Types Distribution
              </h3>
              <div className="space-y-3">
                {analysis.dtypes.map((dtype: string, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-300">{analysis.columns[i]}</span>
                    <span className="px-3 py-1 bg-indigo-900/30 text-indigo-300 rounded-full text-sm">{dtype}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Class Balance
              </h3>
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-end pr-2"
                    style={{ width: `${analysis.class_balance * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {Math.round(analysis.class_balance * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>Positive Class</span>
                  <span>{Math.round(analysis.class_balance * 100)}%</span>
                </div>
              </div>
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Positive Class</span>
                  <span className="text-amber-400 font-bold">{Math.round(analysis.class_balance * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Negative Class</span>
                  <span className="text-emerald-400 font-bold">{Math.round((1 - analysis.class_balance) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality Assessment */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-[var(--color-border)] mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Data Quality Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
                <div className="text-2xl font-bold text-emerald-400 mb-1">98%</div>
                <div className="text-gray-400 text-sm">Completeness</div>
              </div>
              <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-800/30">
                <div className="text-2xl font-bold text-amber-400 mb-1">Medium</div>
                <div className="text-gray-400 text-sm">Skewness</div>
              </div>
              <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
                <div className="text-2xl font-bold text-indigo-400 mb-1">Good</div>
                <div className="text-gray-400 text-sm">Correlation</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/describe" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Description
              </motion.button>
            </Link>
            <Link href="/recommend">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg flex items-center justify-center"
              >
                Get AI Recommendations
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Insights Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Feature Insights</h3>
            <p className="text-gray-400 text-sm">Age and income are the most predictive features for your target variable.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Model Suggestions</h3>
            <p className="text-gray-400 text-sm">Based on your data, Random Forest and XGBoost are recommended.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Data Preprocessing</h3>
            <p className="text-gray-400 text-sm">Categorical variables will be encoded and numerical features scaled.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}