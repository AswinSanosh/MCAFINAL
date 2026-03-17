"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Tiny localStorage helpers — safe for SSR (typeof window check)
// ---------------------------------------------------------------------------
const STORAGE_KEY = "automl_session";

function readStorage(): Record<string, any> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

function writeStorage(patch: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    const current = readStorage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  } catch { /* quota exceeded or private mode */ }
}

/** Wrap a setState so it also persists to localStorage under the given key. */
function usePersisted<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  // Always start with defaultValue — this matches the server render exactly.
  // After mount we hydrate from localStorage so the two renders stay in sync.
  const [value, setValueRaw] = useState<T>(defaultValue);

  useEffect(() => {
    const stored = readStorage()[key];
    if (stored !== undefined) setValueRaw(stored as T);
  }, [key]);

  const setValue = useCallback((v: T) => {
    setValueRaw(v);
    writeStorage({ [key]: v });
  }, [key]);
  return [value, setValue];
}

// ---- Pipeline configuration (what the user selects on /select-pipeline) ----
export type DatasetColumn = { name: string; dtype: string };

export type PipelineConfig = {
  type: 'ai' | 'custom';
  ai_pipeline_id?: number;
  preprocessing?: string;
  feature_engineering?: string;
  algorithm?: string;
  postprocessing?: string;
  target_column?: string;
  n_clusters?: number;
};

// ---- Metrics returned from the Django training endpoint ----
export type TrainingResult = {
  job_id: number;
  task_type: string;
  algorithm: string;
  pipeline_type: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    confusion_matrix?: number[][];
    feature_importance?: { feature: string; importance: number }[];
    classes?: string[];
    mse?: number;
    rmse?: number;
    mae?: number;
    r2?: number;
    n_clusters?: number;
    silhouette_score?: number;
    inertia?: number;
    bic?: number;
    aic?: number;
    cluster_distribution?: Record<string, number>;
    n_samples?: number;
    n_features?: number;
    target_column?: string;
  };
};

// ---- Optimisation result from Optuna ----
export type OptimizationResult = {
  best_score: number;
  best_params: Record<string, number | string>;
  n_trials: number;
  trials: { id: number; score: number; params: Record<string, number | string> }[];
};

type JobStatus = 'idle' | 'uploading' | 'analyzing' | 'training' | 'optimizing' | 'ready' | 'error';

type DatasetContextType = {
  datasetId: string | null;
  setDatasetId: (id: string | null) => void;
  taskType: 'classification' | 'clustering' | 'regression' | null;
  setTaskType: (type: 'classification' | 'clustering' | 'regression' | null) => void;
  description: string;
  setDescription: (desc: string) => void;
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
  targetColumn: string | null;
  setTargetColumn: (col: string | null) => void;
  datasetColumns: DatasetColumn[];
  setDatasetColumns: (cols: DatasetColumn[]) => void;
  datasetFilename: string;
  setDatasetFilename: (name: string) => void;
  jobStatus: JobStatus;
  setJobStatus: (status: JobStatus) => void;
  pipelineConfig: PipelineConfig | null;
  setPipelineConfig: (config: PipelineConfig | null) => void;
  trainingResult: TrainingResult | null;
  setTrainingResult: (result: TrainingResult | null) => void;
  optimizationResult: OptimizationResult | null;
  setOptimizationResult: (result: OptimizationResult | null) => void;
  clearSession: () => void;
};

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [datasetId, setDatasetId] = usePersisted<string | null>("datasetId", null);
  const [taskType, setTaskType] = usePersisted<'classification' | 'clustering' | 'regression' | null>("taskType", null);
  const [description, setDescription] = usePersisted<string>("description", '');
  const [selectedColumns, setSelectedColumns] = usePersisted<string[]>("selectedColumns", []);
  const [targetColumn, setTargetColumn] = usePersisted<string | null>("targetColumn", null);
  const [datasetColumns, setDatasetColumns] = usePersisted<DatasetColumn[]>("datasetColumns", []);
  const [datasetFilename, setDatasetFilename] = usePersisted<string>("datasetFilename", "");
  // jobStatus is ephemeral — no need to persist
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [pipelineConfig, setPipelineConfig] = usePersisted<PipelineConfig | null>("pipelineConfig", null);
  const [trainingResult, setTrainingResult] = usePersisted<TrainingResult | null>("trainingResult", null);
  const [optimizationResult, setOptimizationResult] = usePersisted<OptimizationResult | null>("optimizationResult", null);

  const clearSession = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    setDatasetId(null);
    setTaskType(null);
    setDescription('');
    setSelectedColumns([]);
    setTargetColumn(null);
    setDatasetColumns([]);
    setDatasetFilename("");
    setJobStatus('idle');
    setPipelineConfig(null);
    setTrainingResult(null);
    setOptimizationResult(null);
  }, []);

  return (
    <DatasetContext.Provider
      value={{
        datasetId, setDatasetId,
        taskType, setTaskType,
        description, setDescription,
        selectedColumns, setSelectedColumns,
        targetColumn, setTargetColumn,
        datasetColumns, setDatasetColumns,
        datasetFilename, setDatasetFilename,
        jobStatus, setJobStatus,
        pipelineConfig, setPipelineConfig,
        trainingResult, setTrainingResult,
        optimizationResult, setOptimizationResult,
        clearSession,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) throw new Error("useDataset must be used within DatasetProvider");
  return context;
}
