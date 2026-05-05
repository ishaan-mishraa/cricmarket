'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Close the menu when a link is clicked
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* 1. Neon Glowing Hamburger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`group flex items-center justify-center rounded-lg p-2 transition-all duration-300 border
          ${isOpen 
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
            : 'border-transparent text-indigo-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
          }`}
        aria-label="Toggle Mobile Menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:rotate-90" /> 
        ) : (
          <Menu className="h-6 w-6 transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* 2. The Dropdown Panel with Matching Logo Theme */}
      {isOpen && (
        <div className="absolute left-0 top-16 w-full border-b border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-xl shadow-2xl shadow-emerald-900/20 animate-in slide-in-from-top-2">
          
          {/* Subtle gradient line matching the logo colors */}
          <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-transparent opacity-50"></div>

          <div className="mt-2 flex flex-col gap-3 text-center">
            <Link 
              href="/" 
              onClick={closeMenu} 
              className="block rounded-lg p-3 text-sm font-medium text-zinc-300 transition-all hover:bg-emerald-500/10 hover:text-emerald-400 hover:shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]"
            >
              Dashboard
            </Link>
            <Link 
              href="/players" 
              onClick={closeMenu} 
              className="block rounded-lg p-3 text-sm font-medium text-zinc-300 transition-all hover:bg-emerald-500/10 hover:text-emerald-400 hover:shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]"
            >
              Players
            </Link>
            <Link 
              href="/teams" 
              onClick={closeMenu} 
              className="block rounded-lg p-3 text-sm font-medium text-zinc-300 transition-all hover:bg-emerald-500/10 hover:text-emerald-400 hover:shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]"
            >
              Franchises
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}