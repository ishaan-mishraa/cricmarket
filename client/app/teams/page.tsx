import { getTeams } from '@/lib/api';
import TeamCard from '@/components/TeamCard';

export default async function TeamsPage() {
  // 1. Fetch Teams + 2026 Valuations via your Hono API
  const teamsData = await getTeams();

  const SEASON_YEAR = 2026;
  const TOTAL_BUDGET = 1250000000; // 125 Crores INR

  // 2. Format the data to easily map to our Client Component
  const formattedTeams = teamsData?.map((team: any) => {
    // Isolate only the players active in the current season
    const currentValuations = team.valuations?.filter((v: any) => v.year === SEASON_YEAR) || [];

    // Crunch the financials using the true INR column
    const spent = currentValuations.reduce((sum: number, v: any) => sum + (Number(v.actual_price_local) || 0), 0);
    const remaining = TOTAL_BUDGET - spent;

    // Format the roster and sort by the most expensive players at the top
    const roster = currentValuations
      .filter((v: any) => v.players) // Safety check to ensure player data exists
      .map((v: any) => ({
        name: v.players.name,
        role: v.players.role,
        slug: v.players.slug,
        price: Number(v.actual_price_local) || 0,
      }))
      .sort((a: any, b: any) => b.price - a.price);

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
          {formattedTeams.map((team: any) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}