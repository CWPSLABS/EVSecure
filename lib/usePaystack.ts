// lib/usePaystack.ts
import { useEffect } from 'react';

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
  useEffect(() => {
    // Load Paystack inline script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializePayment = (config: PaystackConfig) => {
    if (!window.PaystackPop) {
      console.error('Paystack script not loaded');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: config.publicKey,
      email: config.email,
      amount: config.amount,
      currency: config.currency,
      ref: config.reference,
      callback: (response: any) => {
        config.onSuccess(response);
      },
      onClose: () => {
        config.onClose();
      },
    });

    handler.openIframe();
  };

  return { initializePayment };
}