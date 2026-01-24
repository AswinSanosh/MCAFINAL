// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const steps = [
  { id: 1, title: "Model Selection", path: "/model-type" },
  { id: 2, title: "Upload Dataset", path: "/upload" },
  { id: 3, title: "Describe Data", path: "/describe" },
  { id: 4, title: "Select Pipeline", path: "/select-pipeline" }, // ← Updated to /recommend
  { id: 5, title: "Train & Optimize", path: "/train" },
  { id: 6, title: "Results & Export", path: "/results" },
];

const pathToStepId: Record<string, number> = {
  "/model-type": 1,
  "/upload": 2,
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
          const { label: statusLabel, color: statusColor } = getStatusLabel(step.id, currentStepId);

          return (
            <motion.div
              key={step.id}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link href={step.path}>
                <div
                  className={`relative group p-4 rounded-xl transition-all duration-300 border ${
                    isActive
                      ? "bg-indigo-900/20 border-indigo-700/50 shadow-[0_4px_12px_-6px_rgba(99,102,241,0.4)]"
                      : isCompleted
                      ? "bg-emerald-900/10 border-emerald-800/30"
                      : "bg-gray-800/30 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {/* Step Number Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md"
                            : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {step.id}
                      </span>
                      <div>
                        <h3 className={`font-medium ${
                          isActive ? "text-white" : isCompleted ? "text-emerald-200" : "text-gray-300"
                        }`}>
                          {step.title}
                        </h3>
                        <span className={`text-xs mt-1 ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator Dot */}
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      isActive ? "bg-indigo-400 animate-pulse" :
                      isCompleted ? "bg-emerald-400" : "bg-gray-600"
                    }`} />
                  </div>

                  {/* Progress Line (between steps) */}
                  {step.id < steps.length && (
                    <div className="absolute left-4 bottom-0 w-0.5 h-6 -translate-y-1/2">
                      <div className={`w-full h-full ${
                        currentStepId > step.id ? "bg-emerald-500" : "bg-gray-700"
                      }`} />
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer Note */}
      <div className="mt-12 p-3 bg-gray-800/30 rounded-lg border border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          💡 Click any step to revisit and adjust settings
        </p>
      </div>
    </aside>
  );
}