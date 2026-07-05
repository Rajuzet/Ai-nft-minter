"use client";

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function DebugPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      const healthJson = await healthRes.json();
      setHealthStatus(healthJson);

      const statusRes = await fetch(`${API_BASE_URL}/api/status`);
      const statusJson = await statusRes.json();
      setApiStatus(statusJson);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBackend();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Backend Diagnostic Utility</h1>
            <p className="text-sm text-slate-400">Test WCOS API Gateway connection & database status</p>
          </div>
          <button
            onClick={testBackend}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-sm font-medium"
          >
            Refresh Test
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">API Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Target Backend URL:</span>
              <p className="font-mono text-emerald-300 font-medium">{API_BASE_URL}</p>
            </div>
            <div>
              <span className="text-slate-400">Connection Status:</span>
              <p className="font-medium">
                {loading ? (
                  <span className="text-amber-400">Testing...</span>
                ) : error ? (
                  <span className="text-rose-400">Disconnected</span>
                ) : (
                  <span className="text-emerald-400">Connected 🟢</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-4 text-rose-300 text-sm">
            <strong className="font-semibold">Error: </strong> {error}
          </div>
        )}

        {healthStatus && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-200">Health Check (`GET /health`)</h2>
            <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800">
              {JSON.stringify(healthStatus, null, 2)}
            </pre>
          </div>
        )}

        {apiStatus && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-200">System Status (`GET /api/status`)</h2>
            <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800">
              {JSON.stringify(apiStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
