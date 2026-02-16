// lib/confirmation/Authmodal.tsx
"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  context?: 'payment' | 'sync';
}

export function AuthModal({ isOpen, onClose, onSuccess, context }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        if (error) throw error;

        if (context === 'payment') {
          setMessage('✅ Account created! Check your email to confirm, then come back to subscribe.');
        } else {
          setMessage('✅ Account created! Check your email for a confirmation link.');
        }

        setTimeout(() => {
          setMode('signin');
          setMessage('');
        }, 4000);

      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Context banner */}
        {context === 'payment' && (
          <div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
            <p className="text-sm text-purple-300 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {mode === 'signup'
                ? 'Create a free account to complete your Pro subscription'
                : 'Sign in to continue to payment'
              }
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="••••••••"
            />
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/50">
              <p className="text-sm text-green-400">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all"
          >
            {loading
              ? 'Loading...'
              : mode === 'signin'
                ? context === 'payment' ? 'Sign In & Continue to Payment' : 'Sign In'
                : context === 'payment' ? 'Create Account & Subscribe' : 'Sign Up'
            }
          </button>
        </form>

        {/* Toggle signin/signup */}
        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Bottom note */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-xs text-blue-400">
            <strong>Note:</strong>{' '}
            {context === 'payment'
              ? 'This account is for cloud sync & payments only — separate from your vault master password.'
              : 'Your vault data is encrypted before being sent to the cloud. We never see your secrets.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
