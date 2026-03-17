// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useDataset } from "../../../lib/hooks/useDataset";

const steps = [
  { id: 1, title: "Model Selection", path: "/model-type" },
  { id: 2, title: "Upload Dataset", path: "/upload" },
  { id: 3, title: "Describe Data", path: "/describe" },
  { id: 4, title: "Select Pipeline", path: "/select-pipeline" },
  { id: 5, title: "Train & Optimize", path: "/train" },
  { id: 6, title: "Results & Export", path: "/results" },
];

const pathToStepId: Record<string, number> = {
  "/model-type": 1,
  "/upload": 2,
  "/select-columns": 2,
  "/describe": 3,
  "/analyze": 3,
  "/select-pipeline": 4,
  "/train": 5,
  "/optimize": 5,
  "/results": 6,
  "/export": 6,
};

// Status labels
const getStatusLabel = (stepId: number, currentStepId: number): { label: string; color: string } => {
  if (currentStepId > stepId) return { label: "Completed", color: "text-emerald-400" };
  if (currentStepId === stepId) return { label: "In Progress", color: "text-indigo-300" };
  return { label: "Pending", color: "text-gray-500" };
};

export default function Sidebar() {
  const pathname = usePathname();
  const currentStepId = pathToStepId[pathname] || 1;

  const { taskType, datasetFilename, selectedColumns, description, pipelineConfig, trainingResult } = useDataset();

  // A step is unlocked if all prerequisites are satisfied.
  // Each step also unlocks the one after it so the user can proceed.
  const unlockedUpTo = (() => {
    if (!taskType) return 1;                          // only Model Selection
    if (!datasetFilename || selectedColumns.length === 0) return 2; // up to Upload
    if (!description) return 3;                       // up to Describe
    if (!pipelineConfig) return 4;                    // up to Select Pipeline
    if (!trainingResult) return 5;                    // up to Train
    return 6;                                         // all unlocked
  })();

  const isUnlocked = (stepId: number) => stepId <= unlockedUpTo;

  const getStepDetails = (stepId: number): string[] => {
    switch (stepId) {
      case 1:
        return taskType ? [taskType.charAt(0).toUpperCase() + taskType.slice(1)] : [];
      case 2: {
        const lines: string[] = [];
        if (datasetFilename) lines.push(datasetFilename);
        if (selectedColumns.length > 0) {
          selectedColumns.slice(0, 3).forEach(c => lines.push(c));
          if (selectedColumns.length > 3) lines.push(`+${selectedColumns.length - 3} more`);
        }
        return lines;
      }
      case 3:
        if (!description) return [];
        return [description.length > 45 ? description.slice(0, 42) + "\u2026" : description];
      case 4: {
        if (!pipelineConfig) return [];
        const parts: string[] = [];
        if (pipelineConfig.preprocessing) parts.push(pipelineConfig.preprocessing);
        if (pipelineConfig.feature_engineering) parts.push(pipelineConfig.feature_engineering);
        if (pipelineConfig.algorithm) parts.push(pipelineConfig.algorithm);
        return parts;
      }
      case 5: {
        if (!trainingResult) return [];
        const m = trainingResult.metrics;
        const lines: string[] = [trainingResult.algorithm];
        if (m.accuracy !== undefined) lines.push(`Accuracy: ${Math.round(m.accuracy * 100)}%`);
        else if (m.r2 !== undefined) lines.push(`R\u00b2: ${m.r2.toFixed(3)}`);
        else if (m.silhouette_score !== undefined) lines.push(`Silhouette: ${m.silhouette_score.toFixed(3)}`);
        return lines;
      }
      default:
        return [];
    }
  };

  return (
    <aside className="hidden md:block w-72 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 p-6 pt-15 h-screen sticky top-0 overflow-y-auto shrink-0">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-200 mb-1">AutoML Workflow</h2>
        <p className="text-xs text-gray-500 uppercase tracking-wider">Your progress</p>
      </div>

      <nav className="space-y-3">
        {steps.map((step) => {
          const isActive = currentStepId === step.id;
          const isCompleted = currentStepId > step.id;
          const locked = !isUnlocked(step.id);
          const { label: statusLabel, color: statusColor } = getStatusLabel(step.id, currentStepId);

          const cardContent = (
            <div
              className={`group p-4 rounded-xl transition-all duration-300 border ${
                locked
                  ? "bg-gray-800/20 border-gray-800/50 opacity-50 cursor-not-allowed"
                  : isActive
                  ? "bg-indigo-900/20 border-indigo-700/50 shadow-[0_4px_12px_-6px_rgba(99,102,241,0.4)]"
                  : isCompleted
                  ? "bg-emerald-900/10 border-emerald-800/30"
                  : "bg-gray-800/30 border-gray-800 hover:border-gray-700"
              }`}
            >
              {/* Step Number Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0 overflow-hidden">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      locked
                        ? "bg-gray-700/50 text-gray-600"
                        : isActive
                        ? "bg-indigo-600 text-white shadow-md"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {locked ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : step.id}
                  </span>
                  <div className="min-w-0 overflow-hidden">
                    <h3 className={`font-medium ${
                      locked ? "text-gray-600" : isActive ? "text-white" : isCompleted ? "text-emerald-200" : "text-gray-300"
                    }`}>
                      {step.title}
                    </h3>
                    {!locked && isCompleted ? (
                      <div className="mt-1 space-y-0.5">
                        {getStepDetails(step.id).length > 0
                          ? getStepDetails(step.id).map((line, i) => (
                              <span key={i} className="block text-xs text-emerald-400 truncate">
                                › {line}
                              </span>
                            ))
                          : <span className="text-xs text-emerald-400">Completed</span>
                        }
                      </div>
                    ) : (
                      <span className={`text-xs mt-1 ${
                        locked ? "text-gray-600" : statusColor
                      }`}>
                        {locked ? "Complete previous step" : statusLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator Dot */}
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  locked ? "bg-gray-700" :
                  isActive ? "bg-indigo-400 animate-pulse" :
                  isCompleted ? "bg-emerald-400" : "bg-gray-600"
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
              {locked ? (
                cardContent
              ) : (
                <Link href={step.path}>{cardContent}</Link>
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Footer Note */}
      <div className="mt-12 p-3 bg-gray-800/30 rounded-lg border border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          💡 Complete each step to unlock the next. You can revisit earlier steps freely.
        </p>
      </div>
    </aside>
  );
}