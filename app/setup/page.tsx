"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { generateSalt, hashPassword, generateId } from "@/lib/crypto";

export default function SetupPage() {
  const router = useRouter();
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (masterPassword.length < 8) {
      setError("Master password must be at least 8 characters");
      return;
    }

    if (masterPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Generate salt
      const salt = generateSalt();
      console.log('🔐 Generated salt:', salt, 'Length:', salt.length);

      // Validate salt
      if (!salt || salt.length !== 32) {
        throw new Error(`Invalid salt generated: length ${salt?.length || 0}, expected 32`);
      }

      // Hash password for verification
      const passwordHash = await hashPassword(masterPassword, salt);
      console.log('🔐 Password hash created:', passwordHash.substring(0, 16) + '...');

      // Initialize IndexedDB
      await db.init();

      // Save settings to IndexedDB
      await db.saveSettings({
        masterPasswordHash: passwordHash,
        salt,
        createdAt: Date.now()
      });

      // Verify settings were saved correctly
      const savedSettings = await db.getSettings();
      console.log('✅ Settings saved:', {
        hasSalt: !!savedSettings?.salt,
        saltLength: savedSettings?.salt?.length,
        hasHash: !!savedSettings?.masterPasswordHash
      });

      if (!savedSettings?.salt || savedSettings.salt !== salt) {
        throw new Error('Settings verification failed - salt mismatch');
      }

      // Validate the saved salt
      if (!/^[0-9a-f]{32}$/i.test(savedSettings.salt)) {
        throw new Error('Saved salt is corrupted - invalid format');
      }

      // Create default environments
      const defaultEnvironments = [
        {
          id: generateId(),
          name: 'Production',
          type: 'production' as const,
          color: '#10b981',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: generateId(),
          name: 'Staging',
          type: 'staging' as const,
          color: '#f59e0b',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: generateId(),
          name: 'Development',
          type: 'development' as const,
          color: '#3b82f6',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      for (const env of defaultEnvironments) {
        await db.addEnvironment(env);
      }

      // Store ONLY master password in sessionStorage for this session
      // NEVER store salt - it always comes from IndexedDB via getSalt()
      sessionStorage.setItem('masterPassword', masterPassword);
      sessionStorage.setItem('unlocked', 'true');

      console.log('✅ Vault setup complete');

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Setup error:', err);
      setError(err.message || 'Failed to setup vault');
    } finally {
      setLoading(false);
    }
  };

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
              Welcome to Env<span className="text-purple-400">Vault</span>
            </h1>
            <p className="text-gray-400">Create your master password to get started</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
              <div className="flex gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-300">
                  <strong>Important:</strong> Your master password encrypts all your data. 
                  <span className="block mt-1">
                    ⚠️ If you forget it, your data cannot be recovered!
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Master Password</label>
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Enter a strong password"
                required
                minLength={8}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Master Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
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
              {loading ? 'Creating Vault...' : 'Create Vault'}
            </button>
          </form>

          <div className="mt-6 space-y-2">
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All data encrypted with AES-256-GCM</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Stored locally in your browser (IndexedDB)</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Export/import for backup and team sharing</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}