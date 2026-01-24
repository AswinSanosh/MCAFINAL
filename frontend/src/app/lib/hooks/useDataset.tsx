"use client";

import { createContext, useContext, useState } from "react";

type DatasetContextType = {
  datasetId: string | null;
  setDatasetId: (id: string | null) => void;
  taskType: 'classification' | 'clustering' | 'regression' | null;
  setTaskType: (type: 'classification' | 'clustering' | 'regression' | null) => void;
  jobStatus: 'idle' | 'uploading' | 'analyzing' | 'training' | 'optimizing' | 'ready' | 'error';
  setJobStatus: (status: 'idle' | 'uploading' | 'analyzing' | 'training' | 'optimizing' | 'ready' | 'error') => void;
};

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [taskType, setTaskType] = useState<'classification' | 'clustering' | 'regression' | null>(null);
  const [jobStatus, setJobStatus] = useState<
    'idle' | 'uploading' | 'analyzing' | 'training' | 'optimizing' | 'ready' | 'error'
  >('idle');

  return (
    <DatasetContext.Provider
      value={{
        datasetId,
        setDatasetId,
        taskType,
        setTaskType,
        jobStatus,
        setJobStatus,
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
