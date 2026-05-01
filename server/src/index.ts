import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

// 1. Define your Cloudflare Worker Environment Bindings
type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

// 2. Pass the Bindings type to Hono
const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

// --- HEALTH CHECK ---
app.get('/', (c) => {
  return c.json({ message: 'CricMarket API is running on the Edge! 🏏⚡' })
})

// --- TEAM ENDPOINTS ---
app.get('/api/teams', async (c) => {
  // Initialize Supabase using Cloudflare's c.env
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ teams: data })
})

app.get('/api/teams/:id', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)
  const teamId = c.req.param('id')
  
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      valuations (
        price_usd,
        players (*)
      )
    `)
    .eq('id', teamId)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ team: data })
})

// --- PLAYER ENDPOINTS ---
// --- PLAYER ENDPOINTS ---
app.get('/api/players', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)

  // 1. Grab query parameters from the URL
  const search = c.req.query('search')
  const role = c.req.query('role')
  const limit = parseInt(c.req.query('limit') || '50') // Default to 50 players
  const offset = parseInt(c.req.query('offset') || '0') // Default to start of list

  // 2. Build the Supabase query dynamically
  let query = supabase
    .from('players')
    .select('id, name, slug, role, nationality, image_url', { count: 'exact' })

  // 3. Apply Search and Filters if they exist
  if (search) {
    query = query.ilike('name', `%${search}%`) // Case-insensitive search
  }
  if (role) {
    query = query.eq('role', role)
  }

  // 4. Apply Pagination and Sorting
  query = query
    .range(offset, offset + limit - 1)
    .order('name', { ascending: true })

  const { data, error, count } = await query

  if (error) return c.json({ error: error.message }, 500)
  
  // 5. Return data along with pagination metadata
  return c.json({ 
    players: data, 
    meta: { total: count, limit, offset } 
  })
})

app.get('/api/players/:slug', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)
  const slug = c.req.param('slug')
  
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      player_stats (*),
      valuations (
        price_usd,
        teams (name, primary_color)
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ player: data })
})

export default app