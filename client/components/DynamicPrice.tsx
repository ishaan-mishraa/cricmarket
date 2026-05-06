'use client';

import { useCurrency } from './CurrencyProvider';

interface Props {
  amountInInr: number;
  compact?: boolean;
}

export default function DynamicPrice({ amountInInr, compact = false }: Props) {
  const { formatPrice } = useCurrency();
  
  // Renders the live, converted currency string
  return <>{formatPrice(amountInInr, compact)}</>;
}