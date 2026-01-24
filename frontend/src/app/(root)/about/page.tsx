// src/app/about/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
  const features = [
    {
      title: "AI-Powered Recommendations",
      description: "Our advanced algorithms suggest the best ML pipelines for your specific data and goals.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "No Coding Required",
      description: "Build, train, and deploy ML models without writing a single line of code.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      title: "Automatic Optimization",
      description: "Hyperparameter tuning and model optimization handled automatically.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      title: "Easy Deployment",
      description: "Export your models in multiple formats for seamless integration.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    }
  ];

  const steps = [
    { number: "01", title: "Upload Data", description: "Upload your dataset (CSV or Excel)" },
    { number: "02", title: "Select Task", description: "Choose your ML task: Classification, Clustering, or Regression" },
    { number: "03", title: "AI Recommendation", description: "Our AI suggests the best pipeline for your data" },
    { number: "04", title: "Train & Optimize", description: "We automatically train, tune, and optimize your model" },
    { number: "05", title: "Deploy", description: "Download and deploy your model" }
  ];

  const audiences = [
    { title: "Students", description: "Learning ML concepts without getting bogged down in code" },
    { title: "Analysts", description: "Without coding experience who need predictive insights" },
    { title: "Researchers", description: "Needing quick prototyping for experiments" },
    { title: "Business Teams", description: "Wanting to predict outcomes and make data-driven decisions" }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
            About AutoML Studio
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We built this platform to democratize machine learning. No coding required — just your data and goals.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)] shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-[var(--color-accent)] mb-12">How It Works</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 hidden md:block"></div>

            <div className="space-y-12">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6`}
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold z-10">
                    {step.number}
                  </div>
                  <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg flex-1 max-w-md">
                    <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Who Is This For Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-[var(--color-accent)] mb-12">Who Is This For?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((audience, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg"
              >
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{audience.title}</h3>
                <p className="text-gray-400">{audience.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center py-12"
        >
          <h2 className="text-3xl font-bold text-[var(--color-text)] mb-6">Ready to get started?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Join thousands of users who have transformed their data into powerful machine learning models.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-[var(--color-bg)] text-[var(--color-text)] rounded-lg font-bold border border-[var(--color-border)] hover:bg-gray-700/50 transition"
              >
                Back to Home
              </motion.button>
            </Link>
            <Link href="/model-type">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}