// src/app/model-type/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function ModelTypePage() {
  const modelTypes = [
    {
      title: "Classification",
      description: "Predict discrete labels (e.g., spam detection, image recognition).",
      href: "/upload?task=classification",
      color: "from-indigo-600 to-purple-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      title: "Clustering",
      description: "Discover hidden patterns in unlabeled data (e.g., customer segmentation).",
      href: "/upload?task=clustering",
      color: "from-emerald-600 to-teal-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      title: "Regression",
      description: "Predict continuous values (e.g., house prices, temperature forecasts).",
      href: "/upload?task=regression",
      color: "from-blue-600 to-cyan-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 mt-8"
        >
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Select Your <span className="text-white">Task</span>
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Choose a machine learning task to begin your automated pipeline journey
          </motion.p>
        </motion.div>

        {/* Model Types */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {modelTypes.map((model, index) => (
              <motion.div
                key={model.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + 0.1 * index }}
                whileHover={{ y: -15 }}
                className="bg-gradient-to-b from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-[var(--color-border)] transition-all duration-300 group"
              >
                <Link href={model.href} className="block h-full">
                  <div className={`p-8 bg-gradient-to-r ${model.color} text-white relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                        {model.icon}
                      </div>
                      <h2 className="text-2xl font-bold text-center">{model.title}</h2>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-gray-300 text-center leading-relaxed mb-6">
                      {model.description}
                    </p>
                    <div className="flex justify-center">
                      <span className="px-6 py-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 rounded-full text-sm font-medium border border-indigo-500/30">
                        AutoML Pipeline
                      </span>
                    </div>
                    <motion.div
                      className="mt-8 text-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <button className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                        Select Task
                      </button>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Image Clustering Option */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-[var(--color-border)] transition-all duration-300 mb-16"
        >
          <div className="p-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="text-6xl mb-6">🖼️</div>
              <h2 className="text-2xl font-bold text-center">Image Clustering</h2>
            </div>
          </div>
          <div className="p-8">
            <p className="text-gray-300 text-center leading-relaxed mb-6">
              Cluster similar images together using advanced computer vision techniques
            </p>
            <div className="flex justify-center mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30">
                Computer Vision
              </span>
            </div>
            <Link href="/image-clustering">
              <motion.button
                className="w-full px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Image Clustering
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          className="mt-20 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-[var(--color-border)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">Intelligent Suggestions</h3>
              <p className="text-gray-400">Our AI recommends the best algorithms for your specific data</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">Fast Processing</h3>
              <p className="text-gray-400">Get results in minutes, not hours or days</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-400">Your data stays protected with enterprise-grade security</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}