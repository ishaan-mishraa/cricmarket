'use client';

import { useState } from 'react';
import { BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { generateGmAnalysis } from '@/app/actions/gm';

interface Props {
  squad: any[];
  remainingBudget: number;
  rosterSize: number;
}

export default function AIGmAssistant({ squad, remainingBudget, rosterSize }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const result = await generateGmAnalysis(squad, remainingBudget, rosterSize);
      setAnalysis(result);
    } catch (error) {
      setAnalysis("Error communicating with AI Assistant.");
    }
    setIsLoading(false);
  };

  if (rosterSize === 0) return null; // Hide if no players are drafted

  const isComplete = rosterSize >= 15;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-950/10 shadow-lg">
      <div className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-900/20 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-indigo-100">AI Front Office</h3>
            <p className="text-xs font-medium text-indigo-400/70">
              {isComplete ? 'Post-Draft Squad Evaluation' : 'Live Tactical Recommendations'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-all hover:bg-indigo-400 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isLoading ? 'Analyzing Data...' : isComplete ? 'Generate Season Preview' : 'Get Draft Advice'}
        </button>
      </div>

      {/* Analysis Output Area */}
      {analysis && (
        <div className="p-6">
          <div className="prose prose-sm prose-invert max-w-none text-zinc-300">
            {/* Super simple markdown parser for bold text and line breaks */}
            {analysis.split('\n').map((line, i) => (
              <p key={i} className="mb-2 leading-relaxed">
                {line.split('**').map((text, j) => 
                  j % 2 === 1 ? <strong key={j} className="text-indigo-300">{text}</strong> : text
                )}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}