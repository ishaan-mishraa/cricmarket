'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'INR' | 'USD' | 'GBP' | 'AUD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (amountInInr: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ 
  children, 
  initialRates 
}: { 
  children: ReactNode;
  initialRates: Record<string, number>;
}) {
  const [currency, setCurrency] = useState<Currency>('INR');

  const formatPrice = (amountInInr: number) => {
    // Multiply the true INR database price by the live exchange rate
    const rate = initialRates[currency] || 1;
    const converted = amountInInr * rate;
    
    // Format perfectly based on the locale
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'INR' ? 0 : 2, // Decimals for USD/GBP, no decimals for INR
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};