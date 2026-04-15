// src/app/select-pipeline/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

export default function PipelinePage() {
  const { datasetId, taskType, setJobStatus, setPipelineConfig, imageZipPath } = useDataset();
  const isImageClustering = taskType === 'clustering' && !!imageZipPath;
  const [selectedPipeline, setSelectedPipeline] = useState<number | null>(null);
  const [approach, setApproach] = useState<"ai" | "custom">("ai");
  const [aiPipelines, setAiPipelines] = useState<any[]>([]);
  const [topPick, setTopPick] = useState<number | null>(null);
  const [aiPowered, setAiPowered] = useState(false);
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
        setTopPick(data.top_pick ?? null);
        setAiPowered(data.ai_powered ?? false);
      })
      .catch(err => setRecError(err.message ?? "Failed to load recommendations"))
      .finally(() => setLoadingRecs(false));
  }, [datasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Force custom builder when doing image clustering (no tabular dataset for AI recs)
  useEffect(() => {
    if (isImageClustering) setApproach("custom");
  }, [isImageClustering]);

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
          : isImageClustering
          ? [
              { name: "KMeans",                  desc: "Centroid-based clustering" },
              { name: "DBSCAN",                  desc: "Density-based, finds noise" },
              { name: "AgglomerativeClustering", desc: "Hierarchical bottom-up clustering" },
              { name: "GaussianMixture",         desc: "Probabilistic mixture model" },
              { name: "SpectralClustering",      desc: "Graph-based manifold clustering" },
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

  const selectPipeline = (pipeline: any) => {
    setSelectedPipeline(pipeline.id);
    setPipelineConfig({
      type: "ai",
      ai_pipeline_id: pipeline.id,
      algorithm: pipeline.algorithm,
      preprocessing: pipeline.preprocessing,
      feature_engineering: pipeline.feature_engineering,
      postprocessing: pipeline.postprocessing,
    });
    window.location.href = "/train";
  };

  const handleCustomSelect = (stepId: string, option: string) => {
    setCustomSelection((prev) => ({ ...prev, [stepId]: option }));
  };

  const trainCustomPipeline = () => {
    setPipelineConfig({
      type: "custom",
      preprocessing: isImageClustering ? "None" : (customSelection.preprocessing || "StandardScaler"),
      feature_engineering: isImageClustering ? "None" : (customSelection.feature_engineering || "None"),
      algorithm: customSelection.algorithm,
      postprocessing: isImageClustering ? "None" : (customSelection.postprocessing || "None"),
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
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-purple-400 mb-4">
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
                  ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              AI Recommendations
            </button>
            <button
              onClick={() => setApproach("custom")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                approach === "custom"
                  ? "bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
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

            {/* AI-powered indicator */}
            <AnimatePresence>
              {!loadingRecs && aiPowered && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 mb-8"
                >
                  <span className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-700/40 rounded-full text-sm text-purple-300">
                    <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Ranked by AI · analysed your dataset samples &amp; description
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {loadingRecs && (
              <div className="flex flex-col justify-center items-center py-20 gap-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500" />
                  <div className="animate-spin rounded-full h-16 w-16 border-r-4 border-purple-500/30 absolute inset-0" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
                </div>
                <p className="text-indigo-400 text-lg font-medium">Asking AI to analyse your dataset…</p>
                <p className="text-gray-500 text-sm">Sending samples to OpenRouter · this may take ~10 s</p>
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
                {aiPipelines.map((pipeline: any, idx: number) => {
                  const isTop = pipeline.top_pick === true;
                  const rankNum = idx + 1;
                  return (
                    <motion.div
                      key={pipeline.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectPipeline(pipeline)}
                      className={`relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 ${
                        selectedPipeline === pipeline.id
                          ? "border-indigo-500 bg-indigo-900/20 shadow-lg shadow-indigo-500/20"
                          : isTop
                          ? "border-purple-500/60 bg-purple-900/10 shadow-md shadow-purple-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-indigo-600/50 hover:bg-gray-800"
                      }`}
                    >
                      {/* Top pick ribbon */}
                      {isTop && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-linear-to-r from-purple-600 to-indigo-600 rounded-full text-xs font-bold text-white shadow-md whitespace-nowrap">
                          ✦ AI Top Pick
                        </div>
                      )}

                      {/* Header row: rank + pipeline id + score */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          {aiPowered && (
                            <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                              rankNum === 1 ? "bg-yellow-500/20 text-yellow-300"
                              : rankNum === 2 ? "bg-gray-400/20 text-gray-300"
                              : rankNum === 3 ? "bg-amber-700/20 text-amber-600"
                              : "bg-gray-700/40 text-gray-500"
                            }`}>
                              {rankNum}
                            </span>
                          )}
                          <span className="text-xs font-bold text-indigo-300 bg-indigo-900/40 px-2 py-1 rounded-full">
                            Pipeline #{pipeline.id}
                          </span>
                        </div>
                        {pipeline.score && (
                          <span className="text-xs font-bold text-blue-300 bg-blue-900/40 px-2 py-1 rounded-full">
                            ~{(pipeline.score * 100).toFixed(0)}% score
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 leading-snug">{pipeline.name}</h3>
                      <p className="text-gray-400 text-sm mb-3">{pipeline.description}</p>

                      {/* AI reason */}
                      {pipeline.ai_reason && (
                        <div className="mb-4 px-3 py-2 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                          <p className="text-xs text-purple-300 leading-relaxed">
                            <span className="font-semibold text-purple-200">AI: </span>
                            {pipeline.ai_reason}
                          </p>
                        </div>
                      )}

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

                      <div className={`mt-4 w-full py-2 text-center rounded-xl font-bold text-sm transition-all ${
                        isTop
                          ? "bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                          : "bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                      }`}>
                        Select &amp; Train →
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Custom Pipeline Builder */}
        {approach === "custom" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {isImageClustering && (
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/40 rounded-xl text-blue-300 text-sm flex items-center gap-3">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>Image clustering mode — pick an algorithm below. PCA preprocessing and pixel feature extraction are handled automatically.</span>
              </div>
            )}
            <div className="space-y-6 mb-8">
              {(isImageClustering ? mlSteps.filter(s => s.id === "algorithm") : mlSteps).map((step) => (
                <div key={step.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    {customSelection[step.id] && (
                      <span className="ml-auto text-sm text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full">{customSelection[step.id]}</span>
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
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isCustomComplete ? "Train Custom Pipeline →" : "Select an Algorithm to Continue"}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Back to Analysis */}
        <div className="flex justify-start mt-8">
          <Link href="/analyze">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Analysis
            </motion.button>
          </Link>
        </div>
      </div>
    </main>
    </ProtectedRoute>
  );
}
