import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type CurrencyCode = 'SAR' | 'USD' | 'EUR';

export interface CurrencyInfo {
  code: CurrencyCode;
  rate: number; // Conversion rate relative to SAR (1 SAR = rate TargetCurrency)
  symbolAr: string;
  symbolEn: string;
  nameAr: string;
  nameEn: string;
  flag: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyInfo> = {
  SAR: {
    code: 'SAR',
    rate: 1.0,
    symbolAr: 'ر.س',
    symbolEn: 'SAR',
    nameAr: 'ريال سعودي',
    nameEn: 'Saudi Riyal',
    flag: '🇸🇦',
  },
  USD: {
    code: 'USD',
    rate: 0.2667, // Approximate 1 SAR ≈ 0.2667 USD (1 USD ≈ 3.75 SAR)
    symbolAr: '$',
    symbolEn: '$',
    nameAr: 'دولار أمريكي',
    nameEn: 'US Dollar',
    flag: '🇺🇸',
  },
  EUR: {
    code: 'EUR',
    rate: 0.245, // Approximate 1 SAR ≈ 0.245 EUR (1 EUR ≈ 4.08 SAR)
    symbolAr: '€',
    symbolEn: '€',
    nameAr: 'يورو أوروبي',
    nameEn: 'Euro',
    flag: '🇪🇺',
  },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  currencyInfo: CurrencyInfo;
  convertPrice: (amountInSAR: number) => number;
  formatPrice: (amountInSAR: number, options?: { hideSymbol?: boolean; fractionDigits?: number }) => string;
  symbol: string;
  availableCurrencies: CurrencyInfo[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'usil_selected_currency';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
      if (saved && CURRENCY_CONFIGS[saved]) {
        return saved;
      }
    }
    return 'SAR';
  });

  const setCurrency = (code: CurrencyCode) => {
    if (CURRENCY_CONFIGS[code]) {
      setCurrencyState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // ignore
      }
    }
  };

  const isArabic = (i18n.language || 'ar').startsWith('ar');
  const currencyInfo = CURRENCY_CONFIGS[currency];
  const symbol = isArabic ? currencyInfo.symbolAr : currencyInfo.symbolEn;

  const convertPrice = (amountInSAR: number): number => {
    if (currency === 'SAR') return amountInSAR;
    const converted = amountInSAR * currencyInfo.rate;
    // For USD and EUR, round to nearest integer if >= 50, otherwise 2 decimals
    if (converted >= 100) {
      return Math.round(converted);
    }
    return Math.round(converted * 100) / 100;
  };

  const formatPrice = (
    amountInSAR: number,
    options?: { hideSymbol?: boolean; fractionDigits?: number }
  ): string => {
    const converted = convertPrice(amountInSAR);
    const locale = isArabic ? 'ar-SA' : 'en-US';

    const formattedNumber = converted.toLocaleString(locale, {
      minimumFractionDigits: options?.fractionDigits !== undefined ? options.fractionDigits : (currency === 'SAR' || converted % 1 === 0 ? 0 : 2),
      maximumFractionDigits: options?.fractionDigits !== undefined ? options.fractionDigits : (currency === 'SAR' || converted % 1 === 0 ? 0 : 2),
    });

    if (options?.hideSymbol) {
      return formattedNumber;
    }

    if (isArabic) {
      return `${formattedNumber} ${symbol}`;
    } else {
      return currency === 'USD' || currency === 'EUR' ? `${symbol}${formattedNumber}` : `${formattedNumber} ${symbol}`;
    }
  };

  const availableCurrencies = Object.values(CURRENCY_CONFIGS);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyInfo,
        convertPrice,
        formatPrice,
        symbol,
        availableCurrencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
