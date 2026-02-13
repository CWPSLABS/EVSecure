// lib/crypto.ts - FINAL FIX FOR TYPESCRIPT

import { db } from './db';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const ITERATIONS = 100000;
const SALT_LENGTH = 16;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AesGcmParams extends Algorithm {
  name: 'AES-GCM';
  iv: BufferSource;
  additionalData?: BufferSource;
  tagLength?: number;
}

interface Pbkdf2Params extends Algorithm {
  name: 'PBKDF2';
  salt: BufferSource;
  iterations: number;
  hash: string | Algorithm;
}

interface AesKeyGenParams extends Algorithm {
  name: 'AES-GCM';
  length: number;
}

// ============================================================================
// SALT MANAGER (built-in)
// ============================================================================

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

// ============================================================================
// CORE CRYPTO FUNCTIONS
// ============================================================================

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hex = bufferToHex(salt);
  console.log('Generated salt length:', hex.length, 'Expected:', SALT_LENGTH * 2);
  return hex;
}

/**
 * Validate hex string
 */
function validateHex(hex: string, expectedLength: number, name: string): void {
  if (!hex || typeof hex !== 'string') {
    throw new Error(`${name} is missing or invalid type`);
  }
  
  if (hex.length !== expectedLength) {
    throw new Error(
      `${name} has invalid length: ${hex.length}, expected: ${expectedLength}`
    );
  }
  
  if (!/^[0-9a-f]+$/i.test(hex)) {
    throw new Error(`${name} contains invalid hex characters`);
  }
}

/**
 * Hash password for storage verification
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  // Validate inputs
  if (!password) throw new Error('Password is required');
  validateHex(salt, SALT_LENGTH * 2, 'Salt');
  
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = hexToBuffer(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    } as Pbkdf2Params,
    keyMaterial,
    256
  );

  return bufferToHex(new Uint8Array(hashBuffer));
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  try {
    const hash = await hashPassword(password, salt);
    return hash === storedHash;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * Derive encryption key from password
 */
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  validateHex(salt, SALT_LENGTH * 2, 'Salt');
  
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = hexToBuffer(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    } as Pbkdf2Params,
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH } as AesKeyGenParams,
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt a value
 */
export async function encrypt(
  plaintext: string,
  masterPassword: string,
  salt: string
): Promise<{ encryptedValue: string; iv: string }> {
  try {
    if (!plaintext) throw new Error('Plaintext is required');
    if (!masterPassword) throw new Error('Master password is required');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Derive key
    const key = await deriveKey(masterPassword, salt);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ivHex = bufferToHex(iv);
    
    console.log('Generated IV length:', ivHex.length, 'Expected:', IV_LENGTH * 2);

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv as BufferSource } as AesGcmParams,
      key,
      data
    );

    return {
      encryptedValue: bufferToHex(new Uint8Array(encryptedBuffer)),
      iv: ivHex
    };
  } catch (error: any) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt value: ${error.message}`);
  }
}

/**
 * Decrypt a value
 */

/**
 * Decrypt a value
 */
export async function decrypt(
  encryptedValue: string,
  masterPassword: string,
  iv: string,
  salt: string
): Promise<string> {
  try {
    // Validate inputs
    if (!encryptedValue) throw new Error('Encrypted value is required');
    if (!masterPassword) throw new Error('Master password is required');
    validateHex(iv, IV_LENGTH * 2, 'IV');
    
    // Derive key
    const key = await deriveKey(masterPassword, salt);

    // Convert hex to buffers
    const encryptedBuffer = hexToBuffer(encryptedValue);
    const ivBuffer = hexToBuffer(iv);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: ivBuffer as BufferSource } as AesGcmParams,
      key,
      encryptedBuffer as BufferSource  // <-- ADD THIS CAST
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error: any) {
    console.error('Decryption error:', error);
    if (error.message && error.message.includes('Invalid hex')) {
      throw error; // Re-throw validation errors
    }
    throw new Error('Failed to decrypt - incorrect password or corrupted data');
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS (use these in your components!)
// ============================================================================

/**
 * Encrypt a value using the current session's master password
 * Automatically retrieves salt from IndexedDB
 */
export async function encryptValue(plaintext: string): Promise<{ encryptedValue: string; iv: string }> {
  const masterPassword = getMasterPassword();
  const salt = await getSalt();
  return encrypt(plaintext, masterPassword, salt);
}

/**
 * Decrypt a value using the current session's master password
 * Automatically retrieves salt from IndexedDB
 */
export async function decryptValue(
  encryptedValue: string,
  iv: string
): Promise<string> {
  const masterPassword = getMasterPassword();
  const salt = await getSalt();
  return decrypt(encryptedValue, masterPassword, iv, salt);
}

/**
 * Verify the current session password
 */
export async function verifyCurrentPassword(): Promise<boolean> {
  try {
    const password = getMasterPassword();
    const settings = await db.getSettings();
    
    if (!settings) {
      return false;
    }
    
    return verifyPassword(password, settings.masterPasswordHash, settings.salt);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debug function to check salt consistency
 */
export async function debugSaltCheck(): Promise<void> {
  try {
    console.log('=== Salt Debug ===');
    
    const salt = await getSalt();
    console.log('✅ Salt retrieved from IndexedDB');
    console.log('Salt:', salt);
    console.log('Length:', salt.length, '(expected: 32)');
    console.log('Format valid:', /^[0-9a-f]{32}$/i.test(salt));
    
    const settings = await db.getSettings();
    console.log('Full settings:', {
      hasSalt: !!settings?.salt,
      hasHash: !!settings?.masterPasswordHash,
      createdAt: settings?.createdAt
    });
    
    const isAuth = isUnlocked();
    console.log('Session unlocked:', isAuth);
    
    if (isAuth) {
      const passwordValid = await verifyCurrentPassword();
      console.log('Current password valid:', passwordValid);
    }
  } catch (error) {
    console.error('❌ Salt check failed:', error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string - odd length: ${hex.length}`);
  }

  const length = hex.length / 2;
  const bytes = new Uint8Array(length);
  
  for (let i = 0; i < length; i++) {
    const byte = hex.substring(i * 2, i * 2 + 2);
    bytes[i] = parseInt(byte, 16);
    
    if (isNaN(bytes[i])) {
      throw new Error(`Invalid hex character at position ${i * 2}: "${byte}"`);
    }
  }
  
  return bytes;
}


