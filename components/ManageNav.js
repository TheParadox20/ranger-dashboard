'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Map, Users, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/sessions', label: 'Sessions', icon: Users },
  { href: '/dashboard/routes', label: 'Routes', icon: Map },
];

export default function ManageNav() {
  const pathname = usePathname();

  return (
    <header className="flex-shrink-0 h-12 bg-surface border-b border-border flex items-center px-4 gap-4 z-20">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
          <Shield size={14} className="text-accent-bright" />
        </div>
        <span className="font-display font-bold text-base uppercase tracking-widest text-primary whitespace-nowrap">
          Ranger Command
        </span>
      </div>

      <div className="h-5 w-px bg-border" />

      <nav className="flex items-center gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-widest transition-colors',
                active
                  ? 'bg-accent/20 text-accent-bright border border-accent/40'
                  : 'text-muted hover:text-secondary border border-transparent',
              )}
            >
              <Icon size={12} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
