import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Activity, Trophy, Shield } from 'lucide-react';
import { getPlayerBySlug } from '@/lib/api';

export default async function PlayerProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Await the params for Next.js 15
  const resolvedParams = await params;
  
  let player;
  try {
    player = await getPlayerBySlug(resolvedParams.slug);
  } catch (error) {
    notFound();
  }

  if (!player) notFound();

  // Extract relations safely
  const stats = player.player_stats?.[0]; // Assuming Overall T20 is the first/only stat block
  const currentValuation = player.valuations?.[0];
  const team = currentValuation?.teams;

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Back Button */}
      <Link 
        href="/players" 
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Market
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Hero Image & Identity */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 shadow-2xl">
            {player.image_url ? (
              <Image
                src={player.image_url}
                alt={player.name}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover object-top"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-800">
                No Image Available
              </div>
            )}
            {/* Gradient Overlay for aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {player.name}
              </h1>
              <p className="mt-2 text-lg font-medium text-zinc-300">{player.role}</p>
            </div>
          </div>

          {/* Franchise Badge */}
          {team && (
            <div 
              className="flex items-center gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5"
              style={{ borderLeftColor: team.primary_color, borderLeftWidth: '4px' }}
            >
              <Shield className="h-8 w-8 opacity-80" style={{ color: team.primary_color }} />
              <div>
                <p className="text-sm font-medium text-zinc-500">Current Franchise</p>
                <p className="text-lg font-bold text-zinc-100">{team.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stats & Financials */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          
          {/* Financials Overview */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-zinc-100">
              <Activity className="h-5 w-5 text-emerald-500" />
              Market Valuation
            </h2>
            <div className="mt-6">
              <p className="text-sm font-medium text-zinc-500">2026 Contract Value</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-emerald-400">
                {currentValuation?.price_usd ? formatMoney(currentValuation.price_usd) : 'Undisclosed'}
              </p>
            </div>
          </div>

          {/* T20 Career Stats */}
          {stats ? (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-zinc-100">
                <Trophy className="h-5 w-5 text-amber-500" />
                T20 Career Statistics
              </h2>
              
              <div className="mt-8 grid grid-cols-2 gap-px bg-zinc-800/50 sm:grid-cols-4">
                {/* Batting Box */}
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">Matches</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.matches}</p>
                </div>
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">Runs</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.runs}</p>
                </div>
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">Strike Rate</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.batting_strike_rate}</p>
                </div>
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">Average</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.batting_avg}</p>
                </div>

                {/* Bowling Box (if applicable) */}
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">Wickets</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.wickets}</p>
                </div>
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">Economy</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.economy}</p>
                </div>
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">Best Bowling</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.best_bowling || '-'}</p>
                </div>
                <div className="bg-zinc-950 p-6">
                  <p className="text-sm font-medium text-zinc-500">5W Hauls</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stats.five_wicket_hauls}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-8 text-center text-zinc-500">
              No T20 statistics available for this player.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}