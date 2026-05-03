// client/components/AIScoutingReport.tsx
'use client';

import { useState } from 'react';
import { Sparkles, BrainCircuit, Target, ShieldAlert, Activity } from 'lucide-react';
import { generateScoutingReport } from '../app/actions/scout';

interface AIScoutingReportProps {
  playerName: string;
  stats: any;
}

export default function AIScoutingReport({ playerName, stats }: AIScoutingReportProps) {
  const [report, setReport] = useState<any>(null);
  const [isScouting, setIsScouting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScout = async () => {
    setIsScouting(true);
    setError(null);
    
    try {
      const result = await generateScoutingReport(playerName, stats);
      setReport(result);
    } catch (err) {
      setError("CMAI failed to analyze the player data. Please try again.");
    } finally {
      setIsScouting(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6 sm:p-8 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-zinc-100">
            <BrainCircuit className="h-6 w-6 text-violet-400" />
            CM AI Scouting
          </h2>
          
          {!report && !isScouting && (
            <button 
              onClick={runScout}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              <Sparkles className="h-4 w-4" /> Run Analysis
            </button>
          )}
        </div>

        {/* LOADING STATE */}
        {isScouting && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-indigo-400 animate-spin border-opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <BrainCircuit className="absolute inset-0 m-auto h-6 w-6 text-violet-400 animate-pulse" />
            </div>
            <p className="text-violet-400 font-medium animate-pulse">Analyzing {playerName}'s historical data...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400">
            {error}
          </div>
        )}

        {/* REPORT STATE */}
        {report && !isScouting && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="rounded-xl bg-zinc-950/50 p-5 border border-emerald-500/20">
                <h3 className="flex items-center gap-2 font-bold text-emerald-400 mb-3">
                  <Target className="h-4 w-4" /> Key Strengths
                </h3>
                <ul className="space-y-2">
                  {report.strengths?.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="rounded-xl bg-zinc-950/50 p-5 border border-rose-500/20">
                <h3 className="flex items-center gap-2 font-bold text-rose-400 mb-3">
                  <ShieldAlert className="h-4 w-4" /> Vulnerabilities
                </h3>
                <ul className="space-y-2">
                  {report.weaknesses?.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Verdict */}
            <div className="rounded-xl bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-5 border border-violet-500/30">
              <h3 className="flex items-center gap-2 font-bold text-violet-300 mb-2">
                <Activity className="h-4 w-4" /> AI Verdict
              </h3>
              <p className="text-zinc-200 leading-relaxed text-sm">
                {report.verdict}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}