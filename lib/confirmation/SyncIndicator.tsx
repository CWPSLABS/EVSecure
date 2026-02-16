// components/SyncIndicator.tsx
"use client";

import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/lib/supabase';
import { getLastSyncTime } from '@/lib/cloudsync';

export function SyncIndicator() {
  const [isAuth, setIsAuth] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    const authenticated = await isAuthenticated();
    setIsAuth(authenticated);
    
    if (authenticated) {
      const lastSyncTime = getLastSyncTime();
      setLastSync(lastSyncTime);
    }
  };

  if (!isAuth) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      <span>
        {lastSync 
          ? `Synced ${formatRelativeTime(lastSync)}`
          : 'Cloud sync enabled'
        }
      </span>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}