'use client';

import { useEffect, useState } from 'react';
import { useCurrency } from './CurrencyProvider';

interface Props {
  amountInInr: number;
  compact?: boolean;
}

export default function DynamicPrice({ amountInInr, compact = false }: Props) {
  const { formatPrice } = useCurrency();
  const [mounted, setMounted] = useState(false);

  // Tell React that the browser has safely loaded
  useEffect(() => {
    setMounted(true);
  }, []);

  // Before the browser loads, render an invisible placeholder to prevent Hydration mismatch
  if (!mounted) {
    return <span className="opacity-0">0</span>; 
  }

  // Once safely mounted on the client, render the perfectly formatted currency
  return <>{formatPrice(amountInInr, compact)}</>;
}