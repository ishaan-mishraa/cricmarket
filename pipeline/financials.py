import os
import time
import re
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_KEY"))

EXCHANGE_RATE = 95 

# Exact URLs
AUCTION_YEARS = [
    {"year": 2026, "url": "https://www.cricbuzz.com/cricket-series/ipl-2026/auction/teams"},
    {"year": 2025, "url": "https://www.cricbuzz.com/cricket-series/ipl-2025/auction/teams"},
    {"year": 2024, "url": "https://www.cricbuzz.com/cricket-series/ipl-2024/auction/teams"}
]

def parse_financials(price_str):
    """Returns both the USD converted price and the raw local INR price"""
    if not price_str or '--' in price_str:
        return 0, 0
    price_str = price_str.upper().strip()
    try:
        if 'CR' in price_str:
            num = float(price_str.replace('CR', '').strip())
            local_val = num * 10000000 # 1 Crore
            return int(local_val / EXCHANGE_RATE), local_val
        elif 'L' in price_str:
            num = float(price_str.replace('L', '').strip())
            local_val = num * 100000 # 1 Lakh
            return int(local_val / EXCHANGE_RATE), local_val
        return 0, 0
    except Exception:
        return 0, 0

def run_financials():
    print("\n💰 CRICMARKET: FULL FINANCIAL EXTRACTION 💰\n")

    with Stealth().use_sync(sync_playwright()) as p:
        browser = p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
        page = context.new_page()

        for season in AUCTION_YEARS:
            year = season['year']
            hub_url = season['url']
            print(f"\n🌍 PROCESSING SEASON: {year}")

            try:
                page.goto(hub_url, wait_until="domcontentloaded", timeout=45000)
                time.sleep(3)
                
                hub_soup = BeautifulSoup(page.content(), 'html.parser')
                team_links = hub_soup.find_all('a', href=re.compile(r'/auction/teams/\d+'))
                unique_team_urls = list(set(["https://www.cricbuzz.com" + a['href'] for a in team_links if a['href'].startswith('/cricket-series')]))
                
                if not unique_team_urls:
                    print(f"⚠️ No teams found for {year}.")
                    continue

                for team_url in unique_team_urls:
                    page.goto(team_url, wait_until="domcontentloaded", timeout=45000)
                    time.sleep(2)
                    team_soup = BeautifulSoup(page.content(), 'html.parser')
                    
                    team_header = team_soup.find('span', class_=re.compile(r'text-\[16px\].*font-bold'))
                    if not team_header: continue
                        
                    team_name = team_header.text.strip()
                    print(f"\n 🛡️ FRANCHISE: {team_name} ({year})")
                    
                    team_db = supabase.table('teams').select('id').ilike('name', f"%{team_name[:5]}%").execute()
                    if not team_db.data: continue
                    team_id = team_db.data[0]['id']

                    player_cards = team_soup.find_all('a', href=re.compile(r'/auction/players/'))
                    
                    for card in player_cards:
                        name_tag = card.find('span', class_=re.compile(r'text-\[14px\]'))
                        price_tag = card.find('span', class_=re.compile(r'text-right.*text-\[12px\]'))
                        
                        # Extract Acquisition Type (Look for the tiny text-[9px] chip, otherwise it's an Auction buy)
                        acq_tag = card.find('div', class_=re.compile(r'text-\[9px\]'))
                        acq_type = acq_tag.text.strip().title() if acq_tag else "Auction"
                        
                        if not name_tag or not price_tag: continue
                            
                        player_name = name_tag.text.strip()
                        slug = player_name.lower().replace(' ', '-')
                        raw_price = price_tag.text.strip()
                        
                        price_usd, actual_price_local = parse_financials(raw_price)
                        
                        if price_usd > 0:
                            player_db = supabase.table('players').select('id').eq('slug', slug).execute()
                            if player_db.data:
                                player_id = player_db.data[0]['id']
                                
                                # OVERWRITE THE DATABASE COLUMNS YOU SHOWED ME
                                supabase.table('valuations').update({
                                    "price_usd": price_usd,
                                    "actual_price_local": actual_price_local,
                                    "original_currency": "INR",
                                    "acquisition_type": acq_type
                                }).eq('player_id', player_id).eq('year', year).execute()
                                
                                print(f"   ✅ {player_name:<18} | {acq_type:<10} | {raw_price:<8} -> ${price_usd:,}")

            except Exception as e:
                print(f"❌ Error processing {year}: {e}")

        browser.close()

if __name__ == "__main__":
    run_financials()