// src/app/upload/page.tsx
"use client";

import { useState } from "react";
import { useDataset } from "../../lib/hooks/useDataset";
import { motion } from "framer-motion";

export default function UploadPage() {
  const { setDatasetId, setTaskType, setJobStatus } = useDataset();
  const [file, setFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState<string>('');
  const [datasetSource, setDatasetSource] = useState<'upload' | 'drive'>('upload');
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatusState] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      setError("Please upload a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Preview first 5 rows (mock)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 6); // header + 5 rows
      setPreview(lines);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (datasetSource === 'upload' && !file) {
      setError("Please select a file to upload.");
      return;
    }

    if (datasetSource === 'drive' && !driveLink) {
      setError("Please provide a Google Drive link.");
      return;
    }

    setJobStatus('uploading');
    setJobStatusState('uploading');
    setError(null);

    try {
      if (datasetSource === 'upload') {
        const formData = new FormData();
        formData.append('file', file!);

        // Mock API call to Django
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        setDatasetId(data.dataset_id);
        setTaskType(data.task_type || 'classification'); // fallback
        setJobStatus('analyzing');
        setJobStatusState('analyzing');

        // Redirect to /describe after 1s (simulate processing)
        setTimeout(() => {
          window.location.href = '/describe';
        }, 1000);
      } else {
        // Handle Google Drive link
        console.log("Processing Google Drive link:", driveLink);
        // Simulate processing
        setTimeout(() => {
          setDatasetId('drive_dataset_123');
          setTaskType('classification');
          setJobStatus('analyzing');
          setJobStatusState('analyzing');
          window.location.href = '/describe';
        }, 1000);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
      setJobStatus('error');
      setJobStatusState('error');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            Upload Your Dataset
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get started by uploading your data file or providing a Google Drive link
          </p>
        </motion.div>

        {/* Dataset Source Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Dataset Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setDatasetSource('upload')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                datasetSource === 'upload'
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : 'border-[var(--color-border)] hover:border-indigo-500'
              }`}
            >
              <div className="text-3xl mb-3">📁</div>
              <h3 className="text-lg font-bold text-white">Upload File</h3>
              <p className="text-gray-400 text-sm">Upload a CSV or Excel file directly</p>
            </button>
            <button
              onClick={() => setDatasetSource('drive')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                datasetSource === 'drive'
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : 'border-[var(--color-border)] hover:border-indigo-500'
              }`}
            >
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="text-lg font-bold text-white">Google Drive Link</h3>
              <p className="text-gray-400 text-sm">Provide a shareable Google Drive link</p>
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)]"
        >
          {/* Upload Section */}
          {datasetSource === 'upload' && (
            <>
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-indigo-500 bg-indigo-900/10'
                    : 'border-[var(--color-border)] hover:border-indigo-500 hover:bg-indigo-900/5'
                }`}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-900/20 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Drag & drop your file here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <p className="text-sm text-gray-500">Supports CSV and Excel files</p>

                  <input
                    id="fileInput"
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* File Info */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-indigo-900/30 flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview([]);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Preview Section */}
              {preview.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8"
                >
                  <h3 className="font-semibold text-lg text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Data Preview
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-800">
                        <tr>
                          {preview[0]?.split(',').map((header, idx) => (
                            <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                              {header.trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {preview.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/30'}>
                            {row.split(',').map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-sm text-gray-300">
                                {cell.trim()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Google Drive Section */}
          {datasetSource === 'drive' && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                </svg>
                Google Drive Link
              </h3>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Shareable Link</label>
                <input
                  type="text"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)]"
                />
                <p className="text-sm text-gray-500 mt-2">Make sure the link is publicly accessible or shared with anyone who has the link</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-900/30 text-red-300 rounded-lg border border-red-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpload}
              disabled={datasetSource === 'upload' && !file}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                (datasetSource === 'upload' && file) || (datasetSource === 'drive' && driveLink)
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                {jobStatus === 'uploading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {datasetSource === 'upload' ? 'Upload & Analyze' : 'Process Drive Link'}
                  </>
                )}
              </div>
            </button>

            <button
              onClick={() => window.history.back()}
              className="px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700"
            >
              Cancel
            </button>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Supported Formats</h3>
            <p className="text-gray-400 text-sm">CSV and Excel files are supported. Files should be under 100MB.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Data Preparation</h3>
            <p className="text-gray-400 text-sm">Ensure your data is clean with meaningful column headers.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Privacy Assured</h3>
            <p className="text-gray-400 text-sm">Your data is processed securely and never shared with third parties.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}