// src/app/train/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TrainPage() {
  const { datasetId, taskType, setJobStatus } = useDataset();
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<any>({});
  const [currentPhase, setCurrentPhase] = useState("Initializing...");
  const [pipelineType, setPipelineType] = useState<"ai" | "custom">("ai");

  useEffect(() => {
    setJobStatus('training');

    // Determine pipeline type based on previous selection
    // In a real app, this would come from the dataset context
    setPipelineType(Math.random() > 0.5 ? "ai" : "custom");

    // Define training phases
    const phases = [
      { name: "Initializing...", duration: 1000 },
      { name: "Loading data...", duration: 1500 },
      { name: "Preprocessing features...", duration: 2000 },
      { name: "Training model...", duration: 3000 },
      { name: "Validating results...", duration: 1000 },
    ];

    let phaseIndex = 0;
    let phaseStartTime = Date.now();

    const updatePhase = () => {
      if (phaseIndex < phases.length) {
        setCurrentPhase(phases[phaseIndex].name);

        // Calculate progress based on phase completion
        const elapsed = Date.now() - phaseStartTime;
        const phaseProgress = Math.min(elapsed / phases[phaseIndex].duration, 1);
        const totalProgress = ((phaseIndex + phaseProgress) / phases.length) * 100;

        setProgress(totalProgress);

        if (elapsed >= phases[phaseIndex].duration) {
          phaseIndex++;
          if (phaseIndex < phases.length) {
            phaseStartTime = Date.now();
            setTimeout(updatePhase, 100); // Small delay before next phase
          } else {
            // Training complete
            setTimeout(() => {
              setJobStatus('ready');
              setMetrics({
                accuracy: 0.88,
                precision: 0.87,
                recall: 0.89,
                f1: 0.88,
              });
            }, 500);
          }
        } else {
          setTimeout(updatePhase, 100); // Check again in 100ms
        }
      }
    };

    updatePhase();

    return () => {};
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
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Training Your Model
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We’re training your {pipelineType === 'ai' ? 'AI-recommended' : 'custom-built'} pipeline on your dataset. This may take a few minutes.
          </p>
        </motion.div>

        {/* Pipeline Type Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className={`px-6 py-3 rounded-full text-sm font-bold ${
            pipelineType === 'ai'
              ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {pipelineType === 'ai' ? '🤖 AI-Recommended Pipeline' : '⚙️ Custom-Built Pipeline'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          {/* Progress Visualization */}
          <div className="mb-10">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-indigo-400">Training Progress</span>
              <span className="text-sm font-medium text-gray-400">{Math.round(progress)}%</span>
            </div>

            <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden mb-6">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            <div className="text-center text-lg font-medium text-gray-300 mb-8">
              {currentPhase}
            </div>
          </div>

          {/* Training Visualization */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-48 h-48 rounded-full border-4 border-indigo-900/30 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-4 border-purple-900/30 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-indigo-700/30 flex items-center justify-center">
                    <motion.div
                      className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full bg-indigo-500"
                  animate={{
                    x: [0, Math.sin(i * 72 * Math.PI / 180) * 80],
                    y: [0, Math.cos(i * 72 * Math.PI / 180) * 80],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Metrics Display */}
          {progress === 100 && (
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-indigo-400">{metrics.accuracy?.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Accuracy</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-400">{metrics.precision?.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Precision</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-400">{metrics.recall?.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Recall</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-emerald-400">{metrics.f1?.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">F1-Score</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/recommend" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Recommendations
              </motion.button>
            </Link>
            <Link href="/optimize">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={progress < 100}
                className={`w-full flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                  progress === 100
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
          </div>
        </motion.div>

        {/* Training Insights */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">{pipelineType === 'ai' ? 'AI-Powered Training' : 'Custom Pipeline Training'}</h3>
            <p className="text-gray-400 text-sm">
              {pipelineType === 'ai'
                ? 'Using our AI-recommended pipeline optimized for your specific dataset.'
                : 'Training your custom-built pipeline with your selected components.'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Performance Metrics</h3>
            <p className="text-gray-400 text-sm">Real-time metrics are calculated during training.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Secure Process</h3>
            <p className="text-gray-400 text-sm">Your data remains secure during the training process.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}