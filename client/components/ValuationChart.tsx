'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from './CurrencyProvider';

export default function ValuationChart({ data }: { data: { year: number; price: number }[] }) {
  // Pull in our dynamic formatter
  const { formatPrice } = useCurrency();

  // Recharts custom tooltip to display the full formatted price on hover
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-sm">
          <p className="mb-1 text-sm font-medium text-zinc-400">{label} Valuation</p>
          <p className="text-2xl font-black text-emerald-400">
            {/* payload[0].payload.price targets the raw INR data we passed to the chart */}
            {formatPrice(payload[0].payload.price)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          
          <XAxis 
            dataKey="year" 
            stroke="#52525b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          
          <YAxis 
            stroke="#52525b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            // Use our new hook with the 'compact' flag set to true!
            tickFormatter={(value) => formatPrice(value, true)} 
            width={80}
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '5 5' }} 
          />
          
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#34d399" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}