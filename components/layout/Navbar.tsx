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
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/find-teammates', label: 'Find Teammates' },
  { href: '/clans', label: 'Clans' },
  { href: '/community', label: 'Community' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { profile, signOut, loading } = useAuth();
  const { unreadCount } = useNotifications(profile?.id ?? null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
        background: scrolled ? 'rgba(6,6,14,0.95)' : 'rgba(6,6,14,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Swords size={22} style={{ color: 'var(--accent)' }} />
            <span
              className="font-rajdhani font-bold text-2xl"
              style={{
                background: 'linear-gradient(135deg, #FF4500, #FF6B00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              FRAG.GG
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname.startsWith(link.href) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {profile ? (
                  <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <Link
                      href="/notifications"
                      className="relative p-2 rounded-lg"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold animate-pulse-glow"
                          style={{ background: 'var(--accent)', fontSize: '0.6rem' }}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>

                    {/* Avatar Dropdown */}
                    <div ref={dropdownRef} className="relative">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 p-1 rounded-lg transition-all"
                        style={{ border: '1px solid var(--border)' }}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '2px solid var(--accent)' }}>
                          <Image
                            src={getAvatarUrl(profile.avatar_url, profile.username)}
                            alt={profile.username}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                          {profile.username}
                        </span>
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>

                      {dropdownOpen && (
                        <div
                          className="absolute right-0 mt-2 w-52 rounded-xl py-2 z-50 animate-scale-in"
                          style={{
                            background: 'rgba(16,16,30,0.98)',
                            border: '1px solid var(--border-accent)',
                            backdropFilter: 'blur(20px)',
                          }}
                        >
                          <DropdownItem href={`/players/${profile.username}`} icon={<User size={15} />} label="My Profile" onClick={() => setDropdownOpen(false)} />
                          <DropdownItem href="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" onClick={() => setDropdownOpen(false)} />
                          <DropdownItem href="/profile/edit" icon={<Settings size={15} />} label="Edit Profile" onClick={() => setDropdownOpen(false)} />
                          <DropdownItem href="/notifications" icon={<Bell size={15} />} label="Notifications" badge={unreadCount} onClick={() => setDropdownOpen(false)} />
                          {profile.is_admin && (
                            <>
                              <div style={{ height: 1, background: 'var(--border)', margin: '4px 12px' }} />
                              <DropdownItem href="/admin" icon={<Shield size={15} />} label="Admin Panel" onClick={() => setDropdownOpen(false)} accent />
                            </>
                          )}
                          <div style={{ height: 1, background: 'var(--border)', margin: '4px 12px' }} />
                          <button
                            onClick={() => { signOut(); setDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                            style={{ color: '#FF4444', fontFamily: 'Inter, sans-serif' }}
                          >
                            <LogOut size={15} />
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="btn-ghost" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Login</Link>
                    <Link href="/register" className="btn-accent" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Register</Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-16 z-30"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="md:hidden relative z-40 animate-slide-up"
            style={{ background: 'rgba(6,6,14,0.98)', borderTop: '1px solid var(--border)', padding: '1rem' }}
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 px-4 rounded-lg mb-1 font-rajdhani font-semibold transition-colors"
                style={{
                  color: pathname.startsWith(link.href) ? 'var(--accent)' : 'var(--text-secondary)',
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
      className="flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-white/5"
      style={{ color: accent ? 'var(--accent)' : 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}
    >
      <span className="flex items-center gap-3">{icon}{label}</span>
      {badge && badge > 0 ? (
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: 'var(--accent)', fontSize: '0.6rem' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
