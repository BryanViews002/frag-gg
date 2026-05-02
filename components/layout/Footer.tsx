'use client';

import Link from 'next/link';
import { Swords, Twitter, Youtube, MessageCircle, ArrowUp } from 'lucide-react';

const NAV_LINKS = [
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/find-teammates', label: 'Find Teammates' },
  { href: '/clans', label: 'Clans' },
  { href: '/community', label: 'Community' },
];

const SOCIAL = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: MessageCircle, href: '#', label: 'Discord' },
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Swords size={22} style={{ color: 'var(--accent)' }} />
              <span className="font-rajdhani font-bold text-2xl" style={{ color: 'var(--accent)' }}>
                FRAG.GG
              </span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              The premier CODM competitive platform. Compete. Dominate. Get Recognized.
            </p>
            {/* Socials — pure CSS hover */}
            <div className="flex items-center gap-3 mt-6">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="footer-social"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation — pure CSS hover */}
          <div>
            <h3 className="font-rajdhani font-bold text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
              Platform
            </h3>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Status + Back to Top */}
          <div>
            <h3 className="font-rajdhani font-bold text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
              Platform Status
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="live-dot" style={{ animation: 'livePulse 2s ease-in-out infinite' }} />
              <span style={{ color: 'var(--neon-green)', fontSize: '0.85rem', fontWeight: 600 }}>
                All Systems Operational
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              100% Free at launch. No pay-to-win. No BS.
            </p>
            <button
              onClick={scrollToTop}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              <ArrowUp size={14} /> Back to Top
            </button>
          </div>
        </div>

        <div className="section-divider mt-10" />
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            &copy; {new Date().getFullYear()} FRAG.GG. All rights reserved.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Not affiliated with Activision or TiMi Studios.
          </p>
        </div>
      </div>
    </footer>
  );
}
