import { Shield, Wallet, TrendingDown } from 'lucide-react';
import { getTeams } from '@/lib/api';

export default async function TeamsPage() {
  const teams = await getTeams();

  // Helper to format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-zinc-800/50 pb-6 pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Franchise Hub</h1>
        <p className="mt-2 text-zinc-400">Track live team budgets, spending, and available purses for the 2026 season.</p>
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          // Calculate the financial metrics
          const spent = team.total_budget_usd - team.remaining_budget_usd;
          const remainingPercent = (team.remaining_budget_usd / team.total_budget_usd) * 100;
          
          return (
            <div 
              key={team.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/60"
            >
              {/* Dynamic Neon Top Border using the team's actual hex color */}
              <div 
                className="absolute left-0 top-0 h-1 w-full transition-opacity duration-300 group-hover:opacity-100 opacity-70"
                style={{ backgroundColor: team.primary_color }}
              />

              {/* Header: Team Identity */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 shadow-inner"
                    style={{ border: `1px solid ${team.primary_color}40` }} // 40 is hex for 25% opacity
                  >
                    <Shield className="h-6 w-6" style={{ color: team.primary_color }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-100">{team.name}</h2>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{team.league}</p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="mt-8 space-y-5">
                {/* Remaining Purse (Hero Number) */}
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    Remaining Purse
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-100">
                    {formatMoney(team.remaining_budget_usd)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-zinc-500">
                    <span>Spent: {formatMoney(spent)}</span>
                    <span>{remainingPercent.toFixed(1)}% Left</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-950">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${100 - remainingPercent}%`,
                        backgroundColor: team.primary_color 
                      }}
                    />
                  </div>
                </div>
                
                {/* Total Budget Reference */}
                <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 text-sm text-zinc-500">
                  <span>Total Cap</span>
                  <span className="font-medium text-zinc-300">{formatMoney(team.total_budget_usd)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}