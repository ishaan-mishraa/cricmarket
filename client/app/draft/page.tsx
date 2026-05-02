import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Wallet, Shield, Users, Trash2 } from 'lucide-react';

export default async function DraftRoom() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the manager's profile
  const { data: profile } = await supabase
    .from('manager_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch their drafted squad with player details
  const { data: squad } = await supabase
    .from('user_squads')
    .select(`
      player_id,
      draft_price_usd,
      players (
        id, name, slug, role, image_url, nationality
      )
    `)
    .eq('user_id', user.id);

  // Financial Mechanics
  const SALARY_CAP = 15000000; // $15M
  const spent = squad?.reduce((acc, curr) => acc + Number(curr.draft_price_usd), 0) || 0;
  const remaining = SALARY_CAP - spent;
  const rosterSize = squad?.length || 0;

  // The Server Action to drop a player
  const dropPlayer = async (playerId: string) => {
    'use server';
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    if (!user) return;

    // Delete the specific player from this manager's squad
    const { error } = await supabaseServer
      .from('user_squads')
      .delete()
      .match({ user_id: user.id, player_id: playerId });

    if (!error) {
      // Refresh the page data to recalculate the budget
      revalidatePath('/draft');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-12 pt-4">
      {/* Header & Financials */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Manager ID Card */}
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Franchise Manager</p>
              <h1 className="text-xl font-bold text-zinc-100">{profile?.display_name || 'Anonymous'}</h1>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-zinc-800/50 pt-4">
            <span className="text-sm text-zinc-500">Roster Size</span>
            <span className="font-semibold text-zinc-100">{rosterSize} / 15 Players</span>
          </div>
        </div>

        {/* The Purse */}
        <div className="flex flex-col justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Wallet className="h-4 w-4 text-emerald-500" />
              Available Draft Purse
            </p>
            <p className="text-sm text-zinc-500">Cap: {formatMoney(SALARY_CAP)}</p>
          </div>
          
          <h2 className={`text-4xl font-bold tracking-tight ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatMoney(remaining)}
          </h2>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-950">
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${(remaining / SALARY_CAP) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* The Roster */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-zinc-100">
            <Users className="h-5 w-5 text-zinc-400" />
            Active Roster
          </h2>
          <Link href="/players" className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-300">
            Enter Market
          </Link>
        </div>

        {rosterSize === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800/50 p-12 text-center">
            <p className="text-zinc-500">Your franchise has no players. Enter the market to start drafting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {squad?.map((slot: any) => {
              const p = slot.players;
              return (
                <div key={p.id} className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-4 transition-colors hover:border-zinc-700">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-950">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} fill className="object-cover object-top" sizes="64px" />
                    ) : (
                      <Users className="absolute inset-0 m-auto h-6 w-6 text-zinc-800" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-zinc-100">{p.name}</h3>
                    <p className="truncate text-xs text-zinc-400">{p.role}</p>
                    <p className="mt-1 font-mono text-sm font-medium text-emerald-400">
                      {formatMoney(slot.draft_price_usd)}
                    </p>
                  </div>

                  {/* The Drop Button */}
                  <form action={dropPlayer.bind(null, p.id)}>
                    <button 
                      type="submit"
                      className="absolute right-3 top-3 rounded-lg p-2 text-zinc-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                      title="Drop from Squad"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}