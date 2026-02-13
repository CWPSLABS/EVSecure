// lib/cloudsync.ts
import { supabase, getUser } from './supabase';
import { db } from './db';
import { checkHasActiveSubscription } from '@/app/subscription-actions';

const LAST_SYNC_KEY = 'lastCloudSync';

export function getLastSyncTime(): Date | null {
  const timestamp = localStorage.getItem(LAST_SYNC_KEY);
  return timestamp ? new Date(parseInt(timestamp)) : null;
}

function setLastSyncTime(): void {
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
}

// Check if user has active Pro subscription
async function checkSubscription(): Promise<void> {
  try {
    const hasActive = await checkHasActiveSubscription();
    if (!hasActive) {
      throw new Error('🔒 Cloud sync is a Pro feature. Upgrade to sync your vault across devices!');
    }
  } catch (error: any) {
    // If it's already our subscription error, rethrow it
    if (error.message.includes('Pro feature')) {
      throw error;
    }
    // Otherwise, treat as subscription check failure
    throw new Error('🔒 Cloud sync is a Pro feature. Upgrade to sync your vault across devices!');
  }
}

export async function pushToCloud(): Promise<void> {
  console.log('☁️ Starting push to cloud...');
  
  // Check subscription FIRST
  await checkSubscription();

  const user = await getUser();
  if (!user) throw new Error('Not authenticated');

  const backup = await db.exportAll();
  
  const { error } = await supabase
    .from('vaults')
    .upsert({
      user_id: user.id,
      data: backup,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;

  setLastSyncTime();
  console.log('✅ Pushed to cloud successfully');
}

export async function pullFromCloud(): Promise<void> {
  console.log('☁️ Starting pull from cloud...');
  
  // Check subscription FIRST
  await checkSubscription();

  const user = await getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vaults')
    .select('data')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data?.data) throw new Error('No cloud vault found');

  await db.importAll(data.data);
  setLastSyncTime();
  console.log('✅ Pulled from cloud successfully');
}

export async function syncVault(): Promise<{
  syncing: boolean;
  lastSync: Date | null;
  error: string | null;
}> {
  console.log('🔄 Starting vault sync...');
  
  try {
    // Check subscription FIRST - this will throw if not Pro
    await checkSubscription();

    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    // Get cloud vault
    const { data: cloudData, error: cloudError } = await supabase
      .from('vaults')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .single();

    if (cloudError && cloudError.code !== 'PGRST116') {
      throw cloudError;
    }

    // Get local vault
    const localBackup = await db.exportAll();
    const localUpdatedAt = new Date(localBackup.exportedAt);

    if (!cloudData) {
      // No cloud vault - push local to cloud
      console.log('📤 No cloud vault found, pushing local data...');
      await pushToCloud();
    } else {
      const cloudUpdatedAt = new Date(cloudData.updated_at);

      if (cloudUpdatedAt > localUpdatedAt) {
        // Cloud is newer - pull from cloud
        console.log('📥 Cloud is newer, pulling...');
        await pullFromCloud();
      } else if (localUpdatedAt > cloudUpdatedAt) {
        // Local is newer - push to cloud
        console.log('📤 Local is newer, pushing...');
        await pushToCloud();
      } else {
        // Already in sync
        console.log('✅ Already in sync');
        setLastSyncTime();
      }
    }

    return {
      syncing: false,
      lastSync: getLastSyncTime(),
      error: null,
    };
  } catch (err: any) {
    console.error('❌ Sync error:', err);
    return {
      syncing: false,
      lastSync: getLastSyncTime(),
      error: err.message,
    };
  }
}

export async function deleteCloudVault(): Promise<void> {
  console.log('🗑️ Deleting cloud vault...');
  
  // Don't check subscription for deletion - allow users to delete their data

  const user = await getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('vaults')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;

  localStorage.removeItem(LAST_SYNC_KEY);
  console.log('✅ Cloud vault deleted');
}