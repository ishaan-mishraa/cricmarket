import os
import time
import re
import requests
import json
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

# --- 1. SETUP & AUTHENTICATION ---
load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_KEY"))

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# --- 2. GLOBAL LEAGUE TARGETS ---
GLOBAL_TOURNAMENTS = [
    {"league": "IPL", "year": 2024, "url": "https://www.espncricinfo.com/series/indian-premier-league-2024-1411142/squads"},
    {"league": "BBL", "year": 2024, "url": "https://www.espncricinfo.com/series/big-bash-league-2023-24-1386084/squads"},
    {"league": "SA20", "year": 2024, "url": "https://www.espncricinfo.com/series/sa20-2023-24-1392651/squads"},
    {"league": "PSL", "year": 2024, "url": "https://www.espncricinfo.com/series/pakistan-super-league-2023-24-1406568/squads"},
    {"league": "Hundred", "year": 2024, "url": "https://www.espncricinfo.com/series/the-hundred-men-s-competition-2024-1417778/squads"}
]

# --- 3. HELPER: SAFE JSON EXTRACTION ---
def extract_stat(stats_array, stat_name, default_val=0):
    """Safely extracts a specific stat from the Cricinfo JSON array"""
    try:
        val = next((s['value'] for s in stats_array if s['name'] == stat_name), default_val)
        return float(val) if '.' in str(val) else int(val) if str(val).isdigit() else val
    except (ValueError, TypeError):
        return default_val

# --- 4. DATA HARVESTER ---
def fetch_player_data(cricinfo_id):
    url = f"https://www.espncricinfo.com/cricketers/player-{cricinfo_id}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code != 200: return None

        soup = BeautifulSoup(res.text, 'html.parser')
        script_tag = soup.find('script', id='__NEXT_DATA__')
        if not script_tag: return None
            
        page_data = json.loads(script_tag.string)
        player_props = page_data['props']['pageProps']['data']['player']
        
        # Parse basic info
        image_url = player_props.get('image', {}).get('url')
        if image_url: image_url = f"https://wassets.hscicdn.com{image_url}"
        
        country = player_props.get('country', {}).get('name', 'Unknown')
        
        # Parse DOB safely
        dob_dict = player_props.get('dateOfBirth', {})
        dob = None
        if dob_dict and 'year' in dob_dict and 'month' in dob_dict and 'date' in dob_dict:
            dob = f"{dob_dict['year']}-{dob_dict['month']:02d}-{dob_dict['date']:02d}"

        # Get T20 Stats
        t20_stats = next((stat for stat in player_props.get('stats', []) if stat.get('class', '') == 'T20'), None)

        return {
            "name": player_props.get('name', ''),
            "slug": player_props.get('name', '').lower().replace(' ', '-'),
            "nationality": country,
            "dob": dob,
            "role": player_props.get('playingRole', 'Unknown'),
            "batting_style": player_props.get('battingStyles', [''])[0] if player_props.get('battingStyles') else None,
            "bowling_style": player_props.get('bowlingStyles', [''])[0] if player_props.get('bowlingStyles') else None,
            "image_url": image_url,
            "stats": t20_stats['types'] if t20_stats else []
        }
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return None

