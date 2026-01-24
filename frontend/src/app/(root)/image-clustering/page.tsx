// src/app/image-clustering/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ImageClusteringPage() {
  const [datasetSource, setDatasetSource] = useState<'upload' | 'drive'>('upload');
  const [driveLink, setDriveLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.zip') && !selectedFile.name.endsWith('.tar') && !selectedFile.name.endsWith('.rar')) {
      setError("Please upload a compressed archive (ZIP, TAR, RAR) containing images.");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Preview first 5 images (mock)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 6); // header + 5 rows
      setPreview(lines);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (datasetSource === 'drive' && !driveLink) {
      setError("Please provide a Google Drive link.");
      return;
    }
    
    if (datasetSource === 'upload' && !file) {
      setError("Please select a file to upload.");
      return;
    }

    // Simulate upload process
    console.log(datasetSource === 'drive' ? driveLink : file);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
            Image Clustering
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Upload your image dataset or provide a Google Drive link to cluster similar images
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-gray-800/50 rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8"
        >
          {/* Dataset Source Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Dataset Source</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setDatasetSource('upload')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  datasetSource === 'upload'
                    ? 'border-emerald-500 bg-emerald-900/20'
                    : 'border-[var(--color-border)] hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-3">📁</div>
                <h3 className="text-lg font-bold text-white">Upload Archive</h3>
                <p className="text-gray-400 text-sm">Upload a ZIP or TAR file containing your images</p>
              </button>
              <button
                onClick={() => setDatasetSource('drive')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  datasetSource === 'drive'
                    ? 'border-emerald-500 bg-emerald-900/20'
                    : 'border-[var(--color-border)] hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-3">🔗</div>
                <h3 className="text-lg font-bold text-white">Google Drive Link</h3>
                <p className="text-gray-400 text-sm">Provide a shareable Google Drive link</p>
              </button>
            </div>
          </div>

          {/* Upload Section */}
          {datasetSource === 'upload' && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Upload Image Archive</h2>
              <div 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  file 
                    ? 'border-emerald-500 bg-emerald-900/10' 
                    : 'border-[var(--color-border)] hover:border-emerald-500 hover:bg-emerald-900/5'
                }`}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/20 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Drag & drop your archive here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <p className="text-sm text-gray-500">Supports ZIP, TAR, RAR archives with image files</p>
                  
                  <input
                    id="fileInput"
                    type="file"
                    accept=".zip,.tar,.rar"
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
                      <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Image Preview
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center">
                        <div className="bg-gray-700 w-16 h-16 rounded-md"></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Google Drive Section */}
          {datasetSource === 'drive' && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Google Drive Link</h2>
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
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/model-type" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-700 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Model Selection
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-cyan-700 transition-all duration-300 shadow-lg flex items-center justify-center"
            >
              Start Clustering
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.button>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Image Clustering</h3>
            <p className="text-gray-400 text-sm">Group similar images together using advanced computer vision techniques.</p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Multiple Sources</h3>
            <p className="text-gray-400 text-sm">Upload directly or use Google Drive links for convenient access.</p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">Secure Processing</h3>
            <p className="text-gray-400 text-sm">Your images are processed securely and never stored permanently.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}