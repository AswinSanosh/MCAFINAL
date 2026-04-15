// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDataset } from "../../../lib/hooks/useDataset";

const steps = [
  { id: 1, title: "Model Selection",  path: "/model-type" },
  { id: 2, title: "Upload Dataset",   path: "/upload" },
  { id: 3, title: "Describe Data",    path: "/describe" },
  { id: 4, title: "Select Pipeline",  path: "/select-pipeline" },
  { id: 5, title: "Train & Optimize", path: "/train" },
  { id: 6, title: "Results & Export", path: "/results" },
];

const pathToStepId: Record<string, number> = {
  "/model-type":      1,
  "/upload":          2,
  "/select-columns":  2,
  "/describe":        3,
  "/analyze":         3,
  "/select-pipeline": 4,
  "/train":           5,
  "/optimize":        5,
  "/results":         6,
  "/export":          6,
};

const TASK_LABELS: Record<string, string> = {
  classification: "Classification",
  regression:     "Regression",
  clustering:     "Clustering",
};

export default function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on the landing page and about page
  const hiddenOnPaths = ["/", "/about"];
  if (hiddenOnPaths.includes(pathname)) return null;

  const currentStepId = pathToStepId[pathname] || 1;

  const {
    taskType, datasetFilename, selectedColumns, targetColumn,
    description, pipelineConfig, trainingResult, optimizationResult,
    imageZipPath, clearSession,
  } = useDataset();

  const isImageClustering = taskType === "clustering" && !!imageZipPath;

  // How far the user has progressed through the workflow.
  const unlockedUpTo = (() => {
    if (!taskType) return 1;
    if (isImageClustering) {
      if (!pipelineConfig) return 4;
      if (!trainingResult) return 5;
      return 6;
    }
    if (!datasetFilename || selectedColumns.length === 0) return 2;
    if (!description) return 3;
    if (!pipelineConfig) return 4;
    if (!trainingResult) return 5;
    return 6;
  })();

  const isUnlocked = (stepId: number) => stepId <= unlockedUpTo;

  // Data-driven completion — a step is "done" as soon as its data is saved,
  // regardless of which page the user is currently on.
  const isEffectivelyCompleted = (stepId: number): boolean => {
    switch (stepId) {
      case 1: return !!taskType;
      case 2:
        if (isImageClustering) return !!imageZipPath;
        return !!datasetFilename && selectedColumns.length > 0;
      case 3:
        if (isImageClustering) return true; // always skipped in image mode
        return !!description;
      case 4: return !!pipelineConfig;
      case 5: return !!trainingResult;
      case 6: return !!trainingResult;
      default: return false;
    }
  };

  const getStatusLabel = (stepId: number): { label: string; color: string } => {
    if (isImageClustering && stepId === 3) return { label: "Skipped — image mode", color: "text-amber-500/70" };
    if (isEffectivelyCompleted(stepId))    return { label: "Completed", color: "text-blue-400" };
    if (currentStepId === stepId)          return { label: "In Progress", color: "text-indigo-300" };
    return { label: "Pending", color: "text-gray-500" };
  };

  // Returns live detail lines for a step — shown on BOTH active and completed states.
  const getStepDetails = (stepId: number): string[] => {
    switch (stepId) {
      case 1:
        return taskType ? [TASK_LABELS[taskType] ?? taskType] : [];

      case 2: {
        if (isImageClustering) return imageZipPath ? ["Image ZIP uploaded"] : [];
        const lines: string[] = [];
        if (datasetFilename) lines.push(datasetFilename);
        if (targetColumn) lines.push(`Target: ${targetColumn}`);
        const featureCount = selectedColumns.filter(c => c !== targetColumn).length;
        if (featureCount > 0) lines.push(`${featureCount} feature${featureCount !== 1 ? "s" : ""} selected`);
        return lines;
      }

      case 3:
        if (isImageClustering) return ["N/A — using image ZIP"];
        if (!description) return [];
        return [description.length > 50 ? description.slice(0, 48) + "…" : description];

      case 4: {
        if (!pipelineConfig) return [];
        const parts: string[] = [];
        if (pipelineConfig.algorithm) parts.push(pipelineConfig.algorithm);
        if (pipelineConfig.preprocessing && pipelineConfig.preprocessing !== "None")
          parts.push(pipelineConfig.preprocessing);
        if (pipelineConfig.feature_engineering && pipelineConfig.feature_engineering !== "None")
          parts.push(pipelineConfig.feature_engineering);
        if (pipelineConfig.n_clusters) parts.push(`${pipelineConfig.n_clusters} clusters`);
        return parts;
      }

      case 5: {
        if (!trainingResult) return [];
        const m = trainingResult.metrics;
        const lines: string[] = [trainingResult.algorithm];
        if (m.accuracy !== undefined)              lines.push(`Accuracy: ${Math.round(m.accuracy * 100)}%`);
        else if (m.r2 !== undefined)               lines.push(`R²: ${m.r2.toFixed(3)}`);
        else if (m.silhouette_score !== undefined)  lines.push(`Silhouette: ${m.silhouette_score.toFixed(3)}`);
        if (m.f1 !== undefined)                    lines.push(`F1: ${m.f1.toFixed(3)}`);
        if (m.n_clusters !== undefined)            lines.push(`${m.n_clusters} clusters`);
        if (optimizationResult)                    lines.push(`Optimized · ${optimizationResult.n_trials} trials`);
        return lines;
      }

      case 6: {
        if (!trainingResult) return [];
        const m = trainingResult.metrics;
        const lines: string[] = [];
        if (m.accuracy !== undefined)              lines.push(`Accuracy: ${Math.round(m.accuracy * 100)}%`);
        else if (m.r2 !== undefined)               lines.push(`R²: ${m.r2.toFixed(3)}`);
        else if (m.silhouette_score !== undefined)  lines.push(`Silhouette: ${m.silhouette_score.toFixed(3)}`);
        if (optimizationResult)                    lines.push(`Best score: ${optimizationResult.best_score.toFixed(3)}`);
        lines.push("Ready to export");
        return lines;
      }

      default:
        return [];
    }
  };

  return (
    <aside className="hidden md:block w-72 bg-linear-to-b from-gray-900 to-gray-950 border-r border-gray-800 p-6 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto shrink-0">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-200 mb-1">AutoML Workflow</h2>
        <p className="text-xs text-gray-500 uppercase tracking-wider">Your progress</p>
      </div>

      <nav className="space-y-3">
        {steps.map((step) => {
          const isActive    = currentStepId === step.id;
          const isCompleted = isEffectivelyCompleted(step.id);
          const locked      = !isUnlocked(step.id);
          const skipped     = isImageClustering && step.id === 3;
          const { label: statusLabel, color: statusColor } = getStatusLabel(step.id);
          const details = locked ? [] : getStepDetails(step.id);
          const hasDetails = details.length > 0;

          const cardContent = (
            <div
              className={`group p-4 rounded-xl transition-all duration-300 border ${
                locked
                  ? "bg-gray-800/20 border-gray-800/50 opacity-50 cursor-not-allowed"
                  : isActive
                  ? "bg-indigo-900/20 border-indigo-700/50 shadow-[0_4px_12px_-6px_rgba(99,102,241,0.4)]"
                  : isCompleted
                  ? skipped
                    ? "bg-amber-900/10 border-amber-800/20"
                    : "bg-blue-900/10 border-blue-800/30"
                  : "bg-gray-800/30 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0 overflow-hidden flex-1">
                  {/* Step badge */}
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      locked
                        ? "bg-gray-700/50 text-gray-600"
                        : isActive
                        ? "bg-indigo-600 text-white shadow-md"
                        : isCompleted
                        ? skipped ? "bg-amber-700/60 text-amber-300" : "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {locked ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : isCompleted && !skipped ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : skipped ? "⤵" : step.id}
                  </span>

                  {/* Title + details */}
                  <div className="min-w-0 overflow-hidden flex-1">
                    <h3 className={`font-medium text-sm ${
                      locked ? "text-gray-600"
                      : isActive ? "text-white"
                      : isCompleted ? skipped ? "text-amber-300/70" : "text-blue-200"
                      : "text-gray-300"
                    }`}>
                      {step.title}
                    </h3>

                    {/* Live detail lines — shown while active OR completed */}
                    <AnimatePresence mode="wait">
                      {!locked && hasDetails ? (
                        <motion.div
                          key={details.join("|")}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18 }}
                          className="mt-1 space-y-0.5"
                        >
                          {details.map((line, i) => (
                            <span
                              key={i}
                              className={`block text-xs truncate ${
                                skipped ? "text-amber-500/60"
                                : isActive ? "text-indigo-300/80"
                                : isCompleted ? "text-blue-400"
                                : "text-gray-500"
                              }`}
                            >
                              › {line}
                            </span>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.span
                          key="status"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`text-xs mt-0.5 block ${locked ? "text-gray-600" : statusColor}`}
                        >
                          {locked ? "Complete previous step" : statusLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ml-2 ${
                  locked ? "bg-gray-700"
                  : isActive ? "bg-indigo-400 animate-pulse"
                  : isCompleted ? skipped ? "bg-amber-600/60" : "bg-blue-400"
                  : "bg-gray-600"
                }`} />
              </div>
            </div>
          );

          return (
            <motion.div
              key={step.id}
              whileHover={locked ? {} : { x: 4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {locked ? cardContent : <Link href={step.path}>{cardContent}</Link>}
            </motion.div>
          );
        })}
      </nav>

      <div className="mt-12 p-3 bg-gray-800/30 rounded-lg border border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          💡 Complete each step to unlock the next. You can revisit earlier steps freely.
        </p>
      </div>

      {unlockedUpTo > 1 && (
        <button
          onClick={() => {
            if (confirm("Start over? All current session progress will be cleared.")) {
              clearSession();
              window.location.href = "/model-type";
            }
          }}
          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-red-400 bg-transparent hover:bg-red-900/10 border border-transparent hover:border-red-800/40 rounded-lg transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start Over
        </button>
      )}
    </aside>
  );
}