# --- 5. THE MASTER PIPELINE ---
def run_pipeline():
    print("==================================================")
    print("🏏 CRICMARKET: UNRESTRICTED DATA SYNC")
    print("==================================================\n")

    for tournament in GLOBAL_TOURNAMENTS:
        league_name = tournament['league']
        year = tournament['year']
        print(f"\n🌍 SCANNING {league_name} {year}...")

        # 1. Fetch Squads Page
        response = requests.get(tournament['url'], headers=HEADERS)
        if response.status_code != 200:
            print(f"❌ Failed to reach {league_name} URL.")
            continue
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all teams on the page (Cricinfo groups them in specific divs)
        team_blocks = soup.find_all('div', class_=re.compile(r'squad-content'))
        if not team_blocks:
            # Fallback for newer UI
            team_blocks = soup.find_all('div', class_=re.compile(r'ds-flex ds-flex-col ds-gap-4'))

        for team_block in team_blocks:
            # Extract Team Name
            team_title = team_block.find(['h2', 'span'], class_=re.compile(r'ds-text-title'))
            if not team_title: continue
            
            # Clean up names like "Chennai Super Kings Squad" -> "Chennai Super Kings"
            team_name = team_title.text.replace('Squad', '').strip()
            
            # 2. SEED TEAMS TABLE
            print(f"\n  🛡️ TEAM: {team_name}")
            team_res = supabase.table('teams').select('id').eq('name', team_name).execute()
            
            if not team_res.data:
                insert_res = supabase.table('teams').insert({
                    "name": team_name,
                    "league": league_name,
                }).execute()
                team_id = insert_res.data[0]['id']
            else:
                team_id = team_res.data[0]['id']

            # Extract Players in this team
            player_links = team_block.find_all('a', href=re.compile(r'/cricketers/.*-(\d+)$'))
            
            for index, link in enumerate(player_links, 1):
                match = re.search(r'-(\d+)$', link['href'])
                if not match: continue
                cricinfo_id = match.group(1)

                print(f"    [{index}/{len(player_links)}] Fetching player ID {cricinfo_id}...", end=" ")
                p_data = fetch_player_data(cricinfo_id)
                
                if not p_data:
                    print("❌ FAILED")
                    continue

                try:
                    # 3. SEED PLAYERS TABLE
                    player_payload = {
                        "slug": p_data['slug'],
                        "name": p_data['name'],
                        "nationality": p_data['nationality'],
                        "dob": p_data['dob'],
                        "role": p_data['role'],
                        "batting_style": p_data['batting_style'],
                        "bowling_style": p_data['bowling_style'],
                        "image_url": p_data['image_url'],
                        "current_estimated_value": 0 # Placeholder until financial scraper is built
                    }
                    p_res = supabase.table('players').upsert(player_payload, on_conflict='slug').execute()
                    player_id = p_res.data[0]['id']

                    # 4. SEED VALUATIONS TABLE (Linking Player -> Team)
                    val_check = supabase.table('valuations').select('id').eq('player_id', player_id).eq('team_id', team_id).eq('year', year).execute()
                    if not val_check.data:
                        supabase.table('valuations').insert({
                            "player_id": player_id,
                            "team_id": team_id,
                            "league": league_name,
                            "year": year,
                            "price_usd": 0 # Financials handled later
                        }).execute()

                    # 5. SEED PLAYER_STATS TABLE (Power & Control Metrics)
                    if p_data['stats']:
                        stats_payload = {
                            "player_id": player_id,
                            "format_or_league": "Overall T20",
                            
                            # Baseline
                            "matches": extract_stat(p_data['stats'], 'matches'),
                            "innings": extract_stat(p_data['stats'], 'innings'),
                            
                            # Batting Metrics
                            "runs": extract_stat(p_data['stats'], 'runs'),
                            "highest_score": str(extract_stat(p_data['stats'], 'highScore', '')),
                            "batting_avg": extract_stat(p_data['stats'], 'battingAverage', None),
                            "batting_strike_rate": extract_stat(p_data['stats'], 'battingStrikeRate', None),
                            "fours": extract_stat(p_data['stats'], 'fours'),
                            "sixes": extract_stat(p_data['stats'], 'sixes'),
                            "fifties": extract_stat(p_data['stats'], 'fifties'),
                            "hundreds": extract_stat(p_data['stats'], 'hundreds'),
                            
                            # Bowling Metrics
                            "wickets": extract_stat(p_data['stats'], 'wickets'),
                            "best_bowling": str(extract_stat(p_data['stats'], 'bestBowlingInInnings', '')),
                            "bowling_avg": extract_stat(p_data['stats'], 'bowlingAverage', None),
                            "economy": extract_stat(p_data['stats'], 'economyRate', None),
                            "bowling_strike_rate": extract_stat(p_data['stats'], 'bowlingStrikeRate', None),
                            "four_wicket_hauls": extract_stat(p_data['stats'], 'fourWickets'),
                            "five_wicket_hauls": extract_stat(p_data['stats'], 'fiveWickets')
                        }
                        
                        # Note: on_conflict requires unique(player_id, format_or_league) to be set in DB
                        supabase.table('player_stats').upsert(stats_payload, on_conflict='player_id,format_or_league').execute()
                    
                    print("✅ ALL TABLES SYNCED")
                
                except Exception as e:
                    print(f"❌ DB ERROR: {e}")

                # MANDATORY DELAY: Do not remove this or you will get IP banned
                time.sleep(1.5)

    print("\n🏁 GLOBAL SYNCHRONIZATION COMPLETE")

if __name__ == "__main__":
    run_pipeline()