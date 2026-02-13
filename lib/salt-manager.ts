// lib/salt-manager.ts
import { db } from './db';

/**
 * Get the salt from IndexedDB
 * This should be the ONLY way to retrieve the salt in your app
 */
export async function getSalt(): Promise<string> {
  const settings = await db.getSettings();
  
  if (!settings?.salt) {
    throw new Error('Salt not found - vault may not be initialized');
  }

  // Validate salt format
  if (typeof settings.salt !== 'string') {
    throw new Error('Invalid salt format - expected string');
  }

  if (settings.salt.length !== 32) {
    throw new Error(`Invalid salt length: ${settings.salt.length}, expected 32`);
  }

  // Validate it's proper hex
  if (!/^[0-9a-f]{32}$/i.test(settings.salt)) {
    throw new Error('Invalid salt format - must be 32-character hex string');
  }

  return settings.salt;
}

/**
 * Get master password from session storage
 */
export function getMasterPassword(): string {
  const password = sessionStorage.getItem('masterPassword');
  
  if (!password) {
    throw new Error('Not authenticated - please unlock vault');
  }
  
  return password;
}

/**
 * Check if vault is unlocked
 */
export function isUnlocked(): boolean {
  return sessionStorage.getItem('unlocked') === 'true' && 
         !!sessionStorage.getItem('masterPassword');
}

/**
 * Lock the vault
 */
export function lockVault(): void {
  sessionStorage.removeItem('masterPassword');
  sessionStorage.removeItem('unlocked');
}