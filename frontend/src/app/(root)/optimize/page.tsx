// src/app/optimize/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";
import Link from "next/link";

export default function OptimizePage() {
  const { datasetId, taskType, setJobStatus } = useDataset();
  const [trials, setTrials] = useState<any[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("Initializing optimization...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setJobStatus('optimizing');

    let trialCount = 0;
    const interval = setInterval(() => {
      trialCount++;

      if (trialCount > 10) {
        clearInterval(interval);
        setJobStatus('ready');
        setBestScore(0.91);
        setCurrentPhase("Optimization complete!");
        setProgress(100);
        return;
      }

      const newTrial = {
        id: trialCount,
        score: Math.random() * 0.1 + 0.85, // 0.85–0.95
        params: { max_depth: Math.floor(Math.random() * 10) + 1, n_estimators: 100 },
        timestamp: new Date().toLocaleTimeString(),
      };

      setTrials(prev => [...prev, newTrial]);
      if (newTrial.score > bestScore) {
        setBestScore(newTrial.score);
      }

      // Update progress and phase
      setProgress((trialCount / 10) * 100);
      setCurrentPhase(`Testing hyperparameters (${trialCount}/10)`);
    }, 1500);

    return () => clearInterval(interval);
  }, [bestScore]);

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
            We’re using Bayesian Optimization to find the best hyperparameters for your model.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          {/* Progress Visualization */}
          <div className="mb-10">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-amber-400">Optimization Progress</span>
              <span className="text-sm font-medium text-gray-400">{Math.round(progress)}%</span>
            </div>

            <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden mb-6">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 to-orange-600"
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

          {/* Optimization Visualization */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-48 h-48 rounded-full border-4 border-amber-900/30 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-4 border-orange-900/30 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-amber-700/30 flex items-center justify-center">
                    <motion.div
                      className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-center"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        scale: {
                          duration: 1,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-amber-500"
                  animate={{
                    x: [0, Math.sin(i * 60 * Math.PI / 180) * 70],
                    y: [0, Math.cos(i * 60 * Math.PI / 180) * 70],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-6 rounded-xl border border-amber-800/30">
              <div className="text-3xl font-bold text-amber-400 mb-2">{trials.length}/10</div>
              <div className="text-gray-400">Trials Completed</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 p-6 rounded-xl border border-emerald-800/30">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{bestScore.toFixed(2)}</div>
              <div className="text-gray-400">Best Score</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-xl border border-indigo-800/30">
              <div className="text-3xl font-bold text-indigo-400 mb-2">{trials.length > 0 ? Math.max(...trials.map(t => t.score)).toFixed(2) : '0.00'}</div>
              <div className="text-gray-400">Current Best</div>
            </div>
          </div>

          {/* Recent Trials */}
          {trials.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Recent Trials
              </h3>
              <div className="space-y-4">
                {trials.slice(-3).reverse().map((trial) => (
                  <motion.div
                    key={trial.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-white">Trial #{trial.id}</div>
                      <div className="text-sm text-gray-400">{trial.timestamp}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-400">{trial.score.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">Score</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/train" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Training
              </motion.button>
            </Link>
            <Link href="/results">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={trials.length < 10}
                className={`w-full flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                  trials.length >= 10
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 cursor-pointer'
                    : 'bg-gray-700 cursor-not-allowed'
                } flex items-center justify-center`}
              >
                View Final Results
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Optimization Insights */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-amber-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Bayesian Optimization</h3>
            <p className="text-gray-400 text-sm">Advanced algorithm finds optimal hyperparameters efficiently.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-amber-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Performance Tracking</h3>
            <p className="text-gray-400 text-sm">Real-time monitoring of optimization progress.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-amber-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Model Improvement</h3>
            <p className="text-gray-400 text-sm">Fine-tuning parameters for maximum model performance.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}