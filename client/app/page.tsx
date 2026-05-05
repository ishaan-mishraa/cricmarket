import Link from 'next/link';
import Image from 'next/image';
import { getTeams, getPlayers } from '@/lib/api';
import { Activity, Users, Shield, ArrowRight } from 'lucide-react';
import DynamicMetricCard from '@/components/DynamicMetricCard'; // 1. Import the dynamic client component

export default async function Dashboard() {
  // Fetch data in parallel for maximum speed
  const [teams, playersData] = await Promise.all([
    getTeams(),
    getPlayers(6, 0),
  ]);

  const previewPlayers = playersData.players;

  // 1. The 2026 Mega Auction Constants
  const TEAMS_COUNT = 10;
  const PURSE_PER_TEAM_INR = 1250000000; // 125 Crores INR
  const TOTAL_LEAGUE_BUDGET_INR = TEAMS_COUNT * PURSE_PER_TEAM_INR;

  // 2. Schema-Accurate Math based on Hono Payload
  const totalSpentInr = teams.reduce((acc: number, team: any) => {
    const teamValuations = team.valuations || [];
    const seasonValuations = teamValuations.filter((v: any) => v.year === 2026);
    const teamSpent = seasonValuations.reduce((sum: number, v: any) => sum + (Number(v.actual_price_local) || 0), 0);
    
    return acc + teamSpent;
  }, 0);

  const totalRemainingInr = TOTAL_LEAGUE_BUDGET_INR - totalSpentInr;
  const marketLiquidityPercent = (totalRemainingInr / TOTAL_LEAGUE_BUDGET_INR) * 100;

  return (
    <div className="space-y-12 pb-12 pt-4">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/20 p-8 sm:p-12">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Live Market Data Active
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            The Elite Player Analytics Terminal.
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Real-time valuations, T20 statistics, and franchise budget tracking for the 2026 season. 
            Powered by Cloudflare Edge computing.
          </p>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-zinc-800/20 blur-3xl" />
      </section>

      {/* Macro Market Metrics */}
      <section>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-100">
          <Activity className="h-5 w-5 text-zinc-400" />
          Macro Market Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* 3. Swap in the DynamicMetricCards and pass the raw INR values */}
          <DynamicMetricCard 
            title="Total League Purse" 
            valueInInr={TOTAL_LEAGUE_BUDGET_INR} 
            iconName="wallet" 
            color="text-zinc-100" 
          />
          <DynamicMetricCard 
            title="Capital Deployed" 
            valueInInr={totalSpentInr} 
            iconName="trending" 
            color="text-rose-400" 
          />
          <DynamicMetricCard 
            title="Available Liquidity" 
            valueInInr={totalRemainingInr} 
            iconName="activity" 
            color="text-emerald-400" 
          />
          
          {/* Liquidity Progress Bar (Remains Server-Side since it's just a percentage) */}
          <div className="flex flex-col justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
            <p className="text-sm font-medium text-zinc-500">Market Liquidity</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-3xl font-bold text-zinc-100">{marketLiquidityPercent.toFixed(1)}%</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-950">
              <div 
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${Math.max(0, Math.min(marketLiquidityPercent, 100))}%` }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link href="/players" className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-8 transition-all hover:border-zinc-600 hover:bg-zinc-800/60">
          <Users className="mb-4 h-8 w-8 text-zinc-400 group-hover:text-zinc-100" />
          <h3 className="text-2xl font-bold text-zinc-100">Player Market</h3>
          <p className="mt-2 text-zinc-400">Search and filter hundreds of elite players, view their T20 statistics, and analyze their current valuations.</p>
          <div className="mt-6 flex items-center gap-2 font-medium text-zinc-300 transition-transform group-hover:translate-x-2">
            Enter Market <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link href="/teams" className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-8 transition-all hover:border-zinc-600 hover:bg-zinc-800/60">
          <Shield className="mb-4 h-8 w-8 text-zinc-400 group-hover:text-zinc-100" />
          <h3 className="text-2xl font-bold text-zinc-100">Franchise Hub</h3>
          <p className="mt-2 text-zinc-400">Track all 10 IPL franchises. Monitor their spending caps, remaining budgets, and strategic financial positioning.</p>
          <div className="mt-6 flex items-center gap-2 font-medium text-zinc-300 transition-transform group-hover:translate-x-2">
            View Franchises <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </section>

      {/* Featured Players Preview */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">Featured Players</h2>
          <Link href="/players" className="text-sm font-medium text-zinc-400 hover:text-zinc-100">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {previewPlayers.map((player: any) => (
            <Link key={player.id} href={`/players/${player.slug}`}>
              <div className="group relative flex aspect-square w-full flex-col overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950 transition-all hover:border-zinc-600">
                {player.image_url && (
                  <Image
                    src={player.image_url}
                    alt={player.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 16vw"
                    className="object-cover object-top opacity-80 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-100"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="line-clamp-1 font-semibold text-zinc-100">{player.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">{player.role}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// Notice that the static MetricCard function is gone!