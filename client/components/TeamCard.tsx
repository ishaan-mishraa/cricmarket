'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const getLogoPath = (teamName: string) => {
  if (!teamName) return '/logo.svg';
  const formattedName = teamName.toLowerCase().replace(/ /g, '-');
  return `/teams/${formattedName}.png`;
};

// Define the shape of our incoming data
type Player = { name: string; role: string; slug: string; price: number };
type Team = {
  id: string;
  name: string;
  league: string;
  budget: number;
  spent: number;
  remaining: number;
  roster: Player[];
};

export default function TeamCard({ team }: { team: Team }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentSpent = (team.spent / team.budget) * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-lg transition-colors hover:border-zinc-700">
      
      {/* 1. The Main Clickable Header Area */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="group cursor-pointer p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-inner">
              <Image 
                src={getLogoPath(team.name)} 
                alt={`${team.name} Logo`}
                width={48}
                height={48}
                className="h-auto w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100">{team.name}</h3>
              <p className="text-xs font-medium text-zinc-500">{team.league}</p>
            </div>
          </div>
          
          {/* Animated Expand Icon */}
          <ChevronDown 
            className={`h-5 w-5 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : 'group-hover:text-zinc-300'}`} 
          />
        </div>

        {/* Financial Summary */}
        <div className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Remaining Purse</p>
              <p className="text-3xl font-black tracking-tight text-white">
                ${team.remaining.toLocaleString()}
              </p>
            </div>
            <p className="text-xs font-medium text-zinc-500">
              Spent: ${team.spent.toLocaleString()}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" 
              style={{ width: `${percentSpent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. The Expandable Roster Dropdown */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] border-t border-zinc-800' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden bg-zinc-900/30">
          <div className="p-4">
            <h4 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Active Roster ({team.roster.length})
            </h4>
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
              {team.roster.map((player) => (
                <Link 
                  key={player.slug} 
                  href={`/players/${player.slug}`}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-zinc-800/80"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{player.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">{player.role}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">
                    ${player.price.toLocaleString()}
                  </p>
                </Link>
              ))}
              {team.roster.length === 0 && (
                <p className="p-2 text-sm text-zinc-500">No players assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}