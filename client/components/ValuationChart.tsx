'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChartProps {
  data: {
    year: number;
    price: number;
  }[];
}

export default function ValuationChart({ data }: ChartProps) {
  // Format currency for the tooltip
  const formatMoney = (value: number) => {
    if (value === 0) return 'Undrafted';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="mt-8 h-62.5 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="year" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            hide={true} 
            domain={['dataMin - 50000', 'dataMax + 200000']} 
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-3 shadow-xl backdrop-blur-sm">
                    <p className="text-xs text-zinc-400 font-medium mb-1">
                      {payload[0].payload.year} Valuation
                    </p>
                    <p className="text-lg font-bold text-emerald-400">
                      {formatMoney(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            activeDot={{ r: 6, fill: "#10b981", stroke: "#09090b", strokeWidth: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}