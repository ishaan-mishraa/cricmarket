import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { LogOut, LogIn } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { Mynerve } from 'next/font/google';
import MobileMenu from './MobileMenu';

const logoFont = Mynerve({ subsets: ['latin'], weight: ['400'] });

export default async function Navbar() {
  // 1. Securely check the user session on the server
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Server Action to handle secure sign out
  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/'); // Send them back to the main dashboard after logging out
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Logo & Main Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-50 transition-opacity hover:opacity-80">
            <Image 
              src="/logo.svg" 
              alt="CricMarket Logo" 
              width={32} 
              height={32} 
              className="rounded-md"
            />
            <span className={`${logoFont.className} text-2xl tracking-tighter bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent`}>
            CricMarket
            </span>
          </Link>
          
          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden items-center gap-6 text-sm font-medium text-zinc-400 md:flex">
            <Link href="/" className="transition-colors hover:text-zinc-100">Dashboard</Link>
            <Link href="/players" className="transition-colors hover:text-zinc-100">Players</Link>
            <Link href="/teams" className="transition-colors hover:text-zinc-100">Franchises</Link>
          </div>
          {/* Notice: MobileMenu was removed from here! */}
        </div>

        {/* Right Side: Auth, VIP Access & Mobile Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {/* The Glowing Manager Mode Indicator */}
              <Link 
                href="/draft" 
                className="hidden sm:inline-flex group relative items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/20"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Manager Mode
              </Link>
              
              {/* Discrete Sign Out Button */}
              <form action={handleSignOut}>
                <button 
                  type="submit"
                  className="flex items-center gap-2 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <Link 
              href="/login" 
              className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-300"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* THE FIX: Mobile Menu is now safely in the right-side container */}
          <MobileMenu />
          
        </div>

      </div>
    </nav>
  );
}