"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const features = [
    { icon: "🧠", title: "AI Recommendations", desc: "Smart pipeline suggestions tailored to your data" },
    { icon: "⚡", title: "Auto Tuning", desc: "Automatic hyperparameter optimization" },
    { icon: "📦", title: "Easy Export", desc: "One-click model deployment options" },
    { icon: "📊", title: "Data Insights", desc: "Comprehensive analysis of your datasets" },
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8 min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* Hero Section */}
      <section className="max-w-7xl w-full pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              AI-Powered <span className="text-white">No-Code</span> ML Platform
            </motion.h1>
            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Build, train, and deploy machine learning models without writing a single line of code.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/model-type">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Get Started
                </motion.button>
              </Link>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gray-800 text-indigo-300 border-2 border-indigo-500/30 rounded-xl font-bold text-lg hover:bg-gray-700/50 transition-colors"
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
              <svg width="320" height="320" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                <circle cx="160" cy="160" r="160" fill="url(#gradient)" />
                <path d="M110 200L160 80L210 200H110Z" fill="#818cf8" />
                <circle cx="160" cy="160" r="32" fill="#4f46e5" />
                <rect x="140" y="210" width="40" height="12" rx="6" fill="#6366f1" />
                {/* Animated pulse rings */}
                <circle cx="160" cy="160" r="50" stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.6">
                  <animate attributeName="r" values="50;65;50" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to build and deploy machine learning models with ease</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -10 }}
              className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border)] shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-3xl p-12 text-center border border-indigo-700/30"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Data?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">Join thousands of users who have built powerful ML models without writing code</p>
          <Link href="/model-type">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Building Today
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}