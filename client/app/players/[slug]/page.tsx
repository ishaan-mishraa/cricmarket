import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ArrowLeft, Activity, Trophy, Shield, Plus, Check, Trash2 } from 'lucide-react';
import { getPlayerBySlug } from '@/lib/api';
import { createClient } from '@/utils/supabase/server';
import ValuationChart from '@/components/ValuationChart';
import AIScoutingReport from '@/components/AIScoutingReport';
import DynamicPrice from '@/components/DynamicPrice'; // <-- Imported the Dynamic Price Component

const getLogoPath = (teamName: string) => {
  if (!teamName) return '/logo.svg';
  const formattedName = teamName.toLowerCase().replace(/ /g, '-');
  return `/teams/${formattedName}.png`;
};

export default async function PlayerProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  
  // 1. Fetch Player Data
  let player;
  try {
    player = await getPlayerBySlug(resolvedParams.slug);
  } catch (error) {
    notFound();
  }
  if (!player) notFound();

  const stats = player.player_stats?.[0];
  
  // Prepare all valuations and sort them chronologically
  const allValuations = player.valuations || [];
  const sortedValuations = [...allValuations].sort((a: any, b: any) => a.year - b.year);
  
  // Map data specifically for Recharts using the true INR column
  const chartData = sortedValuations.map((v: any) => ({
    year: v.year,
    price: Number(v.actual_price_local) || 0
  }));

  // Get the current/latest valuation
  const currentValuation = allValuations.find((v: any) => v.year === 2026) || sortedValuations[sortedValuations.length - 1];
  const team = currentValuation?.teams;
  
  // Fallback to 50 Lakhs (5000000 INR) base price if undefined
  const playerPrice = currentValuation?.actual_price_local || 5000000; 

  // 2. Fetch Manager Data (If logged in)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isDrafted = false;
  // Set Manager Budget to 125 Crores INR
  let remainingBudget = 1250000000;
  let rosterSize = 0;

  if (user) {
    const { data: squad } = await supabase
      .from('user_squads')
      .select('player_id, draft_price_usd')
      .eq('user_id', user.id);

    if (squad) {
      rosterSize = squad.length;
      // Storing INR values in the existing bigint column
      const spent = squad.reduce((sum, p) => sum + Number(p.draft_price_usd), 0);
      remainingBudget -= spent;
      isDrafted = squad.some((p) => p.player_id === player.id);
    }
  }

  // 3. Server Actions for Manager Mode
  const draftPlayer = async () => {
    'use server';
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    if (!user) return redirect('/login');

    const { error } = await supabaseServer.from('user_squads').insert({
      user_id: user.id,
      player_id: player.id,
      draft_price_usd: playerPrice, // Inserting INR value
    });

    if (!error) {
      revalidatePath(`/players/${player.slug}`);
      redirect('/draft');
    }
  };

  const dropPlayer = async () => {
    'use server';
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    if (!user) return redirect('/login');

    const { error } = await supabaseServer.from('user_squads').delete().match({
      user_id: user.id,
      player_id: player.id,
    });

    if (!error) {
      revalidatePath(`/players/${player.slug}`);
    }
  };

  // Determine button state
  const canAfford = remainingBudget >= playerPrice;
  const isRosterFull = rosterSize >= 15;

  return (
    <div className="space-y-8 pb-12 pt-4">
      {/* Back Button */}
      <Link href="/players" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100">
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
              <div className="flex h-full w-full items-center justify-center text-zinc-800">No Image Available</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{player.name}</h1>
              <p className="mt-2 text-lg font-medium text-zinc-300">{player.role}</p>
            </div>
          </div>

          {team && (
            <div className="flex items-center gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5" style={{ borderLeftColor: team.primary_color, borderLeftWidth: '4px' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 p-2">
              <Image 
                src={getLogoPath(team.name)}
                alt={`${team.name} Logo`}
                width={40}
                height={40}
                className="object-contain w-auto h-auto"
              />
            </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Current Franchise</p>
                <p className="text-lg font-bold text-zinc-100">{team.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stats & Financials */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          
          {/* Financials & Draft Action Area */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6 sm:p-8 flex flex-col gap-8">
            {/* Top Row: Price & Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-zinc-100">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Market Valuation
                </h2>
                <div className="mt-6">
                  <p className="text-sm font-medium text-zinc-500">2026 Contract Value</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-emerald-400">
                    {/* Swapped static formatter for the Dynamic Price component */}
                    <DynamicPrice amountInInr={playerPrice} />
                  </p>
                </div>
              </div>

              {/* Smart Draft Logic */}
              <div className="w-full sm:w-auto">
                {!user ? (
                  <Link href="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-8 py-4 font-bold text-zinc-900 transition-colors hover:bg-zinc-300">
                    Sign in to Draft
                  </Link>
                ) : isDrafted ? (
                  <form action={dropPlayer}>
                    <button type="submit" className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 px-8 py-4 font-bold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-95">
                      <Trash2 className="h-5 w-5" /> Drop from Squad
                    </button>
                  </form>
                ) : isRosterFull ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-8 py-4 font-bold text-rose-400 cursor-not-allowed">
                    Roster Full (15/15)
                  </div>
                ) : !canAfford ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-8 py-4 font-bold text-rose-400 cursor-not-allowed">
                    Insufficient Funds
                  </div>
                ) : (
                  <form action={draftPlayer}>
                    <button type="submit" className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-8 py-4 font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-95">
                      <Plus className="h-5 w-5" /> Draft Player
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Bottom Row: Recharts Stock Ticker */}
            <div className="pt-6 border-t border-zinc-800/50">
              {chartData.length > 1 ? (
                <ValuationChart data={chartData} />
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-zinc-800 border-dashed bg-zinc-900/30">
                  <p className="text-sm text-zinc-500">Insufficient historical data for chart.</p>
                </div>
              )}
            </div>
          </div>

          {/* T20 Career Stats */}
          {stats ? (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-zinc-100">
                <Trophy className="h-5 w-5 text-amber-500" />
                T20 Career Statistics
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-px bg-zinc-800/50 sm:grid-cols-4 overflow-hidden rounded-xl border border-zinc-800/50">
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">Matches</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.matches}</p></div>
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">Runs</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.runs}</p></div>
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">Strike Rate</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.batting_strike_rate}</p></div>
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">Average</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.batting_avg}</p></div>
                
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">Wickets</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.wickets}</p></div>
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">Economy</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.economy}</p></div>
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">Best Bowling</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.best_bowling || '-'}</p></div>
                <div className="bg-zinc-950 p-6"><p className="text-sm font-medium text-zinc-500">5W Hauls</p><p className="mt-2 text-2xl font-bold text-zinc-100">{stats.five_wicket_hauls}</p></div>
              </div>
            </div>
          ) : (
             <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-8 text-center text-zinc-500">No T20 statistics available.</div>
          )}
          <AIScoutingReport playerName={player.name} stats={stats} />
        </div>
      </div>
    </div>
  );
}