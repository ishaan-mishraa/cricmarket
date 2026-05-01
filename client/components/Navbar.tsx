'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Shield } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Players', href: '/players', icon: Users },
    { name: 'Franchises', href: '/teams', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950">
            <span className="font-bold tracking-tighter">CM</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-zinc-50">CricMarket</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-zinc-800/50 text-zinc-50' 
                    : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline-block">{link.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}