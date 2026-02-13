"use server";

import "server-only";
import { createClient } from "./supabase-server";

export interface Subscription {
  id?: string;
  user_id: string;
  email: string;
  plan: "free" | "pro";
  status: "active" | "inactive" | "cancelled" | "past_due";
  paystack_customer_code?: string;
  paystack_subscription_code?: string;
  currency: "NGN" | "GHS" | "KES" | "ZAR" | "USD";
  amount?: number;
  current_period_start?: string;
  current_period_end?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getSubscription(): Promise<Subscription | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user found');
      return null;
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found, create free one
        return await createFreeSubscription(user.id, user.email!);
      }
      console.error('Error fetching subscription:', error);
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Error in getSubscription:', error);
    return null;
  }
}

export async function refreshSubscription(): Promise<Subscription | null> {
  return await getSubscription();
}

export async function createFreeSubscription(
  userId: string,
  email: string
): Promise<Subscription> {
  const supabase = await createClient();
  
  const subscription: Partial<Subscription> = {
    user_id: userId,
    email,
    plan: "free",
    status: "active",
    currency: "NGN",
  };

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscription)
    .select()
    .single();

  if (error) {
    console.error('Error creating free subscription:', error);
    throw error;
  }

  return data;
}

export async function createProSubscription(
  userId: string,
  email: string,
  paystackCustomerCode: string,
  paystackSubscriptionCode: string,
  currency: "NGN" | "GHS" | "KES" | "ZAR" | "USD",
  amount: number,
  endDate: string
): Promise<Subscription> {
  const supabase = await createClient();
  
  const subscription: Partial<Subscription> = {
    user_id: userId,
    email,
    plan: "pro",
    status: "active",
    paystack_customer_code: paystackCustomerCode,
    paystack_subscription_code: paystackSubscriptionCode,
    currency,
    amount,
    current_period_start: new Date().toISOString(),
    current_period_end: endDate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(subscription, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error creating pro subscription:', error);
    throw error;
  }

  return data;
}

export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getSubscription();
  
  if (!subscription || subscription.plan !== "pro" || subscription.status !== "active") {
    return false;
  }
  
  // Check if subscription has expired
  if (subscription.current_period_end) {
    const expirationDate = new Date(subscription.current_period_end);
    const now = new Date();
    
    if (now > expirationDate) {
      console.log('⏰ Subscription expired');
      return false;
    }
  }
  
  return true;
}



export async function updateSubscriptionStatus(
  userId: string,
  status: "active" | "inactive" | "cancelled" | "past_due"
): Promise<void> {
  try {
    console.log('📝 Updating subscription status for:', userId, 'to:', status);
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
    
    console.log('✅ Subscription status updated');
  } catch (err: any) {
    console.error('❌ Error in updateSubscriptionStatus:', err);
    throw err;
  }

 } 
  





