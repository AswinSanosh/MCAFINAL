// src/app/describe/page.tsx
"use client";

import { useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000/api";

export default function DescribePage() {
  const { datasetId, taskType, description, setDescription } = useDataset();
  const [isFocused, setIsFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (datasetId) {
        await fetch(`${API_BASE}/describe/${datasetId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
        });
      }
    } catch {
      // non-critical â€” continue even if save fails
    } finally {
      setSaving(false);
      window.location.href = '/analyze';
    }
  };

  const examples = [
    "Predict house prices based on features like location, size, and amenities",
    "Classify customer churn based on purchase history and demographics",
    "Cluster customers by spending behaviour for targeted marketing",
    "Detect fraudulent transactions in financial records",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Describe Your Dataset
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Help the system understand your goal. This improves pipeline recommendations.
          </p>
          {taskType && (
            <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-indigo-900/30 border border-indigo-500/30">
              <span className="text-indigo-300 text-sm font-medium">Task: {taskType}</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-800/50 rounded-2xl shadow-xl p-8 border border-gray-700 mb-8"
        >
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Goal Description
            </label>
            <div className={`relative rounded-xl border-2 transition-all duration-300 ${
              isFocused ? 'border-indigo-500 bg-indigo-900/10' : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
            }`}>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 500))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="e.g., Predict customer churn based on purchase history, age, and demographics..."
                className="w-full p-5 bg-transparent border-0 focus:ring-0 text-gray-200 placeholder-gray-500 resize-none min-h-[180px] outline-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-500">{description.length}/500</div>
            </div>
          </div>

          {/* Suggested examples */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Need inspiration?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setDescription(ex)}
                  className="text-left px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white transition-all duration-200 text-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/upload" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all border border-gray-600 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Analyse Dataset'}
              {!saving && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
