'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { getAvatarUrl } from '@/lib/utils';
import {
  Bell, ChevronDown, User, LayoutDashboard, Settings,
  LogOut, Shield, Swords, Menu, X
} from 'lucide-react';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '/tournaments',    label: 'Tournaments' },
  { href: '/leaderboards',   label: 'Leaderboards' },
  { href: '/find-teammates', label: 'Find Teammates' },
  { href: '/clans',          label: 'Clans' },
  { href: '/community',      label: 'Community' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { profile, signOut, loading } = useAuth();
  const { unreadCount } = useNotifications(profile?.id ?? null);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [mobileOpen,   setMobileOpen]     = useState(false);
  const [scrolled,     setScrolled]       = useState(false);
  const [scrollPct,    setScrollPct]      = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    const handleScroll = () => {
      const el  = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrolled(window.scrollY > 20);
      setScrollPct(Math.min(pct * 100, 100));
    };
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'navbar-scrolled' : ''}`}
      style={{
        background:         scrolled ? 'rgba(7,7,15,0.97)' : 'rgba(7,7,15,0.78)',
        backdropFilter:     'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom:       '1px solid rgba(255,255,255,0.045)',
        height:             scrolled ? '56px' : '64px',
        transition:         'height 0.3s ease, background 0.3s ease',
      }}
    >
      {/* Accent top line */}
      <div className="navbar-top-border" />

      {/* Scroll-progress indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0,
          height: '2px',
          width: `${scrollPct}%`,
          background: 'linear-gradient(90deg, #FF4500, #FF8C00)',
          transition: 'width 0.1s linear',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,107,0,0.08))',
              border: '1px solid rgba(255,69,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow 0.2s ease',
            }}
              className="group-hover:shadow-[0_0_12px_rgba(255,69,0,0.3)]"
            >
              <Swords size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <span
              className="font-rajdhani font-bold text-xl tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #FF5500, #FF8C00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              FRAG.GG
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(link => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  style={isActive ? {
                    color: 'var(--text-primary)',
                    background: 'rgba(255,69,0,0.09)',
                    borderRadius: '7px',
                    border: '1px solid rgba(255,69,0,0.14)',
                  } : {}}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {profile ? (
                  <div className="flex items-center gap-2">
                    {/* Bell */}
                    <Link
                      href="/notifications"
                      className="relative p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Notifications"
                    >
                      <Bell size={19} />
                      {unreadCount > 0 && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: 'var(--accent)', fontSize: '0.58rem' }}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>

                    {/* Avatar dropdown */}
                    <div ref={dropdownRef} className="relative">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all"
                        style={{
                          background: dropdownOpen ? 'rgba(255,69,0,0.07)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${dropdownOpen ? 'rgba(255,69,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden" style={{ border: '2px solid var(--accent)' }}>
                          <Image
                            src={getAvatarUrl(profile.avatar_url, profile.username)}
                            alt={profile.username}
                            width={28} height={28}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <span className="hidden sm:block text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>
                          {profile.username}
                        </span>
                        <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                      </button>

                      {dropdownOpen && (
                        <div
                          className="absolute right-0 mt-2 w-52 rounded-xl py-2 z-50"
                          style={{
                            background: 'rgba(13,13,27,0.98)',
                            border: '1px solid var(--border-accent)',
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                            animation: 'scaleIn 0.15s var(--ease-out-expo)',
                          }}
                        >
                          <DropdownItem href="/profile"                        icon={<User size={14} />}           label="My Profile"    onClick={() => setDropdownOpen(false)} />
                          <DropdownItem href="/dashboard"                     icon={<LayoutDashboard size={14} />} label="Dashboard"     onClick={() => setDropdownOpen(false)} />
                          <DropdownItem href="/profile/edit"                  icon={<Settings size={14} />}        label="Edit Profile"  onClick={() => setDropdownOpen(false)} />
                          <DropdownItem href="/notifications"                 icon={<Bell size={14} />}            label="Notifications" badge={unreadCount} onClick={() => setDropdownOpen(false)} />
                          {profile.is_admin && (
                            <>
                              <div style={{ height: 1, background: 'var(--border)', margin: '4px 12px' }} />
                              <DropdownItem href="/admin" icon={<Shield size={14} />} label="Admin Panel" onClick={() => setDropdownOpen(false)} accent />
                            </>
                          )}
                          <div style={{ height: 1, background: 'var(--border)', margin: '4px 12px' }} />
                          <button
                            onClick={() => { signOut(); setDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                            style={{ color: '#FF5555', fontFamily: 'Inter, sans-serif' }}
                          >
                            <LogOut size={14} /> Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login"    className="btn-ghost"  style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>Login</Link>
                    <Link href="/register" className="btn-accent" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>Register</Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 z-30"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="md:hidden relative z-40"
            style={{
              background: 'rgba(7,7,15,0.98)',
              borderTop: '1px solid var(--border)',
              padding: '0.75rem',
              animation: 'scaleIn 0.18s var(--ease-out-expo)',
            }}
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-4 rounded-lg mb-0.5 font-rajdhani font-semibold tracking-wide transition-colors"
                style={{
                  fontSize: '1rem',
                  color:      pathname.startsWith(link.href) ? 'var(--accent)'  : 'var(--text-secondary)',
                  background: pathname.startsWith(link.href) ? 'var(--accent-dim)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}

function DropdownItem({
  href, icon, label, badge, onClick, accent
}: {
  href: string; icon: React.ReactNode; label: string;
  badge?: number; onClick: () => void; accent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-white/[0.045]"
      style={{ color: accent ? 'var(--accent)' : 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}
    >
      <span className="flex items-center gap-3">{icon}{label}</span>
      {badge && badge > 0 ? (
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: 'var(--accent)', fontSize: '0.58rem' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
