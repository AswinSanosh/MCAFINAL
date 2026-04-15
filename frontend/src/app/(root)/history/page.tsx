"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

export default function SessionHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/user-sessions/`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setSessions(data.sessions ?? []))
      .catch((err) => setError(err.message ?? "Failed to fetch session history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
        <h1 className="text-3xl font-bold text-emerald-400 mb-8">Session History</h1>
        {loading && <div className="text-gray-300">Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && sessions.length === 0 && (
          <div className="text-gray-400">No previous sessions found.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 rounded-xl p-6 border border-gray-700 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-white">
                  {session.session_name || `Session #${session.id}`}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(session.started_at).toLocaleString()}
                </div>
              </div>
              <div className="text-gray-300 mb-2">
                <span className="font-semibold">Type:</span> {session.model_type}
              </div>
              <div className="text-gray-400 text-sm mb-2">
                {session.description}
              </div>
              <div className="mb-2">
                <span className="font-semibold text-gray-300">Jobs:</span>
                <ul className="ml-4 list-disc text-gray-400 text-sm">
                  {session.jobs.map((job: any) => (
                    <li key={job.id}>
                      {job.algorithm} ({job.pipeline_type}) — <span className="text-emerald-400">{job.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={`/results?session=${session.id}`} className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-sm">
                View Results
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}
