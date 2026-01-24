// src/app/export/page.tsx
"use client";

import { useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ExportPage() {
  const { datasetId, taskType } = useDataset();
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);

  const downloadModel = (format: 'pkl' | 'onnx' | 'script') => {
    setActiveFormat(format);
    setDownloadStatus(`Preparing ${format} download...`);

    // Simulate download preparation
    setTimeout(() => {
      setDownloadStatus(`✅ ${format.toUpperCase()} exported successfully!`);
    }, 1500);
  };

  const formats = [
    {
      id: 'pkl',
      name: '.pkl (Python Pickle)',
      description: 'Serialized model for Python environments',
      icon: '📦',
      color: 'indigo',
      gradient: 'from-indigo-600 to-purple-600'
    },
    {
      id: 'onnx',
      name: '.onnx (Open Neural Network Exchange)',
      description: 'Cross-platform model format for deployment',
      icon: '🧬',
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 'script',
      name: '.py (Python Script)',
      description: 'Complete inference code with model',
      icon: '🐍',
      color: 'emerald',
      gradient: 'from-emerald-600 to-cyan-600'
    }
  ];

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
            Export Your Trained Model
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Download your trained model in multiple formats for deployment or further use.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {formats.map((format, index) => (
              <motion.div
                key={format.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ y: -10 }}
                className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${
                  activeFormat === format.id
                    ? `border-${format.color}-500 bg-${format.color}-900/20`
                    : 'border-[var(--color-border)] hover:border-gray-600'
                }`}
                onClick={() => downloadModel(format.id as 'pkl' | 'onnx' | 'script')}
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">{format.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{format.name}</h3>
                  <p className="text-gray-400 text-sm">{format.description}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r ${format.gradient} shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  Export Model
                </motion.button>
              </motion.div>
            ))}
          </div>

          {downloadStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 bg-gradient-to-r from-emerald-900/20 to-emerald-900/10 rounded-2xl border border-emerald-800/30 text-center"
            >
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400 font-medium">{downloadStatus}</span>
              </div>
            </motion.div>
          )}

          {/* Model Info Card */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-[var(--color-border)] mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Model Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Model Type</div>
                <div className="text-white font-medium">Random Forest</div>
              </div>
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Accuracy</div>
                <div className="text-white font-medium">91%</div>
              </div>
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Features</div>
                <div className="text-white font-medium">4</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.href = '/results'}
              className="flex-1 px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Results
            </button>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg flex items-center justify-center"
              >
                Start New Project
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Deployment Options */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Cloud Deployment</h3>
            <p className="text-gray-400 text-sm">Deploy your model to cloud platforms like AWS, Azure, or GCP.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">API Integration</h3>
            <p className="text-gray-400 text-sm">Integrate your model into applications via REST API endpoints.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Production Ready</h3>
            <p className="text-gray-400 text-sm">Your model is optimized and ready for production environments.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}