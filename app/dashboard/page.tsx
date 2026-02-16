// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, Environment } from "@/lib/db";
import { isUnlocked, lockVault } from "@/lib/crypto";
import { SyncIndicator } from '@/lib/confirmation/SyncIndicator';
import { getSubscription, type Subscription } from '@/lib/subscription';
import { isAuthenticated } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isCloudAuthenticated, setIsCloudAuthenticated] = useState(false);

  // New environment form state
  const [isCreating, setIsCreating] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvType, setNewEnvType] = useState('development');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEnvironments();
    checkCloudAuth();
  }, []);

  const checkCloudAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsCloudAuthenticated(authenticated);
    
    if (authenticated) {
      const subscription = await getSubscription();
      setCurrentSubscription(subscription);
      console.log('📊 Dashboard subscription:', subscription);
    }
  };

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      setError("");

      if (!isUnlocked()) {
        console.log('🔒 Not unlocked, redirecting to unlock');
        router.push('/unlock');
        return;
      }

      await db.init();
      const envs = await db.getAllEnvironments();
      console.log('📦 Loaded environments:', envs.length);
      setEnvironments(envs);
    } catch (err: any) {
      console.error('❌ Load environments error:', err);
      setError(err.message || 'Failed to load environments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;

    try {
      setCreating(true);

      const colorMap: Record<string, string> = {
        development: '#8B5CF6',
        staging: '#F59E0B',
        production: '#EF4444',
        testing: '#10B981',
      };

      const newEnv: Environment = {
        id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newEnvName.trim(),
        type: newEnvType as Environment['type'],
        color: colorMap[newEnvType] || '#8B5CF6',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.addEnvironment(newEnv);
      setEnvironments(prev => [...prev, newEnv]);
      setNewEnvName('');
      setNewEnvType('development');
      setIsCreating(false);

      // Go to new environment
      router.push(`/environment/${newEnv.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create environment');
    } finally {
      setCreating(false);
    }
  };

  const handleLock = () => {
    lockVault();
    router.push('/unlock');
  };

  const isActivePro = Boolean(
    currentSubscription &&
    currentSubscription.plan === 'pro' &&
    currentSubscription.status === 'active' &&
    (!currentSubscription.current_period_end || new Date(currentSubscription.current_period_end) > new Date())
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading environments...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                EV<span className="text-purple-400">Secure</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">Secure Environment Variables Manager</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Sync Indicator - 3 states */}
              {isActivePro && isCloudAuthenticated ? (
                // Pro + signed in → show sync indicator
                <SyncIndicator />
              ) : isCloudAuthenticated && !isActivePro ? (
                // Signed in but no Pro → sync locked        
              
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-amber-400 whitespace-nowrap">Sync Locked</span>
                </div>
              ) : null}
              
              <button
                onClick={() => router.push('/')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </button>

              <button
                onClick={() => router.push('/feedback')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5l16.5-7.5L13.5 19.5l-2.25-6L3 10.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 13.5L19.5 3" />
                </svg>
                <span className="hidden sm:inline">Feedback</span>
              </button>

              <button
                onClick={() => router.push('/settings')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Settings</span>
              </button>

              <button
                onClick={handleLock}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="hidden sm:inline">Lock</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Page Header with Create Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Your Environments</h2>
            <p className="text-sm sm:text-base text-gray-400">Manage your environment variables securely</p>
          </div>
          {environments.length > 0 && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Environment</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        {/* Create Environment Form */}
        {isCreating && (
          <div className="mb-6 p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/50">
            <h3 className="text-lg font-semibold mb-4">Create New Environment</h3>
            <form onSubmit={handleCreateEnvironment} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Environment Name</label>
                <input
                  type="text"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="e.g. My Project, API Keys, Work..."
                  required
                  autoFocus
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Type</label>
                <select
                  value={newEnvType}
                  onChange={(e) => setNewEnvType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                  <option value="testing">Testing</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Environment'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewEnvName(''); setError(''); }}
                  className="px-4 py-2 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Environments Grid */}
        {environments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {environments.map((env) => (
              <Link
                key={env.id}
                href={`/environment/${env.id}`}
                className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all hover:scale-105 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${env.color}20` }}
                  >
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: env.color }} />
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">{env.name}</h3>
                <p className="text-sm text-gray-400 capitalize mb-4">{env.type}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">Updated {new Date(env.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>

        ) : (
          // Empty state
          !isCreating && (
            <div className="text-center py-20 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800/50 rounded-full mb-6">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No environments yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create your first environment to start storing your API keys and environment variables securely.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Environment
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}