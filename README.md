# 🏏 CricMarket (MVP)

> The "Transfermarkt for Cricket." A global financial and statistical database for franchise cricket economies (IPL, BBL, The Hundred, etc.).

CricMarket tracks player market values, historical auction prices, and global franchise rosters. Unlike traditional cricket websites focused on live match scores, this platform serves as a "Bloomberg Terminal" for the business of cricket, featuring a premium dark-mode, cyberpunk-inspired UI.

---

## 🏗️ Architecture & Tech Stack

This project is structured as a monorepo containing three distinct layers:

1. **Frontend (`/client`)**
   - **Framework:** Next.js (App Router) + React
   - **Styling:** Tailwind CSS (Custom dark/neon theme)
   - **Role:** The user-facing dashboard, rendering player portfolios and market movers.

2. **Backend API (`/server`)**
   - **Framework:** Hono
   - **Runtime:** Cloudflare Workers (Edge)
   - **Role:** Blazing-fast, read-only API endpoints connecting the frontend to the database.

3. **Data Pipeline (`/pipeline`)**
   - **Language:** Python 3.11 (Pandas, BeautifulSoup4)
   - **Automation:** GitHub Actions (Nightly Cron Job)
   - **Role:** Scrapes Cricsheet, Wikipedia, and ESPNcricinfo to automatically populate the database with player metadata, high-res images, and T20 stats.

4. **Database**
   - **Provider:** Supabase (PostgreSQL)
   - **Core Tables:** `players`, `teams`, `valuations`, `player_stats`.

---

## 📁 Folder Structure
```text
cricmarket/
├── client/                 # Next.js UI
├── server/                 # Hono Edge API
├── pipeline/               # Python Scrapers & Seeders
├── .github/workflows/      # Automated Nightly Scraping Scripts
└── README.md
```
## 🚀 Local Development Setup
1. **Prerequisites**
Node.js & pnpm installed

Python 3.11+ installed

A Supabase project (with tables created and RLS configured for read-access)

2. **Environment Variables**
You will need to set up two separate sets of environment variables to maintain security.

For the Hono Backend (server/wrangler.jsonc):

```
"vars": {
  "SUPABASE_URL": "your_project_url",
  "SUPABASE_ANON_KEY": "your_publishable_key"
}
```
For the Python Pipeline (pipeline/.env):
(⚠️ NEVER commit this file to GitHub!)

```
SUPABASE_URL="your_project_url"
SUPABASE_SERVICE_KEY="your_secret_admin_key"
```
3. **Run the Stack**
A. Seed the Database (Python):

```
cd pipeline
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python pipeline.py
```
B. Start the API (Hono):
Open a new terminal tab.

```
cd server
pnpm install
pnpm dev
```
# Runs on [http://127.0.0.1:8787](http://127.0.0.1:8787)
C. Start the Frontend (Next.js):
Open a third terminal tab.

```
cd client
npm install
npm run dev
```
# Runs on http://localhost:3000
🤖 Automated Data Ingestion
The python scraper is configured to run automatically every day at 02:00 UTC via GitHub Actions. It cross-references Cricsheet's master registry with Wikipedia and Cricinfo to ensure uncapped/rookie players are safely ingested and updated.
