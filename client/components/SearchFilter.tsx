'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { useTransition, useState } from 'react';

export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize state from URL params so it survives refreshes
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);

    startTransition(() => {
      router.push(`/players?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
      
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search players by name (e.g. Kohli, Khan)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      {/* Role Dropdown */}
      <div className="relative w-full sm:w-56">
        <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            // Auto-submit the form when a dropdown option is clicked
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) params.set('role', e.target.value);
            else params.delete('role');
            if (search) params.set('search', search);
            startTransition(() => router.push(`/players?${params.toString()}`));
          }}
          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-zinc-100 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="">All Roles</option>
          <option value="Batsman">Batter</option>
          <option value="Bowler">Bowler</option>
          <option value="WK-Batsman">Wicketkeeper</option>
          <option value="Batting Allrounder">Batting Allrounder</option>
          <option value="Bowling Allrounder">Bowling Allrounder</option>
        </select>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className="rounded-lg bg-zinc-100 px-6 py-2.5 font-medium text-zinc-900 transition-colors hover:bg-zinc-300 disabled:opacity-50"
        disabled={isPending}
      >
        {isPending ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}