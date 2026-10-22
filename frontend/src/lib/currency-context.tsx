'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number; // 1 unit in local = rateToUSD in USD
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 1.08 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 1.28 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 0.012 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToUSD: 0.74 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', rateToUSD: 0.65 },
];

interface CurrencyContextType {
  reportingCurrency: CurrencyOption;
  setReportingCurrencyCode: (code: string) => void;
  formatReportingAmount: (amountInUSD: number) => string;
  convertUSDToReporting: (amountInUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  reportingCurrency: SUPPORTED_CURRENCIES[0],
  setReportingCurrencyCode: () => {},
  formatReportingAmount: (amt) => `$${amt.toLocaleString()}`,
  convertUSDToReporting: (amt) => amt,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [reportingCurrency, setReportingCurrency] = useState<CurrencyOption>(SUPPORTED_CURRENCIES[0]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCode = localStorage.getItem('acme_reporting_currency');
      if (savedCode) {
        const found = SUPPORTED_CURRENCIES.find((c) => c.code === savedCode);
        if (found) setReportingCurrency(found);
      }
    }
  }, []);

  const setReportingCurrencyCode = (code: string) => {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (found) {
      setReportingCurrency(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('acme_reporting_currency', found.code);
      }
    }
  };

  const convertUSDToReporting = (amountInUSD: number) => {
    if (!amountInUSD) return 0;
    if (reportingCurrency.code === 'USD') return amountInUSD;
    return amountInUSD / reportingCurrency.rateToUSD;
  };

  const formatReportingAmount = (amountInUSD: number) => {
    const converted = convertUSDToReporting(amountInUSD);
    const { code, symbol } = reportingCurrency;

    if (code === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(converted);
    }
    if (code === 'EUR') {
      return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(converted);
    }
    if (code === 'GBP') {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(converted);
    }
    if (code === 'INR') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(converted);
    }
    return `${symbol}${Math.round(converted).toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        reportingCurrency,
        setReportingCurrencyCode,
        formatReportingAmount,
        convertUSDToReporting,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
