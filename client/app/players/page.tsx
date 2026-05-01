import Image from 'next/image';
import Link from 'next/link';
import { getPlayers } from '@/lib/api';
import SearchFilter from '@/components/SearchFilter';

export default async function PlayersPage({
  searchParams,
}: {
  // Next.js 15 requires searchParams to be typed as a Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the Promise before extracting values
  const resolvedParams = await searchParams;

  // Extract params safely
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;
  const role = typeof resolvedParams.role === 'string' ? resolvedParams.role : undefined;

  // Fetch from the Cloudflare Edge API
  const data = await getPlayers(48, 0, search, role);
  const players = data.players;
  const meta = data.meta;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-zinc-800/50 pb-6 pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Player Market</h1>
        <p className="mt-2 text-zinc-400">Browse the elite tier of global cricket talent.</p>
      </div>

      {/* Interactive Search & Filter Bar */}
      <SearchFilter />

      {/* Metadata Readout */}
      <div className="text-sm text-zinc-500">
        Showing {players.length} of {meta?.total || 0} players
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-6">
        {players.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500">
            No players found matching your criteria.
          </div>
        ) : (
          players.map((player) => (
            <Link key={player.id} href={`/players/${player.slug}`}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/80 hover:shadow-2xl hover:shadow-zinc-900/50">
                
                {/* Image Container */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                  {player.image_url ? (
                    <Image
                      src={player.image_url}
                      alt={player.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-800">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="line-clamp-1 font-semibold text-zinc-100 group-hover:text-white">
                      {player.name}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-400">
                      {player.role}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-800/50 pt-3 text-[10px] uppercase tracking-wider text-zinc-500">
                    <span>{player.nationality}</span>
                    <div className="h-2 w-2 rounded-full bg-zinc-700 group-hover:bg-zinc-400 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}