'use client';

import { useCurrency } from './CurrencyProvider';
import { Wallet, TrendingUp, Activity, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  trending: TrendingUp,
  activity: Activity,
};

interface Props {
  title: string;
  valueInInr: number;
  iconName: 'wallet' | 'trending' | 'activity';
  color?: string;
}

export default function DynamicMetricCard({ title, valueInInr, iconName, color = "text-zinc-100" }: Props) {
  const { formatPrice } = useCurrency();
  const Icon = ICON_MAP[iconName];
  
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className={`mt-3 text-2xl sm:text-3xl font-bold ${color}`}>
        {formatPrice(valueInInr)}
      </p>
    </div>
  );
}