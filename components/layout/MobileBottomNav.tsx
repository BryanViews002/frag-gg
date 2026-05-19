'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Users, BarChart3, User } from 'lucide-react';

const ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/tournaments', icon: Trophy, label: 'Tournaments' },
  { href: '/find-teammates', icon: Users, label: 'Teammates' },
  { href: '/leaderboards', icon: BarChart3, label: 'Leaderboard' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const HIDDEN_ROUTES = ['/login', '/register', '/forgot-password'];

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        background: 'rgba(6,6,14,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-all ${isActive ? 'mobile-nav-item-active' : ''}`}
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <Icon
              size={isActive ? 22 : 20}
              style={{
                transition: 'all 0.2s ease',
              }}
            />
            <span style={{
              fontSize: '0.6rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.03em',
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
