// client/actions/scout.ts
'use server';

import { GoogleGenAI } from '@google/genai';

export async function generateScoutingReport(playerName: string, stats: any) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
    You are a ruthless, highly analytical T20 franchise cricket scout. 
    Analyze the following T20 career statistics for a player named ${playerName}:
    
    Matches: ${stats?.matches || 0}
    Runs: ${stats?.runs || 0}
    Batting Strike Rate: ${stats?.batting_strike_rate || 0}
    Batting Average: ${stats?.batting_avg || 0}
    Wickets: ${stats?.wickets || 0}
    Economy Rate: ${stats?.economy || 0}
    Best Bowling: ${stats?.best_bowling || 'N/A'}
    
    Based on these numbers and your general knowledge of this player's real-world cricket profile, generate a scouting report.
    Be honest and analytical. If their strike rate is low, call them a liability in the powerplay. If their economy is high, call them expensive.
    
    You MUST return the response strictly in the following JSON format. Do not wrap it in markdown code blocks, just return the raw JSON object:
    {
      "strengths": ["List 2-3 specific strengths based on their stats"],
      "weaknesses": ["List 2-3 specific vulnerabilities or poor stats"],
      "verdict": "A 2-sentence final verdict on whether they are worth drafting in a high-stakes T20 league."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    
    if (text) {
      return JSON.parse(text);
    } else {
      throw new Error("Empty response from AI");
    }

  } catch (error) {
    console.error("Scouting AI Error:", error);
    throw new Error("Failed to generate AI scouting report.");
  }
}