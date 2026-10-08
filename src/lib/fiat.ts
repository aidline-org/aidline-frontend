'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { config } from '@/lib/config';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN';

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'NGN'];

interface Rates {
  usd: number;
  eur: number;
  gbp: number;
  ngn: number;
}

interface FiatContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Rates | null;
  loading: boolean;
  error: boolean;
  formatFiat: (rawXlm: string | bigint | number) => string | null;
}

const FiatContext = createContext<FiatContextValue | null>(null);

const STORAGE_KEY = 'aidline_currency';

export function FiatProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (saved && CURRENCIES.includes(saved)) {
        setCurrencyState(saved);
      }
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, c);
    }
  }, []);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,eur,gbp,ngn',
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) throw new Error('Price fetch failed');
      const data = await res.json();
      if (data && data.stellar) {
        setRates({
          usd: Number(data.stellar.usd) || 0,
          eur: Number(data.stellar.eur) || 0,
          gbp: Number(data.stellar.gbp) || 0,
          ngn: Number(data.stellar.ngn) || 0,
        });
      } else {
        throw new Error('Invalid rate format');
      }
    } catch {
      setError(true);
      setRates(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRates();
    const interval = setInterval(fetchRates, 60_000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const formatFiat = useCallback(
    (rawXlm: string | bigint | number): string | null => {
      if (!rates) return null;
      const rateKey = currency.toLowerCase() as keyof Rates;
      const rate = rates[rateKey];
      if (!rate || rate <= 0) return null;

      let numericXlm = 0;
      if (typeof rawXlm === 'bigint') {
        numericXlm = Number(rawXlm) / 10 ** config.tokenDecimals;
      } else if (typeof rawXlm === 'string') {
        const parsed = parseFloat(rawXlm.replace(/,/g, ''));
        if (isNaN(parsed)) return null;
        numericXlm = parsed;
      } else if (typeof rawXlm === 'number') {
        if (isNaN(rawXlm)) return null;
        numericXlm = rawXlm;
      }

      if (numericXlm <= 0) return null;

      const fiatVal = numericXlm * rate;
      try {
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: fiatVal < 1 ? 4 : 2,
        }).format(fiatVal);
        return `~ ${formatted}`;
      } catch {
        return `~ ${fiatVal.toFixed(2)} ${currency}`;
      }
    },
    [currency, rates],
  );

  return (
    <FiatContext.Provider value={{ currency, setCurrency, rates, loading, error, formatFiat }}>
      {children}
    </FiatContext.Provider>
  );
}

export function useFiat(): FiatContextValue {
  const ctx = useContext(FiatContext);
  if (!ctx) {
    throw new Error('useFiat must be used within a FiatProvider');
  }
  return ctx;
}
