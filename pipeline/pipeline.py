import os
import time
import re
import random
from datetime import datetime
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# --- 1. SETUP & AUTHENTICATION ---
load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_KEY"))

GLOBAL_TOURNAMENTS = [
    {"league": "IPL", "year": 2026, "url": "https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/squads"}
]

# --- 2. THE PURE DOM EXTRACTOR ---
def parse_cricbuzz_player(html_content, cb_id):
    """Rips data directly from the rendered HTML DOM"""
    soup = BeautifulSoup(html_content, 'html.parser')

    # 1. Basic Identity
    name_tag = soup.find('span', class_=re.compile(r'text-xl font-bold'))
    name = name_tag.text.strip() if name_tag else f"Player_{cb_id}"
    slug = name.lower().replace(' ', '-')

    # 2. Meta info (Role, Styles, DOB, Nationality)
    def get_meta(label):
        lbl_div = soup.find('div', string=re.compile(f'^{label}$', re.I))
        if lbl_div:
            val_div = lbl_div.find_next_sibling('div')
            if val_div: return val_div.text.strip()
        return None

    role = get_meta('Role') or 'Unknown'
    batting_style = get_meta('Batting Style')
    bowling_style = get_meta('Bowling Style')

    # Cricbuzz puts Nationality in a span next to a flag icon
    nat_tag = soup.find('span', class_=re.compile(r'text-gray-800'))
    nationality = nat_tag.text.strip() if nat_tag else 'Unknown'

    # Image URL (upgrade low-res to high-res if found)
    img_tag = soup.find('img', alt=slug)
    image_url = img_tag['src'] if img_tag and 'src' in img_tag.attrs else None
    if image_url:
        image_url = image_url.replace('d=low&p=gthumb', 'd=high&p=det')

    # Format Date of Birth
    dob_raw = get_meta('Born')
    dob = None
    if dob_raw:
        match = re.search(r'([A-Za-z]+ \d{1,2}, \d{4})', dob_raw)
        if match:
            try:
                dob = datetime.strptime(match.group(1), '%B %d, %Y').strftime('%Y-%m-%d')
            except ValueError:
                pass

    # 3. Stats Tables Extraction
    stats = {
        "matches": 0, "innings": 0, "runs": 0, "highest_score": "", "batting_avg": 0.0,
        "batting_strike_rate": 0.0, "fours": 0, "sixes": 0, "fifties": 0, "hundreds": 0,
        "wickets": 0, "best_bowling": "", "bowling_avg": 0.0, "economy": 0.0, 
        "bowling_strike_rate": 0.0, "four_wicket_hauls": 0, "five_wicket_hauls": 0
    }

    # Find the career summary tables
    tables = soup.find_all('table')
    for table in tables:
        # Determine if this is Batting or Bowling table based on previous heading
        prev_heading = table.find_previous('div', string=re.compile(r'Career Summary', re.I))
        if not prev_heading: continue
        is_batting = 'Batting' in prev_heading.text

        headers = [th.text.strip().lower() for th in table.find_all('th')]
        
        # Determine format column index (Prefer IPL, fallback to T20)
        format_idx = -1
        if 'ipl' in headers: format_idx = headers.index('ipl')
        elif 't20' in headers: format_idx = headers.index('t20')
        
        if format_idx == -1: continue

        def get_stat(row_name, type_cast=int, default=0):
            for tr in table.find_all('tr'):
                tds = [td.text.strip() for td in tr.find_all('td')]
                if tds and tds[0].lower() == row_name.lower():
                    if len(tds) > format_idx:
                        val = tds[format_idx].replace('*', '').replace('-', '0').strip()
                        try:
                            return type_cast(val) if val else default
                        except ValueError:
                            return default
            return default

        def get_text_stat(row_name):
            for tr in table.find_all('tr'):
                tds = [td.text.strip() for td in tr.find_all('td')]
                if tds and tds[0].lower() == row_name.lower():
                    if len(tds) > format_idx:
                        return tds[format_idx].replace('-', '').strip()
            return ""

        if is_batting:
            stats['matches'] = get_stat('Matches')
            stats['innings'] = get_stat('Innings')
            stats['runs'] = get_stat('Runs')
            stats['highest_score'] = get_text_stat('Highest')
            stats['batting_avg'] = get_stat('Average', float)
            stats['batting_strike_rate'] = get_stat('SR', float)
            stats['fours'] = get_stat('Fours')
            stats['sixes'] = get_stat('Sixes')
            stats['fifties'] = get_stat('50s')
            stats['hundreds'] = get_stat('100s')
        else:
            stats['wickets'] = get_stat('Wickets')
            stats['best_bowling'] = get_text_stat('BBI')
            stats['bowling_avg'] = get_stat('Avg', float)
            stats['economy'] = get_stat('Eco', float)
            stats['bowling_strike_rate'] = get_stat('SR', float)
            stats['four_wicket_hauls'] = get_stat('4w')
            stats['five_wicket_hauls'] = get_stat('5w')

    return {
        "cricbuzz_id": cb_id,
        "name": name,
        "slug": slug,
        "nationality": nationality,
        "dob": dob,
        "role": role,
        "batting_style": batting_style,
        "bowling_style": bowling_style,
        "image_url": image_url,
        "stats": stats
    }

