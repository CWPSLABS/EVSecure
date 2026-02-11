// lib/paystack.ts
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

// Supported currencies with their symbols and names
export const SUPPORTED_CURRENCIES = {
  NGN: { symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', country: 'Nigeria' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭', country: 'Ghana' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪', country: 'Kenya' },
  ZAR: { symbol: 'R', name: 'South African Rand', flag: '🇿🇦', country: 'South Africa' },
  USD: { symbol: '$', name: 'US Dollar', flag: '🌍', country: 'International' },
} as const;

export type Currency = keyof typeof SUPPORTED_CURRENCIES;

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Local vault storage',
      'End-to-end encryption',
      'Unlimited variables',
    ],
    limitations: [
      'No cloud sync',
      'No automatic backups',
    ],
  },
  PRO: {
    name: 'Pro',
    interval: 'monthly',
    // Prices in smallest currency unit (kobo, pesewas, cents, etc.)
    prices: {
      NGN: 500000, // ₦5,000.00
      GHS: 7000,   // ₵70.00
      KES: 120000, // KSh 1,200.00
      ZAR: 15000,  // R150.00
      USD: 999,    // $9.99
    },
    features: [
      'Everything in Free',
      'Cloud sync across devices',
      'Automatic encrypted backups',
      'Priority support',
    ],
  },
};

export function getPlanPrice(currency: Currency) {
  return {
    ...PLANS.PRO,
    price: PLANS.PRO.prices[currency],
    currency,
  };
}

export function formatPrice(amount: number, currency: Currency): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  const displayAmount = amount / 100; // Convert from kobo/cents to main unit
  
  return `${currencyInfo.symbol}${displayAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}