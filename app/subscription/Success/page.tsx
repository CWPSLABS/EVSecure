// app/subscription/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any cached subscription data
    sessionStorage.removeItem('subscriptionChecked');
    localStorage.removeItem('lastSubscriptionCheck');
    
    // Force a complete page reload when navigating to settings
    // This ensures fresh data from the database
    const links = document.querySelectorAll('a[href="/settings"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/settings';
      });
    });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-2">Welcome to Pro! 🎉</h1>
          <p className="text-gray-400 mb-8">
            Your subscription is now active. You can now sync your vault across all your devices!
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                // Force complete page reload to settings
                window.location.href = '/settings';
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              Go to Settings
            </button>
            <button
              onClick={() => {
                // Force complete page reload to dashboard
                window.location.href = '/dashboard';
              }}
              className="w-full py-3 border border-slate-700 text-white rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <p className="text-xs text-blue-400">
              💡 Your Pro subscription includes cloud sync, automatic backups, and priority support.
            </p>
          </div>

          {/* Debug Info */}
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-gray-500">
              Note: Your subscription is now active in the database. The pages will refresh to show your Pro status.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
