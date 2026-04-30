import os
import time
import re
import requests
import pandas as pd
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_KEY"))

# --- 1. GET NAMES AND IDs ---
def get_master_player_list():
    print("🌐 Downloading Cricsheet Master Registry...")
    url = "https://cricsheet.org/register/people.csv"
    
    df = pd.read_csv(url)
    players_df = df.dropna(subset=['key_cricinfo'])
    
    # Convert to a list of dictionaries so we keep the ID attached to the name
    # e.g. [{'name': 'V Kohli', 'cricinfo_id': 253802}]
    players = players_df[['name', 'key_cricinfo']].drop_duplicates(subset=['name']).rename(columns={'key_cricinfo': 'cricinfo_id'}).to_dict('records')
    
    print(f"✅ Downloaded {len(players)} unique players.")
    return players

# --- 2. THE CRICINFO FALLBACK ---
def resolve_full_name(cricinfo_id):
    """Hits Cricinfo using the ID to find the player's actual full name"""
    url = f"https://www.espncricinfo.com/ci/content/player/{int(cricinfo_id)}.html"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CricMarket/1.0'}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'lxml')
            h1 = soup.find('h1')
            if h1:
                return h1.text.strip() # Returns the full name (e.g., "Andre Adams")
    except:
        pass
    return None

# --- 3. THE WIKIPEDIA SCRAPER ---
def scrape_wikipedia_player(player_name):
    wiki_slug = player_name.replace(" ", "_")
    db_slug = player_name.lower().replace(" ", "-")
    
    url = f"https://en.wikipedia.org/wiki/{wiki_slug}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        return None

    soup = BeautifulSoup(response.text, 'lxml')
    player_data = {
        "slug": db_slug, "name": player_name, "nationality": None, 
        "dob": None, "role": None, "batting_style": None,
        "bowling_style": None, "image_url": None, "current_estimated_value": 0
    }

    infobox = soup.find('table', {'class': 'infobox vcard'})
    if not infobox:
        return player_data 

    img_tag = infobox.find('img')
    if img_tag and 'src' in img_tag.attrs:
        raw_url = "https:" + img_tag['src']
        player_data["image_url"] = re.sub(r'\d+px-', '400px-', raw_url)

    for tr in infobox.find_all('tr'):
        th = tr.find('th')
        td = tr.find('td')
        if th and td:
            label = th.text.strip().lower()
            value = re.sub(r'\[\d+\]', '', td.text.strip())

            if "born" in label: player_data["dob"] = value.split('\n')[0] 
            elif "batting" in label: player_data["batting_style"] = value
            elif "bowling" in label: player_data["bowling_style"] = value
            elif "role" in label: player_data["role"] = value
            elif "national" in label: player_data["nationality"] = value.split('\n')[0]

    return player_data

# --- 4. THE MAIN LOOP ---
def run_pipeline():
    players = get_master_player_list()
    
    # Test on the first 50 players
    for p in players[:50]:
        short_name = p['name']
        print(f"🕵️ Searching: {short_name}...", end=" ")
        
        # Attempt 1: Try with the Cricsheet name
        data = scrape_wikipedia_player(short_name)
        
        # Attempt 2: If it failed, resolve the full name via Cricinfo and try again!
        if not data or data['role'] is None:
            full_name = resolve_full_name(p['cricinfo_id'])
            if full_name and full_name != short_name:
                print(f"🔄 Acronym found! Retrying as '{full_name}'...", end=" ")
                data = scrape_wikipedia_player(full_name)

        # Save to database
        if data and data['role'] is not None:
            try:
                supabase.table('players').upsert(data, on_conflict='slug').execute()
                print("✅ SAVED")
            except Exception as e:
                print(f"❌ DB ERROR: {e}")
        else:
            print("⚠️ STILL NO DATA (Rookie/Unknown)")
            
        time.sleep(1.5) # Rate limit to avoid IP bans

if __name__ == "__main__":
    run_pipeline()