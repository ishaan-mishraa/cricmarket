'use client';

import { useCurrency } from './CurrencyProvider';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center">
      <select 
        value={currency} 
        onChange={(e) => setCurrency(e.target.value as any)}
        className="cursor-pointer appearance-none rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm font-medium text-zinc-300 outline-none transition-colors hover:border-zinc-700 hover:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        title="Select Currency"
      >
        <option value="INR">₹ INR</option>
        <option value="USD">$ USD</option>
        <option value="GBP">£ GBP</option>
        <option value="AUD">$ AUD</option>
      </select>
    </div>
  );
}