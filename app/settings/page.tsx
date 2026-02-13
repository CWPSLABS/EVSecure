// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { 
  isUnlocked, 
  lockVault, 
  verifyPassword, 
  hashPassword,
  generateSalt 
} from "@/lib/crypto";
import { ConfirmDialog } from "@/lib/confirmation/page";
import { supabase, getUser, isAuthenticated } from '@/lib/supabase';
import { syncVault, pushToCloud, pullFromCloud, deleteCloudVault, getLastSyncTime } from '@/lib/cloudsync';
import { AuthModal } from '@/lib/confirmation/Authmodal';
import { getSubscription, type Subscription, refreshSubscription } from '@/lib/subscription';
import { cancelSubscription } from '@/app/subscription-actions';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCloudAuthenticated, setIsCloudAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    syncing: boolean;
    lastSync: Date | null;
    error: string | null;
  }>({
    syncing: false,
    lastSync: null,
    error: null,
  });

  useEffect(() => {
    checkAuth();
    loadSettings();
    checkCloudAuth();

    const handleFocus = () => {
      console.log('🔄 Page focused, refreshing subscription...');
      checkCloudAuth();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkAuth = () => {
    if (!isUnlocked()) {
      router.push('/unlock');
      return;
    }
    setLoading(false);
  };

  const loadSettings = () => {
    const autoLock = localStorage.getItem('autoLockEnabled') === 'true';
    const minutes = parseInt(localStorage.getItem('autoLockMinutes') || '15');
    setAutoLockEnabled(autoLock);
    setAutoLockMinutes(minutes);
  };

  const checkCloudAuth = async () => {
    console.log('🔍 Checking cloud auth and subscription...');
    const authenticated = await isAuthenticated();
    setIsCloudAuthenticated(authenticated);
    
    if (authenticated) {
      const user = await getUser();
      setUserEmail(user?.email || null);
      const subscription = await refreshSubscription();
      setCurrentSubscription(subscription);
      console.log('📊 Subscription loaded:', subscription);
      const lastSync = getLastSyncTime();
      setSyncStatus(prev => ({ ...prev, lastSync }));
    } else {
      // Not authenticated - clear subscription state
      setCurrentSubscription(null);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    try {
      setChangingPassword(true);
      setError("");
      const settings = await db.getSettings();
      if (!settings) { setError("Vault not initialized"); return; }
      const isValid = await verifyPassword(currentPassword, settings.masterPasswordHash, settings.salt);
      if (!isValid) { setError("Current password is incorrect"); return; }
      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);
      await db.saveSettings({ masterPasswordHash: newHash, salt: newSalt, createdAt: settings.createdAt });
      sessionStorage.setItem('masterPassword', newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowChangePassword(false);
      setSuccess("Master password changed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      setError("");
      const backup = await db.exportAll();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `envvault-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("Encrypted backup downloaded!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError('Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      setError("");
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.settings || !backup.environments || !backup.variables) {
        throw new Error('Invalid backup file format');
      }
      const confirm = window.confirm(
        `This will replace your current vault with the backup from ${new Date(backup.exportedAt).toLocaleString()}.\n\nAre you sure?`
      );
      if (!confirm) { setImporting(false); return; }
      await db.clearAll();
      await db.importAll(backup);
      const newSettings = await db.getSettings();
      if (newSettings) { lockVault(); router.push('/unlock'); }
    } catch (err: any) {
      setError(err.message || 'Failed to import backup');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleAutoLockToggle = (enabled: boolean) => {
    setAutoLockEnabled(enabled);
    localStorage.setItem('autoLockEnabled', enabled.toString());
    if (enabled) { setupAutoLock(autoLockMinutes); } else { clearAutoLock(); }
  };

  const handleAutoLockMinutesChange = (minutes: number) => {
    setAutoLockMinutes(minutes);
    localStorage.setItem('autoLockMinutes', minutes.toString());
    if (autoLockEnabled) { setupAutoLock(minutes); }
  };

  const setupAutoLock = (minutes: number) => {
    clearAutoLock();
    const timeout = setTimeout(() => { lockVault(); router.push('/unlock'); }, minutes * 60 * 1000);
    (window as any).__autoLockTimeout = timeout;
  };

  const clearAutoLock = () => {
    if ((window as any).__autoLockTimeout) {
      clearTimeout((window as any).__autoLockTimeout);
      delete (window as any).__autoLockTimeout;
    }
  };

  const handleLockVault = () => { lockVault(); router.push('/unlock'); };

  const handleClearAllData = async () => {
    if (deleteConfirmText !== 'DELETE') { setError('Please type DELETE to confirm'); return; }
    try {
      setError("");
      await db.clearAll();
      sessionStorage.clear();
      localStorage.clear();
      router.push('/');
    } catch (err: any) {
      setError('Failed to clear data');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      if (!currentSubscription) return;
      await cancelSubscription(currentSubscription.user_id);
      await checkCloudAuth();
      setShowCancelDialog(false);
      setSuccess('Subscription cancelled. You will retain access until the end of your billing period.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError('Failed to cancel subscription: ' + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsCloudAuthenticated(false);
      setUserEmail(null);
      setCurrentSubscription(null);
      setSyncStatus({ syncing: false, lastSync: null, error: null });
      setSuccess('Signed out successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSync = async () => {
    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
    try {
      const result = await syncVault();
      setSyncStatus(result);
      if (result.error) { setError(result.error); }
      else { setSuccess('Vault synced successfully!'); setTimeout(() => setSuccess(''), 3000); }
    } catch (err: any) {
      setSyncStatus(prev => ({ ...prev, syncing: false, error: err.message }));
      setError(err.message);
    }
  };

  const handlePushToCloud = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      await pushToCloud();
      const lastSync = getLastSyncTime();
      setSyncStatus({ syncing: false, lastSync, error: null });
      setSuccess('Pushed to cloud successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setSyncStatus(prev => ({ ...prev, syncing: false, error: err.message }));
      setError(err.message);
    }
  };

  const handlePullFromCloud = async () => {
    const confirm = window.confirm('This will replace your local vault with the cloud version. Continue?');
    if (!confirm) return;
    try {
      setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      await pullFromCloud();
      const lastSync = getLastSyncTime();
      setSyncStatus({ syncing: false, lastSync, error: null });
      setSuccess('Pulled from cloud successfully!');
      setTimeout(() => setSuccess(''), 3000);
      window.location.reload();
    } catch (err: any) {
      setSyncStatus(prev => ({ ...prev, syncing: false, error: err.message }));
      setError(err.message);
    }
  };

  const handleDeleteCloudVault = async () => {
    const confirm = window.confirm('This will permanently delete your cloud vault. Your local data will remain. Continue?');
    if (!confirm) return;
    try {
      await deleteCloudVault();
      setSuccess('Cloud vault deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </main>
    );
  }

  const hasActiveSubscription = Boolean(
    currentSubscription &&
    currentSubscription.plan === 'pro' &&
    currentSubscription.status === 'active' &&
    (!currentSubscription.current_period_end || new Date(currentSubscription.current_period_end) > new Date())
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Settings</h1>
                <p className="text-sm text-gray-400">Manage your vault settings</p>
              </div>
            </div>
            <button
              onClick={handleLockVault}
              className="px-4 py-2 text-sm border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Lock Vault
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Security Section */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Change Master Password</div>
                      <div className="text-sm text-gray-400">Update your vault password</div>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 transition-transform ${showChangePassword ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showChangePassword && (
                  <div className="mt-4 p-4 bg-slate-900/30 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleChangePassword} disabled={changingPassword}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold disabled:opacity-50">
                        {changingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                      <button onClick={() => { setShowChangePassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setError(""); }}
                        className="px-4 py-2 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors">
                        Cancel
                      </button>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                      <p className="text-xs text-yellow-400 flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Make sure to remember your new password. There is no way to recover it if forgotten.</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-lock */}
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Auto-lock Vault</div>
                      <div className="text-sm text-gray-400">Automatically lock after inactivity</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={autoLockEnabled} onChange={(e) => handleAutoLockToggle(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {autoLockEnabled && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Lock after (minutes)</label>
                    <select value={autoLockMinutes} onChange={(e) => handleAutoLockMinutesChange(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50">
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ✅ FIXED Cloud Sync Section - Sign in check FIRST */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Cloud Sync
              {hasActiveSubscription && isCloudAuthenticated && (
                <span className="ml-auto px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-semibold">
                  PRO
                </span>
              )}
            </h2>

            {/* 
              ✅ CORRECT ORDER:
              1. Not signed in? → Show Sign In (returning Pro users need this!)
              2. Signed in but no Pro? → Show Upgrade prompt
              3. Signed in + Pro? → Show sync controls
            */}
            {!isCloudAuthenticated ? (
              // STEP 1: Not signed in → Sign In first
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Cloud Sync</p>
                      <p className="text-xs text-slate-400">
                        Sign in to access your cloud vault across all devices
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <p className="text-xs text-blue-400">
                    💡 Already have a Pro subscription? Sign in and it will be automatically recognized — no need to pay again!
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  Sign In to Cloud Sync
                </button>
              </div>

            ) : !hasActiveSubscription ? (
              // STEP 2: Signed in but no Pro → Upgrade prompt
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-slate-400 mb-1">Cloud Sync Locked</p>
                        <p className="text-xs text-slate-500">Signed in as {userEmail}</p>
                      </div>
                    </div>
                    <button onClick={handleSignOut} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                  <p className="text-sm text-amber-400 font-semibold mb-2">🔒 Upgrade to Unlock Cloud Sync</p>
                  <p className="text-xs text-amber-300 mb-3">Sync your encrypted vault across all devices with automatic backups.</p>
                  <ul className="space-y-1 text-xs text-amber-200">
                    <li>✓ Unlimited device sync</li>
                    <li>✓ Automatic encrypted backups</li>
                    <li>✓ Priority support</li>
                    <li>✓ From just ₦5,000/month</li>
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  className="w-full block py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all text-center"
                >
                  Upgrade to Pro
                </Link>
              </div>

            ) : (
              // STEP 3: Signed in + Pro → Full sync controls
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Pro Active</div>
                      <div className="text-sm text-gray-400">{userEmail}</div>
                    </div>
                  </div>
                  <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    Sign Out
                  </button>
                </div>

                {syncStatus.lastSync && (
                  <div className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last synced: {syncStatus.lastSync.toLocaleString()}
                    </div>
                    {syncStatus.syncing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>}
                  </div>
                )}

                {syncStatus.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{syncStatus.error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleSync} disabled={syncStatus.syncing}
                    className="flex items-center justify-center gap-2 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50">
                    {syncStatus.syncing ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Syncing...</>
                    ) : (
                      <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>Sync Now</>
                    )}
                  </button>
                  <button onClick={handlePushToCloud} disabled={syncStatus.syncing}
                    className="flex items-center justify-center gap-2 py-3 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors disabled:opacity-50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Push to Cloud
                  </button>
                </div>

                <button onClick={handlePullFromCloud} disabled={syncStatus.syncing}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Pull from Cloud
                </button>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">Advanced Options</summary>
                  <div className="mt-3 space-y-2">
                    <button onClick={handleDeleteCloudVault}
                      className="w-full py-2 text-sm text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/10 transition-colors">
                      Delete Cloud Vault
                    </button>
                  </div>
                </details>
              </div>
            )}
          </section>

          {/* Subscription Management - only for Pro users */}
          {isCloudAuthenticated && hasActiveSubscription && (
            <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Subscription Management
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Current Plan:</span>
                    <span className="font-semibold text-purple-400">Pro</span>
                  </div>
                  {currentSubscription?.current_period_end && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Status:</span>
                        <span className="text-green-400 font-semibold">Active</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Renews on:</span>
                        <span className="text-gray-300">{new Date(currentSubscription.current_period_end).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Amount:</span>
                        <span className="text-gray-300">
                          {currentSubscription.currency === 'NGN' ? '₦' :
                           currentSubscription.currency === 'GHS' ? '₵' :
                           currentSubscription.currency === 'KES' ? 'KSh' :
                           currentSubscription.currency === 'ZAR' ? 'R' : '$'}
                          {((currentSubscription.amount || 0) / 100).toFixed(2)}/month
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <button onClick={() => setShowCancelDialog(true)}
                    className="w-full py-3 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors font-semibold">
                    Cancel Subscription
                  </button>
                  <Link href="/pricing"
                    className="w-full block py-3 border border-slate-700 text-white rounded-lg hover:bg-slate-800/50 transition-colors text-center">
                    View Plans
                  </Link>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <p className="text-xs text-blue-400 flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>If you cancel, you'll continue to have Pro access until the end of your billing period.</span>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Backup & Restore */}
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Backup & Restore
            </h2>
            <div className="space-y-4">
              <button onClick={handleExportBackup} disabled={exporting}
                className="w-full flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Export Encrypted Backup</div>
                    <div className="text-sm text-gray-400">Download your entire vault as JSON</div>
                  </div>
                </div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <label className="w-full flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors cursor-pointer">
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Import Backup</div>
                    <div className="text-sm text-gray-400">Restore from backup file</div>
                  </div>
                </div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </label>

              <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <p className="text-xs text-blue-400 flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Backups are encrypted. You'll need your master password to restore them.</span>
                </p>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Danger Zone
            </h2>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-900/20 rounded-lg hover:bg-red-900/30 transition-colors border border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-red-400">Delete All Data</div>
                  <div className="text-sm text-red-300">Permanently delete your entire vault</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); setError(""); }}
        onConfirm={handleClearAllData}
        title="Delete All Data"
        description="This will permanently delete your entire vault, including all environments and variables. This action cannot be undone."
        confirmText="DELETE"
        confirmValue={deleteConfirmText}
        onConfirmValueChange={setDeleteConfirmText}
        confirmButtonText="Delete Everything"
        isDangerous
      />

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        description={`Are you sure you want to cancel your Pro subscription? You will continue to have access until ${
          currentSubscription?.current_period_end
            ? new Date(currentSubscription.current_period_end).toLocaleDateString()
            : 'the end of your billing period'
        }. After that, cloud sync will be disabled.`}
        confirmText="CANCEL SUBSCRIPTION"
        confirmValue=""
        onConfirmValueChange={() => {}}
        confirmButtonText="Yes, Cancel Subscription"
        isDangerous
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          checkCloudAuth();
          setSuccess('Signed in successfully! You can now sync your vault.');
          setTimeout(() => setSuccess(''), 3000);
        }}
      />
    </main>
  );
}
