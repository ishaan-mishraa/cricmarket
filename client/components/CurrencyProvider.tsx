'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'INR' | 'USD' | 'GBP' | 'AUD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  // We added a 'compact' boolean flag here
  formatPrice: (amountInInr: number, compact?: boolean) => string; 
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

  const formatPrice = (amountInInr: number, compact = false) => {
    const rate = initialRates[currency] || 1;
    const converted = amountInInr * rate;
    
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      // If compact is true, it shows 1.7M or 14Cr. If false, shows full numbers.
      notation: compact ? 'compact' : 'standard', 
      maximumFractionDigits: compact ? 1 : (currency === 'INR' ? 0 : 2),
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