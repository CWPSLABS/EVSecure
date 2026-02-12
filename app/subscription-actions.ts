"use server";

import { hasActiveSubscription, updateSubscriptionStatus } from '@/lib/subscription';

export async function cancelSubscription(userId: string) {
  await updateSubscriptionStatus(userId, 'cancelled');
}

export async function checkHasActiveSubscription(): Promise<boolean> {
  return await hasActiveSubscription();
}