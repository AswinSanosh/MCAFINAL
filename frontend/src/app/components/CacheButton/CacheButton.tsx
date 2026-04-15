"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDataset } from "../../lib/hooks/useDataset";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

type Phase = "idle" | "confirm" | "clearing" | "done" | "error";

export default function CacheButton() {
  const { clearSession } = useDataset();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<{ freed_mb: number; deleted_datasets: number; deleted_jobs: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClear = async () => {
    setPhase("clearing");
    setErrorMsg(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/clear-cache/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to clear cache");
      setResult({ freed_mb: data.freed_mb, deleted_datasets: data.deleted_datasets, deleted_jobs: data.deleted_jobs });
      clearSession();
      setPhase("done");
      setTimeout(() => { window.location.href = "/model-type"; }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Unknown error");
      setPhase("error");
      setTimeout(() => setPhase("idle"), 4000);
    }
  };

  return (
    <>
      {/* Fixed button — bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Toast-style feedback panel */}
        <AnimatePresence>
          {(phase === "confirm" || phase === "done" || phase === "error") && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`rounded-2xl border p-4 shadow-2xl w-72 ${
                phase === "confirm"
                  ? "bg-gray-900 border-gray-700"
                  : phase === "done"
                  ? "bg-emerald-950 border-emerald-800/60"
                  : "bg-red-950 border-red-800/60"
              }`}
            >
              {phase === "confirm" && (
                <>
                  <p className="text-sm font-semibold text-white mb-1">Remove all cached data?</p>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    This will permanently delete all uploaded datasets and saved model files from the server to free up storage.
                    Your current session will also be cleared.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPhase("idle")}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClear}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      Yes, delete all
                    </button>
                  </div>
                </>
              )}

              {phase === "done" && result && (
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-300 mb-1">Cache cleared!</p>
                    <p className="text-xs text-gray-400">
                      {result.deleted_datasets} dataset{result.deleted_datasets !== 1 ? "s" : ""} &amp; {result.deleted_jobs} model{result.deleted_jobs !== 1 ? "s" : ""} removed · <span className="text-emerald-400 font-mono">{result.freed_mb} MB</span> freed
                    </p>
                  </div>
                </div>
              )}

              {phase === "error" && (
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-300 mb-1">Failed to clear cache</p>
                    <p className="text-xs text-gray-400">{errorMsg}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The trigger button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (phase === "idle") setPhase("confirm");
            else if (phase === "confirm") setPhase("idle");
          }}
          disabled={phase === "clearing"}
          title="Remove cached datasets and models"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl border text-sm font-semibold transition-all duration-200 ${
            phase === "clearing"
              ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
              : phase === "confirm"
              ? "bg-red-900/80 border-red-700/60 text-red-300"
              : "bg-gray-900/90 border-gray-700 text-gray-300 hover:border-red-700/50 hover:text-red-400 backdrop-blur-sm"
          }`}
        >
          {phase === "clearing" ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-white animate-spin" />
              Clearing…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove Cache
            </>
          )}
        </motion.button>
      </div>
    </>
  );
}
