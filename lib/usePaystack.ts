// lib/usePaystack.ts
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackConfig {
  email: string;
  amount: number;
  currency: string;
  publicKey: string;
  reference: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
}

export function usePaystack() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    // Mark as loaded when ready
    script.onload = () => {
      console.log('✅ Paystack script loaded successfully');
      scriptLoaded.current = true;
    };

    script.onerror = () => {
      console.error('❌ Failed to load Paystack script');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup - keep it cached!
    };
  }, []);

  const initializePayment = (config: PaystackConfig) => {
    // If PaystackPop not ready yet, wait for it
    if (!window.PaystackPop) {
      console.log('⏳ Waiting for Paystack to load...');
      
      let attempts = 0;
      const maxAttempts = 20; // Wait up to 10 seconds
      
      const waitForPaystack = setInterval(() => {
        attempts++;
        console.log(`⏳ Attempt ${attempts}/${maxAttempts} - Waiting for Paystack...`);
        
        if (window.PaystackPop) {
          clearInterval(waitForPaystack);
          console.log('✅ Paystack ready! Opening payment...');
          openPaystackPopup(config);
        } else if (attempts >= maxAttempts) {
          clearInterval(waitForPaystack);
          console.error('❌ Paystack failed to load after 10 seconds');
          alert('Payment system failed to load. Please check your internet connection and try again.');
          config.onClose(); // Reset loading state
        }
      }, 500);
      
      return;
    }

    openPaystackPopup(config);
  };

  const openPaystackPopup = (config: PaystackConfig) => {
    try {
      console.log('🚀 Opening Paystack popup...');
      console.log('🔑 Key:', config.publicKey ? 'Present' : 'MISSING!');
      console.log('📧 Email:', config.email);
      console.log('💰 Amount:', config.amount);
      console.log('💱 Currency:', config.currency);

      if (!config.publicKey) {
        alert('Payment configuration error. Please contact support.');
        config.onClose();
        return;
      }

      const handler = window.PaystackPop.setup({
        key: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: config.currency,
        ref: config.reference,
        callback: (response: any) => {
          console.log('✅ Paystack callback received:', response);
          config.onSuccess(response);
        },
        onClose: () => {
          console.log('🚪 Paystack popup closed');
          config.onClose();
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error('❌ Paystack popup error:', err);
      alert('Failed to open payment window. Please try again.');
      config.onClose();
    }
  };

  return { initializePayment };
}