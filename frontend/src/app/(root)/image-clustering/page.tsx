// src/app/(root)/image-clustering/page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const API_BASE = "http://localhost:8000/api";
const MEDIA_BASE = "http://localhost:8000/media";
const POLL_INTERVAL_MS = 2500;

type Phase = "upload" | "configure" | "training" | "results";

interface ClusterResult {
  task_type: string;
  algorithm: string;
  n_images: number;
  n_clusters: number;
  cluster_distribution: Record<string, number>;
  sample_images: Record<string, string[]>;
  silhouette_score?: number;
  pca_components?: number;
  explained_variance?: number;
}

const ALGORITHMS = [
  { id: "KMeans",                label: "K-Means",            desc: "Fast centroid-based clustering" },
  { id: "DBSCAN",                label: "DBSCAN",             desc: "Density-based, handles noise" },
  { id: "AgglomerativeClustering", label: "Agglomerative",    desc: "Hierarchical bottom-up clustering" },
  { id: "GaussianMixture",       label: "Gaussian Mixture",   desc: "Probabilistic soft assignments" },
  { id: "SpectralClustering",    label: "Spectral",           desc: "Graph-based manifold clustering" },
];

type UploadSource = "zip" | "drive";

export default function ImageClusteringPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [source, setSource] = useState<UploadSource>("zip");
  const [file, setFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [zipPath, setZipPath] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState("KMeans");
  const [nClusters, setNClusters] = useState(4);
  const [algoParams, setAlgoParams] = useState<Record<string, string | number>>({});
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("pending");
  const [result, setResult] = useState<ClusterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset per-algorithm params whenever the algorithm changes
  useEffect(() => {
    const defaults: Record<string, Record<string, string | number>> = {
      KMeans:                 { n_init: 10, max_iter: 300, init: "k-means++" },
      DBSCAN:                 { eps: 0.5, min_samples: 5, metric: "euclidean" },
      AgglomerativeClustering:{ linkage: "ward" },
      GaussianMixture:        { covariance_type: "full", max_iter: 100 },
      SpectralClustering:     { affinity: "rbf", n_neighbors: 10 },
    };
    setAlgoParams(defaults[algorithm] ?? {});
  }, [algorithm]);

  // ── File selection ──────────────────────────────────────────────────────
  const handleFile = (selected: File) => {
    if (!selected.name.toLowerCase().endsWith(".zip")) {
      setError("Please upload a ZIP archive (.zip) containing your images.");
      return;
    }
    if (selected.size > 200 * 1024 * 1024) {
      setError("File exceeds the 200 MB limit.");
      return;
    }
    setFile(selected);
    setError(null);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  // ── Step 1a: Upload ZIP ─────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { setError("Please select a ZIP file."); return; }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/image-upload/`, { credentials: 'include', method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setZipPath(data.zip_path);
      setUploadLabel(file.name);
      setPhase("configure");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Step 1b: Import from Google Drive ───────────────────────────────────
  const handleDriveImport = async () => {
    if (!driveUrl.trim()) { setError("Please paste a Google Drive folder link."); return; }
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/image-drive/`, { credentials: 'include', method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drive_url: driveUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Drive import failed");
      setZipPath(data.zip_path);
      setUploadLabel(`Google Drive (${data.n_images} images, ${data.size_mb} MB)`);
      setPhase("configure");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Drive import failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Step 2: Start clustering ────────────────────────────────────────────
  const handleStartClustering = async () => {
    if (!zipPath) return;
    setError(null);
    setPhase("training");
    try {
      const res = await fetch(`${API_BASE}/image-cluster/`, { credentials: 'include', method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip_path: zipPath, algorithm, n_clusters: nClusters, algo_params: algoParams }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start clustering");
      setJobId(data.job_id);
      setJobStatus("pending");
      startPolling(data.job_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start clustering.");
      setPhase("configure");
    }
  };

  // ── Polling ─────────────────────────────────────────────────────────────
  const startPolling = (id: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/result/${id}/`);
        if (!res.ok) {
          // Server error (e.g. 500) — stop polling and surface the error
          clearInterval(pollRef.current!);
          setError(`Server error ${res.status} while polling job status.`);
          setPhase("configure");
          return;
        }
        const data = await res.json();
        setJobStatus(data.status);
        if (data.status === "completed") {
          clearInterval(pollRef.current!);
          setResult(data.metrics as ClusterResult);
          setPhase("results");
        } else if (data.status === "failed" || data.status === "cancelled") {
          clearInterval(pollRef.current!);
          setError(data.error_message || "Clustering failed.");
          setPhase("configure");
        }
      } catch {
        // network blip — keep polling
      }
    }, POLL_INTERVAL_MS);
  };

  const handleCancelClustering = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (jobId) {
      try {
        await fetch(`${API_BASE}/cancel/${jobId}/`, { credentials: 'include', method: "POST" });
      } catch { /* ignore */ }
    }
    setPhase("configure");
    setJobId(null);
    setJobStatus("pending");
    setError(null);
  };

  const resetAll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPhase("upload");
    setFile(null);
    setDriveUrl("");
    setZipPath(null);
    setUploadLabel(null);
    setJobId(null);
    setResult(null);
    setError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-cyan-400 mb-3">
            Image Clustering
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload a ZIP archive of images — AutoML Studio extracts pixel features, reduces dimensions with PCA,
            and clusters visually similar images automatically.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(["upload", "configure", "training", "results"] as Phase[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                phase === s
                  ? "bg-emerald-500 text-white scale-110"
                  : (["upload", "configure", "training", "results"].indexOf(phase) > i)
                    ? "bg-emerald-900/60 text-emerald-400"
                    : "bg-gray-800 text-gray-500"
              }`}>{i + 1}</div>
              {i < 3 && <div className={`h-px w-8 ${
                (["upload", "configure", "training", "results"].indexOf(phase) > i) ? "bg-emerald-600" : "bg-gray-700"
              }`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── PHASE: UPLOAD ─────────────────────────────────────────── */}
          {phase === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8">
                <h2 className="text-xl font-bold text-white mb-6">Upload Image Archive</h2>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-300 ${
                    dragOver
                      ? "border-emerald-400 bg-emerald-900/20"
                      : file
                        ? "border-emerald-500 bg-emerald-900/10"
                        : "border-gray-600 hover:border-emerald-500 hover:bg-emerald-900/5"
                  }`}
                  onClick={() => document.getElementById("zipInput")?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <input id="zipInput" type="file" accept=".zip" className="hidden" onChange={onFileInput} />
                  <div className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                    <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {file ? (
                    <>
                      <p className="text-emerald-400 font-semibold text-lg">{file.name}</p>
                      <p className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold text-lg mb-1">Drag & drop your ZIP archive here</p>
                      <p className="text-gray-400 text-sm">or click to browse · Max 200 MB</p>
                      <p className="text-gray-500 text-xs mt-3">ZIP should contain JPG, PNG, WEBP, or BMP images</p>
                    </>
                  )}
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
                    {error}
                  </motion.p>
                )}

                <div className="flex gap-4 mt-6">
                  <Link href="/model-type" className="flex-1">
                    <button className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-semibold transition-colors">
                      ← Back
                    </button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading…" : "Upload & Continue →"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PHASE: CONFIGURE ──────────────────────────────────────── */}
          {phase === "configure" && (
            <motion.div key="configure" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Configure Clustering</h2>
                    <p className="text-sm text-gray-400">{uploadLabel ?? file?.name}</p>
                  </div>
                </div>

                {/* Algorithm picker */}
                <div className="mb-8">
                  <label className="block text-gray-300 font-semibold mb-3">Clustering Algorithm</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ALGORITHMS.map((alg) => (
                      <button
                        key={alg.id}
                        onClick={() => setAlgorithm(alg.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          algorithm === alg.id
                            ? "border-emerald-500 bg-emerald-900/20"
                            : "border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        <p className="font-semibold text-white text-sm">{alg.label}</p>
                        <p className="text-gray-400 text-xs mt-1">{alg.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* n_clusters slider (not applicable to DBSCAN / OPTICS) */}
                {!["DBSCAN", "OPTICS", "MeanShift"].includes(algorithm) && (
                  <div className="mb-8">
                    <label className="block text-gray-300 font-semibold mb-2">
                      Number of Clusters: <span className="text-emerald-400">{nClusters}</span>
                    </label>
                    <input
                      type="range" min={2} max={20} value={nClusters}
                      onChange={(e) => setNClusters(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>2</span><span>20</span>
                    </div>
                  </div>
                )}

                {/* ── Per-algorithm parameter panel ──────────────────────── */}
                <div className="mb-8 bg-gray-900/40 rounded-xl border border-gray-700 p-5">
                  <p className="text-gray-300 font-semibold mb-4 flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Algorithm Parameters
                  </p>

                  {algorithm === "KMeans" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          n_init: <span className="text-emerald-400">{algoParams.n_init ?? 10}</span>
                        </label>
                        <input type="range" min={1} max={50} step={1}
                          value={Number(algoParams.n_init ?? 10)}
                          onChange={(e) => setAlgoParams(p => ({ ...p, n_init: Number(e.target.value) }))}
                          className="w-full accent-emerald-500" />
                        <p className="text-gray-600 text-xs mt-1">Number of centroid initializations</p>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          max_iter: <span className="text-emerald-400">{algoParams.max_iter ?? 300}</span>
                        </label>
                        <input type="range" min={50} max={1000} step={50}
                          value={Number(algoParams.max_iter ?? 300)}
                          onChange={(e) => setAlgoParams(p => ({ ...p, max_iter: Number(e.target.value) }))}
                          className="w-full accent-emerald-500" />
                        <p className="text-gray-600 text-xs mt-1">Maximum EM iterations</p>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Init method</label>
                        <select
                          value={String(algoParams.init ?? "k-means++")}
                          onChange={(e) => setAlgoParams(p => ({ ...p, init: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="k-means++">k-means++ (smart)</option>
                          <option value="random">random</option>
                        </select>
                        <p className="text-gray-600 text-xs mt-1">Centroid seeding strategy</p>
                      </div>
                    </div>
                  )}

                  {algorithm === "DBSCAN" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          eps (radius): <span className="text-emerald-400">{Number(algoParams.eps ?? 0.5).toFixed(2)}</span>
                        </label>
                        <input type="range" min={0.01} max={5.0} step={0.01}
                          value={Number(algoParams.eps ?? 0.5)}
                          onChange={(e) => setAlgoParams(p => ({ ...p, eps: Number(e.target.value) }))}
                          className="w-full accent-emerald-500" />
                        <div className="flex justify-between text-xs text-gray-600 mt-1"><span>0.01</span><span>5.0</span></div>
                        <p className="text-gray-600 text-xs mt-1">Max distance between neighbors</p>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          min_samples: <span className="text-emerald-400">{algoParams.min_samples ?? 5}</span>
                        </label>
                        <input type="range" min={1} max={50} step={1}
                          value={Number(algoParams.min_samples ?? 5)}
                          onChange={(e) => setAlgoParams(p => ({ ...p, min_samples: Number(e.target.value) }))}
                          className="w-full accent-emerald-500" />
                        <div className="flex justify-between text-xs text-gray-600 mt-1"><span>1</span><span>50</span></div>
                        <p className="text-gray-600 text-xs mt-1">Min points to form a core point</p>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Distance metric</label>
                        <select
                          value={String(algoParams.metric ?? "euclidean")}
                          onChange={(e) => setAlgoParams(p => ({ ...p, metric: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="euclidean">euclidean</option>
                          <option value="cosine">cosine</option>
                          <option value="manhattan">manhattan</option>
                        </select>
                        <p className="text-gray-600 text-xs mt-1">Distance metric used for neighbors</p>
                      </div>
                    </div>
                  )}

                  {algorithm === "AgglomerativeClustering" && (
                    <div className="max-w-xs">
                      <label className="block text-gray-400 text-sm mb-1">Linkage criterion</label>
                      <select
                        value={String(algoParams.linkage ?? "ward")}
                        onChange={(e) => setAlgoParams(p => ({ ...p, linkage: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ward">ward (minimizes variance)</option>
                        <option value="complete">complete (max distance)</option>
                        <option value="average">average (mean distance)</option>
                        <option value="single">single (min distance)</option>
                      </select>
                      <p className="text-gray-600 text-xs mt-1">How inter-cluster distance is measured</p>
                    </div>
                  )}

                  {algorithm === "GaussianMixture" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Covariance type</label>
                        <select
                          value={String(algoParams.covariance_type ?? "full")}
                          onChange={(e) => setAlgoParams(p => ({ ...p, covariance_type: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="full">full (most flexible)</option>
                          <option value="tied">tied (shared covariance)</option>
                          <option value="diag">diag (axis-aligned)</option>
                          <option value="spherical">spherical (isotropic)</option>
                        </select>
                        <p className="text-gray-600 text-xs mt-1">Shape of each cluster's distribution</p>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          max_iter: <span className="text-emerald-400">{algoParams.max_iter ?? 100}</span>
                        </label>
                        <input type="range" min={10} max={500} step={10}
                          value={Number(algoParams.max_iter ?? 100)}
                          onChange={(e) => setAlgoParams(p => ({ ...p, max_iter: Number(e.target.value) }))}
                          className="w-full accent-emerald-500" />
                        <p className="text-gray-600 text-xs mt-1">Maximum EM iterations</p>
                      </div>
                    </div>
                  )}

                  {algorithm === "SpectralClustering" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Affinity</label>
                        <select
                          value={String(algoParams.affinity ?? "rbf")}
                          onChange={(e) => setAlgoParams(p => ({ ...p, affinity: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="rbf">rbf (Gaussian kernel)</option>
                          <option value="nearest_neighbors">nearest_neighbors</option>
                        </select>
                        <p className="text-gray-600 text-xs mt-1">How the similarity graph is built</p>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          n_neighbors: <span className="text-emerald-400">{algoParams.n_neighbors ?? 10}</span>
                        </label>
                        <input type="range" min={2} max={50} step={1}
                          value={Number(algoParams.n_neighbors ?? 10)}
                          onChange={(e) => setAlgoParams(p => ({ ...p, n_neighbors: Number(e.target.value) }))}
                          className="w-full accent-emerald-500" />
                        <p className="text-gray-600 text-xs mt-1">Neighbors for graph construction</p>
                      </div>
                    </div>
                  )}

                  {!["KMeans","DBSCAN","AgglomerativeClustering","GaussianMixture","SpectralClustering"].includes(algorithm) && (
                    <p className="text-gray-500 text-sm italic">No additional parameters for {algorithm}.</p>
                  )}
                </div>

                {error && (
                  <p className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">{error}</p>
                )}

                <div className="flex gap-4">
                  <button onClick={() => { setPhase("upload"); setError(null); }}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-semibold transition-colors">
                    ← Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartClustering}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all"
                  >
                    Start Clustering →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PHASE: TRAINING ───────────────────────────────────────── */}
          {phase === "training" && (
            <motion.div key="training" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-12 text-center">
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="w-20 h-20 border-4 border-emerald-600/30 border-t-emerald-400 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-400 text-2xl">🖼️</div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Clustering Images…</h2>
                <p className="text-gray-400 mb-2">Extracting pixel features · PCA reduction · {algorithm}</p>
                <p className="text-sm text-gray-500 capitalize">Status: {jobStatus}</p>
                {jobId && <p className="text-xs text-gray-600 mt-1">Job #{jobId}</p>}
                <button
                  onClick={handleCancelClustering}
                  className="mt-8 px-6 py-2.5 bg-red-900/30 hover:bg-red-800/50 border border-red-700/40 text-red-400 hover:text-red-300 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Clustering
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PHASE: RESULTS ────────────────────────────────────────── */}
          {phase === "results" && result && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-6">

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Images Processed", value: result.n_images.toLocaleString(), color: "from-emerald-600/20 to-emerald-900/20", border: "border-emerald-700/40" },
                  { label: "Clusters Found",    value: result.n_clusters, color: "from-cyan-600/20 to-cyan-900/20", border: "border-cyan-700/40" },
                  { label: "Silhouette Score",  value: result.silhouette_score !== undefined ? result.silhouette_score.toFixed(3) : "N/A", color: "from-purple-600/20 to-purple-900/20", border: "border-purple-700/40" },
                  { label: "PCA Variance",      value: result.explained_variance !== undefined ? `${(result.explained_variance * 100).toFixed(1)}%` : "N/A", color: "from-amber-600/20 to-amber-900/20", border: "border-amber-700/40" },
                ].map((card) => (
                  <motion.div key={card.label} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`bg-linear-to-br ${card.color} rounded-xl p-5 border ${card.border}`}>
                    <p className="text-gray-400 text-xs font-medium mb-2">{card.label}</p>
                    <p className="text-white text-2xl font-bold">{card.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Algorithm info */}
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center text-emerald-400 text-lg">🤖</div>
                <div>
                  <p className="text-white font-semibold">{result.algorithm}</p>
                  <p className="text-gray-400 text-sm">
                    {result.pca_components ? `${result.pca_components} PCA components` : "No PCA"} ·{" "}
                    {result.n_images} images clustered into {result.n_clusters} groups
                  </p>
                </div>
              </div>

              {/* Cluster gallery */}
              {Object.keys(result.cluster_distribution).filter(k => Number(k) >= 0).sort((a, b) => Number(a) - Number(b)).map((cid) => {
                const count = result.cluster_distribution[cid];
                const samples = result.sample_images?.[cid] ?? [];
                return (
                  <motion.div key={cid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">Cluster {Number(cid) + 1}</h3>
                      <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                        {count} image{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {samples.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {samples.map((relPath, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${MEDIA_BASE}/${relPath}`}
                              alt={`Cluster ${Number(cid) + 1} sample ${i + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: Math.max(0, Math.min(count, 6)) }).map((_, i) => (
                          <div key={i} className="aspect-square rounded-lg bg-gray-700/50 border border-gray-600 flex items-center justify-center text-gray-500 text-xs">
                            img
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Noise cluster (DBSCAN) */}
              {result.cluster_distribution["-1"] !== undefined && (
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-5">
                  <p className="text-gray-400 text-sm">
                    <span className="text-amber-400 font-semibold">Noise / Outliers:</span>{" "}
                    {result.cluster_distribution["-1"]} image{result.cluster_distribution["-1"] !== 1 ? "s" : ""} could not be assigned to a cluster (DBSCAN/OPTICS behaviour).
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <button onClick={resetAll}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-semibold transition-colors">
                  ← Cluster Another Dataset
                </button>
                {jobId && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`${API_BASE}/image-download/${jobId}/`}
                    download={`clusters_job_${jobId}.zip`}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Clusters (.zip)
                  </motion.a>
                )}
                <Link href="/model-type" className="flex-1">
                  <button className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-semibold transition-all">
                    Back to Model Selection
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
    </ProtectedRoute>
  );
}
