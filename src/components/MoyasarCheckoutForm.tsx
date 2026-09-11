import React, { useEffect, useRef } from 'react';

export type MoyasarFormConfig = {
  amount: number;
  currency: string;
  description: string;
  publishable_api_key: string;
  callback_url: string;
  methods?: string[];
  supported_networks?: string[];
  metadata?: Record<string, string>;
};

type MoyasarJs = {
  init: (options: Record<string, unknown>) => void;
};

function loadMoyasarAssets(): Promise<MoyasarJs> {
  return new Promise((resolve, reject) => {
    const existing = (window as unknown as { Moyasar?: MoyasarJs }).Moyasar;
    if (existing) {
      resolve(existing);
      return;
    }
    const cssId = 'moyasar-mpf-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    script.onload = () => {
      const sdk = (window as unknown as { Moyasar?: MoyasarJs }).Moyasar;
      if (!sdk) {
        reject(new Error('تعذر تحميل نموذج ميسر.'));
        return;
      }
      resolve(sdk);
    };
    script.onerror = () => reject(new Error('تعذر تحميل نموذج ميسر.'));
    document.head.appendChild(script);
  });
}

export function MoyasarCheckoutForm({ config }: { config: MoyasarFormConfig }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void loadMoyasarAssets()
      .then((sdk) => {
        sdk.init({
          element: '.usil-moyasar-form',
          language: 'ar',
          amount: config.amount,
          currency: config.currency || 'SAR',
          description: config.description,
          publishable_api_key: config.publishable_api_key,
          callback_url: config.callback_url,
          statement_descriptor: 'USIL',
          methods: config.methods || ['creditcard', 'applepay', 'stcpay'],
          supported_networks: config.supported_networks || ['mada', 'visa', 'mastercard'],
          metadata: config.metadata || {},
          credit_card: { save_card: false, manual: false },
          apple_pay: {
            country: 'SA',
            label: 'يوصل',
            supported_countries: ['SA'],
            merchant_capabilities: ['supports3DS', 'supportsCredit', 'supportsDebit'],
            validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
          },
          on_completed: async (payment: { id?: string }) => {
            const id = String(payment?.id || '').trim();
            if (!id) return;
            await fetch('/api/payments/moyasar/callback', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id }),
            });
          },
        });
      })
      .catch(() => {
        started.current = false;
      });
  }, [config]);

  return (
    <div className="space-y-3 text-right">
      <p className="text-xs text-slate-600 font-bold leading-relaxed">
        ادفع عبر ميسر (مدى / آبل باي / STC Pay). البطاقة تروح لـ POST /v1/payments عند ميسر، مو على سيرفر يوصل.
      </p>
      <div className="usil-moyasar-form mysr-form rounded-2xl border border-slate-200 bg-white p-3" />
    </div>
  );
}
