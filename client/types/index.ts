export interface Team {
  id: string;
  name: string;
  league: string;
  primary_color?: string;
  total_budget?: number;       // Updated to match DB
  remaining_budget?: number;   // Updated to match DB
  created_at?: string;
  valuations?: Valuation[];    // Added for the nested join from Hono
}

export interface PlayerStats {
  id: string;
  player_id: string;
  format_or_league: string;
  matches: number;
  innings: number;
  runs: number;
  highest_score: string;
  batting_avg: number;
  batting_strike_rate: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  wickets: number;
  best_bowling: string;
  bowling_avg: number;
  economy: number;
  bowling_strike_rate: number;
  four_wicket_hauls: number;
  five_wicket_hauls: number;
}

export interface Valuation {
  id?: string;
  price_usd?: number;
  actual_price_local?: number; // <-- ADDED: Our true INR source of truth
  year: number;                
  acquisition_type?: string;
  teams?: {
    name: string;
    primary_color?: string;
  };
  players?: Partial<Player>;   // <-- ADDED: Allows TeamCard to map the roster
}

export interface Player {
  id: string;
  cricbuzz_id?: string;
  slug: string;
  name: string;
  nationality?: string;
  dob?: string;
  role?: string;
  batting_style?: string;
  bowling_style?: string;
  image_url?: string;
  current_est_value?: number;  // Corrected to match the DB column exactly
  player_stats?: PlayerStats[];
  valuations?: Valuation[];
}

export interface PaginatedResponse<T> {
  players: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}