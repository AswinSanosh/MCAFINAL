// src/app/describe/page.tsx
"use client";

import { useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DescribePage() {
  const { datasetId, taskType } = useDataset();
  const [description, setDescription] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    // Mock: save description to backend
    console.log("Description saved:", description);
    // In real app: POST to /api/describe
    window.location.href = '/analyze';
  };

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
            Help our AI understand your goal. This improves pipeline recommendations.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)]"
        >
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Goal Description
            </label>
            <div className={`relative rounded-xl border-2 transition-all duration-300 ${
              isFocused
                ? 'border-indigo-500 bg-indigo-900/10'
                : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-gray-600'
            }`}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="e.g., Predict customer churn based on purchase history, age, and demographics to improve retention strategies..."
                className="w-full p-5 bg-transparent border-0 focus:ring-0 text-[var(--color-text)] placeholder-gray-500 resize-none min-h-[200px]"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                {description.length}/500
              </div>
            </div>
          </div>

          {/* Suggested Examples */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Need inspiration? Try these examples:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Predict house prices based on features like location, size, and amenities",
                "Classify emails as spam or not spam based on content and sender",
                "Forecast sales for next quarter based on historical data",
                "Identify fraudulent transactions from banking records"
              ].map((example, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 cursor-pointer hover:border-indigo-500 transition-colors"
                  onClick={() => setDescription(example)}
                >
                  <p className="text-gray-300 text-sm">{example}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/upload" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700"
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Upload
                </div>
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!description.trim()}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                description.trim()
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                Continue to Analysis
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Be Specific</h3>
            <p className="text-gray-400 text-sm">Detailed descriptions lead to better model recommendations.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Include Metrics</h3>
            <p className="text-gray-400 text-sm">Mention specific metrics you care about (accuracy, precision, etc.).</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Business Context</h3>
            <p className="text-gray-400 text-sm">Explain the business problem you're trying to solve.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}