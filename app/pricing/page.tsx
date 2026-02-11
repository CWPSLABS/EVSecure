'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/supabase';
import { 
  PAYSTACK_PUBLIC_KEY, 
  PLANS, 
  getPlanPrice, 
  formatPrice,
  SUPPORTED_CURRENCIES,
  Currency 
} from '@/lib/paystack';
import { 
  getSubscription, 
  createProSubscription, 
  type Subscription, 
  refreshSubscription 
} from '@/lib/subscription';
import { usePaystack } from '@/lib/usePaystack';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const { initializePayment } = usePaystack();

  useEffect(() => {
    checkAuthAndSubscription();
    detectUserCurrency();
  }, []);

  const detectUserCurrency = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const countryCode = data.country_code;

      const currencyMap: Record<string, Currency> = {
        'NG': 'NGN',
        'GH': 'GHS',
        'KE': 'KES',
        'ZA': 'ZAR',
      };

      setCurrency(currencyMap[countryCode] || 'USD');
    } catch (error) {
      console.log('Could not detect currency, using default');
      setCurrency('NGN');
    }
  };

  const checkAuthAndSubscription = async () => {
    console.log('🔍 Checking auth and subscription...');
    setCheckingSubscription(true);
    
    try {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);

      if (authenticated) {
        const user = await getUser();
        setUserEmail(user?.email || null);

        const subscription = await refreshSubscription();
        setCurrentSubscription(subscription);
        console.log('📊 Current subscription:', subscription);
      }
    } catch (error) {
      console.error('Error checking auth/subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const plan = getPlanPrice(currency);
  
  const hasActiveProSubscription = Boolean(
  currentSubscription?.plan === 'pro' && 
  currentSubscription?.status === 'active' &&
  (!currentSubscription?.current_period_end || new Date(currentSubscription.current_period_end) > new Date())
);

  const handleSubscribe = async () => {
    if (!isAuth) {
      router.push('/settings?showAuth=true');
      return;
    }

    if (!userEmail) {
      alert('Please sign in first');
      return;
    }

    console.log('💳 Starting subscription process...');
    setLoading(true);

    const config = {
      email: userEmail,
      amount: plan.price,
      currency: currency,
      publicKey: PAYSTACK_PUBLIC_KEY,
      reference: `sub_${Date.now()}`,
     
      onSuccess: async (response: any) => {
        console.log('✅ Payment successful:', response);
        
        try {
          const user = await getUser();
          if (!user) throw new Error('Not authenticated');

          console.log('💾 Creating subscription in database...');

          const endDate = new Date();
          //endDate.setDate(endDate.getDate() + 30);
          
          endDate.setMinutes(endDate.getMinutes() + 300);
          
          await createProSubscription(
            user.id,
            user.email!,
            response.customer_code || '',
            response.reference || '',
            currency,
            plan.price,
            endDate.toISOString()
          );

          console.log('✅ Subscription created successfully!');

          await new Promise(resolve => setTimeout(resolve, 2000));
          window.location.href = '/subscription/Success';

        } catch (err: any) {
          console.error('❌ Subscription creation error:', err);
          alert(
            `Payment successful but failed to activate subscription. Please contact support with reference: ${response.reference}`
          );
        } finally {
          setLoading(false);
        }
      },
      
      onClose: () => {
        console.log('❌ Payment cancelled');
        setLoading(false);
      },
    };

    initializePayment(config);
  };

  if (checkingSubscription) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4" />
          <p>Loading subscription data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold">
                Env<span className="text-purple-400">Vault</span>
              </h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              {isAuth && (
                <Link
                  href="/settings"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Settings
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Secure your environment variables with end-to-end encryption
          </p>

          {/* Currency Selector */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            {(Object.keys(SUPPORTED_CURRENCIES) as Currency[]).map((curr) => {
              const currInfo = SUPPORTED_CURRENCIES[curr];
              return (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-4 py-2 rounded-md transition-all ${
                    currency === curr
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  aria-label={`Select ${currInfo.country} currency`}
                >
                  {currInfo.flag} {currInfo.country}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {SUPPORTED_CURRENCIES[currency].symbol}0
              </span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {PLANS.FREE.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg 
                    className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
              {PLANS.FREE.limitations.map((limitation, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg 
                    className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                  <span className="text-gray-400">{limitation}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-3 bg-slate-700 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
              aria-label="Free plan - currently active"
            >
              {!hasActiveProSubscription ? 'Current Plan ✓' : 'Downgrade Available'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-500 hover:border-purple-400 transition-colors">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
              MOST POPULAR
            </div>

            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {formatPrice(plan.price, currency)}
              </span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg 
                    className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                  <span className="text-gray-100">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading || hasActiveProSubscription}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              aria-label={hasActiveProSubscription ? 'Pro plan - currently active' : 'Subscribe to Pro plan'}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Processing...
                </span>
              ) : hasActiveProSubscription ? (
                'Current Plan ✓'
              ) : (
                'Subscribe Now'
              )}
            </button>

            {!isAuth && (
              <p className="mt-3 text-center text-sm text-gray-400">
                Sign in required to subscribe
              </p>
            )}

            {hasActiveProSubscription && currentSubscription?.current_period_end && (
              <p className="mt-3 text-center text-sm text-green-400">
                Active until {new Date(currentSubscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            <details className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                <span>Is my data secure?</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-400 leading-relaxed">
                Yes! All your environment variables are encrypted end-to-end using AES-256 encryption. 
                We never have access to your unencrypted data.
              </p>
            </details>

            <details className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                <span>Can I cancel anytime?</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-400 leading-relaxed">
                Yes! You can cancel your subscription at any time from your settings page. 
                You'll continue to have access until the end of your billing period.
              </p>
            </details>

            <details className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                <span>What payment methods do you accept?</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-400 leading-relaxed">
                We accept all major credit/debit cards, bank transfers, and mobile money through Paystack. 
                Payment methods vary by country.
              </p>
            </details>

            <details className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                <span>What happens to my data if I cancel?</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-400 leading-relaxed">
                Your local vault data always remains on your device. If you cancel, you'll lose access to cloud sync, 
                but you can export your data at any time.
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