# --- 3. THE PLAYWRIGHT ENGINE ---
def run_pipeline():
    print("==================================================")
    print("🏏 CRICMARKET: BACKGROUND HARVESTER INITIATED")
    print("==================================================\n")

    with Stealth().use_sync(sync_playwright()) as p:
        browser = p.chromium.launch(
            headless=True, 
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
            ]
        )
        
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        for tournament in GLOBAL_TOURNAMENTS:
            league_name = tournament['league']
            year = tournament['year']
            hub_url = tournament['url']
            
            print(f"\n🌍 NAVIGATING TO {league_name} {year} SQUADS HUB...")

            try:
                page.goto(hub_url, wait_until="domcontentloaded", timeout=45000)
                time.sleep(2) 
                
                team_nodes = page.locator('div.tb\\:cursor-pointer')
                team_count = team_nodes.count()

                if team_count == 0:
                    print(f"⚠️ No teams found. UI might have changed.")
                    continue

                for i in range(team_count):
                    team_nodes.nth(i).click()
                    time.sleep(1.5) # Give the grid a moment to update
                    
                    team_name = team_nodes.nth(i).locator('span').first.inner_text().strip()
                    print(f"\n   🛡️ FRANCHISE: {team_name}")
                    
                    team_db_res = supabase.table('teams').select('id').eq('name', team_name).execute()
                    if not team_db_res.data:
                        insert_res = supabase.table('teams').insert({"name": team_name, "league": league_name}).execute()
                        team_id = insert_res.data[0]['id']
                    else:
                        team_id = team_db_res.data[0]['id']

                    hrefs = page.evaluate("""() => {
                        return Array.from(document.querySelectorAll('a[href^="/profiles/"]')).map(a => a.href);
                    }""")
                    
                    unique_player_paths = list(set(hrefs))
                    
                    for index, player_url in enumerate(unique_player_paths, 1):
                        match = re.search(r'/profiles/(\d+)/', player_url)
                        if not match: continue
                        cb_id = match.group(1)
                        
                        print(f"    [{index}/{len(unique_player_paths)}] Syncing ID {cb_id}...", end=" ")
                        
                        player_page = context.new_page()
                        try:
                            player_page.goto(player_url, wait_until="domcontentloaded", timeout=20000)
                            
                            # Just wait for the player's name to render, meaning the DOM is ready
                            player_page.wait_for_selector('span.text-xl.font-bold', state='attached', timeout=10000)
                            
                            p_data = parse_cricbuzz_player(player_page.content(), cb_id)
                            
                            if not p_data:
                                print("❌ FAILED (Data Missing)")
                                continue

                            player_payload = {
                                "cricbuzz_id": p_data['cricbuzz_id'],
                                "slug": p_data['slug'], 
                                "name": p_data['name'], 
                                "nationality": p_data['nationality'],
                                "dob": p_data['dob'], 
                                "role": p_data['role'], 
                                "batting_style": p_data['batting_style'],
                                "bowling_style": p_data['bowling_style'], 
                                "image_url": p_data['image_url'],
                                "current_estimated_value": 0 
                            }
                            # THIS IS LINE 118: It requires the 'slug' column to be UNIQUE in Supabase
                            p_res = supabase.table('players').upsert(player_payload, on_conflict='slug').execute()
                            player_db_id = p_res.data[0]['id']

                            # --- FIXED VALUATION LOGIC ---
                            # Only check if a valuation exists for this year, ignore the team_id for the check
                            val_check = supabase.table('valuations').select('id').eq('player_id', player_db_id).eq('year', year).execute()
                            
                            if not val_check.data:
                                # Safe default insert including acquisition_type
                                supabase.table('valuations').insert({
                                    "player_id": player_db_id, 
                                    "team_id": team_id, 
                                    "league": league_name, 
                                    "year": year, 
                                    "price_usd": 0,
                                    "acquisition_type": "Draft"
                                }).execute()

                            s = p_data['stats']
                            if s['matches'] > 0: 
                                stats_payload = {
                                    "player_id": player_db_id, "format_or_league": "Overall T20",
                                    "matches": s['matches'], "innings": s['innings'], "runs": s['runs'],
                                    "highest_score": s['highest_score'], "batting_avg": s['batting_avg'],
                                    "batting_strike_rate": s['batting_strike_rate'], "fours": s['fours'],
                                    "sixes": s['sixes'], "fifties": s['fifties'], "hundreds": s['hundreds'],
                                    "wickets": s['wickets'], "best_bowling": s['best_bowling'],
                                    "bowling_avg": s['bowling_avg'], "economy": s['economy'],
                                    "bowling_strike_rate": s['bowling_strike_rate'], "four_wicket_hauls": s['four_wicket_hauls'],
                                    "five_wicket_hauls": s['five_wicket_hauls']
                                }
                                supabase.table('player_stats').upsert(stats_payload, on_conflict='player_id,format_or_league').execute()
                            
                            print(f"✅ SECURED ({p_data['name']})")
                        
                        except Exception as e:
                            print(f"❌ DB/LOAD ERROR: {e}")
                        finally:
                            player_page.close() 
                            time.sleep(random.uniform(1.5, 3.5))

            except Exception as e:
                print(f"❌ Navigation Error on {league_name}: {e}")
                
        browser.close()

    print("\n🏁 HEADLESS PIPELINE COMPLETE. DATABASE SEEDED.")

if __name__ == "__main__":
    run_pipeline()