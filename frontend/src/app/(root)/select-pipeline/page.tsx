// src/app/select-pipeline/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PipelinePage() {
  const { datasetId, taskType, setJobStatus } = useDataset();
  const [selectedPipeline, setSelectedPipeline] = useState<number | null>(null);
  const [approach, setApproach] = useState<'ai' | 'custom'>('ai');

  // AI-recommended pipelines
  const mockPipelines = [
    {
      id: 1,
      name: "Random Forest + SMOTE + StandardScaler",
      score: 0.87,
      description: "Balances classes and scales features for robust classification.",
      components: ["StandardScaler", "SMOTE", "RandomForestClassifier"],
      complexity: "Medium",
      trainingTime: "5-10 min",
      memoryUsage: "Medium"
    },
    {
      id: 2,
      name: "XGBoost + MinMaxScaler",
      score: 0.85,
      description: "High-performance gradient boosting with feature scaling.",
      components: ["MinMaxScaler", "XGBClassifier"],
      complexity: "High",
      trainingTime: "10-15 min",
      memoryUsage: "High"
    },
    {
      id: 3,
      name: "Logistic Regression + PCA",
      score: 0.82,
      description: "Simple linear model with dimensionality reduction.",
      components: ["PCA", "LogisticRegression"],
      complexity: "Low",
      trainingTime: "2-5 min",
      memoryUsage: "Low"
    },
  ];

  // Full ML pipeline steps with model options
  const mlSteps = [
    {
      id: 'preprocessing',
      title: 'Data Preprocessing',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      options: [
        { name: 'StandardScaler', desc: 'Zero mean, unit variance', type: 'numeric' },
        { name: 'MinMaxScaler', desc: 'Scales to [0, 1]', type: 'numeric' },
        { name: 'RobustScaler', desc: 'Robust to outliers', type: 'numeric' },
        { name: 'OneHotEncoder', desc: 'Categorical → binary', type: 'categorical' },
        { name: 'LabelEncoder', desc: 'Categorical → numeric', type: 'categorical' },
        { name: 'Imputer (Mean)', desc: 'Fill missing values', type: 'missing' },
      ]
    },
    {
      id: 'feature_engineering',
      title: 'Feature Engineering',
      icon: 'M9 3v2m6-2v2M9 19v-2m6 2v-2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      options: [
        { name: 'PCA', desc: 'Dimensionality reduction', type: 'transform' },
        { name: 'PolynomialFeatures', desc: 'Create interaction terms', type: 'transform' },
        { name: 'SelectKBest', desc: 'Top K features', type: 'selection' },
        { name: 'RFE', desc: 'Recursive feature elimination', type: 'selection' },
        { name: 'SMOTE', desc: 'Oversample minority class', type: 'sampling' },
        { name: 'None', desc: 'Skip this step', type: 'none' },
      ]
    },
    {
      id: 'algorithm',
      title: 'Learning Algorithm',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      options: taskType === 'classification'
        ? [
            { name: 'RandomForestClassifier', desc: 'Ensemble of decision trees', type: 'tree' },
            { name: 'XGBClassifier', desc: 'Gradient boosting', type: 'boosting' },
            { name: 'LogisticRegression', desc: 'Linear classifier', type: 'linear' },
            { name: 'SVC', desc: 'Support vector machine', type: 'kernel' },
            { name: 'KNeighborsClassifier', desc: 'Instance-based learning', type: 'neighbors' },
          ]
        : taskType === 'regression'
        ? [
            { name: 'RandomForestRegressor', desc: 'Ensemble regression', type: 'tree' },
            { name: 'XGBRegressor', desc: 'Gradient boosting', type: 'boosting' },
            { name: 'LinearRegression', desc: 'Ordinary least squares', type: 'linear' },
            { name: 'SVR', desc: 'Support vector regressor', type: 'kernel' },
            { name: 'KNeighborsRegressor', desc: 'Instance-based regression', type: 'neighbors' },
          ]
        : [
            { name: 'KMeans', desc: 'Centroid-based clustering', type: 'partition' },
            { name: 'DBSCAN', desc: 'Density-based clustering', type: 'density' },
            { name: 'AgglomerativeClustering', desc: 'Hierarchical clustering', type: 'hierarchical' },
            { name: 'GaussianMixture', desc: 'Probabilistic clustering', type: 'probabilistic' },
          ]
    },
    {
      id: 'postprocessing',
      title: 'Post-Processing',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      options: [
        { name: 'CalibratedClassifierCV', desc: 'Probability calibration', type: 'calibration' },
        { name: 'ThresholdOptimizer', desc: 'Optimize decision threshold', type: 'threshold' },
        { name: 'None', desc: 'Skip this step', type: 'none' },
      ]
    }
  ];

  // Custom pipeline selections
  const [customSelection, setCustomSelection] = useState<Record<string, string>>({
    preprocessing: '',
    feature_engineering: '',
    algorithm: '',
    postprocessing: '',
  });

  useEffect(() => {
    setJobStatus('ready');
  }, []);

  const selectPipeline = (pipelineId: number) => {
    setSelectedPipeline(pipelineId);
    console.log("Selected pipeline:", pipelineId);
    window.location.href = '/train';
  };

  const handleCustomSelect = (stepId: string, option: string) => {
    setCustomSelection(prev => ({ ...prev, [stepId]: option }));
  };

  const isCustomComplete = customSelection.algorithm !== '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Build Your ML Pipeline
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose between AI-recommended pipelines or build your own by selecting components for each step of the machine learning workflow.
          </p>
        </motion.div>

        {/* Approach Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setApproach('ai')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                approach === 'ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Recommendations
              </div>
            </button>
            <button
              onClick={() => setApproach('custom')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                approach === 'custom'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Custom Pipeline
              </div>
            </button>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        {approach === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">AI-Powered Recommendations</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Our AI analyzed your {taskType} task and recommends these optimized pipelines.
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {mockPipelines.map((pipeline, index) => (
                <motion.div
                  key={pipeline.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ y: -5 }}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-lg ${
                    selectedPipeline === pipeline.id
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-900/20 to-purple-900/20'
                      : 'border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:border-purple-500'
                  }`}
                  onClick={() => selectPipeline(pipeline.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold text-white">{pipeline.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          pipeline.complexity === 'Low' ? 'bg-emerald-900/30 text-emerald-400' :
                          pipeline.complexity === 'Medium' ? 'bg-amber-900/30 text-amber-400' :
                          'bg-purple-900/30 text-purple-400'
                        }`}>
                          {pipeline.complexity} Complexity
                        </span>
                      </div>
                      <p className="text-gray-400 mb-4">{pipeline.description}</p>

                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {pipeline.trainingTime} training
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                          {pipeline.memoryUsage} memory
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {pipeline.components.map((comp: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-gray-800/50 text-indigo-300 rounded-lg text-sm border border-gray-700">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center">
                      <div className="text-3xl font-bold text-indigo-400 mb-1">{pipeline.score.toFixed(2)}</div>
                      <div className="text-sm text-gray-400">Estimated Accuracy</div>
                      <div className="mt-2">
                        <button
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            selectedPipeline === pipeline.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {selectedPipeline === pipeline.id ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Custom Pipeline Builder */}
        {approach === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Build Your Custom Pipeline</h2>
              <p className="text-gray-400 max-w-3xl mx-auto">
                Select one component for each step of the machine learning workflow to create a pipeline tailored to your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {mlSteps.map((step, stepIndex) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * stepIndex }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                    {step.title}
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {step.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        onClick={() => handleCustomSelect(step.id, option.name)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          customSelection[step.id] === option.name
                            ? 'border-indigo-500 bg-indigo-900/20'
                            : 'border-gray-700 bg-gray-800/30 hover:border-indigo-400'
                        }`}
                      >
                        <div className="font-medium text-white">{option.name}</div>
                        <div className="text-sm text-gray-400 mt-1">{option.desc}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Selected Pipeline Preview */}
            {(customSelection.preprocessing || customSelection.feature_engineering || customSelection.algorithm) && (
              <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-700/50 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-emerald-300 mb-4">Your Custom Pipeline</h3>
                <div className="flex flex-wrap gap-2">
                  {customSelection.preprocessing && (
                    <span className="px-3 py-1.5 bg-emerald-900/30 text-emerald-300 rounded-lg text-sm border border-emerald-700">
                      {customSelection.preprocessing}
                    </span>
                  )}
                  {customSelection.feature_engineering && customSelection.feature_engineering !== 'None' && (
                    <span className="px-3 py-1.5 bg-emerald-900/30 text-emerald-300 rounded-lg text-sm border border-emerald-700">
                      {customSelection.feature_engineering}
                    </span>
                  )}
                  {customSelection.algorithm && (
                    <span className="px-3 py-1.5 bg-emerald-900/30 text-emerald-300 rounded-lg text-sm border border-emerald-700">
                      {customSelection.algorithm}
                    </span>
                  )}
                  {customSelection.postprocessing && customSelection.postprocessing !== 'None' && (
                    <span className="px-3 py-1.5 bg-emerald-900/30 text-emerald-300 rounded-lg text-sm border border-emerald-700">
                      {customSelection.postprocessing}
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/analyze" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Analysis
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (approach === 'ai' && selectedPipeline) {
                selectPipeline(selectedPipeline);
              } else if (approach === 'custom' && isCustomComplete) {
                // Save custom pipeline
                console.log("Custom pipeline:", customSelection);
                window.location.href = '/train';
              }
            }}
            disabled={(approach === 'ai' && !selectedPipeline) || (approach === 'custom' && !isCustomComplete)}
            className={`flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg flex items-center justify-center ${
              (approach === 'ai' && selectedPipeline) || (approach === 'custom' && isCustomComplete)
                ? approach === 'ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
                : 'bg-gray-700 cursor-not-allowed'
            }`}
          >
            Train Selected Pipeline
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </main>
  );
}