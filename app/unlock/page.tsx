// app/unlock/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";

export default function UnlockPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      await db.init();
      const settings = await db.getSettings();
      
      if (!settings) {
        router.push('/setup');
        return;
      }
      
      setInitialized(true);
    } catch (err: any) {
      console.error('Initialization check error:', err);
      setError('Failed to check vault status');
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);

      const settings = await db.getSettings();
      
      if (!settings) {
        setError("Vault not initialized");
        router.push('/setup');
        return;
      }

      const isValid = await verifyPassword(
        password,
        settings.masterPasswordHash,
        settings.salt
      );

      if (!isValid) {
        setError("Incorrect password");
        return;
      }

      sessionStorage.setItem('masterPassword', password);
      sessionStorage.setItem('unlocked', 'true');

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Unlock error:', err);
      setError(err.message || 'Failed to unlock vault');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Unlock Env<span className="text-purple-400">Vault</span>
            </h1>
            <p className="text-gray-400">Enter your master password to continue</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Master Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-purple-500/30 disabled:opacity-50"
            >
              {loading ? 'Unlocking...' : 'Unlock Vault'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-400 mb-1">Master Password Cannot Be Reset</p>
                <p className="text-xs text-amber-300/80">
                  This password encrypts your vault locally. If you forget it, your data cannot be recovered. 
                  Make sure to remember it or store it securely.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Note: This is different from your cloud sync password
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}