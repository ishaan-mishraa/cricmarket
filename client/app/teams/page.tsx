import { createClient } from '@/utils/supabase/server';
import TeamCard from '@/components/TeamCard';

export default async function TeamsPage() {
  const supabase = await createClient();

  // 1. Fetch Teams + 2026 Valuations + Associated Players
  const { data: teamsData, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      league,
      valuations (
        price_usd,
        year,
        players (
          name,
          role,
          slug
        )
      )
    `);

  if (error) {
    console.error("Error fetching teams:", error);
  }

  const SEASON_YEAR = 2026;
  const TOTAL_BUDGET = 15000000; // $15M Standard IPL Budget (Adjust if you have this in DB)

  // 2. Format the data to easily map to our Client Component
  const formattedTeams = teamsData?.map((team) => {
    // Isolate only the players active in the current season
    const currentValuations = team.valuations?.filter((v: any) => v.year === SEASON_YEAR) || [];

    // Crunch the financials
    const spent = currentValuations.reduce((sum: number, v: any) => sum + (v.price_usd || 0), 0);
    const remaining = TOTAL_BUDGET - spent;

    // Format the roster and sort by the most expensive players at the top
    const roster = currentValuations.map((v: any) => ({
      name: v.players?.name,
      role: v.players?.role,
      slug: v.players?.slug,
      price: v.price_usd,
    })).sort((a: any, b: any) => b.price - a.price);

    return {
      id: team.id,
      name: team.name,
      league: team.league,
      budget: TOTAL_BUDGET,
      spent,
      remaining,
      roster,
    };
  }) || [];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-4xl font-black tracking-tighter text-white">Franchise Hub</h1>
        <p className="mb-10 text-zinc-400">Track live team budgets, spending, and available purses for the {SEASON_YEAR} season.</p>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {formattedTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}