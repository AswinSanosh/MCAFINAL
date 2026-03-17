// src/app/select-pipeline/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000/api";

export default function PipelinePage() {
  const { datasetId, taskType, setJobStatus, setPipelineConfig } = useDataset();
  const [selectedPipeline, setSelectedPipeline] = useState<number | null>(null);
  const [approach, setApproach] = useState<"ai" | "custom">("ai");
  const [aiPipelines, setAiPipelines] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [recError, setRecError] = useState<string | null>(null);

  // Fetch AI recommendations from backend
  useEffect(() => {
    setJobStatus("ready");
    if (!datasetId) { setLoadingRecs(false); return; }
    fetch(`${API_BASE}/recommend/${datasetId}/`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setAiPipelines(data.pipelines ?? []);
      })
      .catch(err => setRecError(err.message ?? "Failed to load recommendations"))
      .finally(() => setLoadingRecs(false));
  }, [datasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Full ML pipeline steps with model options
  const mlSteps = [
    {
      id: "preprocessing",
      title: "Data Preprocessing",
      icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
      options: [
        { name: "StandardScaler", desc: "Zero mean, unit variance" },
        { name: "MinMaxScaler", desc: "Scales to [0, 1]" },
        { name: "RobustScaler", desc: "Robust to outliers" },
        { name: "Imputer (Mean)", desc: "Fill missing values" },
      ],
    },
    {
      id: "feature_engineering",
      title: "Feature Engineering",
      icon: "M9 3v2m6-2v2M9 19v-2m6 2v-2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
      options: [
        { name: "PCA", desc: "Dimensionality reduction" },
        { name: "UMAP", desc: "Non-linear dim. reduction (great for clustering)" },
        { name: "PolynomialFeatures", desc: "Create interaction terms" },
        { name: "SelectKBest", desc: "Top K features by ANOVA F-score" },
        { name: "SMOTE", desc: "Oversample minority class" },
        { name: "None", desc: "Skip this step" },
      ],
    },
    {
      id: "algorithm",
      title: "Learning Algorithm",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      options:
        taskType === "classification"
          ? [
              { name: "RandomForestClassifier", desc: "Ensemble of decision trees" },
              { name: "XGBClassifier", desc: "Gradient boosting" },
              { name: "LogisticRegression", desc: "Linear classifier" },
              { name: "SVC", desc: "Support vector machine" },
              { name: "ExtraTreesClassifier", desc: "Extremely randomised trees" },
              { name: "AdaBoostClassifier", desc: "Adaptive boosting" },
              { name: "MLPClassifier", desc: "Multi-layer perceptron (neural net)" },
              { name: "KNeighborsClassifier", desc: "Instance-based learning" },
            ]
          : taskType === "regression"
          ? [
              { name: "RandomForestRegressor", desc: "Ensemble regression" },
              { name: "XGBRegressor", desc: "Gradient boosting" },
              { name: "LinearRegression", desc: "Ordinary least squares" },
              { name: "Ridge", desc: "L2-regularised linear regression" },
              { name: "Lasso", desc: "L1-regularised (sparse) regression" },
              { name: "SVR", desc: "Support vector regressor" },
              { name: "ExtraTreesRegressor", desc: "Extremely randomised trees" },
              { name: "MLPRegressor", desc: "Multi-layer perceptron (neural net)" },
              { name: "KNeighborsRegressor", desc: "Instance-based regression" },
            ]
          : [
              { name: "KMeans", desc: "Centroid-based clustering" },
              { name: "DBSCAN", desc: "Density-based clustering" },
              { name: "AgglomerativeClustering", desc: "Hierarchical clustering" },
              { name: "GaussianMixture", desc: "Probabilistic Gaussian mixture" },
              { name: "OPTICS", desc: "Ordering points to identify structure" },
            ],
    },
    {
      id: "postprocessing",
      title: "Post-Processing",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      options: [
        { name: "CalibratedClassifierCV", desc: "Probability calibration" },
        { name: "None", desc: "Skip this step" },
      ],
    },
  ];

  const [customSelection, setCustomSelection] = useState<Record<string, string>>({
    preprocessing: "",
    feature_engineering: "",
    algorithm: "",
    postprocessing: "",
  });

  const selectPipeline = (pipelineId: number) => {
    setSelectedPipeline(pipelineId);
    setPipelineConfig({ type: "ai", ai_pipeline_id: pipelineId });
    window.location.href = "/train";
  };

  const handleCustomSelect = (stepId: string, option: string) => {
    setCustomSelection((prev) => ({ ...prev, [stepId]: option }));
  };

  const trainCustomPipeline = () => {
    setPipelineConfig({
      type: "custom",
      preprocessing: customSelection.preprocessing || "StandardScaler",
      feature_engineering: customSelection.feature_engineering || "None",
      algorithm: customSelection.algorithm,
      postprocessing: customSelection.postprocessing || "None",
    });
    window.location.href = "/train";
  };

  const isCustomComplete = customSelection.algorithm !== "";

  const complexityColor: Record<string, string> = {
    Low: "text-emerald-400",
    Medium: "text-amber-400",
    High: "text-red-400",
  };

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
            Choose between AI-recommended pipelines or build your own by selecting components for each step.
          </p>
        </motion.div>

        {/* Approach Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setApproach("ai")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                approach === "ai"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              AI Recommendations
            </button>
            <button
              onClick={() => setApproach("custom")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                approach === "custom"
                  ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Custom Builder
            </button>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        {approach === "ai" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {loadingRecs && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-500 mr-4" />
                <p className="text-indigo-400 text-lg">Generating recommendations…</p>
              </div>
            )}
            {recError && (
              <div className="text-center text-red-400 py-10">
                <p className="text-xl font-bold mb-2">Could not load recommendations</p>
                <p className="text-gray-400">{recError}</p>
                <Link href="/upload" className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                  Upload Dataset
                </Link>
              </div>
            )}
            {!loadingRecs && !recError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {aiPipelines.map((pipeline: any) => (
                  <motion.div
                    key={pipeline.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectPipeline(pipeline.id)}
                    className={`cursor-pointer rounded-2xl border p-6 transition-all duration-300 ${
                      selectedPipeline === pipeline.id
                        ? "border-indigo-500 bg-indigo-900/20 shadow-lg shadow-indigo-500/20"
                        : "border-gray-700 bg-gray-800/50 hover:border-indigo-600/50 hover:bg-gray-800"
                    }`}
                  >
                    {/* Score badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-indigo-300 bg-indigo-900/40 px-2 py-1 rounded-full">Pipeline #{pipeline.id}</span>
                      {pipeline.score && (
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-900/40 px-2 py-1 rounded-full">
                          Score ~{(pipeline.score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">{pipeline.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{pipeline.description}</p>

                    {/* Components */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(pipeline.components ?? []).map((c: string) => (
                        <span key={c} className="text-xs text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded-full">{c}</span>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 border-t border-gray-700 pt-3 mt-2">
                      <span className={`font-medium ${complexityColor[pipeline.complexity] ?? "text-gray-400"}`}>
                        {pipeline.complexity ?? "—"} complexity
                      </span>
                      <span>⏱ {pipeline.trainingTime ?? "—"}</span>
                    </div>

                    <div className="mt-4 w-full py-2 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all">
                      Select &amp; Train →
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Custom Pipeline Builder */}
        {approach === "custom" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="space-y-6 mb-8">
              {mlSteps.map((step) => (
                <div key={step.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    {customSelection[step.id] && (
                      <span className="ml-auto text-sm text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-full">{customSelection[step.id]}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {step.options.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => handleCustomSelect(step.id, opt.name)}
                        className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                          customSelection[step.id] === opt.name
                            ? "border-indigo-500 bg-indigo-900/30 text-white"
                            : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-indigo-600/50 hover:bg-gray-800"
                        }`}
                      >
                        <div className="font-medium text-sm">{opt.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={trainCustomPipeline}
                disabled={!isCustomComplete}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  isCustomComplete
                    ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700 shadow-lg"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isCustomComplete ? "Train Custom Pipeline →" : "Select an Algorithm to Continue"}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Back */}
        <div className="mt-8">
          <Link href="/analyze">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-all border border-gray-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Analysis
            </motion.button>
          </Link>
        </div>
      </div>
    </main>
  );
}
