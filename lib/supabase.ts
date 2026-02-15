'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return supabaseInstance;
}

export const supabase = getSupabase();

export async function getUser() {
  const client = getSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  return user;
}

export async function isAuthenticated() {
  try {
    const user = await getUser();
    return !!user;
  } catch {
    return false;
  }
}