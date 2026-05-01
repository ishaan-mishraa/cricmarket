import { Player, Team, PaginatedResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

export async function getTeams(): Promise<Team[]> {
  const res = await fetch(`${API_URL}/teams`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch teams');
  const data = await res.json();
  return data.teams;
}

export async function getTeamById(id: string): Promise<any> {
  const res = await fetch(`${API_URL}/teams/${id}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch team');
  const data = await res.json();
  return data.team;
}

export async function getPlayers(
  limit: number = 24,
  offset: number = 0,
  search?: string,
  role?: string
): Promise<PaginatedResponse<Player>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (search) params.append('search', search);
  if (role) params.append('role', role);

  const res = await fetch(`${API_URL}/players?${params.toString()}`, { 
    cache: 'no-store' // Keep dynamic for search
  });
  
  if (!res.ok) throw new Error('Failed to fetch players');
  return res.json();
}

export async function getPlayerBySlug(slug: string): Promise<Player> {
  const res = await fetch(`${API_URL}/players/${slug}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch player');
  const data = await res.json();
  return data.player;
}