"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../lib/AuthContext";

const stats = [
  { value: "18+", label: "Algorithms" },
  { value: "3", label: "Task Types" },
  { value: "0", label: "Lines of Code" },
  { value: "9", label: "Step Workflow" },
];

const features = [
  {
    gradient: "from-indigo-600/20 to-indigo-900/10",
    border: "border-indigo-700/30",
    iconBg: "bg-indigo-600/20",
    iconColor: "text-indigo-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "AI Pipeline Recommendations",
    desc: "Intelligent pipeline presets ranked by estimated accuracy, complexity, and training time — matched to your specific dataset.",
  },
  {
    gradient: "from-amber-600/20 to-amber-900/10",
    border: "border-amber-700/30",
    iconBg: "bg-amber-600/20",
    iconColor: "text-amber-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "Optuna Hyperparameter Tuning",
    desc: "Bayesian optimization automatically searches the hyperparameter space over 20 trials to find the best-performing configuration.",
  },
  {
    gradient: "from-emerald-600/20 to-emerald-900/10",
    border: "border-emerald-700/30",
    iconBg: "bg-emerald-600/20",
    iconColor: "text-emerald-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Rich Results Dashboard",
    desc: "Accuracy, precision, recall, F1, R², silhouette scores, confusion matrices, feature importance charts — all rendered instantly.",
  },
  {
    gradient: "from-purple-600/20 to-purple-900/10",
    border: "border-purple-700/30",
    iconBg: "bg-purple-600/20",
    iconColor: "text-purple-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "One-Click Model Export",
    desc: "Download your trained model as a joblib .pkl file or a self-contained Python inference script — ready for production.",
  },
];

const workflowSteps = [
  { id: 1, label: "Model Type", color: "bg-indigo-500", desc: "Classification, Regression, or Clustering" },
  { id: 2, label: "Upload", color: "bg-purple-500", desc: "CSV or Excel file" },
  { id: 3, label: "Describe", color: "bg-blue-500", desc: "Natural language goal" },
  { id: 4, label: "Analyze", color: "bg-cyan-500", desc: "Automated profiling" },
  { id: 5, label: "Pipeline", color: "bg-teal-500", desc: "AI or custom selection" },
  { id: 6, label: "Train", color: "bg-emerald-500", desc: "Tune & run model" },
  { id: 7, label: "Optimize", color: "bg-amber-500", desc: "Bayesian search" },
  { id: 8, label: "Results", color: "bg-orange-500", desc: "Metrics & charts" },
  { id: 9, label: "Export", color: "bg-rose-500", desc: "Download model" },
];

const techStack = [
  { name: "scikit-learn", color: "text-orange-400" },
  { name: "XGBoost", color: "text-cyan-400" },
  { name: "Optuna", color: "text-indigo-400" },
  { name: "Django REST", color: "text-emerald-400" },
  { name: "Next.js 16", color: "text-white" },
  { name: "Tailwind CSS", color: "text-blue-400" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = "/model-type";
    } else {
      window.location.href = "/auth/login";
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center p-4 md:p-8 min-h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* ── Hero ── */}
      <section className="max-w-7xl w-full pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-600/40 text-indigo-300 text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              No-Code · No ML Experience Needed
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Build ML Models<br />
              <span className="text-white">Without Code</span>
            </motion.h1>

            <motion.p
              className="text-lg text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Upload your dataset, pick a task, and let AutoML Studio recommend, train, optimize,
              and export a production-ready model — all through a guided 9-step interface.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.96 }}
                className="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl transition-all duration-300"
              >
                Start Building →
              </motion.button>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-gray-800/80 text-gray-200 border border-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-700/60 transition-all"
                >
                  How it works
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Pipeline visualization */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-linear-to-br from-indigo-600/10 to-purple-600/10 rounded-3xl blur-2xl" />
            <div className="relative bg-gray-900/60 border border-gray-700/60 rounded-2xl p-6 backdrop-blur">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">Automated Workflow</p>
              <div className="space-y-2">
                {workflowSteps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className={`w-6 h-6 rounded-full ${step.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {step.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-200 text-sm font-medium">{step.label}</span>
                      <span className="text-gray-500 text-xs ml-2">— {step.desc}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-7xl w-full my-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center"
            >
              <div className="text-4xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-purple-400 mb-1">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section className="max-w-7xl w-full mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Everything You Need</h2>
          <p className="text-gray-400 max-w-xl mx-auto">From raw data to a deployable model in minutes — no ML expertise required.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`bg-linear-to-br ${f.gradient} border ${f.border} rounded-2xl p-6 transition-all duration-300`}
            >
              <div className={`w-10 h-10 rounded-xl ${f.iconBg} ${f.iconColor} flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="max-w-7xl w-full mb-16"
      >
        <p className="text-center text-xs text-gray-600 uppercase tracking-widest mb-6">Powered by</p>
        <div className="flex flex-wrap justify-center gap-4">
          {techStack.map((t, i) => (
            <div key={i} className={`px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700/50 text-sm font-semibold ${t.color}`}>
              {t.name}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="max-w-7xl w-full mb-12"
      >
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-900/40 to-purple-900/40 rounded-3xl p-10 md:p-16 text-center border border-indigo-700/30">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="relative text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Data?
          </h2>
          <p className="relative text-gray-300 mb-8 max-w-xl mx-auto">
            Upload a CSV, select your task, and get a trained, optimized, export-ready model in under 5 minutes.
          </p>
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(99,102,241,0.5)" }}
            whileTap={{ scale: 0.96 }}
            className="px-10 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl transition-all duration-300"
          >
            Start Building Today →
          </motion.button>
        </div>
      </motion.section>
    </main>
  );
}
