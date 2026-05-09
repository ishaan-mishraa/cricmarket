'use server';

import { GoogleGenAI } from '@google/genai';

export async function generateGmAnalysis(
  squad: any[], 
  remainingBudgetInr: number, 
  rosterSize: number
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // 1. Format the squad list with integrated T20 Statistics
  const formattedSquad = squad.length > 0 
    ? squad.map(s => {
        const p = s.players;
        const stats = p?.player_stats?.[0]; // Grab the T20 stats object
        let statString = '';

        if (stats) {
          // Intelligently show relevant stats based on player role
          if (p.role === 'Batsman' || p.role === 'Wicketkeeper') {
            statString = `[Stats: ${stats.runs} Runs, ${stats.batting_avg} Avg, ${stats.batting_strike_rate} SR]`;
          } else if (p.role === 'Bowler') {
            statString = `[Stats: ${stats.wickets} Wickets, ${stats.economy} Econ]`;
          } else {
            // All-rounders get both
            statString = `[Stats: ${stats.runs} Runs, ${stats.batting_strike_rate} SR, ${stats.wickets} Wkts, ${stats.economy} Econ]`;
          }
        }

        return `- ${p?.name} (${p?.role}) - Drafted at ₹${s.draft_price_usd} ${statString}`;
      }).join('\n')
    : 'No players drafted yet.';

  const budgetString = new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(remainingBudgetInr);

  let prompt = '';

  // 2. Mid-Draft Analysis Logic
  if (rosterSize > 0 && rosterSize < 15) {
    prompt = `
      You are an elite, highly analytical T20 Cricket General Manager.
      I am currently drafting a T20 franchise team. 
      I have ${rosterSize}/15 players drafted. 
      My remaining purse is ${budgetString}.

      Here is my current squad and their T20 career statistics:
      ${formattedSquad}

      Provide a concise tactical analysis based heavily on these statistics. Format your response in clean markdown (use **bolding** for emphasis). Do NOT use JSON.
      Include the following:
      1. **Statistical Balance:** Evaluate my current squad balance. Are my batsmen scoring fast enough? Are my bowlers too expensive?
      2. **Target Archetypes:** Identify 2 specific player archetypes I MUST target next to survive this league.
      3. **Financial Strategy:** Give a strict financial strategy on how to allocate the remaining ${budgetString} across the last ${15 - rosterSize} slots.
    `;
  } 
  // 3. Post-Draft Final Review Logic
  else if (rosterSize === 15) {
    prompt = `
      You are a ruthless, highly critical T20 Cricket Pundit analyzing a completed franchise squad.
      I have finished my draft with this 15-man squad and a remaining purse of ${budgetString}:
      
      ${formattedSquad}

      Provide a comprehensive "Season Preview" analysis in clean markdown format (use **bolding** for emphasis). Do NOT use JSON.
      Base your analysis strictly on the provided player statistics.
      Include the following:
      1. **Team Chemistry & Data Profile:** How well do these players fit together mathematically? Are there glaring statistical holes?
      2. **The X-Factor:** Who is the key player that will make or break this season based on their numbers?
      3. **Vulnerabilities:** What are the undeniable weaknesses of this roster?
      4. **Tournament Prediction:** A predicted tournament finish (e.g., Title Contenders, Mid-table, Wooden Spoon) with brutal justification.
    `;
  } else {
    return "Your franchise is empty. Draft some players first to initialize the AI analysis.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;
    
    if (text) {
      return text;
    } else {
      throw new Error("Empty response from AI");
    }

  } catch (error) {
    console.error("GM AI Error:", error);
    throw new Error("The Front Office AI is currently offline. Please try again later.");
  }
}